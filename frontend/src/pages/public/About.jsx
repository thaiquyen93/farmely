import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { landsData } from '../../data/lands';
import FarmCard from '../../components/public/FarmCard';
import Button from '../../components/common/Button';
import {
  Sprout,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  MapPin,
  ClipboardCheck,
  HeartHandshake,
  TrendingUp,
  FileCheck2
} from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <PublicNavbar />

      {/* Hero Banner */}
      <section className="pt-32 pb-20 bg-brand-dark text-white relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-bold uppercase tracking-wider border border-brand-yellow/30">
            <Sprout className="w-4 h-4" />
            <span>VỀ NỀN TẢNG FARMELY</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Kết nối cư dân đô thị với những thửa đất canh tác thông minh
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 leading-relaxed">
            Farmely là giải pháp nông nghiệp số tiên phong, trao cho bạn quyền sở hữu trải nghiệm tự tay hoặc ủy thác canh tác rau sạch hữu cơ VietGAP trên từng luống đất được giám sát IoT 24/7.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-20">
        
        {/* Sứ Mệnh & Tầm Nhìn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="editorial-card p-8 bg-white border border-brand-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-brand-green flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-brand-dark">Sứ Mệnh</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Tạo lập lối sống bền vững cho gia đình đô thị thông qua việc sở hữu nguồn thực phẩm minh bạch 100%, đồng thời tạo việc làm thu nhập ổn định cho người lao động nông thôn.
            </p>
          </div>

          <div className="editorial-card p-8 bg-white border border-brand-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-brand-dark">Tiêu Chuẩn VietGAP</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Mọi thửa đất, hạt giống F1 và quy trình chăm sóc đều tuân thủ nghiêm ngặt quy định an toàn vệ sinh thực phẩm theo bộ quy chuẩn nông học BR03.
            </p>
          </div>

          <div className="editorial-card p-8 bg-white border border-brand-border space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-brand-dark">Công Nghệ IoT 4.0</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Trạm cảm biến quan trắc vi khí hậu thu thập nhiệt độ, độ ẩm đất và dự báo thời tiết, tự động cảnh báo cứu hộ khi môi trường có biến động bất thường.
            </p>
          </div>
        </div>

        {/* 4 Trụ Cột Vận Hành */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-brand-cream text-brand-green uppercase tracking-wider border border-brand-border">
              Nền Tảng Vận Hành Vững Chắc
            </span>
            <h2 className="text-3xl font-heading font-black text-brand-dark mt-2">
              4 Giá Trị Cốt Lõi Tại Farmely
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-brand-border flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center shrink-0 font-bold">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base text-brand-dark">
                  Thửa Đất Quy Chuẩn Độc Lập
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Mỗi thửa đất có diện tích định lượng (từ 50m² - 200m²), có rãnh thoát nước, đường ống tưới thông minh và hệ thống mã hóa độc lập.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-border flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-yellow text-brand-dark flex items-center justify-center shrink-0 font-bold">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base text-brand-dark">
                  Nhật Ký Farm Diary Kèm Ảnh Minh Chứng
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Đội ngũ công nhân tại vườn bắt buộc chụp ảnh hiện trường sau mỗi ca trực (tưới nước, bắt sâu, bón phân) đồng bộ trực tiếp lên tài khoản khách hàng.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-border flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center shrink-0 font-bold">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base text-brand-dark">
                  Đội Ngũ Chuyên Gia Nông Nghiệp (CGNN)
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Các kỹ sư nông học xây dựng Template quy trình chuẩn, kiểm tra độ tương thích cây trồng với từng loại đất và giải đáp tư vấn trực tiếp 24/7.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-border flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-yellow text-brand-dark flex items-center justify-center shrink-0 font-bold">
                4
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base text-brand-dark">
                  Nghiệm Thu Sản Lượng Cân Điện Tử
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Rau củ thu hoạch được cân đo điện tử công khai có ảnh chụp, bạn có thể tự đến thu hoạch cuối tuần hoặc yêu cầu đóng thùng giao tận cửa nhà.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hệ Thống Nông Trại (Lands) */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-brand-yellow text-brand-dark uppercase tracking-wider">
                Hệ Thống Nông Trại Trực Thuộc
              </span>
              <h2 className="text-3xl font-heading font-black text-brand-dark mt-2">
                Các Nông Trại Sinh Thái Farmely
              </h2>
            </div>
            <Link to="/marketplace">
              <Button variant="outline" size="sm" className="gap-2">
                <span>Xem trên Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {landsData.map((land) => (
              <FarmCard key={land.id} land={land} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 sm:p-12 rounded-3xl bg-brand-green text-white text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
            Sẵn Sàng Bắt Đầu Trải Nghiệm Nông Nghiệp Của Riêng Bạn?
          </h2>
          <p className="max-w-xl mx-auto text-stone-200 text-xs sm:text-sm leading-relaxed">
            Khám phá ngay danh sách thửa đất sẵn sàng cho thuê trên Marketplace và chọn giống rau yêu thích của gia đình bạn.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/marketplace">
              <Button variant="primary" size="lg" className="uppercase font-extrabold text-xs">
                KHÁM PHÁ MARKETPLACE NGAY
              </Button>
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
