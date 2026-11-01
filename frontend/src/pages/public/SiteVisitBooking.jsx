import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import SiteVisitForm from '../../components/public/SiteVisitForm';
import { useAuthStore } from '../../stores/authStore';
import { siteVisitsService } from '../../api/siteVisitsService';
import {
  Calendar,
  PhoneCall,
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Car,
  ExternalLink,
  ChevronRight,
  Ticket,
  CalendarCheck,
  RefreshCw,
  User,
  AlertCircle
} from 'lucide-react';

function getVisitStatusBadge(status) {
  switch (status) {
    case 'CONFIRMED':
      return {
        label: 'Đã xác nhận lịch',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotCls: 'bg-emerald-500'
      };
    case 'COMPLETED':
      return {
        label: 'Đã hoàn tất tham quan',
        cls: 'bg-sky-50 text-sky-800 border-sky-200',
        dotCls: 'bg-sky-500'
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy lịch',
        cls: 'bg-stone-100 text-stone-600 border-stone-200',
        dotCls: 'bg-stone-400'
      };
    case 'PENDING':
    default:
      return {
        label: 'Chờ điều phối xác nhận',
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
        dotCls: 'bg-amber-500 animate-pulse'
      };
  }
}

export default function SiteVisitBooking() {
  const [searchParams] = useSearchParams();
  const plotId = searchParams.get('plotId');
  const { user, isAuthenticated } = useAuthStore();

  const [userVisits, setUserVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // ponytail: load & merge site visits by user identity with local storage fallback; upgrade when server adds /api/site-visits/my endpoint
  const loadVisits = useCallback(async () => {
    setLoadingVisits(true);
    try {
      let localList = [];
      try {
        localList = JSON.parse(localStorage.getItem('farmely_my_site_visits') || '[]');
      } catch {}

      let allVisits = [];
      try {
        allVisits = await siteVisitsService.getAll();
      } catch (err) {
        console.warn('Could not fetch remote site visits:', err);
      }

      const phone = (user?.phone || user?.phoneNumber || '').replace(/[\s.-]/g, '');
      const email = (user?.email || '').toLowerCase();
      const name = (user?.fullName || user?.name || '').toLowerCase();

      let matched = [];
      if (isAuthenticated && (phone || email || name)) {
        matched = allVisits.filter((v) => {
          const vPhone = (v.visitor_phone || '').replace(/[\s.-]/g, '');
          if (phone && vPhone && (vPhone.includes(phone) || phone.includes(vPhone))) return true;
          if (email && v.visitor_email && v.visitor_email.toLowerCase().includes(email)) return true;
          if (name && v.visitor_name && v.visitor_name.toLowerCase() === name) return true;
          return false;
        });
      }

      const map = new Map();
      matched.forEach((v) => map.set(v.visit_id || v.id, v));
      localList.forEach((v) => {
        const id = v.visit_id || v.id;
        if (id && !map.has(id)) {
          map.set(id, v);
        }
      });

      const merged = Array.from(map.values()).sort((a, b) => {
        const dateA = new Date(a.visit_date || a.created_at || 0).getTime();
        const dateB = new Date(b.visit_date || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setUserVisits(merged);
    } catch (err) {
      console.warn('Error merging visits:', err);
      try {
        const localList = JSON.parse(localStorage.getItem('farmely_my_site_visits') || '[]');
        setUserVisits(localList);
      } catch {}
    } finally {
      setLoadingVisits(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    loadVisits();
    const handleUpdate = () => loadVisits();
    window.addEventListener('farmely_site_visits_updated', handleUpdate);
    return () => window.removeEventListener('farmely_site_visits_updated', handleUpdate);
  }, [loadVisits]);

  const handleBookingSuccess = (newBooking) => {
    loadVisits();
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans">
      <PublicNavbar />

      {/* ========================================================= */}
      {/* HERO BANNER & BREADCRUMB                                  */}
      {/* ========================================================= */}
      <section className="pt-24 pb-8 bg-gradient-to-r from-brand-dark via-[#1e3d2d] to-brand-green text-white relative overflow-hidden border-b border-emerald-900/40 shadow-inner">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-emerald-200/80 mb-3 font-medium">
            <Link to="/" className="hover:text-white transition">Trang chủ</Link>
            <ChevronRight className="w-3 h-3 text-emerald-400/60" />
            <Link to="/marketplace" className="hover:text-white transition">Sàn Thửa Đất (Marketplace)</Link>
            <ChevronRight className="w-3 h-3 text-emerald-400/60" />
            <span className="text-brand-yellow font-bold">Đặt lịch khảo sát thực địa</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 7 cols: Title & Mission */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-100 border border-white/20 mb-3 backdrop-blur-xs shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
                <span>Trải Nghiệm Thực Địa Miễn Phí</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white tracking-tight leading-tight">
                Đặt Lịch Khảo Sát Nông Trại
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 max-w-2xl leading-relaxed">
                Trực tiếp đặt chân lên cánh đồng, cảm nhận chất đất phù sa, kiểm tra nguồn nước tưới ngầm và trạm quan trắc vi khí hậu trước khi đưa ra quyết định canh tác.
              </p>
            </div>

            {/* Right 5 cols: Farm Hub Summary Card & Action (Không để trống đen) */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white shadow-soft space-y-3">
                <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-yellow/20 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow shrink-0 font-black text-sm">
                      🌱
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Trang Trại Happy Valley</h4>
                      <p className="text-[11px] text-emerald-200/80">Củ Chi, TP. Hồ Chí Minh</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 whitespace-nowrap">
                    Đang mở cửa
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-emerald-100/90">
                  <span>Khung giờ: 08:00 – 17:30</span>
                  <span className="text-brand-yellow font-semibold">Tư vấn 1:1 miễn phí</span>
                </div>

                <Link
                  to="/marketplace"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-brand-yellow hover:bg-yellow-400 text-brand-dark transition shadow-sm hover:shadow-md cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-brand-dark" />
                  <span>Quay lại Bản đồ Marketplace</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MAIN SECTION: FORM + STICKY SIDEBAR                       */}
      {/* ========================================================= */}
      <main className="flex-1 py-7 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* Left Column: Booking Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <SiteVisitForm preselectedPlotId={plotId} onSuccess={handleBookingSuccess} />
          </div>

          {/* Right Column: Sticky Information & Tour Guide Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-24">
            
            {/* Card 1: Lịch Sử Đăng Ký Khảo Sát (Site Visit History) */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-stone-900">
                      Lịch Sử Đăng Ký Khảo Sát
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      {isAuthenticated ? `Tài khoản: ${user?.fullName || user?.name || user?.email}` : 'Phiếu hẹn trên thiết bị của bạn'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {userVisits.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      {userVisits.length} phiếu hẹn
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={loadVisits}
                    disabled={loadingVisits}
                    title="Làm mới lịch sử"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-stone-50 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingVisits ? 'animate-spin text-emerald-700' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Body Content */}
              {loadingVisits && userVisits.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-emerald-600" />
                  Đang đồng bộ lịch sử khảo sát...
                </div>
              ) : userVisits.length > 0 ? (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {userVisits.map((visit, idx) => {
                    const badge = getVisitStatusBadge(visit.status);
                    const plotLabel = visit.plot_code || (visit.plot_id ? `P-${String(visit.plot_id).padStart(2, '0')}` : 'P-01');
                    const ticketCode = `VIS-2026-${String(visit.visit_id || visit.id || idx + 1).padStart(4, '0')}`;
                    const slotText = visit.visit_slot === 'AFTERNOON' ? 'Ca Chiều (14:30 - 16:30)' : 'Ca Sáng (08:30 - 10:30)';

                    return (
                      <div
                        key={visit.visit_id || visit.id || idx}
                        className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 space-y-3 hover:border-emerald-300 hover:bg-white transition-all shadow-2xs"
                      >
                        {/* Ticket Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                          <div>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block font-semibold">Mã vé khảo sát</span>
                            <span className="font-mono text-xs font-black text-emerald-900 tracking-wide">{ticketCode}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotCls}`} />
                            {badge.label}
                          </span>
                        </div>

                        {/* Ticket Body */}
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-stone-400 block">Thửa đất mục tiêu</span>
                            <strong className="text-emerald-800 font-bold block text-xs sm:text-[13px]">
                              Thửa {plotLabel}
                            </strong>
                            <span className="text-[10px] text-stone-500 block truncate">Happy Valley Củ Chi</span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] text-stone-400 block">Ngày & Giờ hẹn</span>
                            <strong className="text-stone-900 font-bold block text-xs sm:text-[13px]">
                              📅 {visit.visit_date}
                            </strong>
                            <span className="text-[10px] text-emerald-700 font-semibold block truncate">
                              🕒 {slotText}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] text-stone-400 block">Khách tham quan</span>
                            <span className="text-stone-800 font-semibold block text-xs truncate">
                              {visit.visitor_name || user?.fullName || 'Khách hàng'}
                            </span>
                            <span className="text-[10px] text-stone-500 block">
                              📞 {visit.visitor_phone || user?.phone || '090...'}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] text-stone-400 block">Quy mô đoàn</span>
                            <span className="text-stone-800 font-semibold block text-xs">
                              👥 {visit.group_size || 1} người
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium block">
                              Xe điện đón miễn phí
                            </span>
                          </div>
                        </div>

                        {visit.notes && (
                          <div className="p-2 rounded-xl bg-white border border-stone-200/70 text-[11px] text-stone-600 italic">
                            "{visit.notes}"
                          </div>
                        )}

                        <div className="pt-1.5 flex items-center justify-between text-[10px] text-stone-400 border-t border-dashed border-stone-200">
                          <span>Đón tiếp tại Cổng 1</span>
                          <span className="text-emerald-700 font-medium">Xuất trình mã vé khi đến</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : isAuthenticated ? (
                <div className="py-7 px-4 text-center rounded-2xl bg-stone-50/70 border border-dashed border-stone-200 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-800">Bạn chưa có lịch hẹn khảo sát nào</h4>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto leading-relaxed">
                    Điền thông tin ở biểu mẫu bên cạnh để chọn ngày và thửa đất. Lịch hẹn của bạn sẽ được lưu tự động tại đây để bạn không bị quên!
                  </p>
                </div>
              ) : (
                <div className="py-6 px-4 text-center rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Đăng nhập để lưu & tra cứu lịch sử</h4>
                    <p className="text-[11px] text-stone-600 max-w-xs mx-auto leading-relaxed mt-1">
                      Đăng nhập giúp tự động lưu trữ các phiếu hẹn khảo sát thực địa của bạn trên mọi thiết bị và nhận thông báo nhắc lịch trước ngày đi.
                    </p>
                  </div>
                  <Link
                    to="/login?redirect=/site-visit/book"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition shadow-xs"
                  >
                    <span>Đăng nhập tài khoản</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <p className="text-[10px] text-stone-400">
                    Hoặc đặt lịch ngay bên cạnh, phiếu hẹn sẽ lưu tạm trên trình duyệt này.
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Farm Location & Facilities */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h3 className="font-heading text-sm font-bold text-stone-900">
                  Địa Điểm Nông Trại Khảo Sát
                </h3>
              </div>

              <div className="space-y-2 text-xs text-stone-700">
                <div>
                  <span className="text-stone-500 block text-[11px]">Khu vực chính:</span>
                  <strong className="text-stone-900 text-xs sm:text-sm font-bold">Trang trại Happy Valley Củ Chi</strong>
                </div>

                <div>
                  <span className="text-stone-500 block text-[11px]">Địa chỉ thực địa:</span>
                  <p className="text-stone-800 leading-relaxed font-medium text-[11px] sm:text-xs">
                    Đường Nhuận Đức, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh
                  </p>
                </div>

                <div>
                  <span className="text-stone-500 block text-[11px]">Thời gian mở cửa đón khách:</span>
                  <p className="text-stone-800 font-medium text-[11px]">
                    08:00 – 17:30 (Thứ Hai – Chủ Nhật, kể cả ngày lễ)
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 text-[11px]">
                    <Car className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tiện ích & Lưu ý thực địa:</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Bãi ô tô 4-16 chỗ, xe điện nội khu miễn phí. Khuyên dùng giày thể thao/giày bệt; trang trại có sẵn nón tai bèo, ủng bảo hộ và nước uống.
                  </p>
                </div>
              </div>

              <a
                href="https://maps.google.com/?q=Nhu%E1%BA%ADn+%C4%90%E1%BB%A9c,+C%E1%BB%A7+Chi,+TP.HCM"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                <span>Xem đường đi trên Google Maps</span>
              </a>
            </div>

            {/* Card 3: Hotline Support Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-stone-900 text-white rounded-3xl p-5 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-heading text-xs sm:text-sm font-bold text-white">Hotline Điều Phối Khảo Sát</h4>
                  <span className="text-[10px] text-emerald-300">Hỗ trợ 24/7 đón tiếp & chỉ đường</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-300 leading-relaxed">
                Cần hướng dẫn đường đi gấp hoặc đăng ký đoàn tham quan đông người (&gt; 5 người), vui lòng gọi ngay:
              </p>

              <div className="pt-0.5 flex items-center justify-between">
                <div>
                  <a
                    href="tel:1900688889"
                    className="text-base font-heading font-black text-amber-400 hover:underline tracking-wide"
                  >
                    1900 688 889
                  </a>
                  <span className="block text-[9px] text-stone-400">Miễn phí cước gọi</span>
                </div>

                <a
                  href="tel:0901234567"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <span>Gọi 0901 234 567</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
