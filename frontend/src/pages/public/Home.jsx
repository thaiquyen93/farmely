import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import Hero from '../../components/public/Hero';
import FarmSearch from '../../components/public/FarmSearch';
import PlotCard from '../../components/public/PlotCard';
import FarmCard from '../../components/public/FarmCard';
import { plotsData } from '../../data/plots';
import { landsData } from '../../data/lands';
import {
  Sprout,
  Radio,
  ClipboardCheck,
  Calendar,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users
} from 'lucide-react';
import Button from '../../components/common/Button';

export default function Home() {
  const featuredPlots = plotsData.slice(0, 3);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, [location]);

  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Top Navbar */}
      <PublicNavbar />

      {/* 1. Cinematic Hero matching reference */}
      <Hero />

      {/* 2. Floating Farm Search */}
      <FarmSearch />

      {/* 3. Featured Plots Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wider mb-2">
              <Sprout className="w-3.5 h-3.5" />
              <span>Thửa Đất Sẵn Sàng Canh Tác</span>
            </div>
            <h2 className="text-section-title font-heading font-black text-brand-dark">
              Các Thửa Đất Nổi Bật
            </h2>
            <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-xl">
              Đất đã được đo đạc thổ nhưỡng, lắp sẵn nguồn nước sạch và kết nối trạm quan trắc IoT vi khí hậu theo chuẩn VietGAP.
            </p>
          </div>

          <Link to="/marketplace">
            <Button variant="outline" size="md" className="gap-2 shrink-0">
              <span>Xem tất cả thửa đất</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPlots.map((plot) => (
            <PlotCard key={plot.id} plot={plot} />
          ))}
        </div>
      </section>

      {/* 4. How Farmely Works - 4 Steps */}
      <section id="how-it-works" className="py-20 bg-white border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-green uppercase tracking-wider border border-brand-border">
              Quy Trình Khép Kín 4 Bước
            </span>
            <h2 className="text-section-title font-heading font-black text-brand-dark mt-3">
              Cách Farmely Hoạt Động
            </h2>
            <p className="text-sm sm:text-base text-brand-muted mt-2">
              Từ lúc chọn thửa đất đầu tiên đến khi nhận giỏ rau sạch tươi ngon giao tận tay bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-brand-cream/40 border border-brand-border hover:bg-brand-cream transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-green text-white flex items-center justify-center font-heading font-black text-xl mb-5 shadow-sm">
                01
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-dark mb-2">
                Chọn Đất & Cây Trồng
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Khám phá Marketplace, tra cứu độ tương thích thổ nhưỡng với giống cây bạn thích (Cà chua bi, Xà lách, Dâu tây...).
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-brand-cream/40 border border-brand-border hover:bg-brand-cream transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center font-heading font-black text-xl mb-5 shadow-sm">
                02
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-dark mb-2">
                Chọn Hình Thức Canh Tác
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Lựa chọn <strong>Self-growing</strong> (tự đến chăm sóc cuối tuần) hoặc <strong>Assisted-growing</strong> (đội ngũ Farmely chăm sóc trọn gói).
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-brand-cream/40 border border-brand-border hover:bg-brand-cream transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-green text-white flex items-center justify-center font-heading font-black text-xl mb-5 shadow-sm">
                03
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-dark mb-2">
                Theo Dõi Từ Xa Qua IoT
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Cập nhật độ ẩm đất, nhiệt độ, Farm Diary có ảnh chụp minh chứng của công nhân và hỏi đáp trực tiếp với Chuyên gia Nông nghiệp.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative p-6 rounded-2xl bg-brand-cream/40 border border-brand-border hover:bg-brand-cream transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center font-heading font-black text-xl mb-5 shadow-sm">
                04
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-dark mb-2">
                Thu Hoạch & Nghiệm Thu
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Cân đo sản lượng bằng cân điện tử có ảnh chụp đối chứng. Bạn có thể tự đến thu hoạch hoặc yêu cầu giao tươi tới tận nhà.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Master Farm Properties (Lands) */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-yellow text-brand-dark uppercase tracking-wider">
            Quỹ Đất Trực Thuộc Vận Hành
          </span>
          <h2 className="text-section-title font-heading font-black text-brand-dark mt-3">
            Hệ Thống Nông Trại Farmely
          </h2>
          <p className="text-sm sm:text-base text-brand-muted mt-2">
            Farmely trực tiếp sở hữu, bảo tồn và vận hành các khu nông trại sinh thái tại các vùng phụ cận TP.HCM và cao nguyên Lâm Đồng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {landsData.map((land) => (
            <FarmCard key={land.id} land={land} />
          ))}
        </div>
      </section>

      {/* 6. Smart Farming & IoT Showcase */}
      <section className="py-20 bg-brand-dark text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-brand-yellow text-xs font-bold uppercase tracking-wider border border-white/15">
                <Radio className="w-3.5 h-3.5" />
                <span>Công Nghệ Nông Nghiệp Thông Minh</span>
              </div>

              <h2 className="text-section-title font-heading font-black text-white text-balance">
                Giám Sát Vi Khí Hậu Từng Luống Đất Theo Thời Gian Thực
              </h2>

              <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
                Mỗi thửa đất được trang bị trạm cảm biến IoT tự động gửi dữ liệu nhiệt độ, độ ẩm không khí và độ ẩm đất. Hệ thống kích hoạt cảnh báo thông minh và tự động hoãn tưới nước khi độ ẩm đạt trên 80% hoặc có mưa lớn.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-black font-heading text-brand-yellow mb-1">3 Giờ/Lần</div>
                  <div className="text-xs text-stone-300">Chu kỳ cập nhật dữ liệu vi khí hậu</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl font-black font-heading text-brand-yellow mb-1">100% Minh Bạch</div>
                  <div className="text-xs text-stone-300">Minh chứng ảnh hiện trường sau mỗi ca trực</div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/marketplace">
                  <Button variant="primary" size="lg" className="uppercase font-extrabold text-xs tracking-wider">
                    XEM CÁC THỬA ĐẤT KẾT NỐI IOT
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Telemetry Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 space-y-6">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-yellow tracking-wider">Trạm mẫu đang trực tiếp</span>
                  <h4 className="font-heading text-lg font-bold text-white">IOT-CC-01 – Thửa Sen Vàng A1</h4>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10">
                  <span className="text-[11px] text-stone-400 block mb-1">Nhiệt độ khí</span>
                  <span className="font-heading text-2xl font-extrabold text-white">28.5°C</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">An toàn (18-32°C)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10">
                  <span className="text-[11px] text-stone-400 block mb-1">Độ ẩm đất</span>
                  <span className="font-heading text-2xl font-extrabold text-brand-yellow">68%</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Lý tưởng</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10">
                  <span className="text-[11px] text-stone-400 block mb-1">Độ ẩm không khí</span>
                  <span className="font-heading text-2xl font-extrabold text-white">74%</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Ổn định</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-300 space-y-2">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-white flex items-center gap-1.5">
                    <CloudSun className="w-4 h-4 text-brand-yellow" />
                    Dự báo thời tiết OpenWeather:
                  </span>
                  <span className="text-brand-yellow">Nắng ráo dịu mát, không mưa</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Cơ chế thông minh BR18: Tự động điều chỉnh định mức tưới theo vi khí hậu thực tế và trạng thái của giống cây trồng.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Farming Experience Section (Self vs Assisted) */}
      <section id="experience" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-green uppercase tracking-wider border border-brand-border">
            Hai Hình Thức Canh Tác Rõ Ràng
          </span>
          <h2 className="text-section-title font-heading font-black text-brand-dark mt-3">
            Lựa Chọn Trải Nghiệm Của Bạn
          </h2>
          <p className="text-sm sm:text-base text-brand-muted mt-2">
            Tự do lựa chọn phương thức canh tác phù hợp nhất với quỹ thời gian và sở thích của bạn và gia đình.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Self-growing Card */}
          <div className="editorial-card p-8 bg-white flex flex-col justify-between border-2 border-transparent hover:border-brand-green/30">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-green flex items-center justify-center mb-6">
                <Sprout className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider">Trải nghiệm tự lập</span>
              <h3 className="font-heading text-2xl font-black text-brand-dark mt-1 mb-3">
                Self-Growing (Tự Canh Tác)
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed mb-6">
                Bạn và gia đình tự tay chăm sóc, tưới tiêu và thu hoạch vườn rau vào các buổi chiều hoặc cuối tuần. Hệ thống cung cấp sổ tay quy trình chuẩn và hướng dẫn từ xa.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-stone-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Xem tài liệu Quy trình chuẩn VietGAP (Read-only)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Tự cập nhật hình ảnh và nhật ký Farm Diary của bạn</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Tự do đến trang trại thu hoạch miễn phí vào cuối tuần</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Mua thêm Gói ủy thác chăm sóc linh hoạt khi bận đột xuất</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-6 border-t border-brand-border">
              <Link to="/marketplace">
                <Button variant="outline" className="w-full">
                  Chọn Thửa Đất Tự Chăm Sóc
                </Button>
              </Link>
            </div>
          </div>

          {/* Assisted-growing Card */}
          <div className="editorial-card p-8 bg-gradient-to-br from-brand-cream/80 to-white flex flex-col justify-between border-2 border-brand-yellow/60 shadow-md">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-brand-green uppercase tracking-wider">Hỗ trợ trọn gói</span>
              <h3 className="font-heading text-2xl font-black text-brand-dark mt-1 mb-3">
                Assisted-Growing (Chăm Sóc Trọn Gói)
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed mb-6">
                Đội ngũ Chuyên viên lao động (CVLĐ) chăm sóc 100% theo quy trình chuẩn của Chuyên gia. Bạn chỉ cần mở app ngắm nhìn cây lớn lên mỗi ngày.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-stone-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Hệ thống tự động sinh Care Task hằng ngày cho công nhân</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Bắt buộc có ảnh minh chứng thực tế tại vườn sau mỗi việc làm</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Tự động đồng bộ báo cáo sang Farm Diary của bạn</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Cảnh báo IoT kéo dài tự động tạo Emergency Task cứu hộ</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-6 border-t border-brand-border">
              <Link to="/marketplace">
                <Button variant="primary" className="w-full">
                  Khám Phá Dịch Vụ Trọn Gói
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 8. Call to Action Banner */}
      <section className="py-20 bg-brand-green text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-hero font-heading font-black text-white text-balance">
            Bắt Đầu Trải Nghiệm Canh Tác Ngay Hôm Nay
          </h2>
          <p className="max-w-2xl mx-auto text-stone-200 text-sm sm:text-base leading-relaxed">
            Bạn vẫn chưa chắc chắn về loại rau hoặc điều kiện đất? Hãy đặt lịch hẹn tham quan vườn miễn phí hoặc nhắn tin với Chuyên gia Nông nghiệp để được tư vấn chu đáo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/site-visit/book">
              <Button variant="primary" size="lg" className="w-full sm:w-auto uppercase tracking-wider font-extrabold">
                ĐẶT LỊCH THAM QUAN VƯỜN
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="outline-light" size="lg" className="w-full sm:w-auto uppercase tracking-wider font-bold">
                XEM THỬA ĐẤT KHẢ DỤNG
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
