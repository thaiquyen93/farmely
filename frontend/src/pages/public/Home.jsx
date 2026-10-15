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
  Radio,
  ClipboardCheck,
  Calendar,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Users,
  Sun,
  CloudRain,
  Droplets,
  Zap,
  Smartphone
} from 'lucide-react';
import Button from '../../components/common/Button';

export default function Home() {
  const location = useLocation();
  const [lands, setLands] = useState([]);
  const [featuredPlots, setFeaturedPlots] = useState([]);

  useEffect(() => {
    farmApi.listLands()
      .then((rows) => setLands(rows || []))
      .catch((err) => console.warn('Không thể nạp danh sách nông trại:', err));

    farmApi.listPlots()
      .then((rows) => {
        const mapped = (rows || []).slice(0, 6).map((p) => ({
          id: String(p.plotId),
          plotId: p.plotId,
          code: p.plotCode,
          name: `Thửa đất ${p.plotCode}`,
          landName: p.landName || 'Trang trại Happy Valley Củ Chi',
          soilType: p.soilType || 'Đất phù sa bồi lắng giàu mùn',
          area: `${Number(p.area)} m²`,
          status: p.status === 'AVAIL' ? 'AVAILABLE' : p.status === 'RENT' ? 'RENTED' : 'MAINTENANCE',
          rentalPriceFormatted: `${Number(p.pricePerPeriod).toLocaleString('vi-VN')} đ/tháng`,
          imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1000&q=80',
          compatibleCrops: ['Rau muống lá tre', 'Cải ngọt bông', 'Xà lách Romaine']
        }));
        setFeaturedPlots(mapped);
      })
      .catch((err) => console.warn('Không thể nạp danh sách thửa đất nổi bật:', err));
  }, []);

  // Interactive IoT Simulator State
  const [simWeather, setSimWeather] = useState('ideal');

  const simScenarios = {
    ideal: {
      title: 'Thời Tiết Lý Tưởng',
      temp: '28.5°C',
      soil: 68,
      air: '74%',
      statusLabel: 'Sinh trưởng tối ưu',
      badge: 'CHUẨN VIETGAP',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      soilColor: 'text-brand-yellow',
      actionText: 'Tưới nhỏ giọt dinh dưỡng hữu cơ tự động lúc 07:00 sáng. Đất ẩm tơi xốp, rau lớn khỏe mỗi ngày.',
      systemAction: 'Chế độ: Tưới nhỏ giọt tiêu chuẩn (Đã hoàn tất lúc 07:00)'
    },
    hot: {
      title: 'Trưa Nắng Gắt 35°C',
      temp: '34.8°C',
      soil: 46,
      air: '55%',
      statusLabel: 'Kích hoạt phun sương',
      badge: 'TỰ ĐỘNG HẠ NHIỆT',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      soilColor: 'text-amber-400',
      actionText: 'Nhiệt độ vượt 33°C: Béc phun sương thông minh tự động bật 5 phút để làm mát lá, chống cháy ngọn.',
      systemAction: 'Chế độ: Đang phun sương làm mát tự động (Bật 5 phút)'
    },
    rain: {
      title: 'Trời Đổ Mưa Lớn',
      temp: '23.6°C',
      soil: 86,
      air: '92%',
      statusLabel: 'Tự động ngắt tưới',
      badge: 'CHỐNG ÚNG THÔNG MINH',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      soilColor: 'text-cyan-400',
      actionText: 'Cảm biến báo độ ẩm đất ≥ 80% kết hợp dữ liệu mưa: Hệ thống ngắt 100% vòi tưới để rễ không bị úng nước.',
      systemAction: 'Chế độ: Hoãn tưới tự động (Tránh ngập rễ & tiết kiệm nước)'
    }
  };

  const currentSim = simScenarios[simWeather];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {lands.map((land) => (
            <FarmCard
              key={land.landId}
              land={{
                id: String(land.landId),
                name: land.landName,
                location: land.address,
                description: land.description || 'Khu nông trại sinh thái chuẩn VietGAP với hệ thống quan trắc IoT 24/7.',
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
              Các thửa đã được đo đạc thổ nhưỡng, lắp nguồn nước sạch và kết nối trạm quan trắc IoT theo chuẩn VietGAP.
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

      {/* 6. Smart Farming & Interactive IoT Simulator */}
      <section className="py-20 bg-brand-dark text-white relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-brand-yellow text-xs font-bold uppercase tracking-wider border border-white/15">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>CÔNG NGHỆ QUAN TRẮC IOT VI KHÍ HẬU</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-white text-balance tracking-tight leading-tight">
                Giám Sát Vi Khí Hậu &<br />
                <span className="text-brand-yellow">Quá Trình Canh Tác Từng Thửa Đất</span>
              </h2>

              <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
                Mỗi thửa đất được trang bị trạm cảm biến IoT thu thập dữ liệu nhiệt độ, độ ẩm không khí và độ ẩm đất. Hệ thống kết hợp dữ liệu vi khí hậu thực tế cùng dự báo thời tiết để tự động điều phối chu trình tưới và kích hoạt cảnh báo kỹ thuật theo đúng quy chuẩn vận hành trang trại.
              </p>

              {/* Interactive Weather Simulator Controls */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/15 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  MÔ PHỎNG PHẢN ỨNG DỮ LIỆU IOT & ĐIỀU PHỐI TƯỚI:
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSimWeather('ideal')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                      simWeather === 'ideal'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md scale-102'
                        : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Thời Tiết Tiêu Chuẩn</span>
                  </button>

                  <button
                    onClick={() => setSimWeather('hot')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                      simWeather === 'hot'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md scale-102'
                        : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-300" />
                    <span>Nhiệt Độ Cao (35°C)</span>
                  </button>

                  <button
                    onClick={() => setSimWeather('rain')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                      simWeather === 'rain'
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md scale-102'
                        : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <CloudRain className="w-4 h-4 text-cyan-300" />
                    <span>Mưa Lớn Độ Ẩm Cao</span>
                  </button>
                </div>
              </div>

              {/* 2 SSoT Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-brand-yellow shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">Minh Bạch Quá Trình Canh Tác</h4>
                    <p className="text-[11px] text-stone-300 leading-snug">Theo dõi dữ liệu cảm biến, hình ảnh thực địa và nhật ký Farm Diary được cập nhật liên tục.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">Quy Trình Chuẩn Hóa VietGAP</h4>
                    <p className="text-[11px] text-stone-300 leading-snug">Phác đồ chăm sóc gắn liền từng giống cây, do Chuyên gia nông nghiệp (CGNN) thiết lập và giám sát.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/marketplace">
                  <Button variant="primary" size="lg" className="uppercase font-black text-xs tracking-wider shadow-yellow-glow">
                    XEM CÁC THỬA ĐẤT KẾT NỐI IOT THÔNG MINH
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Interactive Telemetry Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 space-y-6 shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-brand-yellow tracking-wider">Trạm quan trắc thực địa</span>
                    <span className="text-[10px] text-stone-400">• Vừa cập nhật 2 phút trước</span>
                  </div>
                  <h4 className="font-heading text-lg font-bold text-white">IOT-CC-01 – Thửa Sen Vàng A1</h4>
                </div>
                
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${currentSim.badgeBg}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {currentSim.badge}
                </span>
              </div>

              {/* Real-time Telemetry Readout */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-black/25 border border-white/10 transition-all">
                  <span className="text-[11px] text-stone-400 block mb-1">Nhiệt độ khí</span>
                  <span className="font-heading text-2xl font-black text-white">{currentSim.temp}</span>
                  <span className="text-[10px] text-stone-300 block mt-1">Cảm biến ngoài trời</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/25 border border-white/10 transition-all">
                  <span className="text-[11px] text-stone-400 block mb-1">Độ ẩm đất</span>
                  <span className={`font-heading text-2xl font-black ${currentSim.soilColor}`}>{currentSim.soil}%</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">{currentSim.statusLabel}</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/25 border border-white/10 transition-all">
                  <span className="text-[11px] text-stone-400 block mb-1">Độ ẩm khí</span>
                  <span className="font-heading text-2xl font-black text-white">{currentSim.air}</span>
                  <span className="text-[10px] text-stone-300 block mt-1">Vi khí hậu vườn</span>
                </div>
              </div>

              {/* Soil Moisture Visual Bar */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-300 font-medium">Độ ẩm rễ cây hiện tại:</span>
                  <span className="font-bold text-brand-yellow">{currentSim.soil}% (Mục tiêu 60-75%)</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentSim.soil > 80
                        ? 'bg-cyan-400'
                        : currentSim.soil < 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(currentSim.soil, 100)}%` }}
                  />
                </div>
              </div>

              {/* Dynamic Action Trigger Box */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Zap className="w-4 h-4 text-brand-yellow shrink-0 animate-bounce" />
                  <span>Hệ thống tự động xử lý ngay lập tức:</span>
                </div>
                <p className="text-[12px] text-stone-200 leading-relaxed pl-6 border-l-2 border-brand-yellow/60">
                  {currentSim.actionText}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-stone-400">
                  <span>{currentSim.systemAction}</span>
                  <span className="text-emerald-400 font-bold">100% Tự Động</span>
                </div>
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



      {/* Footer */}
      <Footer />
    </div>
  );
}
