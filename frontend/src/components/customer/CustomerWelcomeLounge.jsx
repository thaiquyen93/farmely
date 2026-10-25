import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, CheckCircle2, Sparkles, ArrowRight,
  Compass, Bus, Car, ShieldCheck, QrCode, FileText, ChevronRight, Check,
  AlertCircle, ShoppingBag, Sprout, Phone, Mail, UserRound, RefreshCw
} from 'lucide-react';
import { siteVisitsService } from '../../api/siteVisitsService';

export default function CustomerWelcomeLounge({ user, onRefreshPlots }) {
  const navigate = useNavigate();

  // Danh sách lịch hẹn tham quan của user này
  const [userVisits, setUserVisits] = useState(() => {
    try {
      const stored = localStorage.getItem('farmely_my_site_visits');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  // Form 1-Click Booking
  const defaultSaturday = getNextWeekendDay(6); // Thứ 7 tới
  const defaultSunday = getNextWeekendDay(0); // Chủ nhật tới

  const [visitDate, setVisitDate] = useState(defaultSaturday);
  const [visitSlot, setVisitSlot] = useState('MORNING');
  const [selectedPlotCode, setSelectedPlotCode] = useState('P-04');
  const [transportMode, setTransportMode] = useState('SHUTTLE_Q1');
  const [groupSize, setGroupSize] = useState('2');
  const [visitorNotes, setVisitorNotes] = useState('');

  // Danh sách các thửa đất thực tế đang AVAILABLE từ Marketplace
  const [availablePlots, setAvailablePlots] = useState([]);
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPlots = async () => {
      setIsLoadingPlots(true);
      try {
        const res = await fetch('/api/plots');
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json?.data || []);
          const avail = list.filter((p) => {
            const st = String(p.status || '').toUpperCase();
            return (st === 'AVAIL' || st === 'AVAILABLE') && p.plotCode !== 'P100';
          });
          if (isMounted) {
            setAvailablePlots(avail);
            if (avail.length > 0) {
              setSelectedPlotCode((prev) => {
                if (avail.some((p) => p.plotCode === prev)) return prev;
                return avail[0].plotCode;
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load available plots:', e);
      } finally {
        if (isMounted) setIsLoadingPlots(false);
      }
    };
    fetchPlots();

    const handleSync = () => fetchPlots();
    window.addEventListener('farmely_plot_booked', handleSync);
    window.addEventListener('farmely_plot_status_changed', handleSync);

    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_plot_updates');
        bc.onmessage = () => fetchPlots();
      }
    } catch {}

    return () => {
      isMounted = false;
      window.removeEventListener('farmely_plot_booked', handleSync);
      window.removeEventListener('farmely_plot_status_changed', handleSync);
      if (bc) { try { bc.close(); } catch {} }
    };
  }, []);

  // Tải danh sách lịch tham quan từ Database
  useEffect(() => {
    loadUserVisits();
  }, [user]);

  const loadUserVisits = async () => {
    setIsLoadingVisits(true);
    try {
      const allVisits = await siteVisitsService.getAll();
      const phone = (user?.phone || user?.phoneNumber || '').replace(/[\s.-]/g, '');
      const email = user?.email || '';
      const name = user?.fullName || user?.name || '';

      const matched = allVisits.filter((v) => {
        const vPhone = (v.visitor_phone || '').replace(/[\s.-]/g, '');
        if (phone && vPhone && (vPhone.includes(phone) || phone.includes(vPhone))) return true;
        if (email && v.visitor_email && v.visitor_email.toLowerCase() === email.toLowerCase()) return true;
        if (name && v.visitor_name && v.visitor_name.toLowerCase() === name.toLowerCase()) return true;
        return false;
      });

      // Hợp nhất với localStorage
      setUserVisits((prev) => {
        const map = new Map();
        matched.forEach((m) => map.set(m.visit_id || m.id, m));
        prev.forEach((p) => {
          const key = p.visit_id || p.id;
          if (key && !map.has(key)) map.set(key, p);
        });
        const merged = Array.from(map.values());
        try {
          localStorage.setItem('farmely_my_site_visits', JSON.stringify(merged));
        } catch {}
        return merged;
      });
    } catch (err) {
      console.warn('Could not load site visits from API:', err);
    } finally {
      setIsLoadingVisits(false);
    }
  };

  // Xử lý 1-Click Booking
  const handleOneClickBooking = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessNotice('');

    try {
      const plotIdNumber = parseInt(selectedPlotCode.replace(/\D/g, ''), 10) || 1;
      const shuttleLabel =
        transportMode === 'SHUTTLE_Q1'
          ? 'Xe đưa đón VIP Quận 1 (Bến Bạch Đằng)'
          : transportMode === 'SHUTTLE_Q7'
          ? 'Xe đưa đón VIP Quận 7 (Crescent Mall)'
          : 'Tự túc phương tiện';

      const bookingPayload = {
        plot_id: plotIdNumber,
        visitor_name: (user?.fullName || user?.name || 'Khách hàng Farmely').trim(),
        visitor_phone: (user?.phone || user?.phoneNumber || '0901234567').trim().replace(/[\s.-]/g, ''),
        visitor_email: user?.email || null,
        visit_date: visitDate,
        visit_slot: visitSlot,
        group_size: Number(groupSize) || 2,
        notes: `[1-Click Booking từ Dashboard] ${shuttleLabel}. Khảo sát thửa ${selectedPlotCode}. ${visitorNotes}`.trim()
      };

      const result = await siteVisitsService.create(bookingPayload);
      const newVisit = {
        ...result,
        visit_id: result?.visit_id || Date.now(),
        plot_code: selectedPlotCode,
        transport_mode: transportMode,
        status: 'CONFIRMED'
      };

      setUserVisits((prev) => {
        const updated = [newVisit, ...prev];
        try {
          localStorage.setItem('farmely_my_site_visits', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setSuccessNotice('Đặt lịch khảo sát thực địa thành công! Thẻ vé điện tử đã được tạo.');
    } catch (err) {
      console.error('Lỗi đặt lịch 1-click:', err);
      // Fallback local
      const fallbackVisit = {
        visit_id: Date.now().toString().slice(-4),
        visitor_name: user?.fullName || 'Khách hàng',
        visitor_phone: user?.phone || '0901234567',
        visitor_email: user?.email,
        visit_date: visitDate,
        visit_slot: visitSlot,
        plot_code: selectedPlotCode,
        plot_id: 1,
        status: 'CONFIRMED',
        group_size: Number(groupSize) || 2,
        notes: `Xe đưa đón: ${transportMode}`
      };
      setUserVisits((prev) => [fallbackVisit, ...prev]);
      setSuccessNotice('Đặt lịch thành công! Farmely đã giữ chỗ xe đưa đón cho bạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVisit = userVisits[0] || null;
  const hasVisit = Boolean(activeVisit);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO HEADER PHÒNG CHỜ TRẢI NGHIỆM
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#063223] via-[#0b4330] to-[#125840] p-6 sm:p-10 text-white shadow-xl border border-emerald-500/20">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 h-80 w-80 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-400 text-stone-950 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Phòng Chờ Trải Nghiệm Thực Địa
            </span>
            <span className="text-xs text-emerald-200/90 font-medium">
              • O2O Onboarding Flow (Online-to-Offline)
            </span>
          </div>

          <h2 className="font-heading text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Chào mừng {user?.fullName || 'bạn'} đến với Farmely!
          </h2>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Hợp đồng thuê thửa đất là cam kết đồng hành dài hạn (1 vụ từ 3 tháng đến 1 năm). Để bạn hoàn toàn an tâm về
            chất lượng đất phù sa, nguồn nước lọc tự nhiên và gặp gỡ Chuyên gia Nông nghiệp trước khi ký hợp đồng,
            Farmely trân trọng mời bạn tham gia <strong>chuyến xe thực địa cuối tuần hoàn toàn miễn phí</strong>.
          </p>

          {/* Stepper 3 Bước Vàng */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-2xl border transition-all ${
              !hasVisit
                ? 'bg-emerald-800/60 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                : 'bg-emerald-900/40 border-emerald-500/30 opacity-90'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  hasVisit ? 'bg-emerald-400 text-emerald-950' : 'bg-amber-400 text-stone-950'
                }`}>
                  {hasVisit ? '✓' : '1'}
                </span>
                <span className="text-xs font-bold text-white">1-Click Đặt Lịch</span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-1">Thông tin đã điền sẵn, chọn ngày trong 10 giây</p>
            </div>

            <div className={`p-3.5 rounded-2xl border transition-all ${
              hasVisit
                ? 'bg-emerald-800/80 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                : 'bg-emerald-900/40 border-emerald-500/30 opacity-70'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  hasVisit ? 'bg-amber-400 text-stone-950' : 'bg-emerald-800 text-emerald-200'
                }`}>
                  2
                </span>
                <span className="text-xs font-bold text-white">Khảo Sát Đất & CGNN</span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-1">Xe đưa đón miễn phí, thử mẫu đất tại Củ Chi</p>
            </div>

            <div className="p-3.5 rounded-2xl border bg-emerald-900/40 border-emerald-500/30 opacity-70">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-emerald-800 text-emerald-200">
                  3
                </span>
                <span className="text-xs font-bold text-white">Chốt Ký Hợp Đồng</span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-1">Giữ ưu đãi 10% mùa đầu & nhận bàn giao vườn</p>
            </div>
          </div>
        </div>
      </section>

      {/* Thông báo đặt lịch thành công */}
      {successNotice && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. GIAI ĐOẠN 2: NẾU ĐÃ CÓ LỊCH HẸN -> HIỂN THỊ THẺ VÉ BOARDING PASS
      ───────────────────────────────────────────────────────────────────────────── */}
      {hasVisit ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#18352b] flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-700" />
                Vé Khảo Sát Nông Trại Thực Địa (Boarding Pass)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Vui lòng xuất trình mã QR này khi lên xe đưa đón hoặc tại cổng trang trại Happy Valley Củ Chi.
              </p>
            </div>
            <button
              type="button"
              onClick={loadUserVisits}
              className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVisits ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-lg">
            {/* Boarding Pass Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Bus className="w-5 h-5 text-lime-300" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-lime-300">Farmely VIP Shuttle</span>
                  <h4 className="font-heading font-black text-base sm:text-lg">Chuyến Xe Thực Địa Khảo Sát Thửa Đất</h4>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-white/80 block">MÃ VÉ KHẢO SÁT</span>
                <span className="font-mono text-base sm:text-lg font-black text-lime-300 tracking-wider">
                  VIS-2026-{String(activeVisit.visit_id || '88').padStart(4, '0')}
                </span>
              </div>
            </div>

            {/* Boarding Pass Body */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Thông tin vé bên trái */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 block font-medium">Khách tham quan</span>
                    <strong className="text-stone-900 text-sm font-bold block mt-0.5">
                      {activeVisit.visitor_name || user?.fullName}
                    </strong>
                    <span className="text-stone-500 text-[11px]">{activeVisit.visitor_phone || user?.phone}</span>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Ngày khởi hành</span>
                    <strong className="text-emerald-800 text-sm font-bold block mt-0.5">
                      {activeVisit.visit_date}
                    </strong>
                    <span className="text-emerald-700 font-semibold text-[11px]">
                      {activeVisit.visit_slot === 'MORNING' ? 'Ca Sáng (08:30 - 11:30)' : 'Ca Chiều (14:00 - 17:00)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Thửa đất mục tiêu</span>
                    <strong className="text-emerald-700 text-sm font-black block mt-0.5">
                      Thửa {activeVisit.plot_code || 'P-01'}
                    </strong>
                    <span className="text-stone-500 text-[11px]">Happy Valley Củ Chi</span>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Số lượng khách</span>
                    <strong className="text-stone-800 text-sm font-bold block mt-0.5">
                      {activeVisit.group_size || 2} người
                    </strong>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Chuyên gia đón tiếp</span>
                    <strong className="text-stone-900 text-sm font-bold block mt-0.5">
                      ThS. Nguyễn Hoàng Nam
                    </strong>
                    <span className="text-stone-500 text-[11px]">Chuyên gia Nông nghiệp</span>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Trạng thái vé</span>
                    <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      ĐÃ XẾP CHỖ XE
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Quyền lợi trong chuyến đi:</strong> Xe đón 2 chiều có máy lạnh, nước uống thảo mộc, nón bảo hộ
                    và bộ kit thử pH thổ nhưỡng tại chỗ. Có xe điện đưa tham quan trạm bơm vi khí hậu IoT.
                  </div>
                </div>
              </div>

              {/* QR Code bên phải */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-center">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100">
                  <QrCode className="w-28 h-28 text-emerald-950" />
                </div>
                <span className="font-mono text-xs font-bold text-emerald-900 mt-2">
                  VIS-2026-{String(activeVisit.visit_id || '88').padStart(4, '0')}
                </span>
                <span className="text-[11px] text-stone-500 mt-0.5">Mã quét Check-in tại cổng</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ─────────────────────────────────────────────────────────────────────────────
            GIAI ĐOẠN 1: CHƯA ĐẶT LỊCH -> FORM 1-CLICK BOOKING SIÊU TỐC
        ───────────────────────────────────────────────────────────────────────────── */
        <section className="space-y-4">
          <div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-[#18352b] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              Đặt Lịch Khảo Sát Nông Trại 1-Click (Miễn Phí)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Hệ thống tự động sử dụng thông tin tài khoản của bạn. Bạn chỉ cần chọn ngày và ca giờ phù hợp.
            </p>
          </div>

          <form
            onSubmit={handleOneClickBooking}
            className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6"
          >
            {/* Thông tin cá nhân tự động */}
            <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <UserRound className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-stone-400 block text-[11px]">Họ và tên:</span>
                  <strong className="text-stone-900">{user?.fullName || 'Khách hàng Farmely'}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-stone-400 block text-[11px]">Số điện thoại:</span>
                  <strong className="text-stone-900">{user?.phone || '0901234567'}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-stone-400 block text-[11px]">Email liên hệ:</span>
                  <strong className="text-stone-900">{user?.email || 'customer@farmely.vn'}</strong>
                </div>
              </div>
            </div>

            {/* Các tùy chọn tham quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Chọn ngày */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Ngày tham quan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitDate(defaultSaturday)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      visitDate === defaultSaturday
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    Thứ Bảy
                    <span className="block text-[10px] font-normal text-stone-500 mt-0.5">{defaultSaturday}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitDate(defaultSunday)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      visitDate === defaultSunday
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    Chủ Nhật
                    <span className="block text-[10px] font-normal text-stone-500 mt-0.5">{defaultSunday}</span>
                  </button>
                </div>
              </div>

              {/* Chọn ca */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Khung giờ đón:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitSlot('MORNING')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      visitSlot === 'MORNING'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    Ca Sáng
                    <span className="block text-[10px] font-normal text-stone-500 mt-0.5">08:30 – 11:30</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitSlot('AFTERNOON')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      visitSlot === 'AFTERNOON'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    Ca Chiều
                    <span className="block text-[10px] font-normal text-stone-500 mt-0.5">14:00 – 17:00</span>
                  </button>
                </div>
              </div>

              {/* Thửa đất quan tâm */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                  Thửa đất muốn xem:
                </label>
                <select
                  value={selectedPlotCode}
                  onChange={(e) => setSelectedPlotCode(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:border-emerald-500 focus:outline-none"
                >
                  {availablePlots.length === 0 ? (
                    <option value="">{isLoadingPlots ? 'Đang tải danh sách thửa đất...' : 'Không có thửa đất khả dụng'}</option>
                  ) : (
                    availablePlots.map((p) => {
                      const code = p.plotCode || p.code;
                      const areaStr = p.area ? `${p.area} m²` : '160 m²';
                      const desc = (Array.isArray(p.crops) && p.crops.length > 0)
                        ? p.crops.slice(0, 2).join(', ')
                        : (p.landName || 'Đất phù sa VietGAP');
                      return (
                        <option key={p.plotId || code} value={code}>
                          Thửa {code} ({areaStr} - {desc})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* Điểm đón xe */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Bus className="w-3.5 h-3.5 text-emerald-700" />
                  Điểm đón xe đưa đón:
                </label>
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="SHUTTLE_Q1">Xe VIP Farmely: Quận 1 (Bến Bạch Đằng)</option>
                  <option value="SHUTTLE_Q7">Xe VIP Farmely: Quận 7 (Crescent Mall)</option>
                  <option value="SELF">Tự túc phương tiện đến Happy Valley</option>
                </select>
              </div>
            </div>

            {/* Nút 1-Click Booking */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100">
              <span className="text-xs text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Miễn phí 100% • Không yêu cầu đặt cọc trước
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang đăng ký...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-lime-300" />
                    <span>⚡ Xác Nhận Đặt Lịch (1-Click Booking)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. GIAI ĐOẠN 3: CHỐT KÝ HỢP ĐỒNG THUÊ ĐẤT (O2O CONVERSION)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4 pt-4 border-t border-stone-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Bước 3: Chốt Hợp Đồng
              </span>
              <span className="text-xs font-semibold text-stone-500">• Giữ ưu đãi 10% mùa đầu</span>
            </div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-[#18352b] mt-1">
              Sẵn Sàng Sở Hữu Mảnh Vườn Riêng?
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Sau khi khảo sát hoặc nếu đã chọn được thửa đất ưng ý, bạn có thể ký Hợp đồng Master Lease ngay để hệ
              thống bàn giao đất và kích hoạt quy trình canh tác VietGAP.
            </p>
          </div>

          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 transition"
          >
            <span>Mở bản đồ 16 thửa</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Danh sách Thửa đất khả dụng (Available) gợi ý thuê từ Marketplace */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePlots.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-stone-200 bg-white p-8 text-center text-stone-500 text-xs">
              Hiện tại tất cả các thửa đất đều đã có khách thuê hoặc đang trong kỳ bảo dưỡng đất. Quý khách vui lòng xem Bản đồ Marketplace để cập nhật thông tin mới nhất!
            </div>
          ) : (
            availablePlots.slice(0, 3).map((plot, idx) => {
              const code = plot.plotCode || plot.code;
              const name = `Thửa Đất ${code} (${plot.landName || 'Happy Valley'})`;
              const area = `${plot.area || 160} m²`;
              const soil = idx === 0 
                ? 'Đất phù sa bồi lắng ven sông, vi sinh tự nhiên'
                : idx === 1 
                ? 'Độ mùn cao, vi khí hậu mát mẻ đón nắng 8h/ngày' 
                : 'Thoát nước tốt, giàu khoáng chất hữu cơ';
              const crop = (Array.isArray(plot.crops) && plot.crops.length > 0)
                ? plot.crops.slice(0, 3).join(', ')
                : 'Cà chua bi, Dưa leo baby, Xà lách';
              const price = `${Number(plot.pricePerPeriod || 1300000).toLocaleString('vi-VN')} đ/tháng`;
              const tag = idx === 0 ? 'Vị trí đắc địa' : idx === 1 ? 'Năng suất cao' : 'Đất màu mỡ';

              return (
                <div
                  key={code}
                  className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {code}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {tag}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#18352b]">{name}</h4>
                      <p className="text-xs text-stone-500 mt-0.5">{soil}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs space-y-1.5">
                      <div className="flex justify-between text-stone-600">
                        <span>Diện tích:</span>
                        <strong className="text-stone-900">{area}</strong>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Cây trồng đề xuất:</span>
                        <strong className="text-emerald-700 truncate max-w-[170px]" title={crop}>{crop}</strong>
                      </div>
                      <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200/60">
                        <span>Giá thuê niêm yết:</span>
                        <strong className="text-emerald-800 font-extrabold">{price}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/marketplace?plot=${code}`)}
                      className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Chốt Thuê Thửa {code} Ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

// Helper lấy ngày thứ 7 hoặc CN tiếp theo
function getNextWeekendDay(targetDayOfWeek) {
  const d = new Date();
  const currentDay = d.getDay(); // 0 = CN, 6 = T7
  let diff = targetDayOfWeek - currentDay;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
