import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import Hero from '../../components/public/Hero';
import FarmCard from '../../components/public/FarmCard';
import PlotCard from '../../components/public/PlotCard';
import { farmApi } from '../../api/farm/farmApi';
import {
  Sprout,
  ClipboardCheck,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users
} from 'lucide-react';
import Button from '../../components/common/Button';

export default function Home() {
  const location = useLocation();
  const [lands, setLands] = useState([]);
  const [featuredPlots, setFeaturedPlots] = useState([]);

  useEffect(() => {
    farmApi.listLands()
      .then((rows) => setLands((rows || []).filter((land) => land.isPublished !== false && land.is_published !== false)))
      .catch((err) => console.warn('Không thể nạp danh sách nông trại:', err));

    farmApi.listPlots()
      .then((rows) => {
        const mapped = (rows || []).slice(0, 6).map((p) => ({
          id: String(p.plotId),
          plotId: p.plotId,
          code: p.plotCode,
          name: `Thửa đất ${p.plotCode}`,
          landName: p.landName || 'Trang trại Happy Valley Củ Chi',
          area: `${Number(p.area)} m²`,
          status: p.status === 'AVAIL' ? 'AVAILABLE' : p.status === 'RENT' ? 'RENTED' : 'MAINTENANCE',
          rentalPriceFormatted: `${Number(p.pricePerPeriod).toLocaleString('vi-VN')} đ/tháng`,
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1000&q=80',
          compatibleCrops: Array.isArray(p.compatibleVarieties)
            ? p.compatibleVarieties.map((variety) => variety.varietyName)
            : []
        }));
        setFeaturedPlots(mapped);
      })
      .catch((err) => console.warn('Không thể nạp danh sách thửa đất nổi bật:', err));
  }, []);

  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Top Navbar */}
      <PublicNavbar />

      {/* 1. Cinematic Hero matching reference */}
      <Hero />

      {/* 2. Top Booking / Site Visit CTA Banner (Đưa lên đầu ngay sau Hero) */}
      <section id="site-visit-cta" className="py-16 sm:py-20 bg-brand-green text-white relative overflow-hidden border-b border-emerald-900/30">
        {/* Subtle ambient lighting */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-yellow/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-brand-yellow text-xs font-bold uppercase tracking-wider border border-white/15">
            <Calendar className="w-3.5 h-3.5" />
            <span>Tham Quan Trực Tiếp Miễn Phí</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white tracking-tight">
            Bắt Đầu Trải Nghiệm Canh Tác Ngay Hôm Nay
          </h2>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-stone-200/90 leading-relaxed">
            Bạn vẫn chưa chắc chắn về loại rau hoặc điều kiện đất? Hãy để lại thông tin đặt lịch tham quan trang trại để được chuyên gia tư vấn trực tiếp và chu đáo nhất.
          </p>

          <div className="pt-3 flex flex-col items-center justify-center">
            <Link to="/site-visit/book" className="group relative inline-flex items-center justify-center">
              {/* Outer Glow */}
              <div className="absolute -inset-1 rounded-2xl bg-brand-yellow/60 blur-lg opacity-75 group-hover:opacity-100 transition duration-300 group-hover:scale-105" />

              {/* Prominent Button */}
              <button className="relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-xl bg-brand-yellow hover:bg-[#ffc83b] text-brand-dark font-heading font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-black/15 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                <Calendar className="w-5 h-5 text-brand-dark stroke-[2.5]" />
                <span>ĐẶT LỊCH THAM QUAN VƯỜN</span>
                <ArrowRight className="w-4 h-4 text-brand-dark stroke-[2.5] group-hover:translate-x-1.5 transition-transform" />
              </button>
            </Link>

            <p className="mt-3 text-xs text-emerald-200/80">
              ✓ Miễn phí 100% • Nhân viên gọi lại xác nhận trong vòng 2 giờ
            </p>
          </div>
        </div>
      </section>

      {/* 3. Farm locations appear before the plot catalogue */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-yellow text-brand-dark uppercase tracking-wider">
            Địa điểm đang có thửa đất
          </span>
          <h2 className="text-section-title font-heading font-black text-brand-dark mt-3">
            Hệ thống nông trại Farmely
          </h2>
          <p className="text-sm sm:text-base text-brand-muted mt-2">
            Xem vị trí, điều kiện tự nhiên và số thửa đang mở tại từng khu nông trại trước khi chọn thửa phù hợp.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-8">
          {lands.map((land) => (
            <FarmCard
              key={land.landId}
              land={{
                id: String(land.landId),
                name: land.landName,
                location: land.address,
                description: land.description || 'Khu nông trại sinh thái canh tác theo quy trình VietGAP.',
                totalArea: land.boundaryAreaM2 ? `${Math.round(land.boundaryAreaM2).toLocaleString('vi-VN')} m²` : '25.000 m²',
                totalPlots: land.totalPlots || 16,
                activePlots: land.availablePlots || 10,
                imageUrl: land.imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'
              }}
            />
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
                Chọn thửa đất & cây trồng
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
                Theo Dõi Vi Khí Hậu Từ Xa
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
                Thu Hoạch & Nhận Nông Sản
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Cân đo sản lượng bằng cân điện tử có ảnh chụp đối chứng. Bạn có thể tự đến trải nghiệm thu hoạch hoặc nhận tại nông trại.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured plots are shown after visitors understand each location */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wider mb-2">
              <Sprout className="w-3.5 h-3.5" />
              <span>Thửa đất sẵn sàng canh tác</span>
            </div>
            <h2 className="text-section-title font-heading font-black text-brand-dark">Các thửa đất nổi bật</h2>
            <p className="text-sm sm:text-base text-brand-muted mt-2 max-w-xl">
              Các thửa được quy hoạch để canh tác theo quy trình VietGAP.
            </p>
          </div>
          <Link to="/marketplace">
            <Button variant="outline" size="md" className="gap-2 shrink-0"><span>Xem tất cả thửa đất</span><ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPlots.length > 0 ? (
            featuredPlots.map((plot) => <PlotCard key={plot.id} plot={plot} />)
          ) : (
            <div className="col-span-full py-12 text-center text-brand-muted text-sm bg-white rounded-2xl border border-brand-border">
              Đang kết nối cơ sở dữ liệu và tải danh sách thửa đất nổi bật...
            </div>
          )}
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
                  <span>Cảnh báo vi khí hậu kéo dài tự động tạo Emergency Task cứu hộ</span>
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



      {/* Footer */}
      <Footer />
    </div>
  );
}
