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
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login } = useAuthStore();
  const [allPlots, setAllPlots] = useState([]);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [selectedPlots, setSelectedPlots] = useState([]);
  const [isAddPlotModalOpen, setIsAddPlotModalOpen] = useState(false);
  const [createdContractId, setCreatedContractId] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isExtendingGrace, setIsExtendingGrace] = useState(false);
  const [graceApplied, setGraceApplied] = useState(false);

  const [selectedCropByPlot, setSelectedCropByPlot] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('farmely_selected_crop_by_plot') || '{}');
      const cropFromUrl = searchParams.get('cropId');
      if (cropFromUrl) {
        if (id) saved[id] = cropFromUrl;
        const plotsParam = searchParams.get('plots');
        if (plotsParam) {
          plotsParam.split(',').forEach((p) => {
            if (p.trim()) saved[p.trim()] = cropFromUrl;
          });
        }
      }
      return saved;
    } catch {
      return {};
    }
  });
  const [cropValidationError, setCropValidationError] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // 15-minute reservation timer (BR08) & checkout settings
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [selectedMode, setSelectedMode] = useState(null); // Mặc định là trống, bắt buộc người dùng chọn
  const [modeValidationError, setModeValidationError] = useState(false);
  const [rentalMonths, setRentalMonths] = useState(1);
  const [paymentMethod] = useState('VNPAY');
  const [isSuccess, setIsSuccess] = useState(false);
  const [contractCode, setContractCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVnPayModal, setShowVnPayModal] = useState(false);

  // Tự động nhận diện giống cây từ URL search param nếu có
  useEffect(() => {
    const cropFromUrl = searchParams.get('cropId');
    if (cropFromUrl) {
      setSelectedCropByPlot((prev) => {
        const next = { ...prev };
        if (selectedPlots.length > 0) {
          selectedPlots.forEach((p) => {
            next[p.id] = cropFromUrl;
            if (p.code) next[p.code] = cropFromUrl;
          });
        }
        if (id) next[id] = cropFromUrl;
        try {
          localStorage.setItem('farmely_selected_crop_by_plot', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    }
  }, [searchParams, selectedPlots, id]);

  // Lấy giống cây đã chọn cho thửa đất (ưu tiên lựa chọn từ Marketplace hoặc state)
  const getPlotSelectedCrop = useCallback((plot) => {
    if (!plot) return null;
    const cropFromUrl = searchParams.get('cropId');
    const savedCropKey =
      selectedCropByPlot[plot.id] ||
      selectedCropByPlot[plot.code] ||
      selectedCropByPlot[plot.plotCode] ||
      cropFromUrl;

    if (savedCropKey) {
      const savedCrop =
        getSafeCropById(savedCropKey) ||
        safeCrops.find(
          (c) =>
            String(c.id).toUpperCase() === String(savedCropKey).toUpperCase() ||
            String(c.varietyId) === String(savedCropKey)
        );
      if (savedCrop) {
        return savedCrop;
      }
    }

    return null;
  }, [selectedCropByPlot, searchParams]);

  // Danh sách tất cả các giống cây trồng có sẵn
  const getCompatibleCropsForPlot = useCallback(() => {
    return safeCrops;
  }, []);

  const handleSelectCropForPlot = (plotId, plotCode, cropId) => {
    setSelectedCropByPlot((prev) => {
      const next = { ...prev, [plotId]: cropId };
      if (plotCode) next[plotCode] = cropId;
      try {
        localStorage.setItem('farmely_selected_crop_by_plot', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    setCropValidationError(false);
  };

  const calculatedEndDate = React.useMemo(() => {
    if (!startDate) return '';
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + rentalMonths);
    return d.toISOString().split('T')[0];
  }, [startDate, rentalMonths]);

  const calculatedEndDateFormatted = React.useMemo(() => {
    if (!calculatedEndDate) return '';
    const parts = calculatedEndDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return calculatedEndDate;
  }, [calculatedEndDate]);

  // BR04: Thời hạn thuê tối thiểu phải >= thời gian sinh trưởng của giống cây + buffer time
  // Gói Assisted-Growing (Ủy thác canh tác trọn gói) bắt buộc tối thiểu 1 vụ mùa hoàn chỉnh (3 tháng)
  const minRequiredMonths = React.useMemo(() => {
    if (selectedMode === 'ASSISTED') {
      return 3;
    }

    let minMonths = 1;
    selectedPlots.forEach((p) => {
      const crop = getPlotSelectedCrop(p);
      if (crop) {
        const days = crop.minDays || 35;
        if (days > 30) {
          minMonths = Math.max(minMonths, 3);
        }
      }
    });

    return minMonths;
  }, [selectedPlots, getPlotSelectedCrop, selectedMode]);

  // Tự động nâng thời hạn thuê nếu thời hạn hiện tại nhỏ hơn mức tối thiểu BR04
  useEffect(() => {
    if (rentalMonths < minRequiredMonths) {
      setRentalMonths(minRequiredMonths);
    }
  }, [minRequiredMonths, rentalMonths]);

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

        // Determine initial plot
        const target = findPlotByAnyCode(id, mapped) || mapped[0];
        if (target) {
          setSelectedPlots([target]);
        }
      })
      .catch((err) => console.error('Lỗi nạp plots trong BookPlot:', err))
      .finally(() => setLoadingPlots(false));
  }, [id, findPlotByAnyCode]);

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
      const codes = [...new Set(plotsQuery.split(',').map((c) => c.trim()).filter(Boolean))];
      const matchedMap = new Map();
      codes.forEach((code) => {
        const found = findPlotByAnyCode(code);
        if (found && !matchedMap.has(found.id)) {
          matchedMap.set(found.id, found);
        }
      });
      const matched = Array.from(matchedMap.values());
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
          const matchedMap = new Map();
          parsed.forEach((p) => {
            const found = findPlotByAnyCode(p.code || p.id);
            if (found && !matchedMap.has(found.id)) {
              matchedMap.set(found.id, found);
            }
          });
          const matched = Array.from(matchedMap.values());
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
  }, [id, searchParams]);

  // Luôn đồng bộ danh sách thửa đất trong hợp đồng vào localStorage
  useEffect(() => {
    if (selectedPlots && selectedPlots.length > 0) {
      try {
        localStorage.setItem(
          'farmely_master_lease_selected_plots',
          JSON.stringify(selectedPlots)
        );
      } catch (e) {
        console.error(e);
      }
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

  const handleAddPlot = (plotToAdd) => {
    setSelectedPlots((prev) => [...prev, plotToAdd]);
    setIsAddPlotModalOpen(false);
  };

  const handleRemovePlot = (plotIdToRemove) => {
    if (selectedPlots.length <= 1) return; // Keep at least 1 plot
    setSelectedPlots((prev) => prev.filter((p) => p.id !== plotIdToRemove));
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

  const subtotalCare =
    selectedMode === 'ASSISTED'
      ? selectedPlots.reduce(
          (sum, p) => sum + (p.careServicePrice || 600000) * rentalMonths,
          0
        )
      : 0;

  const totalAmount = subtotalPlot + subtotalCare;

  const primaryPlot = selectedPlots[0] || allPlots[0] || {};
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
    if (!isNaN(pureNum) && String(pureNum) === String(plot.id).trim()) {
      return pureNum;
    }

    const matched = findPlotByAnyCode(plot.code || plot.id);
    if (matched) {
      if (typeof matched.plotId === 'number' && !isNaN(matched.plotId)) return matched.plotId;
      if (typeof matched.dbPlotId === 'number' && !isNaN(matched.dbPlotId)) return matched.dbPlotId;
      if (typeof matched.plot_id === 'number' && !isNaN(matched.plot_id)) return matched.plot_id;
      const mNum = parseInt(String(matched.id), 10);
      if (!isNaN(mNum) && String(mNum) === String(matched.id).trim()) {
        return mNum;
      }
    }

    const cleanDigits = String(plot.code || plot.id).replace(/\D/g, '');
    if (cleanDigits) {
      return parseInt(cleanDigits, 10);
    }
    return 1;
  }, [findPlotByAnyCode]);

  // Tạo hợp đồng giữ chỗ trực tiếp trong Database PostgreSQL qua rental-service (BR08)
  const createReservationOnServer = async () => {
    const renterId = user?.userId
      ? Number(user.userId)
      : (user?.id ? Number(String(user.id).replace(/\D/g, '')) : 1);

    const start = startDate ? new Date(startDate) : new Date();
    const startStr = start.toISOString().split('T')[0];

    const items = selectedPlots.map((p) => {
      const crop = getPlotSelectedCrop(p);
      const plotDbId = resolvePlotDbId(p);
      // Đảm bảo thỏa mãn BR04: rentDays >= variety.minDays
      const days = Math.max(rentalMonths * 30, crop?.minDays || 35);
      const end = new Date(start);
      end.setDate(end.getDate() + days);

      return {
        plotId: Number(plotDbId),
        varietyId: Number(crop?.varietyId || 1),
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

  const buildPendingBookingPayload = (contractIdToUse) => ({
    contractId: contractIdToUse || createdContractId || null,
    customerId: user?.userId || user?.id || 1,
    customerEmail: user?.email || 'customer@farmely.vn',
    customerName: user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Khách hàng Farmely'),
    customerPhone: user?.phone || user?.phoneNumber || '0901234567',
    totalAmount: totalAmount,
    paymentMethod: 'VNPAY',
    cultivationMode: selectedMode === 'ASSISTED' ? 'ASSISTED_GROWING' : 'SELF_GROWING',
    rentalMonths: rentalMonths,
    startDate: startDate,
    plots: selectedPlots.map((p) => {
      const crop = getPlotSelectedCrop(p);
      return {
        id: p.id,
        code: p.code || p.id,
        name: p.name || `Thửa ${p.code || p.id}`,
        price: p.rentalPrice || 1200000,
        cropId: crop?.id || null,
        varietyId: crop?.varietyId || null,
        cropName: crop?.name || null,
        varietyName: crop?.variety || null
      };
    })
  });

  const handleConfirmBooking = async () => {
    setBookingError('');

    if (!startDate) {
      setBookingError('Vui lòng chọn ngày bắt đầu canh tác.');
      return;
    }

    const missingCropPlot = selectedPlots.find((p) => !getPlotSelectedCrop(p));
    if (missingCropPlot) {
      setCropValidationError(true);
      setBookingError(`Vui lòng chọn giống cây trồng cho thửa đất ${missingCropPlot.code || missingCropPlot.name} (hiển thị viền đỏ) trước khi tiếp tục thanh toán!`);
      const el = document.getElementById(`plot-card-${missingCropPlot.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!selectedMode) {
      setModeValidationError(true);
      setBookingError('Vui lòng chọn hình thức canh tác ở Mục 2 (Self-Growing hoặc Assisted-Growing) trước khi tiếp tục thanh toán!');
      const el = document.getElementById('cultivation-mode-section');
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
        localStorage.removeItem('farmely_master_lease_selected_plots');
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
                <div className="space-y-4">
                  {selectedPlots.map((p, index) => {
                    const plotCrop = getPlotSelectedCrop(p);
                    const isCropMissing = !plotCrop;
                    const compatCrops = getCompatibleCropsForPlot(p);

                    return (
                      <div
                        key={p.id}
                        id={`plot-card-${p.id}`}
                        className={`p-5 rounded-2xl border transition-all ${
                          isCropMissing
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
                                Chăm sóc: +{(p.careServicePrice || 600000).toLocaleString('vi-VN')} đ
                              </span>
                            </div>

                            {selectedPlots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePlot(p.id)}
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
                            onChange={(e) => handleSelectCropForPlot(p.id, p.code, e.target.value)}
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
                                Giống đã chọn: <strong>{plotCrop.variety}</strong> ({plotCrop.name}) • Chu kỳ: {plotCrop.minDays || 45} ngày • Tự động kích hoạt quy trình từ Bước 1
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  Toàn bộ các bước công việc thực tế, quy trình chăm sóc và nhật ký canh tác của cây trồng sẽ được tính chính xác bắt đầu từ ngày bạn chọn (Khởi động từ <strong>Bước 1: Làm đất & gieo trồng giống</strong>).
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
                      Dự kiến kết thúc vụ & nghiệm thu ({rentalMonths} tháng):
                    </span>
                    <strong className="text-sm font-bold text-brand-green mt-0.5">
                      {calculatedEndDateFormatted}
                    </strong>
                    <span className="text-[10px] text-stone-400 mt-0.5">
                      Bàn giao thửa đất & kích hoạt quy trình từ Ngày 1
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Cultivation Mode Selection (Default Blank, Required) */}
              <div
                id="cultivation-mode-section"
                className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-sm space-y-4 transition-all ${
                  modeValidationError && !selectedMode
                    ? 'border-2 border-rose-500 ring-4 ring-rose-500/20 bg-rose-50/20'
                    : 'border-brand-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-border/60">
                  <h3 className="font-heading font-bold text-lg text-brand-dark flex items-center gap-2">
                    <span>2. Chọn Hình Thức Canh Tác Cho Toàn Bộ Hợp Đồng</span>
                    <span className="text-rose-500 text-sm font-bold">*</span>
                  </h3>
                  {!selectedMode ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 self-start sm:self-auto">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Bắt buộc chọn 1 hình thức
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 self-start sm:self-auto">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Đã chọn: {selectedMode === 'SELF' ? 'Self-Growing' : 'Assisted-Growing'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-500">
                  Vui lòng chọn 1 trong 2 hình thức canh tác phù hợp với nhu cầu của bạn trước khi thanh toán:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode('SELF');
                      setModeValidationError(false);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'SELF'
                        ? 'border-2 border-brand-green bg-emerald-50/70 ring-2 ring-brand-green/30 shadow-xs'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50 hover:border-brand-green/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-heading text-sm font-bold text-brand-dark">Self-Growing</p>
                      {selectedMode === 'SELF' && (
                        <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
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
                    onClick={() => {
                      setSelectedMode('ASSISTED');
                      setModeValidationError(false);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedMode === 'ASSISTED'
                        ? 'border-2 border-brand-yellow bg-amber-50/70 ring-2 ring-brand-yellow/40 shadow-xs'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50 hover:border-brand-yellow/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-heading text-sm font-bold text-brand-dark">Assisted-Growing</p>
                      {selectedMode === 'ASSISTED' && (
                        <span className="w-5 h-5 rounded-full bg-brand-yellow text-brand-dark flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Đội ngũ Farmely chăm sóc trọn gói hàng ngày
                    </p>
                    <div className="mt-2.5 space-y-1 text-[11px] text-stone-600 border-t border-brand-border/40 pt-2">
                      <p className="flex items-center gap-1 font-medium text-emerald-800">
                        ✓ Chuyên gia phụ trách: ThS. Nguyễn Hoàng Nam (Tư vấn kỹ thuật chuyên sâu)
                      </p>
                      <p className="text-amber-900 font-medium">
                        ✓ Công nhân phụ trách (CVLĐ): Phân công cố định (Tưới, nhổ cỏ 2 ca/ngày)
                      </p>
                    </div>
                    <p className="text-xs font-bold text-brand-green mt-3">
                      +{selectedPlots.reduce((sum, p) => sum + (p.careServicePrice || 600000), 0).toLocaleString('vi-VN')} đ/tháng ({selectedPlots.length} thửa)
                    </p>
                  </button>
                </div>

                {modeValidationError && !selectedMode && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Bắt buộc chọn hình thức canh tác (Self-Growing hoặc Assisted-Growing) trước khi tiếp tục thanh toán!</span>
                  </div>
                )}
              </div>

              {/* Rental Duration */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-border/60">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-brand-dark flex items-center gap-2">
                      <span>3. Thời Hạn Thuê Thửa Đất Theo Vụ Mùa</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                        Quy tắc BR04
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Thời hạn thuê đất được tính theo chu kỳ sinh trưởng thực tế của cây trồng từ gieo giống đến thu hoạch.
                    </p>
                  </div>
                  {minRequiredMonths > 1 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Yêu cầu tối thiểu: {minRequiredMonths === 3 ? '1 Vụ mùa (~3 Tháng)' : `${minRequiredMonths} Tháng`}</span>
                    </div>
                  )}
                </div>

                {/* Explanation banner if 1-month is locked */}
                {minRequiredMonths > 1 && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                    <Sprout className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold block">
                        {selectedMode === 'ASSISTED'
                          ? 'Gói Hỗ trợ canh tác trọn gói (Assisted-Growing):'
                          : 'Giống cây có chu kỳ sinh trưởng dài (BR04):'}
                      </span>
                      <span className="text-[11px] text-stone-600 leading-relaxed block">
                        {selectedMode === 'ASSISTED'
                          ? 'Chuyên viên Farmely chăm sóc toàn diện theo chu kỳ 1 vụ mùa hoàn chỉnh (từ gieo giống, tưới bón, tỉa cành, phòng ngừa sâu bệnh đến khi thu hoạch). Hợp đồng tối thiểu là 3 tháng để đảm bảo giao nông sản tận tay bạn.'
                          : `Giống cây bạn chọn cần hơn 35 ngày sinh trưởng để ra hoa kết trái. Thời hạn thuê tối thiểu phải từ 3 tháng (1 vụ) để tránh cây bị dở dang khi hết hợp đồng.`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    {
                      months: 1,
                      title: '1 Tháng',
                      cycleName: 'Ngắn hạn thử nghiệm',
                      tag: 'Chỉ rau ngắn ngày',
                      desc: 'Chỉ áp dụng tự chăm sóc rau ngắn ngày (rau muống, rau dền ≤ 30 ngày)'
                    },
                    {
                      months: 3,
                      title: '3 Tháng',
                      cycleName: '1 Vụ Mùa Tiêu Chuẩn',
                      tag: 'Khuyên Dùng',
                      desc: 'Chu kỳ trọn vẹn từ gieo giống đến thu hoạch chuẩn VietGAP'
                    },
                    {
                      months: 6,
                      title: '6 Tháng',
                      cycleName: '2 Vụ Mùa Luân Canh',
                      tag: 'Kỳ Hạn Dài',
                      desc: 'Canh tác 2 vụ liên tiếp, luân phiên thay đổi giống cây'
                    },
                    {
                      months: 12,
                      title: '12 Tháng',
                      cycleName: 'Trọn Năm (4 Vụ)',
                      tag: 'Kỳ Hạn Dài',
                      desc: 'Đất canh tác ổn định cả năm, thu hoạch nông sản liên tục'
                    }
                  ].map((opt) => {
                    const isDisabled = opt.months < minRequiredMonths;
                    const isSelected = rentalMonths === opt.months;

                    return (
                      <button
                        key={opt.months}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) {
                            setRentalMonths(opt.months);
                          }
                        }}
                        className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isDisabled
                            ? 'opacity-40 bg-stone-100 border-stone-200 cursor-not-allowed select-none'
                            : isSelected
                            ? 'border-brand-green bg-emerald-50/60 ring-2 ring-brand-green shadow-md cursor-pointer'
                            : 'border-brand-border bg-white hover:border-brand-green/60 hover:bg-brand-cream/40 cursor-pointer shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-base font-black ${isSelected ? 'text-brand-green' : 'text-brand-dark'}`}>
                              {opt.title}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isDisabled
                                  ? 'bg-stone-200 text-stone-500'
                                  : isSelected
                                  ? 'bg-brand-green text-white'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {isDisabled ? 'Khóa (BR04)' : opt.tag}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-stone-700">{opt.cycleName}</p>
                          <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                            {isDisabled
                              ? `Không đủ chu kỳ: Cần tối thiểu ${minRequiredMonths} tháng để thu hoạch.`
                              : opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
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
                    <span>
                      Giá thuê thửa đất ({selectedPlots.length} thửa, {totalAreaM2} m² x {rentalMonths} tháng):
                    </span>
                    <strong className="text-brand-dark">
                      {subtotalPlot.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>
                      Dịch vụ canh tác ({!selectedMode ? 'Chưa chọn' : selectedMode === 'ASSISTED' ? 'Trọn gói' : 'Tự chăm sóc'} x {rentalMonths} tháng):
                    </span>
                    <strong className="text-brand-dark">
                      {!selectedMode ? (
                        <span className="text-amber-600 font-bold">Chưa chọn hình thức</span>
                      ) : (
                        `${subtotalCare.toLocaleString('vi-VN')} đ`
                      )}
                    </strong>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-[11px] text-stone-600">
                    <span className="font-semibold text-stone-700 block">Thửa đất bao gồm:</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedPlots.map((p) => {
                        const crop = getPlotSelectedCrop(p);
                        return (
                          <span
                            key={p.id}
                            className={`px-2 py-0.5 rounded font-bold border ${
                              crop
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                            }`}
                          >
                            {p.code} ({p.area}) • {crop ? crop.variety : '⚠️ Chưa chọn giống'}
                          </span>
                        );
                      })}
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

                {selectedPlots.some((p) => !getPlotSelectedCrop(p)) && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Vui lòng chọn giống cây trồng cho tất cả thửa đất ở cột bên trái trước khi thanh toán.</span>
                  </div>
                )}

                {!selectedMode && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-800 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Vui lòng chọn hình thức canh tác ở Mục 2 trước khi thanh toán.</span>
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
                  className="w-full uppercase font-black tracking-wider text-sm shadow-md py-4 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  onClick={handleConfirmBooking}
                  loading={isProcessing}
                >
                  <ShieldCheck className="w-5 h-5 text-brand-yellow" />
                  <span>TIẾP TỤC THANH TOÁN VNPAY SANDBOX ({totalAmount.toLocaleString('vi-VN')} đ)</span>
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
