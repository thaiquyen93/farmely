import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Sparkles,
  Info,
  ShieldCheck,
  Sun,
  Sunset,
  Check,
  Building,
  Layers,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { farmApi } from '../../api/farm/farmApi';
import { siteVisitsService } from '../../api/siteVisitsService';
import { FARMS_GEOJSON_DATA } from '../../data/marketplaceGisData';
import Modal from '../common/Modal';

export default function SiteVisitForm({ preselectedPlotId, onSuccess, inModal = false }) {
  const { user, isAuthenticated } = useAuthStore();
  const [dbLands, setDbLands] = useState([]);
  const [dbPlots, setDbPlots] = useState([]);

  // Form State (Khớp chuẩn 1:1 SCR-PUB-05 & Bảng site_visits)
  const [visitorName, setVisitorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitSlot, setVisitSlot] = useState('MORNING'); // MORNING (08:30 - 10:30) | AFTERNOON (14:30 - 16:30)
  const [groupSize, setGroupSize] = useState(2);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedPlot, setSelectedPlot] = useState(preselectedPlotId || '');
  const [isChangingPlot, setIsChangingPlot] = useState(false);
  const [notes, setNotes] = useState('');

  // Validation & Submission State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Load farms & plots from API with fallback to GIS GeoJSON
  useEffect(() => {
    let mounted = true;
    farmApi.listLands()
      .then((r) => {
        if (mounted && Array.isArray(r) && r.length > 0) setDbLands(r);
      })
      .catch(() => {});

    farmApi.listPlots()
      .then((r) => {
        if (mounted && Array.isArray(r) && r.length > 0) {
          setDbPlots(r);
        } else if (mounted) {
          const fallback = FARMS_GEOJSON_DATA.features.map((f) => ({
            plotId: f.properties.id,
            plotCode: f.properties.code?.replace(/^Plot\s+/i, '') || f.properties.id,
            name: f.properties.name,
            area: parseInt(f.properties.area, 10) || 150,
            price: f.properties.price,
            rentalPrice: f.properties.rentalPrice,
            imageUrl: f.properties.img,
            landName: 'Trang trại Happy Valley Củ Chi'
          }));
          setDbPlots(fallback);
        }
      })
      .catch(() => {
        if (mounted) {
          const fallback = FARMS_GEOJSON_DATA.features.map((f) => ({
            plotId: f.properties.id,
            plotCode: f.properties.code?.replace(/^Plot\s+/i, '') || f.properties.id,
            name: f.properties.name,
            area: parseInt(f.properties.area, 10) || 150,
            price: f.properties.price,
            rentalPrice: f.properties.rentalPrice,
            imageUrl: f.properties.img,
            landName: 'Trang trại Happy Valley Củ Chi'
          }));
          setDbPlots(fallback);
        }
      });

    return () => { mounted = false; };
  }, []);

  // Prepopulate if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.fullName && !visitorName) setVisitorName(user.fullName);
      if ((user.phone || user.phoneNumber) && !phoneNumber) setPhoneNumber(user.phone || user.phoneNumber);
      if (user.email && !emailAddress) setEmailAddress(user.email);
    }
  }, [isAuthenticated, user]);

  // Set default farm when lands load
  useEffect(() => {
    if (dbLands.length > 0 && !selectedFarm) {
      setSelectedFarm(dbLands[0].landName || dbLands[0].name || '');
    }
  }, [dbLands, selectedFarm]);

  // Find preselected or currently selected plot object
  const activePlotId = preselectedPlotId || selectedPlot;
  const selectedPlotObj = useMemo(() => {
    if (!activePlotId) return null;
    const cleanId = String(activePlotId).replace(/^plot-/i, '').replace(/^plt-/i, '').toLowerCase();
    return dbPlots.find((p) => {
      const pId = String(p.plotId || p.plot_id || '').toLowerCase();
      const pCode = String(p.plotCode || p.plot_code || p.code || '').replace(/^plot\s+/i, '').toLowerCase();
      return pId === cleanId || pCode === cleanId;
    }) || null;
  }, [activePlotId, dbPlots]);

  // Dates: Min date = tomorrow (at least 24h advance per SSoT  / SCR-PUB-05), Max = +30 days
  const { minDateStr, maxDateStr, tomorrowStr, weekendSatStr, weekendSunStr } = useMemo(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const tmrIso = tmr.toISOString().split('T')[0];

    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 30);
    const maxIso = maxD.toISOString().split('T')[0];

    const calcNextDay = (targetDay) => {
      const d = new Date();
      const cur = d.getDay();
      let diff = (targetDay - cur + 7) % 7;
      if (diff === 0) diff = 7;
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    };

    return {
      minDateStr: tmrIso,
      maxDateStr: maxIso,
      tomorrowStr: tmrIso,
      weekendSatStr: calcNextDay(6),
      weekendSunStr: calcNextDay(0)
    };
  }, []);

  const formattedVisitDateVn = useMemo(() => {
    if (!visitDate) return '';
    try {
      const parts = visitDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[d.getDay()] || '';
        return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {
      return visitDate;
    }
    return visitDate;
  }, [visitDate]);

  useEffect(() => {
    if (!visitDate) {
      setVisitDate(minDateStr);
    }
  }, [minDateStr, visitDate]);

  const validate = () => {
    const errs = {};
    if (!visitorName.trim()) {
      errs.name = 'Vui lòng nhập họ và tên của bạn.';
    } else if (visitorName.trim().length < 2 || visitorName.trim().length > 100) {
      errs.name = 'Họ tên phải từ 2 đến 100 ký tự.';
    }

    const phoneRegex = /^0[0-9]{9}$/;
    const cleanPhone = phoneNumber.trim().replace(/[\s.-]/g, '');
    if (!cleanPhone) {
      errs.phone = 'Vui lòng nhập số điện thoại để chuyên viên liên hệ đón tiếp.';
    } else if (!phoneRegex.test(cleanPhone)) {
      errs.phone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailAddress.trim() && !emailRegex.test(emailAddress.trim())) {
      errs.email = 'Email không hợp lệ (ví dụ: hoten@gmail.com).';
    }

    if (!visitDate) {
      errs.date = 'Vui lòng chọn ngày dự kiến tham quan.';
    } else if (visitDate < minDateStr) {
      errs.date = 'Thời gian khảo sát phải được đặt trước ít nhất 24 giờ.';
    }

    if (groupSize < 1 || groupSize > 5) {
      errs.group = 'Số lượng khách phải từ 1 đến 5 người theo quy định an toàn nông trường.';
    }

    if (notes.length > 500) {
      errs.notes = 'Ghi chú không được vượt quá 500 ký tự.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let numericPlotId = 1;
      if (selectedPlotObj) {
        const parsed = parseInt(String(selectedPlotObj.plotId || selectedPlotObj.plot_id || selectedPlotObj.id).replace(/\D/g, ''), 10);
        numericPlotId = !isNaN(parsed) && parsed > 0 ? parsed : 1;
      }

      const bookingPayload = {
        plot_id: numericPlotId,
        visitor_name: visitorName.trim(),
        visitor_phone: phoneNumber.trim().replace(/[\s.-]/g, ''),
        visitor_email: emailAddress.trim() || null,
        visit_date: visitDate,
        visit_slot: visitSlot,
        group_size: Number(groupSize) || 2,
        notes: notes.trim() || 'Khách quan tâm khảo sát hiện trạng thực tế thửa đất.'
      };

      const result = await siteVisitsService.create(bookingPayload);
      setCreatedBooking(result);
      if (!inModal) {
        setShowSuccessModal(true);
      }
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Error creating site visit booking:', err);
      alert('Có lỗi xảy ra khi lưu lịch hẹn. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppendNoteTag = (tag) => {
    setNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed}. ${tag}`;
    });
  };

  if (inModal && createdBooking) {
    return (
      <div className="py-2 space-y-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h4 className="font-heading text-lg sm:text-xl font-black text-stone-900">
            Đăng Ký Khảo Sát Thành Công!
          </h4>
          <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto leading-relaxed">
            Mã phiếu hẹn: <strong className="font-mono text-emerald-700 font-bold">VST-{createdBooking?.visit_id || Date.now().toString().slice(-6)}</strong>.
            Chuyên viên nông trường sẽ liên hệ xác nhận chuyến xe đón trong <strong>2 giờ làm việc</strong>.
          </p>
        </div>

        {/* Ticket Summary Box */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2">
          <div className="flex justify-between items-center pb-1.5 border-b border-stone-200 font-semibold">
            <span className="text-stone-500">Khách tham quan:</span>
            <strong className="text-stone-900">{visitorName} ({phoneNumber})</strong>
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
            <span className="text-stone-500">Nông trại:</span>
            <strong className="text-stone-900">{selectedPlotObj?.landName || selectedFarm || 'Trang trại Happy Valley Củ Chi'}</strong>
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
            <span className="text-stone-500">Thửa đất mục tiêu:</span>
            <strong className="text-emerald-700 font-bold">
              {selectedPlotObj ? `${selectedPlotObj.plotCode || 'P-01'} (${selectedPlotObj.area || 150} m²)` : 'Tham quan tổng thể trang trại'}
            </strong>
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
            <span className="text-stone-500">Ngày khảo sát:</span>
            <strong className="text-stone-900">{formattedVisitDateVn || visitDate}</strong>
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
            <span className="text-stone-500">Khung giờ:</span>
            <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-100 text-emerald-800">
              {visitSlot === 'MORNING' ? 'Ca Sáng (08:30 – 10:30)' : 'Ca Chiều (14:30 – 16:30)'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500">Số lượng người:</span>
            <strong className="text-stone-900">Đoàn {groupSize} khách</strong>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-left text-[11px] text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Quý khách vui lòng đến trước giờ hẹn 10 phút để thưởng thức trà thảo mộc tại khu đón tiếp và chuẩn bị nón bảo hộ.
          </span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setCreatedBooking(null);
              if (onSuccess) onSuccess();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white transition cursor-pointer"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={inModal ? '' : 'bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-sm'}>
      {/* Form Header (Only when not in a modal) */}
      {!inModal && (
        <div className="mb-5 pb-4 border-b border-stone-200/80">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Phiếu Khảo Sát Thực Địa</span>
            </span>
            <span className="text-[11px] text-stone-600 font-semibold">• Miễn phí 100%</span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Thông Tin Đăng Ký Tham Quan
          </h2>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Vui lòng điền thông tin bên dưới. Chuyên viên nông trường sẽ liên hệ hướng dẫn đường đi và chuẩn bị tài liệu thổ nhưỡng đón tiếp bạn chu đáo.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* ========================================================= */}
        {/* BƯỚC 1: VỊ TRÍ NÔNG TRẠI & THỬA ĐẤT KHẢO SÁT            */}
        {/* ========================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-800 text-white text-[11px] font-bold">1</span>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wide">
                Nông trại & Thửa đất khảo sát
              </h3>
            </div>
            {selectedPlotObj && !isChangingPlot && (
              <button
                type="button"
                onClick={() => setIsChangingPlot(true)}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold hover:underline cursor-pointer"
              >
                Đổi thửa khác
              </button>
            )}
          </div>

          {selectedPlotObj && !isChangingPlot ? (
            /* Selected Plot Preview Card */
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-emerald-100 shrink-0 border border-emerald-200">
                  <img
                    src={selectedPlotObj.imageUrl || selectedPlotObj.img || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=300&q=80'}
                    alt={selectedPlotObj.name || selectedPlotObj.plotCode}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-emerald-700 text-white">
                      {selectedPlotObj.plotCode || selectedPlotObj.code || 'P-01'}
                    </span>
                    <strong className="text-stone-900 font-bold text-xs sm:text-sm">
                      {selectedPlotObj.name || `Thửa đất ${selectedPlotObj.plotCode || 'P-01'}`}
                    </strong>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span>{selectedPlotObj.landName || 'Trang trại Happy Valley Củ Chi'} • {selectedPlotObj.area || 150} m²</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-emerald-200/60">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-emerald-900 border border-emerald-300 shadow-2xs">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Đã chọn thửa</span>
                </span>
              </div>
            </div>
          ) : (
            /* Dual Dropdown Selectors */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Khu vực trang trại</span>
                </label>
                <select
                  value={selectedFarm}
                  onChange={(e) => setSelectedFarm(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 cursor-pointer"
                >
                  {dbLands.length > 0 ? (
                    dbLands.map((l) => (
                      <option key={l.landId || l.id} value={l.landName || l.name}>
                        {l.landName || l.name}
                      </option>
                    ))
                  ) : (
                    <option value="Trang trại Happy Valley Củ Chi">Trang trại Happy Valley Củ Chi (TP.HCM)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Thửa đất muốn khảo sát</span>
                </label>
                <select
                  value={selectedPlot}
                  onChange={(e) => {
                    setSelectedPlot(e.target.value);
                    if (e.target.value) setIsChangingPlot(false);
                  }}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-stone-900 shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 cursor-pointer"
                >
                  <option value="">-- Tham quan toàn trang trại (Chưa chọn thửa) --</option>
                  {dbPlots.map((p) => {
                    const code = p.plotCode || p.code || `P-${p.plotId}`;
                    const area = p.area || 150;
                    return (
                      <option key={p.plotId || p.id || code} value={code}>
                        Thửa {code} ({area} m²) - {p.name || 'Đất phù sa'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* BƯỚC 2: THỜI GIAN & KHUNG GIỜ THAM QUAN                   */}
        {/* ========================================================= */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-800 text-white text-[11px] font-bold">2</span>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wide">
              Thời gian & Khung giờ đón tiếp
            </h3>
          </div>

          <div className="space-y-3">
            {/* Date Picker & Quick Date Chips */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Ngày dự kiến tham quan *</span>
                  </label>
                  {formattedVisitDateVn && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {formattedVisitDateVn}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-stone-600">Đặt trước ít nhất 24 giờ (tối đa 30 ngày)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="date"
                  required
                  min={minDateStr}
                  max={maxDateStr}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full sm:w-60 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />

                {/* Quick Date Shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVisitDate(tomorrowStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      visitDate === tomorrowStr
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    Ngày mai
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitDate(weekendSatStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      visitDate === weekendSatStr
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    Thứ Bảy tới
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitDate(weekendSunStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      visitDate === weekendSunStr
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    Chủ Nhật tới
                  </button>
                </div>
              </div>
              {errors.date && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.date}</p>}
            </div>

            {/* Time Slot Cards (Ca sáng vs Ca chiều) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-800" />
                <span>Khung giờ đón tiếp (Ca khảo sát) *</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Morning Slot */}
                <button
                  type="button"
                  onClick={() => setVisitSlot('MORNING')}
                  className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    visitSlot === 'MORNING'
                      ? 'border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-600/30 shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-stone-50/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${visitSlot === 'MORNING' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs sm:text-sm font-black text-stone-900">Ca Sáng</span>
                        <span className="block text-[11px] font-bold text-emerald-800">08:30 – 10:30</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200">
                      Khuyên dùng
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                    Khảo sát sương mai mát mẻ, kiểm tra độ ẩm đất tự nhiên và hệ thống tưới ngầm vào buổi sáng.
                  </p>
                </button>

                {/* Afternoon Slot */}
                <button
                  type="button"
                  onClick={() => setVisitSlot('AFTERNOON')}
                  className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    visitSlot === 'AFTERNOON'
                      ? 'border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-600/30 shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-stone-50/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${visitSlot === 'AFTERNOON' ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-500'}`}>
                        <Sunset className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs sm:text-sm font-black text-stone-900">Ca Chiều</span>
                        <span className="block text-[11px] font-bold text-emerald-800">14:30 – 16:30</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                    Kiểm tra cường độ ánh sáng, khả năng giữ nước của đất và vận hành trạm quan trắc IoT lúc chiều tà.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BƯỚC 3: THÔNG TIN NGƯỜI ĐẠI DIỆN LIÊN HỆ                 */}
        {/* ========================================================= */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-800 text-white text-[11px] font-bold">3</span>
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wide">
              Thông tin người đại diện tham quan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-800" />
                <span>Họ và tên người đại diện *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Thu Hà"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm text-stone-900 shadow-2xs transition focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-stone-300 focus:ring-emerald-600 focus:border-emerald-600'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.name}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-800" />
                <span>Số điện thoại liên hệ *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Ví dụ: 0901234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm text-stone-900 shadow-2xs transition focus:outline-none focus:ring-2 ${
                  errors.phone
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-stone-300 focus:ring-emerald-600 focus:border-emerald-600'
                }`}
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email nhận vé */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-800" />
                <span>Email nhận vé hẹn điện tử</span>
                <span className="text-stone-500 font-normal">(Tùy chọn)</span>
              </label>
              <input
                type="email"
                placeholder="thuha.nguyen@gmail.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm text-stone-900 shadow-2xs transition focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-stone-300 focus:ring-emerald-600 focus:border-emerald-600'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.email}</p>}
            </div>

            {/* Số lượng khách (5 Chips 1-5 theo chuẩn SSoT SCR-PUB-05) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Số lượng khách tham quan *</span>
                </span>
                <span className="text-[11px] text-stone-600 font-normal">Tiêu chuẩn 1 – 5 người</span>
              </label>

              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGroupSize(num)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center ${
                      groupSize === num
                        ? 'border-emerald-700 bg-emerald-700 text-white shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span>{num}</span>
                    <span className="text-[9px] font-normal opacity-80">khách</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BƯỚC 4: NHU CẦU TƯ VẤN & GHI CHÚ ĐẶC BIỆT                */}
        {/* ========================================================= */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-800 text-white text-[11px] font-bold">4</span>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wide">
                Nhu cầu tư vấn & Ghi chú thêm
              </h3>
            </div>
            <span className="text-[11px] text-stone-600">{notes.length}/500 ký tự</span>
          </div>

          <textarea
            rows={2}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Gia đình tôi quan tâm giống dưa leo baby, muốn kiểm tra hướng gió và hệ thống tưới ngầm..."
            className="w-full rounded-2xl border border-stone-300 bg-white p-3 text-xs sm:text-sm text-stone-900 shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />

          {/* Quick-add tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-semibold text-stone-600">Gợi ý nhanh:</span>
            {[
              '🌱 Cần tư vấn chọn giống cây',
              '💧 Kiểm tra hệ thống tưới ngầm',
              '📡 Xem trạm quan trắc IoT',
              '👨‍👩‍👧‍👦 Đi cùng người lớn tuổi & trẻ em',
              '🚗 Cần hỗ trợ xe điện nội bộ'
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAppendNoteTag(tag)}
                className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200/80 text-stone-700 transition cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>
          {errors.notes && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.notes}</p>}
        </section>

        {/* ========================================================= */}
        {/* SUBMISSION & TRUST SIGNALS                                */}
        {/* ========================================================= */}
        <div className="pt-2 border-t border-stone-200/80 space-y-2.5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-heading font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang lưu lịch hẹn...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>XÁC NHẬN ĐẶT LỊCH KHẢO SÁT THỰC ĐỊA</span>
              </>
            )}
          </button>

          {/* Reassurance notes (No DB leak!) */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-stone-600 text-center">
            <span className="flex items-center gap-1 font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Miễn phí 100% trải nghiệm
            </span>
            <span>•</span>
            <span>Xác nhận qua điện thoại trong 2h</span>
            <span>•</span>
            <span>Hoàn toàn không ràng buộc hợp đồng</span>
          </div>
        </div>
      </form>

      {/* ========================================================= */}
      {/* SUCCESS MODAL: PHIẾU HẸN ĐIỆN TỬ SANG TRỌNG              */}
      {/* ========================================================= */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Lịch Khảo Sát Đã Được Tiếp Nhận!"
        maxWidth="max-w-lg"
      >
        <div className="py-2 space-y-5 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h4 className="font-heading text-xl font-black text-stone-900">
              Đăng Ký Khảo Sát Thành Công!
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-sm mx-auto leading-relaxed">
              Mã lịch hẹn: <strong className="font-mono text-emerald-700 font-bold">VST-{createdBooking?.visit_id || Date.now().toString().slice(-6)}</strong>.
              Chuyên viên điều phối nông trường sẽ gọi điện xác nhận trong vòng <strong>2 giờ làm việc</strong>.
            </p>
          </div>

          {/* Ticket Summary Box */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200 font-semibold">
              <span className="text-stone-500">Khách tham quan:</span>
              <strong className="text-stone-900">{visitorName} ({phoneNumber})</strong>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-stone-500">Nông trại:</span>
              <strong className="text-stone-900">{selectedPlotObj?.landName || selectedFarm || 'Trang trại Happy Valley Củ Chi'}</strong>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-stone-500">Thửa đất mục tiêu:</span>
              <strong className="text-emerald-700 font-bold">
                {selectedPlotObj ? `${selectedPlotObj.plotCode || 'P-01'} (${selectedPlotObj.area || 150} m²)` : 'Tham quan tổng thể trang trại'}
              </strong>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-stone-500">Ngày khảo sát:</span>
              <strong className="text-stone-900">{formattedVisitDateVn || visitDate}</strong>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-stone-500">Khung giờ:</span>
              <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-100 text-emerald-800">
                {visitSlot === 'MORNING' ? 'Ca Sáng (08:30 – 10:30)' : 'Ca Chiều (14:30 – 16:30)'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">Số lượng người:</span>
              <strong className="text-stone-900">Đoàn {groupSize} khách</strong>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-left text-[11px] text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Quý khách vui lòng đến trước giờ hẹn 10 phút để thưởng thức trà thảo mộc tại khu đón tiếp và chuẩn bị nón bảo hộ.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <a
              href="https://maps.google.com/?q=Nhu%E1%BA%ADn+%C4%90%E1%BB%A9c,+C%E1%BB%A7+Chi,+TP.HCM"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 transition flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
              <span>Chỉ đường Google Maps</span>
            </a>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white transition cursor-pointer"
            >
              Đã Hiểu & Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
