import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { plotsData } from '../../data/plots';
import { MARKETPLACE_PLOTS_GIS } from '../../data/marketplaceGisData';
import { getSafeCropById, safeCrops } from '../../data/safeCrops';
import { useAuthStore } from '../../stores/authStore';
import { useServiceStore } from '../../stores/serviceStore';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Sprout,
  Maximize2,
  Radio,
  MapPin,
  Calendar,
  CreditCard,
  QrCode,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import VnPayModal from '../../components/payment/VnPayModal';
import CardPaymentModal from '../../components/payment/CardPaymentModal';
import { apiFetch, unwrapData } from '../../api/apiClient';

export const BOOKING_START_LEAD_DAYS = 10;

export const toLocalIsoDate = (date) => {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
};

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return toLocalIsoDate(next);
};

export const addMonths = (isoDate, months) => {
  const source = new Date(`${isoDate}T12:00:00`);
  const originalDay = source.getDate();
  source.setDate(1);
  source.setMonth(source.getMonth() + months);
  const lastDay = new Date(source.getFullYear(), source.getMonth() + 1, 0).getDate();
  source.setDate(Math.min(originalDay, lastDay));
  return toLocalIsoDate(source);
};

export const getEarliestCultivationDate = (now = new Date()) => addDays(now, BOOKING_START_LEAD_DAYS);

export const getRentalEndDate = (startDate, months, crop) => {
  const monthEnd = addMonths(startDate, months);
  const durationValues = String(crop?.duration || '').match(/\d+/g)?.map(Number) || [];
  const cropMinimumDays = (durationValues.length ? Math.max(...durationValues) : 30) + 10;
  const cropEnd = addDays(`${startDate}T12:00:00`, cropMinimumDays);
  return cropEnd > monthEnd ? cropEnd : monthEnd;
};

const marketplaceBookingPlots = MARKETPLACE_PLOTS_GIS.map((plot) => ({
  ...plot,
  catalog: 'marketplace',
  code: plot.label || String(plot.code || '').replace(/^Plot\s+/i, ''),
  landName: plot.farmName,
  area: plot.areaFormatted || `${plot.area} m²`,
  formattedPrice: plot.rentalPriceFormatted,
  careServicePrice: plot.careServicePrice || 600000,
  iotStationId: `IOT-${plot.label || plot.id}`,
  compatibleCrops: safeCrops.map((crop) => crop.variety)
}));

const bookingPlotsData = [
  ...marketplaceBookingPlots,
  ...plotsData.map((plot) => ({ ...plot, catalog: 'legacy' }))
];

export const getPlotSelectionKey = (plot) => String(plot?.code || plot?.label || plot?.id || '')
  .replace(/^plot\s+/i, '')
  .trim()
  .toLowerCase();

export const dedupeSelectedPlots = (plots) => {
  const seen = new Set();
  return plots.filter((plot) => {
    const key = getPlotSelectionKey(plot);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getBookingValidationError = ({ acceptedTerms, selectedMode, assistedService }) => {
  if (!acceptedTerms) return 'Bạn cần đọc và chấp nhận điều khoản thuê đất trước khi thanh toán.';
  if (selectedMode === 'ASSISTED' && !assistedService) {
    return 'Chưa tải được gói chăm sóc toàn vụ từ hệ thống. Vui lòng tải lại trang rồi thử lại.';
  }
  return '';
};

export default function BookPlot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { services, loading: servicesLoading, loaded: servicesLoaded, error: servicesError, loadServices } = useServiceStore();
  const [selectedCropByPlot] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('farmely_selected_crop_by_plot') || '{}');
    } catch {
      return {};
    }
  });

  // Helper to match plot by any identifier (P-01, Plot P-01, PLT-HV-01, P-101, etc.)
  const findPlotByAnyCode = (code) => {
    if (!code) return null;
    const clean = code.trim().toLowerCase();
    return bookingPlotsData.find((p) => {
      const pId = (p.id || '').toLowerCase();
      const pCode = (p.code || '').toLowerCase();
      const pLabel = (p.label || '').toLowerCase();
      return (
        pId === clean ||
        pCode === clean ||
        pLabel === clean ||
        pCode.replace('plot ', '').trim() === clean ||
        clean.replace('plot ', '').trim() === pCode ||
        pId.replace('plt-hv-', 'p-') === clean ||
        (clean.startsWith('p-') && pId.replace('plt-hv-', '') === clean.replace('p-', ''))
      );
    });
  };

  // Initial plot from route param or available catalog entry
  const initialPlot = findPlotByAnyCode(id) || marketplaceBookingPlots[0] || plotsData[0];
  const initialPlotsFromQuery = dedupeSelectedPlots(
    (searchParams.get('plots') || '')
      .split(',')
      .map((code) => findPlotByAnyCode(code))
      .filter(Boolean)
  );

  // One rental contract can contain multiple selected plots (BR01 / SSoT).
  const [selectedPlots, setSelectedPlots] = useState(() => initialPlotsFromQuery.length ? initialPlotsFromQuery : [initialPlot]);
  const [isAddPlotModalOpen, setIsAddPlotModalOpen] = useState(false);

  // 15-minute reservation timer (BR08)
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [selectedMode, setSelectedMode] = useState('ASSISTED');
  const [rentalMonths, setRentalMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [isSuccess, setIsSuccess] = useState(false);
  const [contractCode, setContractCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVnPayModal, setShowVnPayModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [reservation, setReservation] = useState(null);
  const [startDateByPlot, setStartDateByPlot] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // If URL changes or plots query param exists, sync plots
  useEffect(() => {
    const plotsQuery = searchParams.get('plots');
    if (plotsQuery) {
      const codes = plotsQuery.split(',').map((c) => c.trim()).filter(Boolean);
      const matched = dedupeSelectedPlots(codes
        .map((code) => findPlotByAnyCode(code))
        .filter(Boolean));
      if (matched.length > 0) {
        setSelectedPlots(matched);
        return;
      }
    }

    // Nếu không có param plots trên URL, đọc từ localStorage để bảo toàn khi quay lại
    try {
      const saved = localStorage.getItem('farmely_master_lease_selected_plots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const matched = dedupeSelectedPlots(parsed
            .map((p) => findPlotByAnyCode(p.code || p.id))
            .filter(Boolean));
          if (matched.length > 0) {
            setSelectedPlots(matched);
            return;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    const target = findPlotByAnyCode(id);
    if (target && !selectedPlots.some((p) => p.id === target.id)) {
      setSelectedPlots([target]);
    }
  }, [id, searchParams.get('plots')]);

  // Luôn đồng bộ danh sách thửa đất trong hợp đồng vào localStorage
  useEffect(() => {
    if (selectedPlots && selectedPlots.length > 0) {
      try {
        const uniquePlots = dedupeSelectedPlots(selectedPlots);
        localStorage.setItem(
          'farmely_master_lease_selected_plots',
          JSON.stringify(uniquePlots)
        );
        const canonicalPlots = uniquePlots.map((plot) => plot.code || plot.label || plot.id).join(',');
        if (searchParams.get('plots') !== canonicalPlots) {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('plots', canonicalPlots);
          setSearchParams(nextParams, { replace: true });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [selectedPlots, searchParams, setSearchParams]);

  // Mỗi plot có lịch bắt đầu độc lập. Nếu khách chưa chọn, dùng ngày hợp lệ đầu tiên.
  useEffect(() => {
    const earliest = getEarliestCultivationDate();
    setStartDateByPlot((current) => {
      const next = {};
      selectedPlots.forEach((plot) => {
        const key = getPlotSelectionKey(plot);
        next[key] = current[key] && current[key] >= earliest ? current[key] : earliest;
      });
      return next;
    });
  }, [selectedPlots]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // List of other available plots that can be added to this Master Contract
  const activePlotCatalog = selectedPlots.some((plot) => plot.catalog === 'marketplace')
    ? marketplaceBookingPlots
    : bookingPlotsData.filter((plot) => plot.catalog === 'legacy');
  const availablePlotsToAdd = activePlotCatalog.filter(
    (p) =>
      (p.status === 'AVAILABLE' || p.status === 'Đang trống') &&
      !selectedPlots.some((sp) => sp.id === p.id)
  );

  const handleAddPlot = (plotToAdd) => {
    setSelectedPlots((prev) => {
      const next = prev.some((plot) => plot.id === plotToAdd.id) ? prev : [...prev, plotToAdd];
      const codes = next.map((plot) => plot.code || plot.id).join(',');
      navigate(`/marketplace/plot/${next[0]?.id || id}/book?plots=${encodeURIComponent(codes)}`, { replace: true });
      return next;
    });
    setReservation(null);
    setIsAddPlotModalOpen(false);
  };

  const handleRemovePlot = (plotIdToRemove) => {
    if (selectedPlots.length <= 1) return; // Keep at least 1 plot
    setSelectedPlots((prev) => {
      const next = prev.filter((p) => p.id !== plotIdToRemove);
      const codes = next.map((plot) => plot.code || plot.id).join(',');
      localStorage.setItem('farmely_master_lease_selected_plots', JSON.stringify(next));
      navigate(`/marketplace/plot/${next[0]?.id || id}/book?plots=${encodeURIComponent(codes)}`, { replace: true });
      return next;
    });
    setReservation(null);
  };

  // Aggregate calculations for the multi-plot rental contract.
  const totalAreaM2 = selectedPlots.reduce((sum, p) => {
    const num = typeof p.area === 'number' ? p.area : parseInt(p.area, 10) || 50;
    return sum + num;
  }, 0);

  const subtotalPlot = selectedPlots.reduce(
    (sum, p) => sum + (p.rentalPrice || 1200000) * rentalMonths,
    0
  );

  const assistedService = services.find((service) => service.serviceCode === 'S15' && service.active);
  const subtotalCare = selectedMode === 'ASSISTED' && assistedService
    ? assistedService.price * selectedPlots.length
    : 0;

  const totalAmount = subtotalPlot + subtotalCare;

  const primaryPlot = selectedPlots[0] || initialPlot;
  const plotCodesList = selectedPlots.map((p) => p.code).join(', ');
  const plotCodesSummary = selectedPlots.map((p) => p.code).join('-');
  const selectedCropFor = (plot) => getSafeCropById(selectedCropByPlot[plot.id]);
  const primaryCrop = selectedCropFor(primaryPlot);


  const getNumericId = (value, fallback) => {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
    const trailing = String(value || '').match(/(\d+)$/)?.[1];
    return trailing ? Number(trailing) : fallback;
  };

  const createContractReservation = async () => {
    const earliestAtPayment = getEarliestCultivationDate();
    const items = selectedPlots.map((plot, index) => {
      const key = getPlotSelectionKey(plot);
      const selectedStart = startDateByPlot[key];
      const startDate = selectedStart && selectedStart >= earliestAtPayment ? selectedStart : earliestAtPayment;
      const crop = selectedCropFor(plot);
      return {
        plotId: getNumericId(plot.plot_id ?? plot.plotId ?? plot.id, index + 1),
        varietyId: getNumericId(crop?.varietyId ?? crop?.id, 1),
        serviceId: selectedMode === 'ASSISTED'
          ? getNumericId(assistedService?.serviceId ?? assistedService?.id, null)
          : null,
        startDate,
        endDate: getRentalEndDate(startDate, rentalMonths, crop)
      };
    });

    setStartDateByPlot(Object.fromEntries(selectedPlots.map((plot, index) => [
      getPlotSelectionKey(plot),
      items[index].startDate
    ])));

    const result = unwrapData(await apiFetch('/api/contracts/reservations', {
      method: 'POST',
      body: JSON.stringify({ renterId: getNumericId(user?.id ?? user?.userId, null), items })
    }));
    setReservation(result);
    setContractCode(result.contractNumber || `HD-${result.contractId}`);
    return result;
  };

  const handleConfirmBooking = async () => {
    const validationError = getBookingValidationError({ acceptedTerms, selectedMode, assistedService });
    if (validationError) {
      if (!acceptedTerms) setTermsError(validationError);
      else setBookingError(validationError);
      return;
    }
    setTermsError('');
    setBookingError('');
    setIsProcessing(true);

    let activeReservation = reservation;
    try {
      if (!activeReservation) activeReservation = await createContractReservation();
    } catch (error) {
      setBookingError(error.message || 'Không thể giữ lịch canh tác. Vui lòng kiểm tra ngày bắt đầu rồi thử lại.');
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === 'VNPAY') {
      setIsProcessing(false);
      setShowVnPayModal(true);
      return;
    }

    if (paymentMethod === 'CARD') {
      setIsProcessing(false);
      setShowCardModal(true);
      return;
    }

    setIsProcessing(false);
  };

  const handlePaymentSuccess = async () => {
    setShowVnPayModal(false);
    setShowCardModal(false);
    setIsProcessing(true);
    try {
      if (reservation?.contractId) {
        const activated = unwrapData(await apiFetch(`/api/contracts/${reservation.contractId}/activate`, { method: 'POST' }));
        setContractCode(activated.contractNumber || contractCode);
      }
    } catch (error) {
      setBookingError(error.message || 'Thanh toán thành công nhưng chưa thể kích hoạt hợp đồng.');
      setIsProcessing(false);
      return;
    }
    try {
      localStorage.removeItem('farmely_master_lease_selected_plots');
    } catch (e) {
      console.error(e);
    }
    setIsProcessing(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans">
      <PublicNavbar />

      {/* Top Breadcrumb Header */}
      <div className="pt-28 pb-8 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`/marketplace?plots=${selectedPlots.map((p) => p.code || p.id).join(',')}`}
            className="inline-flex items-center gap-1.5 text-xs text-brand-yellow font-bold hover:underline mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Quay lại Bản đồ Marketplace (Tiếp tục chọn thêm thửa)</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-yellow text-brand-dark">
                  Thuê thửa đất
                </span>
                <span className="text-xs text-stone-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
                  {primaryPlot.landName}
                </span>
                <span className="text-xs text-stone-300">•</span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Một hợp đồng cho toàn bộ thửa đã chọn
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-white">
                Ký Hợp Đồng Thuê Thửa Đất & Thanh Toán
              </h1>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
                <Clock className="w-5 h-5 text-brand-yellow animate-pulse" />
                <div>
                  <span className="text-[10px] text-stone-300 block font-bold uppercase tracking-wider">
                    Khóa giữ chỗ 15 phút
                  </span>
                  <span className="font-mono text-lg font-black text-brand-yellow">
                    {formattedTimer}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* GATE: Sign In Required if not authenticated */}
        {!isAuthenticated ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-brand-border shadow-elevated text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 uppercase tracking-wider inline-block mb-3 border border-amber-200">
                Sign In Required (Yêu Cầu Đăng Nhập)
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
                Vui lòng đăng nhập để tiếp tục thuê thửa đất
              </h2>
              <p className="text-sm text-brand-muted mt-2 max-w-lg mx-auto leading-relaxed">
                Theo quy trình an toàn của Farmely, bạn cần tài khoản để kích hoạt mã giữ chỗ 15 phút
                cho hợp đồng thuê thửa đất và quản lý hợp đồng điện tử.
              </p>
            </div>

            {/* Quick Plot Preview */}
            <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex items-center gap-4 text-left">
              <img
                src={primaryPlot.imageUrl}
                alt={primaryPlot.name}
                className="w-16 h-16 rounded-xl object-cover border border-brand-border shrink-0"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-brand-green">{primaryPlot.code}</span>
                <h4 className="font-heading font-bold text-sm text-brand-dark">{primaryPlot.name}</h4>
                <p className="text-xs text-stone-500">
                  {primaryPlot.area} • {primaryPlot.formattedPrice}/tháng
                </p>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/login?redirect=${encodeURIComponent(
                  `/marketplace/plot/${primaryPlot.id}/book`
                )}`}
                className="flex-1"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full uppercase font-bold text-xs tracking-wider"
                >
                  ĐĂNG NHẬP NGAY
                </Button>
              </Link>
              <Link
                to={`/register?redirect=${encodeURIComponent(
                  `/marketplace/plot/${primaryPlot.id}/book`
                )}`}
                className="flex-1"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full uppercase font-bold text-xs tracking-wider"
                >
                  ĐĂNG KÝ TÀI KHOẢN MỚI
                </Button>
              </Link>
            </div>

          </div>
        ) : isSuccess ? (
          /* SUCCESS CONFIRMATION */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-brand-border shadow-elevated text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider inline-block mb-3 border border-emerald-200">
                Thanh Toán & Kích Hoạt Hợp Đồng Thành Công
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
                Chúc Mừng Bạn Đã Ký Hợp Đồng Thuê Thửa Đất!
              </h2>
              <p className="text-sm text-brand-muted mt-2 max-w-lg mx-auto">
                Hợp đồng thuê {selectedPlots.length} thửa đất đã được ký số thành công.
                Tất cả các thửa đất đã sẵn sàng và được bàn giao độc lập trên Dashboard cá nhân.
              </p>
            </div>

            {/* Contract Details Card */}
            <div className="p-5 rounded-2xl bg-brand-cream/80 border border-brand-border text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                <span className="text-stone-500">Mã hợp đồng thuê:</span>
                <span className="font-mono font-bold text-brand-green text-sm">{contractCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Khách hàng:</span>
                <strong className="text-brand-dark">{user?.fullName || 'Khách hàng Farmely'}</strong>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-stone-500">Danh sách thửa đất ({selectedPlots.length}):</span>
                <div className="text-right space-y-1">
                  {selectedPlots.map((p) => (
                    <span
                      key={getPlotSelectionKey(p)}
                      className="inline-block ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[11px]"
                    >
                      {p.code} - {p.name} ({p.area})
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Hình thức canh tác:</span>
                <span className="font-bold text-brand-dark">
                  {selectedMode === 'ASSISTED'
                    ? 'Assisted-Growing (Ủy thác trọn gói)'
                    : 'Self-Growing (Tự canh tác)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Thời hạn thuê:</span>
                <span className="font-bold text-brand-dark">{rentalMonths} Tháng canh tác</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-brand-border text-sm font-black text-brand-green">
                <span>Tổng giá trị thanh toán:</span>
                <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/marketplace" className="flex-1">
                <Button variant="outline" size="md" className="w-full">
                  Xem thêm thửa đất khác
                </Button>
              </Link>
              <Link to="/customer/dashboard" className="flex-1">
                <Button variant="primary" size="md" className="w-full">
                  Về trang Dashboard cá nhân
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* BOOK PLOT FORM WORKFLOW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 cols: Configuration */}
            <div className="lg:col-span-7 space-y-6">
              {/* MASTER LEASE: PLOTS SELECTION CONTAINER */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border/70">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-brand-green" />
                      <h3 className="font-heading font-black text-lg text-brand-dark">
                        Thửa Đất Trong Hợp Đồng ({selectedPlots.length} thửa)
                      </h3>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Một hợp đồng duy nhất cho các thửa đã chọn, thanh toán gộp một lần.
                    </p>
                  </div>

                  {/* Add Plot Trigger Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/marketplace?plots=${selectedPlots.map((p) => p.code || p.id).join(',')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs border border-slate-200"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Xem bản đồ vệ tinh & chọn thêm</span>
                    </Link>

                    {availablePlotsToAdd.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddPlotModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <span>+ Chọn nhanh</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* List of Selected Plots in this Contract */}
                <div className="space-y-3">
                  {selectedPlots.map((p, index) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-brand-cream/40 border border-brand-border flex flex-col sm:flex-row gap-4 items-center justify-between transition-all hover:bg-brand-cream/70"
                    >
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-16 h-16 rounded-xl object-cover border border-brand-border shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-yellow text-brand-dark">
                              {p.code}
                            </span>
                            <span className="text-[11px] text-stone-500 font-medium">
                              Thửa #{index + 1}
                            </span>
                          </div>
                          <h4 className="font-heading font-bold text-sm text-brand-dark">
                            {p.name}
                          </h4>
                          <p className={`text-[11px] font-semibold ${selectedCropFor(p) ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {selectedCropFor(p)
                              ? `Cây trồng: ${selectedCropFor(p).variety}`
                              : 'Chưa chọn cây trồng — có thể chọn tại Marketplace'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-stone-600">
                            <span className="flex items-center gap-1">
                              <Maximize2 className="w-3 h-3 text-brand-green" /> {p.area}
                            </span>
                            <span className="flex items-center gap-1">
                              <Radio className="w-3 h-3 text-brand-green" /> {p.iotStationId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-border/60">
                        <div className="text-right">
                          <span className="text-xs font-bold text-brand-green block">
                            {(p.rentalPrice || 1200000).toLocaleString('vi-VN')} đ/tháng
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {assistedService
                              ? `Chăm sóc toàn vụ: +${assistedService.price.toLocaleString('vi-VN')} đ`
                              : 'Đang tải giá chăm sóc…'}
                          </span>
                        </div>

                        {selectedPlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePlot(getPlotSelectionKey(p))}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Gỡ thửa này khỏi hợp đồng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sub-summary banner */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                  <span className="font-medium">
                    Tổng diện tích hợp đồng: <strong className="text-slate-900">{totalAreaM2} m²</strong> ({selectedPlots.length} thửa)
                  </span>
                  <span className="text-stone-500 text-[11px]">
                    Ký số 1 lần duy nhất
                  </span>
                </div>
              </div>

              {/* Cultivation Mode Selection */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-brand-dark">
                  1. Chọn Hình Thức Canh Tác Cho Toàn Bộ Hợp Đồng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setSelectedMode('SELF'); setReservation(null); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'SELF'
                        ? 'border-brand-green bg-emerald-50/70 ring-2 ring-brand-green/20'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50'
                    }`}
                  >
                    <p className="font-heading text-sm font-bold text-brand-dark">Self-Growing</p>
                    <p className="text-xs text-stone-500 mt-1">Tự chăm sóc tại vườn cuối tuần</p>
                    <div className="mt-2.5 space-y-1 text-[11px] text-stone-600 border-t border-brand-border/40 pt-2">
                      <p className="flex items-center gap-1 font-medium text-emerald-800">
                        ✓ Chuyên gia đồng hành: ThS. Nam (Tư vấn kỹ thuật online)
                      </p>
                      <p className="text-stone-500">
                        ✓ Khách hàng tự trải nghiệm làm nông tại vườn
                      </p>
                    </div>
                    <p className="text-xs font-bold text-brand-green mt-3">Miễn phí dịch vụ chăm sóc</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedMode('ASSISTED'); setReservation(null); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'ASSISTED'
                        ? 'border-brand-yellow bg-amber-50/70 ring-2 ring-brand-yellow/30'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50'
                    }`}
                  >
                    <p className="font-heading text-sm font-bold text-brand-dark">Assisted-Growing</p>
                    <p className="text-xs text-stone-500 mt-1">
                      Đội ngũ Farmely chăm sóc trọn gói hàng ngày
                    </p>
                    <div className="mt-2.5 space-y-1 text-[11px] text-stone-600 border-t border-brand-border/40 pt-2">
                      <p className="flex items-center gap-1 font-medium text-emerald-800">
                        ✓ Chuyên gia phụ trách: ThS. Nguyễn Hoàng Nam (Quy trình VietGAP)
                      </p>
                      <p className="text-amber-900 font-medium">
                        ✓ Công nhân phụ trách (CVLĐ): Phân công cố định (Tưới, nhổ cỏ 2 ca/ngày)
                      </p>
                    </div>
                    <p className="text-xs font-bold text-brand-green mt-3">
                      {servicesLoading
                        ? 'Đang tải giá từ database…'
                        : assistedService
                          ? `+${(assistedService.price * selectedPlots.length).toLocaleString('vi-VN')} đ/${assistedService.unit} (${selectedPlots.length} thửa)`
                          : 'Không tìm thấy gói S15 đang hoạt động'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Rental Duration */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-brand-dark">
                  2. Thời Hạn Thuê Thửa Đất
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setRentalMonths(m); setReservation(null); }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        rentalMonths === m
                          ? 'border-brand-green bg-brand-green text-white font-black'
                          : 'border-brand-border bg-white text-brand-dark hover:bg-brand-cream'
                      }`}
                    >
                      <span className="text-sm font-bold block">{m} Tháng</span>
                      <span className="text-[10px] opacity-80">{m >= 6 ? 'Ưu đãi' : 'Tiêu chuẩn'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-plot cultivation start dates */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-brand-dark">3. Chọn Ngày Bắt Đầu Canh Tác</h3>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Mỗi thửa có lịch riêng. Ngày sớm nhất là {BOOKING_START_LEAD_DAYS} ngày sau khi thanh toán; nếu không đổi, Farmely dùng ngày hợp lệ đầu tiên.
                    </p>
                  </div>
                  <Calendar className="h-5 w-5 shrink-0 text-brand-green" />
                </div>
                <div className="space-y-3">
                  {selectedPlots.map((plot) => {
                    const key = getPlotSelectionKey(plot);
                    const crop = selectedCropFor(plot);
                    const startDate = startDateByPlot[key] || getEarliestCultivationDate();
                    const endDate = getRentalEndDate(startDate, rentalMonths, crop);
                    return (
                      <div key={key} className="grid gap-3 rounded-2xl border border-brand-border bg-[#fbfcf8] p-4 sm:grid-cols-[minmax(0,1fr)_180px_180px] sm:items-end">
                        <div>
                          <div className="flex items-center gap-2"><span className="rounded-md bg-brand-green px-2 py-1 text-[10px] font-black text-white">{plot.code}</span><strong className="text-sm text-brand-dark">{plot.name}</strong></div>
                          <p className="mt-1 text-[11px] text-stone-500">{crop?.name || 'Giống cây đã chọn'} · {plot.area}</p>
                        </div>
                        <label className="text-xs font-bold text-stone-600">
                          Ngày bắt đầu
                          <input
                            type="date"
                            min={getEarliestCultivationDate()}
                            value={startDate}
                            onChange={(event) => {
                              setStartDateByPlot((current) => ({ ...current, [key]: event.target.value }));
                              setReservation(null);
                              setBookingError('');
                            }}
                            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                        <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
                          <span className="block text-[10px] font-bold text-emerald-700">Kết thúc dự kiến</span>
                          <strong>{new Date(`${endDate}T12:00:00`).toLocaleDateString('vi-VN')}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-brand-dark">
                  4. Phương Thức Thanh Toán
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VNPAY')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'VNPAY'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-brand-dark">Cổng VNPAY Sandbox</p>
                      <p className="text-[10px] text-blue-700 font-medium">VNPAY-QR, Thẻ ATM NCB</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'border-brand-green bg-emerald-50/60 ring-2 ring-brand-green/20'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-brand-green" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-brand-dark">Thẻ Quốc Tế / Nội Địa</p>
                      <p className="text-[10px] text-stone-500">Visa, Mastercard, ATM</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Order Summary & Checkout */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-elevated space-y-6 sticky top-28">
                <div className="border-b border-brand-border/60 pb-4">
                  <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">
                    Đơn Đặt Thuê Thửa Đất
                  </span>
                  <h3 className="text-xl font-heading font-black text-brand-dark mt-1">
                    Tổng Kết Chi Phí
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>
                      Giá thuê thửa đất ({selectedPlots.length} thửa, {totalAreaM2} m² x {rentalMonths} tháng):
                    </span>
                    <strong className="text-brand-dark">
                      {subtotalPlot.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>
                      Dịch vụ canh tác ({selectedMode === 'ASSISTED' ? assistedService?.name || 'Gói S15' : 'Tự chăm sóc'}):
                    </span>
                    <strong className="text-brand-dark">
                      {subtotalCare.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-[11px] text-stone-600">
                    <span className="font-semibold text-stone-700 block">Thửa đất bao gồm:</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedPlots.map((p) => (
                        <span
                          key={getPlotSelectionKey(p)}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                        >
                          {p.code} ({p.area}){selectedCropFor(p) ? ` • ${selectedCropFor(p).name}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-brand-border text-base font-black text-brand-green">
                    <span>Tổng thanh toán 100% Upfront:</span>
                    <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-[11px] text-stone-600 space-y-1">
                  <p className="font-bold text-brand-dark flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                    Chính sách hoàn tiền hợp đồng:
                  </p>
                  <p>• Hoàn 80% khi hủy trước ngày bắt đầu 3 ngày.</p>
                  <p>• Hoàn 50% khi hủy trong vòng 3 ngày trước ngày bắt đầu.</p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-border bg-white p-3 text-xs text-stone-700">
                  <input type="checkbox" checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); if (event.target.checked) setTermsError(''); }} className="mt-0.5 h-4 w-4 accent-emerald-700" />
                  <span>Tôi đã đọc và đồng ý với <Link to="/terms" target="_blank" className="font-bold text-brand-green underline underline-offset-2">điều khoản thuê đất và thanh toán của Farmely</Link>.</span>
                </label>
                {termsError && <p role="alert" className="text-xs font-semibold text-rose-600">{termsError}</p>}
                {bookingError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{bookingError}</p>}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full uppercase font-black tracking-wider text-sm shadow-yellow-glow"
                  onClick={handleConfirmBooking}
                  loading={isProcessing}
                  aria-describedby={termsError ? 'booking-terms-error' : undefined}
                >
                  XÁC NHẬN THANH TOÁN & THUÊ ĐẤT
                </Button>

              </div>
            </div>
          </div>
        )}
      </main>

      {/* POPUP MODAL: THÊM THỬA ĐẤT VÀO HỢP ĐỒNG */}
      {isAddPlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-brand-border shadow-2xl p-6 sm:p-8 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-brand-green rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-brand-dark">
                    Chọn Thêm Thửa Đất Vào Hợp Đồng
                  </h3>
                  <p className="text-xs text-stone-500">
                    Các thửa đất còn trống (`AVAILABLE`) có thể gộp chung vào hợp đồng này
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlotModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plots list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {availablePlotsToAdd.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-sm">
                  Không còn thửa đất trống nào khác để thêm.
                </div>
              ) : (
                availablePlotsToAdd.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-brand-border bg-white hover:border-emerald-400 hover:bg-emerald-50/30 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-14 h-14 rounded-xl object-cover border border-brand-border shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-yellow text-brand-dark">
                            {p.code}
                          </span>
                          <span className="text-xs font-bold text-brand-dark">{p.name}</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {p.area} • {p.iotStationId} • {p.landName}
                        </p>
                        <p className="text-xs font-black text-brand-green mt-1">
                          {(p.rentalPrice || 1200000).toLocaleString('vi-VN')} đ/tháng
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddPlot(p)}
                      className="px-4 py-2 rounded-xl bg-brand-green hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      + Thêm vào
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-brand-border flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddPlotModalOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VNPay Sandbox Payment Pop-up Modal */}
      <VnPayModal
        isOpen={showVnPayModal}
        onClose={() => setShowVnPayModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        plotInfo={{
          code: plotCodesSummary,
          name: `Hợp đồng thuê ${selectedPlots.length} thửa đất`
        }}
        totalAmount={totalAmount}
        contractId={reservation?.contractId}
        additionalPayload={{ contractNumber: reservation?.contractNumber }}
      />

      {/* Card Payment Pop-up Modal */}
      <CardPaymentModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        totalAmount={totalAmount}
        additionalPayload={{ contractId: reservation?.contractId, contractNumber: reservation?.contractNumber }}
        plotInfo={{
          code: plotCodesSummary,
          name: `Hợp đồng thuê ${selectedPlots.length} thửa đất`
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <Footer />
    </div>
  );
}
