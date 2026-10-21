import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import SiteVisitForm from '../../components/public/SiteVisitForm';
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
  Compass
} from 'lucide-react';

export default function SiteVisitBooking() {
  const [searchParams] = useSearchParams();
  const plotId = searchParams.get('plotId');

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
                <span>Trải Nghiệm Thực Địa Miễn Phí • SCR-PUB-05</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white tracking-tight leading-tight">
                Đặt Lịch Khảo Sát Nông Trại
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 max-w-2xl leading-relaxed">
                Trực tiếp đặt chân lên cánh đồng, cảm nhận chất đất phù sa, kiểm tra nguồn nước tưới ngầm và trạm quan trắc IoT vi khí hậu trước khi đưa ra quyết định canh tác.
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

          {/* Value Prop Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15 text-xs">
            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 text-emerald-50">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-brand-yellow" />
              </div>
              <span className="font-semibold text-[11px] sm:text-xs">Miễn phí 100% trải nghiệm</span>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 text-emerald-50">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-brand-yellow" />
              </div>
              <span className="font-semibold text-[11px] sm:text-xs">Xác nhận trong 2 giờ</span>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 text-emerald-50">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-brand-yellow" />
              </div>
              <span className="font-semibold text-[11px] sm:text-xs">Không ràng buộc thuê đất</span>
            </div>

            <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 text-emerald-50">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-brand-yellow" />
              </div>
              <span className="font-semibold text-[11px] sm:text-xs">Xe điện nội khu đưa đón</span>
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
            <SiteVisitForm preselectedPlotId={plotId} />
          </div>

          {/* Right Column: Sticky Information & Tour Guide Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-24">
            
            {/* Card 1: Sample Tour Itinerary (Timeline) */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
                <h3 className="font-heading text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-700" />
                  <span>Lịch Trình Đón Tiếp Mẫu</span>
                </h3>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Thời lượng: 60 - 75 phút
                </span>
              </div>

              <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-3 ring-white" />
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-stone-900">08:30 / 14:30</strong>
                    <span className="text-[10px] text-stone-500">Khu đón tiếp</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Gặp chuyên viên điều phối, thưởng thức trà thảo mộc nông trường và nhận nón bảo hộ.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-3 ring-white" />
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-stone-900">08:50 / 14:50</strong>
                    <span className="text-[10px] text-stone-500">Thực địa thửa đất</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Di chuyển bằng xe điện xem ranh giới thửa đất, độ dốc thoát nước và hướng đón ánh sáng tự nhiên.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-3 ring-white" />
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-stone-900">09:15 / 15:15</strong>
                    <span className="text-[10px] text-stone-500">Trạm quan trắc IoT</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Đo kiểm độ ẩm đất thực địa, kiểm tra đường ống nước tưới ngầm và quan sát số liệu cảm biến IoT.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-3 ring-white" />
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-stone-900">09:40 / 15:40</strong>
                    <span className="text-[10px] text-stone-500">Phòng tư vấn</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Chuyên gia nông nghiệp giải đáp về giống cây trồng, quy trình VietGAP và chính sách bàn giao.
                  </p>
                </div>
              </div>
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
