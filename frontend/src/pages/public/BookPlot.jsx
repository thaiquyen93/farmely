import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { farmApi } from '../../api/farm/farmApi';
import { rentalApi } from '../../api/rental/rentalApi';
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
  CreditCard,
  QrCode,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  X,
  Loader2
} from 'lucide-react';
import VnPayModal from '../../components/payment/VnPayModal';
import CardPaymentModal from '../../components/payment/CardPaymentModal';
import { chatService } from '../../api/communication/chatService';
import { DEMO_CUSTOMERS } from '../../api/communication/chatStorage';

// Danh mục tương thích sinh học chuẩn hóa từ PostgreSQL table plot_variety_compatibility (BR03)
const PLOT_COMPATIBLE_VARIETIES = {
  1: [1, 2, 3, 4, 8, 10], // P-01
  2: [1, 2, 3, 6, 8, 10], // P-02
  3: [4, 5, 6, 7],         // P-03
  4: [3, 4, 6, 9],         // P-04
  5: [1, 5, 7, 8, 9],      // P-05
  6: [1, 2, 8, 10],        // P-06
  13: [1, 2, 3, 10],       // P-07
  14: [2, 3, 8, 10],       // P-08
  15: [4, 5, 6, 7],        // P-09
  16: [3, 4, 9],           // P-10
  17: [1, 3, 5, 8],        // P-11
  18: [2, 3, 6, 10],       // P-12
  19: [1, 4, 7, 9],        // P-13
  20: [4, 5, 6, 7],        // P-14
  21: [1, 2, 3, 5, 8],     // P-15
  22: [2, 3, 8, 10]        // P-16
};

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
  const { user, isAuthenticated, login } = useAuthStore();
  const { services, loading: servicesLoading, loaded: servicesLoaded, error: servicesError, loadServices } = useServiceStore();
  const [allPlots, setAllPlots] = useState([]);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [selectedPlots, setSelectedPlots] = useState([]);
  const [isAddPlotModalOpen, setIsAddPlotModalOpen] = useState(false);
  const [createdContractId, setCreatedContractId] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isExtendingGrace, setIsExtendingGrace] = useState(false);
  const [graceApplied, setGraceApplied] = useState(false);
  const [selectedCropByPlot] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('farmely_selected_crop_by_plot') || '{}');
    } catch {
      return {};
    }
  });

  // Tự động chọn giống cây tương thích chuẩn sinh học (BR03) từ Database
  const getPlotSelectedCrop = useCallback((plot) => {
    if (!plot) return safeCrops[0];
    const plotIdNum = Number(plot.plotId || parseInt(plot.id, 10) || 1);
    const compatVarIds = PLOT_COMPATIBLE_VARIETIES[plotIdNum] || [1, 2, 3];

    // 1. Kiểm tra nếu người dùng đã chủ động chọn giống cây ở Marketplace
    const savedCrop = getSafeCropById(selectedCropByPlot[plot.id]);
    if (savedCrop && compatVarIds.includes(savedCrop.varietyId)) {
      return savedCrop;
    }

    // 2. Nếu chưa chọn hoặc giống không tương thích, tự động lấy giống tương thích số 1 trong DB
    const defaultVarId = compatVarIds[0] || 1;
    return safeCrops.find((c) => c.varietyId === defaultVarId) || safeCrops[0];
  }, [selectedCropByPlot]);

  // Helper to match plot by any identifier
  const findPlotByAnyCode = useCallback((code, plotsList = allPlots) => {
    if (!code || !plotsList.length) return null;
    const clean = code.trim().toLowerCase();
    return plotsList.find((p) => {
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
  }, [allPlots]);

  // Load plots from PostgreSQL DB via Farm Service
  useEffect(() => {
    setLoadingPlots(true);
    farmApi.listPlots()
      .then((rows) => {
        const mapped = (rows || []).map((p) => ({
          id: String(p.plotId),
          plotId: p.plotId,
          code: p.plotCode,
          label: p.plotCode,
          name: `Thửa đất ${p.plotCode}`,
          landName: p.landName || 'Trang trại Happy Valley Củ Chi',
          area: `${Number(p.area)} m²`,
          areaFormatted: `${Number(p.area)} m²`,
          rentalPrice: Number(p.pricePerPeriod),
          formattedPrice: `${Number(p.pricePerPeriod).toLocaleString('vi-VN')} đ/tháng`,
          rentalPriceFormatted: `${Number(p.pricePerPeriod).toLocaleString('vi-VN')} đ/tháng`,
          careServicePrice: Math.round(Number(p.pricePerPeriod) * 0.5),
          status: p.status === 'AVAIL' ? 'AVAILABLE' : p.status === 'RENT' ? 'RENTED' : 'MAINTENANCE',
          iotStationId: `IOT-${p.plotCode}`,
          compatibleCrops: safeCrops.map((crop) => crop.variety),
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1000&q=80'
        }));
        setAllPlots(mapped);

        // Determine initial plots from query or ID
        const queryPlotsParam = searchParams.get('plots');
        if (queryPlotsParam) {
          const codes = queryPlotsParam.split(',').map((c) => c.trim().toLowerCase());
          const matched = dedupeSelectedPlots(mapped.filter((p) => codes.includes(p.code?.toLowerCase()) || codes.includes(p.id?.toLowerCase())));
          if (matched.length > 0) {
            setSelectedPlots(matched);
            return;
          }
        }

        const target = findPlotByAnyCode(id, mapped) || mapped[0];
        if (target) {
          setSelectedPlots([target]);
        }
      })
      .catch((err) => console.error('Lỗi nạp plots trong BookPlot:', err))
      .finally(() => setLoadingPlots(false));
  }, [id, searchParams, findPlotByAnyCode]);

  // 15-minute reservation timer (BR08)
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [selectedMode, setSelectedMode] = useState('ASSISTED');
  const [rentalMonths, setRentalMonths] = useState(1);
  const [paymentMethod] = useState('VNPAY');
  const [isSuccess, setIsSuccess] = useState(false);
  const [contractCode, setContractCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVnPayModal, setShowVnPayModal] = useState(false);

  // Giới hạn ngày bắt đầu canh tác: Từ hôm nay tới tối đa +10 ngày (SSoT)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxStartDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  }, []);
  const [startDate, setStartDate] = useState(todayStr);
  const [startDateError, setStartDateError] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    fetch('/api/plots')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (list.length > 0) {
          setSelectedPlots((prev) =>
            prev.map((sp) => {
              const matched = list.find(
                (p) => (p.plot_code || p.plotCode || '').toLowerCase() === (sp.code || sp.id || '').toLowerCase()
              );
              if (!matched) return sp;
              const numPrice = Number(matched.price_per_period || matched.pricePerPeriod || sp.rentalPrice);
              return {
                ...sp,
                rentalPrice: numPrice,
                formattedPrice: `${numPrice.toLocaleString('vi-VN')} đ/tháng`,
                dbPlotId: matched.plot_id || matched.plotId
              };
            })
          );
        }
      })
      .catch((e) => console.error(e));
  }, []);

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

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // List of other available plots that can be added to this Master Contract
  const availablePlotsToAdd = allPlots.filter(
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

  const primaryPlot = selectedPlots[0] || allPlots[0] || {};
  const plotCodesList = selectedPlots.map((p) => p.code).join(', ');
  const plotCodesSummary = selectedPlots.map((p) => p.code).join('-');
  const primaryCrop = getPlotSelectedCrop(primaryPlot);


  // Cộng thời gian ân hạn 10 phút khi vào bước thanh toán (BR08)
  const handleExtendGracePeriod = async () => {
    if (!createdContractId) return;
    setIsExtendingGrace(true);
    setBookingError('');
    try {
      const res = await rentalApi.extendGracePeriod(createdContractId);
      setGraceApplied(true);
      if (res?.reservationExpiresAt) {
        const remainingMs = new Date(res.reservationExpiresAt).getTime() - Date.now();
        setSecondsRemaining(Math.max(0, Math.floor(remainingMs / 1000)));
      } else {
        setSecondsRemaining((prev) => prev + 600);
      }
    } catch (err) {
      console.error('Lỗi cộng thời gian ân hạn:', err);
      setBookingError(err.message || 'Không thể cộng thêm thời gian ân hạn');
    } finally {
      setIsExtendingGrace(false);
    }
  };

  const saveContractToDb = async (method) => {
    try {
      const response = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user?.id || 1,
          customerEmail: user?.email || 'customer@farmely.vn',
          customerName: user?.fullName || 'Khách hàng Farmely',
          customerPhone: user?.phone || '0901234567',
          totalAmount: totalAmount,
          startDate: startDate || todayStr,
          paymentMethod: method || 'VIETQR',
          cultivationMode: selectedMode === 'ASSISTED' ? 'ASSISTED_GROWING' : 'SELF_GROWING',
          rentalMonths: rentalMonths,
          plots: selectedPlots.map((p) => ({
            id: p.id,
            code: p.code || p.id,
            price: p.rentalPrice || 1200000,
            cropId: selectedCropFor(p)?.id || null,
            cropName: selectedCropFor(p)?.name || null,
            varietyName: selectedCropFor(p)?.variety || null
          }))
        })
      });
      const data = await response.json();
      if (data?.success && (data?.contract_code || data?.contract_number)) {
        return data.contract_code || data.contract_number;
      }
    } catch (err) {
      console.error('Lỗi lưu CSDL:', err);
    }
  };

  // Tạo hợp đồng giữ chỗ trực tiếp trong Database PostgreSQL qua rental-service (BR08)
  const createReservationOnServer = async () => {
    const renterId = user?.userId
      ? Number(user.userId)
      : (user?.id ? Number(String(user.id).replace(/\D/g, '')) : 1);

    const start = new Date(startDate || todayStr);
    const startStr = start.toISOString().split('T')[0];

    const items = selectedPlots.map((p) => {
      const crop = getPlotSelectedCrop(p);
      // Đảm bảo thỏa mãn BR04: rentDays >= variety.minDays
      const days = Math.max(rentalMonths * 30, crop?.minDays || 35);
      const end = new Date(start);
      end.setDate(end.getDate() + days);

      return {
        plotId: Number(p.plotId || parseInt(p.id, 10)),
        varietyId: crop?.varietyId || 1,
        // Dịch vụ chăm sóc trọn gói S15 = 1,800,000 đ/vụ (Assisted), hoặc null (Self)
        serviceId: selectedMode === 'ASSISTED' ? 15 : null,
        startDate: startStr,
        endDate: end.toISOString().split('T')[0]
      };
    });

    return await rentalApi.createReservation({
      renterId,
      items
    });
  };

  const markPlotsAsBookedLocally = () => {
    try {
      localStorage.removeItem('farmely_master_lease_selected_plots');
      const recent = JSON.parse(localStorage.getItem('farmely_recently_booked_plots') || '[]');
      selectedPlots.forEach((sp) => {
        const c1 = sp.code || sp.id;
        const c2 = sp.id;
        if (c1 && !recent.includes(c1)) recent.push(c1);
        if (c2 && !recent.includes(c2)) recent.push(c2);
      });
      localStorage.setItem('farmely_recently_booked_plots', JSON.stringify(recent));
      window.dispatchEvent(new CustomEvent('farmely_plot_booked', { detail: selectedPlots }));
    } catch (e) {
      console.error(e);
    }
  };

  const buildPendingBookingPayload = () => ({
    customerId: user?.id || 1,
    customerEmail: user?.email || 'customer@farmely.vn',
    customerName: user?.fullName || 'Khách hàng Farmely',
    customerPhone: user?.phone || '0901234567',
    totalAmount: totalAmount,
    startDate: startDate || todayStr,
    paymentMethod: 'VNPAY',
    cultivationMode: selectedMode === 'ASSISTED' ? 'ASSISTED_GROWING' : 'SELF_GROWING',
    rentalMonths: rentalMonths,
    plots: selectedPlots.map((p) => ({
      id: p.id,
      code: p.code || p.id,
      name: p.name || `Thửa ${p.code || p.id}`,
      price: p.rentalPrice || 1200000,
      cropId: selectedCropFor(p)?.id || null,
      cropName: selectedCropFor(p)?.name || null,
      varietyName: selectedCropFor(p)?.variety || null
    }))
  });

  const handleConfirmBooking = async () => {
    if (startDate < todayStr) {
      setBookingError('Ngày bắt đầu không được ở quá khứ');
      return;
    }
    if (startDate > maxStartDateStr) {
      setBookingError('Ngày bắt đầu canh tác tối đa trong vòng 10 ngày kể từ hôm nay.');
      return;
    }

    setBookingError('');
    setIsProcessing(true);

    try {
      let resContractId = null;
      let resContractNumber = null;

      try {
        // 1. Gọi POST /api/contracts/reservations vào DB PostgreSQL (BR08)
        const reservation = await createReservationOnServer();
        resContractId = reservation.contractId;
        resContractNumber = reservation.contractNumber;
        setCreatedContractId(resContractId);
        setContractCode(resContractNumber);

        if (reservation.reservationExpiresAt) {
          const remainingMs = new Date(reservation.reservationExpiresAt).getTime() - Date.now();
          setSecondsRemaining(Math.max(0, Math.floor(remainingMs / 1000)));
        }
      } catch (err) {
        console.warn('Lỗi tạo reservation qua rentalApi:', err);
      }

      // Lưu payload dự phòng cho VNPay
      const pendingPayload = buildPendingBookingPayload();
      try {
        localStorage.setItem('farmely_pending_vnpay_booking', JSON.stringify(pendingPayload));
      } catch (e) {
        console.warn('Could not store pending booking:', e);
      }

      // 2. Điều hướng cổng thanh toán theo lựa chọn
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

      // 3. Thanh toán trực tiếp / VietQR: Kích hoạt hợp đồng ngay trong Database (BR09)
      if (resContractId) {
        await rentalApi.activateContract(resContractId);
      } else {
        const savedCode = await saveContractToDb('VIETQR');
        if (savedCode) setContractCode(savedCode);
      }

      setIsProcessing(false);
      syncRentalToChat();
      markPlotsAsBookedLocally();
      setIsSuccess(true);
    } catch (err) {
      console.error('Lỗi quy trình hợp đồng & giữ chỗ:', err);
      setBookingError(err.message || 'Đã có lỗi xảy ra khi tạo hợp đồng giữ chỗ.');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowVnPayModal(false);
    setShowCardModal(false);
    setIsProcessing(true);
    setBookingError('');
    try {
      if (createdContractId) {
        await rentalApi.activateContract(createdContractId);
      } else {
        const savedCode = await saveContractToDb('VNPAY');
        if (savedCode) setContractCode(savedCode);
      }
      syncRentalToChat();
      markPlotsAsBookedLocally();
      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err) {
      console.error('Lỗi kích hoạt hợp đồng sau thanh toán:', err);
      setBookingError(err.message || 'Thanh toán thành công nhưng chưa kích hoạt được hợp đồng.');
      setIsProcessing(false);
      setIsSuccess(true);
    }
  };

  const handleQuickCustomerLogin = async () => {
    await login('customer@farmely.vn', '123456');
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
                    Khóa giữ chỗ 15 phút (BR08)
                  </span>
                  <span className="font-mono text-lg font-black text-brand-yellow">
                    {formattedTimer}
                  </span>
                </div>
                {createdContractId && !graceApplied && (
                  <button
                    type="button"
                    onClick={handleExtendGracePeriod}
                    disabled={isExtendingGrace}
                    className="ml-2 px-2.5 py-1 text-[11px] font-bold bg-brand-yellow text-brand-dark rounded-lg hover:bg-yellow-400 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    title="Cộng thêm 10 phút ân hạn khi chuẩn bị thanh toán (BR08)"
                  >
                    {isExtendingGrace ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>+10p Ân Hạn</span>
                  </button>
                )}
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
                          <p className={`text-[11px] font-semibold ${getPlotSelectedCrop(p) ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {getPlotSelectedCrop(p)
                              ? `Cây trồng: ${getPlotSelectedCrop(p).variety} (Theo BR03)`
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
                    onClick={() => setSelectedMode('SELF')}
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
                    onClick={() => setSelectedMode('ASSISTED')}
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
                      onClick={() => setRentalMonths(m)}
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

              {/* 3. Ngày Bắt Đầu Canh Tác (SSoT: Giới hạn hôm nay tới +10 ngày tối đa) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-green" />
                    <h3 className="font-heading font-bold text-lg text-brand-dark">
                      3. Ngày Bắt Đầu Canh Tác (Start Date) *
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    Quy chuẩn: Hôm nay đến +10 ngày
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-brand-dark block">
                    Chọn ngày nông trại chính thức bàn giao thửa đất và bắt đầu gieo trồng:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <input
                      type="date"
                      min={todayStr}
                      max={maxStartDateStr}
                      value={startDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStartDate(val);
                        if (val < todayStr) {
                          setStartDateError('Ngày bắt đầu không được ở quá khứ');
                        } else if (val > maxStartDateStr) {
                          setStartDateError('Ngày bắt đầu tối đa không quá 10 ngày tới (tránh kéo dài không quản lý được).');
                        } else {
                          setStartDateError('');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-stone-50 font-medium text-sm text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                    <div className="text-xs text-brand-muted leading-relaxed">
                      {startDate === todayStr ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 inline-block">
                          🌱 Bắt đầu ngay hôm nay (Kích hoạt canh tác trực tiếp)
                        </span>
                      ) : (
                        <span className="text-amber-800 font-medium bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 inline-block">
                          ⏳ Bắt đầu sau <strong>{Math.ceil((new Date(startDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24))} ngày</strong> (Chờ bàn giao & phơi ải đất)
                        </span>
                      )}
                    </div>
                  </div>
                  {startDateError ? (
                    <p className="text-xs text-rose-600 font-bold">{startDateError}</p>
                  ) : (
                    <p className="text-[11px] text-brand-muted">
                      💡 <em>Chính sách vận hành:</em> Khách hàng được chọn ngày bắt đầu từ hôm nay tới tối đa 10 ngày để nông trại chủ động điều phối kỹ sư và chuẩn bị cây giống VietGAP.
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method - Only VNPay Sandbox */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-green" />
                    <h3 className="text-base sm:text-lg font-normal text-brand-dark">
                      4. Phương Thức Thanh Toán Duy Nhất
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Cổng VNPay Sandbox
                  </span>
                </div>

                <div className="relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-[#294C3B] bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20 shadow-xs ring-2 ring-[#294C3B]/10 transition-all">
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-emerald-200/90 flex items-center justify-center p-2.5 shadow-2xs shrink-0">
                        <img
                          src="https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo.svg"
                          alt="VNPAY"
                          className="w-full h-auto max-h-7 sm:max-h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                          }}
                        />
                        <span style={{ display: 'none' }} className="font-black text-[#294C3B] text-xs">VNPAY</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <h4 className="text-sm sm:text-[15px] lg:text-base font-medium text-[#1b3b2b] tracking-tight whitespace-nowrap">
                            Cổng Thanh Toán Trực Tuyến VNPAY (Sandbox)
                          </h4>
                          <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] whitespace-nowrap">
                            Chính thức
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-stone-500 mt-1 leading-normal">
                          Thanh toán an toàn, bảo mật tiêu chuẩn quốc tế PCI-DSS & mã hóa SHA-512
                        </p>
                      </div>
                    </div>

                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#294C3B] text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-emerald-50">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
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
                    <span>Ngày bắt đầu canh tác:</span>
                    <strong className="text-brand-dark">
                      {new Date(startDate).toLocaleDateString('vi-VN')} {startDate === todayStr ? '(Hôm nay)' : `(+${Math.ceil((new Date(startDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24))} ngày)`}
                    </strong>
                  </div>

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
                          {p.code} ({p.area}){getPlotSelectedCrop(p) ? ` • ${getPlotSelectedCrop(p).variety}` : ''}
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
                  <span>Tôi đã đọc và đồng ý với <Link to="/terms/rental" target="_blank" className="font-bold text-brand-green underline underline-offset-2">điều khoản thuê đất và thanh toán của Farmely</Link>.</span>
                </label>
                {termsError && <p role="alert" className="text-xs font-semibold text-rose-600">{termsError}</p>}

                {/* Error Banner if any */}
                {bookingError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold">Lỗi xử lý hợp đồng:</strong>
                      <span>{bookingError}</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full uppercase font-black tracking-wider text-sm shadow-md py-4 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  onClick={handleConfirmBooking}
                  loading={isProcessing}
                  aria-describedby={termsError ? 'booking-terms-error' : undefined}
                >
                  <ShieldCheck className="w-5 h-5 text-brand-yellow" />
                  <span>TIẾP TỤC THANH TOÁN VNPAY SANDBOX ({totalAmount.toLocaleString('vi-VN')} đ)</span>
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
        contractId={createdContractId}
        pendingBooking={buildPendingBookingPayload()}
        plotInfo={{
          code: plotCodesSummary,
          name: `Hợp đồng thuê ${selectedPlots.length} thửa đất (${plotCodesList})`
        }}
        totalAmount={totalAmount}
      />

      {/* Card Payment Pop-up Modal */}
      <CardPaymentModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        contractId={createdContractId}
        totalAmount={totalAmount}
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
