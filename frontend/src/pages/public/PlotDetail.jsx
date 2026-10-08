import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { plotsData } from '../../data/plots';
import { varietiesData } from '../../data/varieties';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import SiteVisitForm from '../../components/public/SiteVisitForm';
import { useAuthStore } from '../../stores/authStore';
import {
  MapPin,
  Maximize2,
  Sprout,
  Activity,
  Droplets,
  Thermometer,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Radio,
  ArrowLeft,
  Share2,
  AlertCircle
} from 'lucide-react';

export default function PlotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated } = useAuthStore();
  const plot = plotsData.find((p) => p.id === id) || plotsData[0];
  const [activeImage, setActiveImage] = useState(plot.gallery ? plot.gallery[0] : plot.imageUrl);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedCultivationMode, setSelectedCultivationMode] = useState('ASSISTED');

  const handleBookPlotClick = () => {
    if (!isAuthenticated) {
      setShowSignInModal(true);
    } else {
      navigate(`/marketplace/plot/${plot.id}/book`);
    }
  };

  const compatibleVarietiesList = varietiesData.filter((v) =>
    plot.compatibleCrops.some((c) => v.name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(v.name.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <PublicNavbar />

      {/* Top Breadcrumb Header */}
      <div className="pt-28 pb-8 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs text-brand-yellow font-bold hover:underline mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách thửa đất</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-yellow text-brand-dark">
                  {plot.code}
                </span>
                <span className="text-xs text-stone-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
                  {plot.landName}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-white">
                {plot.name}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={plot.status} size="lg">
                {plot.status === 'AVAILABLE'
                  ? 'Đang mở cho thuê'
                  : plot.status === 'RESERVED'
                  ? 'Đang giữ chỗ 15p'
                  : plot.status === 'RENTED'
                  ? 'Đang canh tác'
                  : 'Đang bảo dưỡng'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        
        {/* Gallery & Quick Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Gallery - 7 cols */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative h-80 sm:h-[440px] rounded-3xl overflow-hidden shadow-elevated border border-brand-border bg-black">
              <img
                src={activeImage}
                alt={plot.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md">
                  Ảnh thực tế tại nông trại
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {plot.gallery && plot.gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {plot.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-24 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImage === img ? 'border-brand-yellow scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Booking Card - 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-elevated space-y-6">
              
              <div>
                <p className="text-xs text-brand-muted uppercase font-bold tracking-wider">
                  Giá thuê thửa đất trọn gói
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-heading font-black text-brand-green">
                    {plot.formattedPrice}
                  </span>
                  <span className="text-xs text-brand-muted">/ tháng canh tác</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Đã bao gồm 01 bộ Starter Kit (cây giống F1 + khay giá thể hữu cơ ban đầu theo BR09).
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 py-4 border-y border-brand-border/60 text-xs">
                <div className="p-3 rounded-xl bg-brand-cream/50">
                  <span className="text-[10px] text-brand-muted uppercase font-bold block">Diện tích canh tác</span>
                  <span className="font-bold text-brand-dark text-sm flex items-center gap-1.5 mt-0.5">
                    <Maximize2 className="w-4 h-4 text-brand-green" />
                    {plot.area}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-brand-cream/50">
                  <span className="text-[10px] text-brand-muted uppercase font-bold block">Trạm quan trắc</span>
                  <span className="font-bold text-brand-dark text-sm flex items-center gap-1.5 mt-0.5">
                    <Radio className="w-4 h-4 text-brand-green" />
                    {plot.iotStationId}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-brand-cream/50 col-span-2">
                  <span className="text-[10px] text-brand-muted uppercase font-bold block">Thổ nhưỡng & pH</span>
                  <span className="font-semibold text-brand-dark mt-0.5 block">
                    {plot.soilType}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {plot.status === 'AVAILABLE' ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full uppercase font-black tracking-wider text-sm shadow-yellow-glow"
                    onClick={handleBookPlotClick}
                  >
                    THUÊ THỬA ĐẤT NÀY NGAY
                  </Button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-stone-100 text-center text-xs text-stone-600 font-bold border border-stone-200">
                    Thửa đất hiện không ở trạng thái khả dụng cho thuê
                  </div>
                )}

                <Button
                  variant="outline"
                  size="md"
                  className="w-full font-bold text-xs"
                  onClick={() => navigate(`/site-visit/book?plotId=${plot.id}`)}
                >
                  <Calendar className="w-4 h-4" />
                  <span>ĐẶT LỊCH THAM QUAN VƯỜN THỰC TẾ</span>
                </Button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] space-y-1 border border-emerald-200">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Quyền lợi khi thuê đất tại Farmely:
                </p>
                <p>• Khóa giữ chỗ 15 phút + 10 phút Grace Period khi nhập mã thanh toán.</p>
                <p>• Chính sách hoàn tiền minh bạch (80% trước 3 ngày, 50% dưới 3 ngày theo BR10).</p>
              </div>
            </div>
          </div>

        </div>

        {/* Real-time IoT Sensor Summary Card */}
        {plot.recentSensorReadings && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-4">
              <div>
                <span className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-4 h-4" />
                  Trạm cảm biến gắn trên thửa đất ({plot.iotStationName})
                </span>
                <h3 className="font-heading text-xl font-bold text-brand-dark mt-1">
                  Chỉ Số Vi Khí Hậu Ghi Nhận Thực Tế
                </h3>
              </div>
              <span className="text-xs text-brand-muted">
                Cập nhật lần cuối: <strong>{plot.recentSensorReadings.lastUpdated}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-muted uppercase font-bold block">Nhiệt độ không khí</span>
                  <span className="text-2xl font-heading font-black text-brand-dark">
                    {plot.recentSensorReadings.temperature}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-muted uppercase font-bold block">Độ ẩm đất</span>
                  <span className="text-2xl font-heading font-black text-brand-dark">
                    {plot.recentSensorReadings.soilMoisture}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-muted uppercase font-bold block">Độ ẩm không khí</span>
                  <span className="text-2xl font-heading font-black text-brand-dark">
                    {plot.recentSensorReadings.humidity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compatible Crop Varieties Section */}
        <div className="space-y-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-green/10 text-brand-green uppercase tracking-wider">
              Quy Chuẩn Tương Thích BR03
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark mt-2">
              Các Giống Cây Trồng Được Phê Duyệt Cho Thửa Này
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-2xl">
              Hội đồng Nông học Farmely đã thẩm định các giống cây dưới đây phát triển tối ưu trên nền đất {plot.soilType}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compatibleVarietiesList.map((variety) => (
              <div key={variety.id} className="editorial-card p-6 bg-white space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={variety.imageUrl}
                    alt={variety.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-brand-border shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                      {variety.cropName}
                    </span>
                    <h4 className="font-heading text-base font-bold text-brand-dark">
                      {variety.name}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {variety.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-t border-brand-border/60">
                  <div>
                    <span className="text-[10px] text-brand-muted block font-semibold">Thời gian sinh trưởng</span>
                    <span className="font-bold text-brand-dark">{variety.growthDuration} ngày</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-muted block font-semibold">Năng suất dự kiến</span>
                    <span className="font-bold text-brand-green">{variety.expectedYield}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-brand-green">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã có quy trình VietGAP
                  </span>
                  <Link
                    to={`/admin/master-data/varieties/${variety.id}`}
                    className="hover:underline text-[11px]"
                  >
                    Xem tiêu chuẩn →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Modal: Sign In Required matching Screen Flow */}
      <Modal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        title="Yêu Cầu Đăng Nhập (Sign In Required)"
        subtitle={`Thửa đất: ${plot.code} - ${plot.name}`}
      >
        <div className="space-y-5 text-left">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Quy Trình Thuê Đất: Cần Đăng Nhập Tài Khoản
            </p>
            <p className="leading-relaxed">
              Để kích hoạt thời hạn khóa giữ chỗ 15 phút (BR08) cho thửa <strong>{plot.name}</strong> và hoàn tất thủ tục Book Plot, vui lòng đăng nhập hoặc đăng ký tài khoản mới.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-brand-cream/60 border border-brand-border flex items-center gap-3">
            <img
              src={plot.imageUrl}
              alt={plot.name}
              className="w-14 h-14 rounded-xl object-cover border border-brand-border shrink-0"
            />
            <div className="text-xs">
              <span className="font-bold text-brand-green">{plot.code}</span>
              <p className="font-heading font-bold text-brand-dark text-sm">{plot.name}</p>
              <p className="text-stone-500">{plot.area} • {plot.formattedPrice}/tháng</p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Link
              to={`/login?redirect=${encodeURIComponent(`/marketplace/plot/${plot.id}/book`)}`}
              className="w-full block"
            >
              <Button variant="primary" size="lg" className="w-full uppercase font-black text-xs tracking-wider">
                ĐĂNG NHẬP NGAY ĐỂ TIẾP TỤC
              </Button>
            </Link>

            <Link
              to={`/register?redirect=${encodeURIComponent(`/marketplace/plot/${plot.id}/book`)}`}
              className="w-full block"
            >
              <Button variant="outline" size="md" className="w-full uppercase font-bold text-xs tracking-wider">
                ĐĂNG KÝ TÀI KHOẢN MỚI
              </Button>
            </Link>
          </div>

          <div className="border-t border-brand-border/60 pt-3 text-center">
            <Link
              to={`/site-visit/book?plotId=${plot.id}`}
              className="text-xs text-brand-green font-semibold hover:underline"
            >
              Hoặc đặt lịch tham quan trước (không cần đăng nhập) →
            </Link>
          </div>
        </div>
      </Modal>

      {/* Modal: Site Visit Booking */}
      <Modal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        title="Đặt Lịch Khảo Sát Thửa Đất"
        maxWidth="max-w-2xl"
      >
        <SiteVisitForm
          preselectedPlotId={plot.id}
          onSuccess={() => setShowVisitModal(false)}
        />
      </Modal>

      {/* Modal: Fast Rental Simulator */}
      <Modal
        isOpen={showRentModal}
        onClose={() => setShowRentModal(false)}
        title="Xác Nhận Giữ Chỗ & Thuê Thửa Đất"
        subtitle={`Thửa đất: ${plot.code} - ${plot.name}`}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">⏱ Thời gian giữ chỗ: 15 Phút (BR08)</p>
            <p>Sau khi nhấn Tiếp Tục, thửa đất sẽ được khóa giữ chỗ tạm thời và chuyển sang trạng thái PAYMENT_PENDING (+10 phút Grace Period khi nhập mã thanh toán).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
              Lựa chọn hình thức canh tác:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedCultivationMode('SELF')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedCultivationMode === 'SELF'
                    ? 'border-brand-green bg-emerald-50/70 ring-2 ring-brand-green/20'
                    : 'border-brand-border bg-white hover:bg-brand-cream/50'
                }`}
              >
                <p className="font-heading text-sm font-bold text-brand-dark">Self-growing</p>
                <p className="text-[11px] text-stone-500 mt-1">Tự chăm sóc tại vườn</p>
                <p className="text-xs font-bold text-brand-green mt-2">Không tính thêm phí</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCultivationMode('ASSISTED')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedCultivationMode === 'ASSISTED'
                    ? 'border-brand-yellow bg-amber-50/70 ring-2 ring-brand-yellow/30'
                    : 'border-brand-border bg-white hover:bg-brand-cream/50'
                }`}
              >
                <p className="font-heading text-sm font-bold text-brand-dark">Assisted-growing</p>
                <p className="text-[11px] text-stone-500 mt-1">Trọn gói công nhân chăm sóc</p>
                <p className="text-xs font-bold text-brand-green mt-2">+{plot.careServicePrice.toLocaleString('vi-VN')} đ/tháng</p>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-cream text-xs space-y-2 border border-brand-border">
            <div className="flex justify-between">
              <span>Tiền thuê đất ({plot.area}):</span>
              <strong>{plot.formattedPrice}</strong>
            </div>
            <div className="flex justify-between">
              <span>Gói canh tác:</span>
              <strong>{selectedCultivationMode === 'ASSISTED' ? `${plot.careServicePrice.toLocaleString('vi-VN')} đ/tháng` : '0 đ'}</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-border text-sm font-extrabold text-brand-green">
              <span>Tổng thanh toán 100% Upfront:</span>
              <span>{(plot.rentalPrice + (selectedCultivationMode === 'ASSISTED' ? plot.careServicePrice : 0)).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowRentModal(false)}>
              HỦY BỎ
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                alert(`Đã khởi tạo đơn giữ chỗ thành công cho ${plot.name} (15 phút lock). Hệ thống chuyển tiếp vào quy trình thanh toán giả lập!`);
                setShowRentModal(false);
              }}
            >
              TIẾP TỤC ĐẾN THANH TOÁN
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
