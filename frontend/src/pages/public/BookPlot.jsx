import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { farmApi } from '../../api/farm/farmApi';
import { rentalApi } from '../../api/rental/rentalApi';
import { getSafeCropById, safeCrops } from '../../data/safeCrops';
import { useAuthStore } from '../../stores/authStore';
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
  UserCheck,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  X,
  Loader2,
  Calendar
} from 'lucide-react';
import VnPayModal from '../../components/payment/VnPayModal';
import { chatService } from '../../api/communication/chatService';
import { DEMO_CUSTOMERS } from '../../api/communication/chatStorage';
import {
  normalizePlotCode,
  findPlotByCode,
  removeCartCodes,
  buildBookingUrl,
  filterCompatibleCrops,
  fetchCompatibleVarietyIds,
  loadLeaseConfigMap,
  saveLeaseConfigMap,
  normalizeLeaseConfig,
  getLeaseConfigError,
  computePlotLeasePrice,
  getCareFeePerMonth
} from '../../utils/leaseSelection';
import PlotLeaseOptions from '../../components/marketplace/PlotLeaseOptions';

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

export const getPlotSelectionKey = (plot) => String(plot?.code || plot?.label || plot?.id || '')
  .replace(/^plot\s+/i, '')
  .trim()
  .toLowerCase();

export const dedupeSelectedPlots = (plots) => {
  const seen = new Set();
  return (plots || []).filter((plot) => {
    const key = getPlotSelectionKey(plot);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getBookingValidationError = ({ acceptedTerms, selectedMode, assistedService, selectedPlots }) => {
  if (selectedPlots !== undefined && Array.isArray(selectedPlots) && selectedPlots.length === 0) {
    return 'Chưa có thửa đất nào được chọn trong hợp đồng. Vui lòng quay lại Marketplace chọn thửa đất!';
  }
  if (!acceptedTerms) return 'Bạn cần đọc và chấp nhận điều khoản thuê đất trước khi thanh toán.';
  if (selectedMode === 'ASSISTED' && !assistedService) {
    return 'Chưa tải được gói chăm sóc toàn vụ từ hệ thống. Vui lòng tải lại trang rồi thử lại.';
  }
  return '';
};

export default function BookPlot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login } = useAuthStore();
  const [allPlots, setAllPlots] = useState([]);
  const [loadingPlots, setLoadingPlots] = useState(true);

  // URL là nguồn sự thật duy nhất của danh sách thửa trong hợp đồng: /marketplace/plot/<mã>/book?plots=<mã,...>
  const plotsParam = searchParams.get('plots');
  const urlCodesKey = React.useMemo(() => {
    const raw = (plotsParam || id || '').split(',');
    return [...new Set(raw.map(normalizePlotCode).filter(Boolean))].join(',');
  }, [plotsParam, id]);
  const urlCodes = React.useMemo(() => (urlCodesKey ? urlCodesKey.split(',') : []), [urlCodesKey]);
  const selectedPlots = React.useMemo(
    () => dedupeSelectedPlots(urlCodes.map((code) => findPlotByCode(allPlots, code)).filter(Boolean)),
    [allPlots, urlCodes]
  );
  const [compatByPlotId, setCompatByPlotId] = useState({});
  const [isAddPlotModalOpen, setIsAddPlotModalOpen] = useState(false);
  const [createdContractId, setCreatedContractId] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isExtendingGrace, setIsExtendingGrace] = useState(false);
  const [graceApplied, setGraceApplied] = useState(false);

  // Cấu hình thuê theo mã thửa ({"P-04": { cropId, cultivationMode, termMonths }}), dùng chung với Marketplace.
  const [leaseConfigByPlot, setLeaseConfigByPlot] = useState(() => {
    const saved = loadLeaseConfigMap();
    const cropFromUrl = searchParams.get('cropId');
    const pathCode = normalizePlotCode(id);
    if (cropFromUrl && pathCode && (!saved[pathCode] || !saved[pathCode].cropId) && getSafeCropById(cropFromUrl)) {
      saved[pathCode] = normalizeLeaseConfig({ ...saved[pathCode], cropId: cropFromUrl }, getSafeCropById(cropFromUrl));
      saveLeaseConfigMap(saved);
    }
    return saved;
  });
  const [showConfigErrors, setShowConfigErrors] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // 15-minute reservation timer (BR08) & checkout settings
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [paymentMethod] = useState('VNPAY');
  const [isSuccess, setIsSuccess] = useState(false);
  const [contractCode, setContractCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVnPayModal, setShowVnPayModal] = useState(false);

  // BR03: nạp danh sách giống tương thích (plot_variety_compatibility) cho từng thửa trong hợp đồng
  useEffect(() => {
    let active = true;
    selectedPlots.forEach((p) => {
      if (p.plotId === undefined || p.plotId === null || p.plotId in compatByPlotId) return;
      fetchCompatibleVarietyIds(p.plotId).then((ids) => {
        if (active) setCompatByPlotId((prev) => ({ ...prev, [p.plotId]: ids }));
      });
    });
    return () => {
      active = false;
    };
  }, [selectedPlots, compatByPlotId]);

  // Danh sách giống cây tương thích với thửa (toàn bộ danh mục nếu thửa chưa có dữ liệu tương thích)
  const getPlotCompatibility = useCallback((plot) => {
    return filterCompatibleCrops(safeCrops, plot ? compatByPlotId[plot.plotId] : null);
  }, [compatByPlotId]);

  const getCompatibleCropsForPlot = useCallback((plot) => getPlotCompatibility(plot).crops, [getPlotCompatibility]);

  const updatePlotLeaseConfig = (plotCode, patch) => {
    const code = normalizePlotCode(plotCode);
    if (!code) return;
    setLeaseConfigByPlot((prev) => {
      const current = prev[code] || {};
      const merged = { ...current, ...patch };
      const crop = getSafeCropById(merged.cropId);
      const normalized = normalizeLeaseConfig(merged, crop);
      const next = { ...prev, [code]: normalized };
      saveLeaseConfigMap(next);
      return next;
    });
    setShowConfigErrors(false);
  };

  const handleSelectCropForPlot = (plotCode, cropId) => {
    updatePlotLeaseConfig(plotCode, { cropId });
  };

  // Lấy giống cây đã chọn cho thửa đất (theo mã thửa); bỏ qua giống không tương thích
  const getPlotSelectedCrop = useCallback((plot) => {
    if (!plot) return null;
    const crop = getSafeCropById(leaseConfigByPlot[normalizePlotCode(plot.code)]?.cropId);
    if (!crop) return null;
    const { crops, hasData } = getPlotCompatibility(plot);
    if (hasData && !crops.some((c) => c.id === crop.id)) return null;
    return crop;
  }, [leaseConfigByPlot, getPlotCompatibility]);

  const getPlotConfig = useCallback((plot) => {
    if (!plot) return { cropId: '', cultivationMode: null, termMonths: 3 };
    const raw = leaseConfigByPlot[normalizePlotCode(plot.code)] || {};
    const crop = getPlotSelectedCrop(plot);
    return normalizeLeaseConfig(raw, crop);
  }, [leaseConfigByPlot, getPlotSelectedCrop]);

  const getPlotError = useCallback((plot) => {
    const config = getPlotConfig(plot);
    const crop = getPlotSelectedCrop(plot);
    return getLeaseConfigError(config, crop);
  }, [getPlotConfig, getPlotSelectedCrop]);

  const getPlotPrice = useCallback((plot) => {
    const config = getPlotConfig(plot);
    const rent = plot?.rentalPrice || 1200000;
    return computePlotLeasePrice({ monthlyRent: rent, ...config });
  }, [getPlotConfig]);

  // Load plots from PostgreSQL DB via Farm Service (chỉ 1 lần; danh sách chọn suy ra từ URL)
  useEffect(() => {
    setLoadingPlots(true);
    farmApi.listPlots()
      .then((rows) => {
        const mapped = (rows || []).map((p) => ({
          id: String(p.plotId),
          plotId: p.plotId,
          dbPlotId: p.plotId,
          code: p.plotCode,
          label: p.plotCode,
          name: `Thửa đất ${p.plotCode}`,
          landName: p.landName || 'Trang trại Happy Valley Củ Chi',
          area: `${Number(p.area)} m²`,
          areaFormatted: `${Number(p.area)} m²`,
          rentalPrice: Number(p.pricePerPeriod),
          formattedPrice: `${Number(p.pricePerPeriod).toLocaleString('vi-VN')} đ/tháng`,
          rentalPriceFormatted: `${Number(p.pricePerPeriod).toLocaleString('vi-VN')} đ/tháng`,
          careServicePrice: getCareFeePerMonth(Number(p.pricePerPeriod)),
          status: p.status === 'AVAIL' ? 'AVAILABLE' : p.status === 'RENT' ? 'RENTED' : 'MAINTENANCE',
          iotStationId: `IOT-${p.plotCode}`,
          compatibleCrops: safeCrops.map((crop) => crop.variety),
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1000&q=80'
        }));
        setAllPlots(mapped);
      })
      .catch((err) => console.error('Lỗi nạp plots trong BookPlot:', err))
      .finally(() => setLoadingPlots(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Tự động điều hướng chọn thửa đất nếu URL chưa có hoặc rỗng
  useEffect(() => {
    if (!loadingPlots && allPlots.length > 0 && selectedPlots.length === 0) {
      const cart = loadCartCodes();
      if (cart.length > 0) {
        navigate(buildBookingUrl(cart), { replace: true });
      } else {
        const firstAvail = allPlots.find((p) => p.status === 'AVAILABLE' || p.status === 'Đang trống' || p.status === 'Còn trống') || allPlots[0];
        if (firstAvail?.code) {
          navigate(buildBookingUrl([firstAvail.code]), { replace: true });
        }
      }
    }
  }, [loadingPlots, allPlots, selectedPlots, navigate]);

  // Luôn đồng bộ danh sách thửa đất trong hợp đồng vào localStorage
  useEffect(() => {
    if (selectedPlots && selectedPlots.length > 0) {
      saveCartCodes(selectedPlots.map((p) => p.code));
    }
  }, [selectedPlots]);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // List of other available plots that can be added to this Master Contract
  const availablePlotsToAdd = allPlots.filter(
    (p) =>
      (p.status === 'AVAILABLE' || p.status === 'Đang trống') &&
      !selectedPlots.some((sp) => sp.id === p.id)
  );

  const selectedCodes = selectedPlots.map((p) => normalizePlotCode(p.code));

  // Thêm/bớt thửa = ghi lại URL để URL, danh sách và thẻ hợp đồng luôn khớp nhau
  const handleAddPlot = (plotToAdd) => {
    const code = normalizePlotCode(plotToAdd?.code);
    if (code) navigate(buildBookingUrl([...selectedCodes, code]), { replace: true });
    setIsAddPlotModalOpen(false);
  };

  const handleRemovePlot = (plotCodeToRemove) => {
    if (selectedPlots.length <= 1) return; // Keep at least 1 plot
    const code = normalizePlotCode(plotCodeToRemove);
    navigate(buildBookingUrl(selectedCodes.filter((c) => c !== code)), { replace: true });
  };

  // Aggregate calculations for the multi-plot rental contract.
  const totalAreaM2 = selectedPlots.reduce((sum, p) => {
    const num = typeof p.area === 'number' ? p.area : parseInt(p.area, 10) || 50;
    return sum + num;
  }, 0);

  const subtotalPlot = selectedPlots.reduce(
    (sum, p) => sum + getPlotPrice(p).rentTotal,
    0
  );

  const subtotalCare = selectedPlots.reduce(
    (sum, p) => sum + getPlotPrice(p).careTotal,
    0
  );

  const totalAmount = selectedPlots.reduce(
    (sum, p) => sum + getPlotPrice(p).total,
    0
  );

  const primaryPlot = selectedPlots[0] || {};
  const bookingUrlForRedirect = buildBookingUrl(urlCodes);
  const plotCodesList = selectedPlots.map((p) => p.code).join(', ');
  const plotCodesSummary = selectedPlots.map((p) => p.code).join('-');
  const primaryCrop = getPlotSelectedCrop(primaryPlot);

  const syncRentalToChat = () => {
    if (!user) return;
    const demoProfile = DEMO_CUSTOMERS.find(
      (customer) => customer.email?.toLowerCase() === user.email?.toLowerCase()
    );
    const safeKey = user.email?.replace(/[^a-zA-Z0-9]/g, '_') || user.id || 'customer';
    chatService.updateRentalContext({
      threadId: demoProfile?.threadId || `CONS-${safeKey}`,
      customerName: user.fullName,
      customerAvatar: user.avatar,
      plotCode: plotCodesList,
      plotName: `Hợp đồng thuê ${selectedPlots.length} thửa đất (${plotCodesList})`,
      crop: primaryCrop?.variety || primaryPlot.compatibleCrops?.[0] || 'Cây trồng tiêu chuẩn'
    });
  };

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

  // Helper xác định chính xác plotId số trong PostgreSQL database
  const resolvePlotDbId = useCallback((plot) => {
    if (!plot) return 1;
    if (typeof plot.plotId === 'number' && !isNaN(plot.plotId)) return plot.plotId;
    if (typeof plot.plot_id === 'number' && !isNaN(plot.plot_id)) return plot.plot_id;
    if (typeof plot.dbPlotId === 'number' && !isNaN(plot.dbPlotId)) return plot.dbPlotId;
    const pureNum = parseInt(String(plot.id), 10);
    if (!isNaN(pureNum)) return pureNum;
    const cleanDigits = String(plot.code || plot.id).replace(/\D/g, '');
    if (cleanDigits) return parseInt(cleanDigits, 10);
    return 1;
  }, []);

  // Tạo hợp đồng giữ chỗ trực tiếp trong Database PostgreSQL qua rental-service (BR08)
  const createReservationOnServer = async () => {
    if (!selectedPlots || selectedPlots.length === 0) {
      throw new Error('Chưa có thửa đất nào được chọn trong hợp đồng.');
    }

    const renterId = user?.userId
      ? Number(user.userId)
      : (user?.id ? Number(String(user.id).replace(/\D/g, '')) : 1);

    const start = startDate ? new Date(startDate) : new Date();
    const startStr = start.toISOString().split('T')[0];

    const items = selectedPlots.map((p) => {
      const crop = getPlotSelectedCrop(p);
      const plotDbId = resolvePlotDbId(p);
      const config = getPlotConfig(p);
      const endDate = getRentalEndDate(startStr, config.termMonths, crop);

      return {
        plotId: Number(plotDbId),
        plotCode: p.code,
        varietyId: Number(crop?.varietyId),
        cultivationMode: config.cultivationMode,
        termMonths: config.termMonths,
        serviceId: config.cultivationMode === 'ASSISTED' ? 15 : null,
        startDate: startStr,
        endDate
      };
    });

    return await rentalApi.createReservation({
      renterId,
      items
    });
  };

  const markPlotsAsBookedLocally = () => {
    try {
      removeCartCodes(selectedPlots.map((p) => p.code));
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

  const buildPendingBookingPayload = (contractIdToUse) => {
    const anyAssisted = selectedPlots.some((p) => getPlotConfig(p).cultivationMode === 'ASSISTED');
    const maxTerm = Math.max(...selectedPlots.map((p) => getPlotConfig(p).termMonths || 3), 3);

    return {
      contractId: contractIdToUse || createdContractId || null,
      customerId: user?.userId || user?.id || 1,
      customerEmail: user?.email || 'customer@farmely.vn',
      customerName: user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Khách hàng Farmely'),
      customerPhone: user?.phone || user?.phoneNumber || '0901234567',
      totalAmount: totalAmount,
      paymentMethod: 'VNPAY',
      cultivationMode: anyAssisted ? 'ASSISTED_GROWING' : 'SELF_GROWING',
      rentalMonths: maxTerm,
      startDate: startDate,
      plots: selectedPlots.map((p) => {
        const crop = getPlotSelectedCrop(p);
        const config = getPlotConfig(p);
        const priceObj = getPlotPrice(p);
        return {
          id: p.id,
          code: p.code || p.id,
          name: p.name || `Thửa ${p.code || p.id}`,
          price: p.rentalPrice || 1200000,
          monthlyRent: p.rentalPrice || 1200000,
          careFeePerMonth: priceObj.careFeePerMonth,
          totalPrice: priceObj.total,
          cultivationMode: config.cultivationMode,
          termMonths: config.termMonths,
          area: p.area,
          cropId: crop?.id || null,
          varietyId: crop?.varietyId || null,
          cropName: crop?.name || null,
          varietyName: crop?.variety || null
        };
      })
    };
  };

  const handleConfirmBooking = async () => {
    setBookingError('');

    if (!selectedPlots || selectedPlots.length === 0) {
      setBookingError('Chưa có thửa đất nào được chọn trong hợp đồng. Vui lòng quay lại Marketplace hoặc bấm "+ Chọn nhanh" để chọn thửa đất!');
      return;
    }

    if (!startDate) {
      setBookingError('Vui lòng chọn ngày bắt đầu canh tác.');
      return;
    }

    const firstInvalidPlot = selectedPlots.find((p) => getPlotError(p));
    if (firstInvalidPlot) {
      const err = getPlotError(firstInvalidPlot);
      setShowConfigErrors(true);
      setBookingError(`Thửa đất ${firstInvalidPlot.code}: ${err}`);
      const el = document.getElementById(`plot-card-${firstInvalidPlot.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsProcessing(true);

    try {
      let contractIdToSave = createdContractId;
      try {
        const reservation = await createReservationOnServer();
        if (reservation?.contractId) {
          contractIdToSave = reservation.contractId;
          setCreatedContractId(reservation.contractId);
          setContractCode(reservation.contractNumber);
          if (reservation.reservationExpiresAt) {
            const remainingMs = new Date(reservation.reservationExpiresAt).getTime() - Date.now();
            setSecondsRemaining(Math.max(0, Math.floor(remainingMs / 1000)));
          }
        }
      } catch (resErr) {
        console.error('Backend reservation notice:', resErr);
        if (isAuthenticated) {
          setBookingError(resErr.message || 'Không thể tạo đơn giữ chỗ trên hệ thống. Vui lòng thử lại!');
          setIsProcessing(false);
          return;
        }
      }

      const pendingPayload = buildPendingBookingPayload(contractIdToSave);
      try {
        localStorage.setItem('farmely_pending_vnpay_booking', JSON.stringify(pendingPayload));
      } catch (e) {
        console.warn('Could not store pending booking:', e);
      }

      setIsProcessing(false);
      setShowVnPayModal(true);
    } catch (err) {
      console.error('Lỗi quy trình hợp đồng & giữ chỗ:', err);
      setBookingError(err.message || 'Đã có lỗi xảy ra khi tạo hợp đồng giữ chỗ.');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowVnPayModal(false);
    setIsProcessing(true);
    setBookingError('');

    try {
      if (createdContractId) {
        await rentalApi.activateContract(createdContractId);
      }

      // Đảm bảo cập nhật trạng thái RENT trên PostgreSQL cho các thửa đất đã thuê
      for (const p of selectedPlots) {
        const plotDbId = resolvePlotDbId(p);
        if (plotDbId) {
          try {
            await fetch(`/api/plots/${plotDbId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'RENT' })
            });
          } catch (patchErr) {
            console.debug('Plot status patch fallback:', patchErr);
          }
        }
      }

      syncRentalToChat();
      markPlotsAsBookedLocally();

      // Thông báo cho toàn bộ các tab và component làm mới dữ liệu
      window.dispatchEvent(new Event('farmely_plot_booked'));

      try {
        removeCartCodes(selectedPlots.map((p) => p.code));
        localStorage.removeItem('farmely_pending_vnpay_booking');
      } catch (e) {
        console.error(e);
      }
      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err) {
      console.error('Lỗi kích hoạt hợp đồng sau thanh toán:', err);
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
            to="/marketplace"
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
                to={`/login?redirect=${encodeURIComponent(bookingUrlForRedirect)}`}
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
                to={`/register?redirect=${encodeURIComponent(bookingUrlForRedirect)}`}
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

            {/* 1-Click Demo Customer Login Shortcut */}
            <div className="pt-4 border-t border-brand-border/60">
              <p className="text-xs text-brand-muted mb-2 font-medium">
                Dành cho người kiểm thử (Tester / Giảng viên):
              </p>
              <button
                type="button"
                onClick={handleQuickCustomerLogin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>1-Click Đăng nhập Demo Customer (Nguyen Van An)</span>
              </button>
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
                      key={p.id}
                      className="inline-block ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[11px]"
                    >
                      {p.code} - {p.name} ({p.area})
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-stone-500">Cấu hình từng thửa ({selectedPlots.length}):</span>
                <div className="text-right space-y-1">
                  {selectedPlots.map((p) => {
                    const cfg = getPlotConfig(p);
                    const modeLabel = cfg.cultivationMode === 'ASSISTED' ? 'Assisted-Growing' : 'Self-Growing';
                    return (
                      <div key={p.id} className="text-[11px] text-stone-700 font-medium">
                        <strong className="text-brand-dark">{p.code}</strong>: {modeLabel} • {cfg.termMonths} tháng
                      </div>
                    );
                  })}
                </div>
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
        ) : loadingPlots ? (
          <div className="py-16 text-center text-sm text-stone-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thông tin thửa đất...
          </div>
        ) : selectedPlots.length === 0 ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center space-y-4" role="alert">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-brand-dark">
              Không tìm thấy thửa đất {urlCodes.join(', ') || '(trống)'} trong hệ thống.
            </p>
            <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Marketplace để chọn thửa đất
            </Link>
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
                      to="/marketplace"
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
                <div className="space-y-4">
                  {loadingPlots ? (
                    <div className="p-8 rounded-2xl border border-brand-border bg-white text-center space-y-3 animate-pulse">
                      <div className="w-8 h-8 mx-auto border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-stone-500 font-medium">Đang nạp dữ liệu thửa đất từ hệ thống...</p>
                    </div>
                  ) : selectedPlots.length === 0 ? (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 text-center space-y-3 animate-fadeIn">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-heading font-bold text-sm text-stone-800">
                          Chưa có thửa đất nào được chọn trong hợp đồng
                        </h4>
                        <p className="text-xs text-stone-500 max-w-md mx-auto">
                          Vui lòng chọn thửa đất bạn muốn thuê từ bản đồ vệ tinh Marketplace hoặc bấm nút bên dưới.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        <Link
                          to="/marketplace"
                          className="px-4 py-2 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs"
                        >
                          Về Marketplace chọn thửa đất
                        </Link>
                        {allPlots.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsAddPlotModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-white border border-brand-border text-brand-dark text-xs font-bold hover:bg-stone-50 transition-colors shadow-xs"
                          >
                            + Chọn nhanh từ danh sách
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    selectedPlots.map((p, index) => {
                      const plotCrop = getPlotSelectedCrop(p);
                      const plotConfig = getPlotConfig(p);
                      const plotError = getPlotError(p);
                      const isPlotInvalid = Boolean(showConfigErrors && plotError);
                      const isCropMissing = !plotCrop;
                      const compatCrops = getCompatibleCropsForPlot(p);

                    return (
                      <div
                        key={p.id}
                        id={`plot-card-${p.id}`}
                        className={`p-5 rounded-2xl border transition-all ${
                          isPlotInvalid
                            ? 'border-2 border-rose-500 bg-rose-50/70 ring-4 ring-rose-500/20 shadow-md'
                            : 'border-brand-border bg-brand-cream/40 hover:bg-brand-cream/70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
                                Chăm sóc: +{getCareFeePerMonth(p.rentalPrice || 1200000).toLocaleString('vi-VN')} đ/tháng (nếu Assisted)
                              </span>
                            </div>

                            {selectedPlots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePlot(p.code)}
                                aria-label={`Gỡ thửa ${p.code} khỏi hợp đồng`}
                                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                title="Gỡ thửa này khỏi hợp đồng"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Chọn Giống Cây Trồng */}
                        <div className="mt-3 pt-3 border-t border-brand-border/60">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                              <Sprout className={`w-4 h-4 ${isCropMissing ? 'text-rose-600 animate-bounce' : 'text-emerald-600'}`} />
                              <span>Chọn Giống Cây Trồng:</span>
                            </label>
                            {isCropMissing ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Chưa chọn giống cây
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Đã chọn giống cây
                              </span>
                            )}
                          </div>

                          <select
                            value={plotCrop?.id || ''}
                            onChange={(e) => handleSelectCropForPlot(p.code, e.target.value)}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all outline-hidden cursor-pointer ${
                              isCropMissing
                                ? 'border-2 border-rose-500 text-rose-950 bg-white ring-2 ring-rose-500/30'
                                : 'border border-emerald-300 text-brand-dark bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20'
                            }`}
                          >
                            <option value="" disabled>-- BẮT BUỘC CHỌN GIỐNG CÂY TRỒNG CHO THỬA NÀY --</option>
                            {compatCrops.map((crop) => (
                              <option key={crop.id} value={crop.id}>
                                {crop.variety} ({crop.name}) - Thời gian sinh trưởng: {crop.minDays || 45} ngày
                              </option>
                            ))}
                          </select>

                          {p.plotId in compatByPlotId && !getPlotCompatibility(p).hasData && (
                            <p className="text-[10px] text-amber-700 mt-1">
                              Thửa đất chưa có dữ liệu tương thích giống cây trong hệ thống – đang hiển thị toàn bộ danh mục.
                            </p>
                          )}

                          {isCropMissing && (
                            <p className="text-[11px] font-bold text-rose-700 mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Vui lòng chọn 1 giống cây trồng trong danh sách trên để kích hoạt quy trình canh tác từ Bước 1!</span>
                            </p>
                          )}

                          {plotCrop && (
                            <p className="text-[11px] text-emerald-800 font-semibold mt-1.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Giống đã chọn: <strong>{plotCrop.variety}</strong> ({plotCrop.name}) • Chu kỳ: {plotCrop.minDays || 45} ngày
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Cấu hình thuê riêng cho thửa đất: Hình thức & Thời hạn */}
                        <div className="mt-3 pt-3 border-t border-brand-border/60">
                          <PlotLeaseOptions
                            crop={plotCrop}
                            {...plotConfig}
                            monthlyRent={p.rentalPrice || 1200000}
                            onChange={(patch) => updatePlotLeaseConfig(p.code, patch)}
                            showErrors={showConfigErrors}
                          />

                          {plotCrop && (
                            <p className="text-[11px] text-emerald-800 font-semibold mt-2.5 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Kết thúc dự kiến: <strong>{getRentalEndDate(startDate, plotConfig.termMonths, plotCrop)}</strong> ({plotConfig.termMonths} tháng)
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }))}
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

              {/* 1. Start Date Selection */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-green" />
                    <h3 className="font-heading font-bold text-lg text-brand-dark">
                      1. Ngày Bắt Đầu Canh Tác & Bàn Giao Thửa Đất
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-stone-500 leading-relaxed">
                  Toàn bộ các bước công việc thực tế, quy trình chăm sóc và nhật ký canh tác của cây trồng sẽ được tính chính xác bắt đầu từ ngày bạn chọn (Khởi động từ <strong>Bước 1: Làm đất & gieo trồng giống</strong>). Ngày bàn giao áp dụng chung cho mọi thửa; ngày kết thúc tính riêng theo thời hạn từng thửa.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Chọn ngày bắt đầu canh tác:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-brand-border text-sm font-semibold text-brand-dark focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-hidden bg-white shadow-2xs cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border flex flex-col justify-center">
                    <span className="text-[11px] text-stone-500 font-medium">
                      Dự kiến kết thúc theo từng thửa:
                    </span>
                    <div className="mt-1 space-y-1">
                      {selectedPlots.map((p) => {
                        const cfg = getPlotConfig(p);
                        const crop = getPlotSelectedCrop(p);
                        const endFormatted = getRentalEndDate(startDate, cfg.termMonths, crop);
                        return (
                          <div key={p.id} className="text-xs text-brand-dark flex justify-between items-center">
                            <strong className="text-brand-green">{p.code}:</strong>
                            <span>{endFormatted} ({cfg.termMonths} tháng)</span>
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1">
                      Bàn giao thửa đất & kích hoạt quy trình từ Ngày 1
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method - Only VNPay Sandbox */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-green" />
                    <h3 className="text-base sm:text-lg font-normal text-brand-dark">
                      2. Phương Thức Thanh Toán Duy Nhất
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
                  <div className="p-3 bg-stone-50 rounded-xl space-y-2 text-[11px] text-stone-600">
                    <span className="font-semibold text-stone-700 block text-xs">Chi tiết từng thửa ({selectedPlots.length} thửa):</span>
                    <div className="space-y-1.5 pt-0.5">
                      {selectedPlots.map((p) => {
                        const crop = getPlotSelectedCrop(p);
                        const cfg = getPlotConfig(p);
                        const priceObj = getPlotPrice(p);
                        const modeLabel = cfg.cultivationMode === 'ASSISTED' ? 'Assisted-Growing' : cfg.cultivationMode === 'SELF' ? 'Self-Growing' : 'Chưa chọn hình thức';
                        const hasErr = Boolean(getPlotError(p));

                        return (
                          <div key={p.id} className={`p-2 rounded-lg border flex justify-between items-start gap-2 ${hasErr ? 'border-amber-300 bg-amber-50/50' : 'border-stone-200 bg-white'}`}>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-stone-900">
                                {p.code} • {crop?.variety || '⚠️ Chưa chọn giống'}
                              </div>
                              <div className="text-[10px] text-stone-500">
                                {modeLabel} • {cfg.termMonths} tháng ({p.area})
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-brand-dark block text-xs">
                                {priceObj.total.toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-[9px] text-stone-400 block">
                                Thuê {Number(p.rentalPrice || 1200000).toLocaleString('vi-VN')}đ × {cfg.termMonths}th
                                {cfg.cultivationMode === 'ASSISTED' && ` + chăm sóc ${priceObj.careFeePerMonth.toLocaleString('vi-VN')}đ × ${cfg.termMonths}th`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between text-stone-600 pt-1">
                    <span>Tổng tiền thuê đất ({selectedPlots.length} thửa):</span>
                    <strong className="text-brand-dark">
                      {subtotalPlot.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>Tổng dịch vụ chăm sóc (gói Assisted):</span>
                    <strong className="text-brand-dark">
                      {subtotalCare.toLocaleString('vi-VN')} đ
                    </strong>
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

                {selectedPlots.length === 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-800 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Hợp đồng chưa có thửa đất nào. Vui lòng chọn ít nhất 1 thửa đất.</span>
                  </div>
                )}

                {selectedPlots.some((p) => getPlotError(p)) && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-800 flex items-center gap-2 animate-fadeIn" role="alert">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Vui lòng hoàn tất giống cây, hình thức canh tác và thời hạn thuê cho tất cả thửa đất ở cột bên trái trước khi thanh toán.</span>
                  </div>
                )}

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
                  disabled={selectedPlots.length === 0}
                  className="w-full uppercase font-black tracking-wider text-sm shadow-md py-4 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleConfirmBooking}
                  loading={isProcessing}
                >
                  <ShieldCheck className="w-5 h-5 text-brand-yellow" />
                  <span>
                    {selectedPlots.length === 0
                      ? 'VUI LÒNG CHỌN THỬA ĐẤT ĐỂ TIẾP TỤC'
                      : `TIẾP TỤC THANH TOÁN VNPAY SANDBOX (${totalAmount.toLocaleString('vi-VN')} đ)`}
                  </span>
                </Button>

                <p className="text-[11px] text-center text-brand-muted">
                  Bằng việc bấm xác nhận, bạn đồng ý với các điều khoản thuê thửa đất của Farmely.
                </p>
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
        plotInfo={{
          code: plotCodesSummary,
          name: `Hợp đồng thuê ${selectedPlots.length} thửa đất (${plotCodesList})`
        }}
        totalAmount={totalAmount}
        pendingBooking={buildPendingBookingPayload()}
      />

      <Footer />
    </div>
  );
}
