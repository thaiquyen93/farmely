import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { farmApi } from '../../api/farm/farmApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import AuthRequiredBookingModal from '../../components/marketplace/AuthRequiredBookingModal';
import SiteVisitForm from '../../components/public/SiteVisitForm';
import { useAuthStore } from '../../stores/authStore';
import { loadCartCodes, normalizePlotCode, dedupeCodes } from '../../utils/leaseSelection';
import {
  MapPin,
  Maximize2,
  Sprout,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  Share2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function PlotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated, login } = useAuthStore();
  const [plot, setPlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedCultivationMode, setSelectedCultivationMode] = useState('ASSISTED');

  useEffect(() => {
    setLoading(true);
    setError('');
    farmApi.listPlots()
      .then((plots) => {
        const found = (plots || []).find((p) =>
          String(p.plotId) === String(id) ||
          (p.plotCode && p.plotCode.toLowerCase() === String(id).toLowerCase())
        );
        if (found) {
          const img = found.imageUrl || null;
          const mapped = {
            id: String(found.plotId),
            plotId: found.plotId,
            code: found.plotCode,
            name: `Thửa đất ${found.plotCode}`,
            landId: found.landId,
            landName: found.landName || 'Trang trại Happy Valley Củ Chi',
            area: `${Number(found.area)} m²`,
            areaNum: Number(found.area),
            status: found.status === 'AVAIL' ? 'AVAILABLE' : found.status === 'RENT' ? 'RENTED' : 'MAINTENANCE',
            rentalPrice: Number(found.pricePerPeriod),
            formattedPrice: `${Number(found.pricePerPeriod).toLocaleString('vi-VN')} đ/tháng`,
            careServicePrice: found.carePricePerMonth ?? found.care_price_per_month ?? Math.round(Number(found.pricePerPeriod) * 0.5),
            compatibleVarieties: Array.isArray(found.compatibleVarieties) ? found.compatibleVarieties : [],
            description: found.description || '',
            imageUrl: img,
            boundaryCoordinates: found.boundary?.length >= 3 ? `GPS Polygon (${found.boundary.length} đỉnh)` : 'Đang đồng bộ GPS'
          };
          setPlot(mapped);
          setActiveImage(mapped.imageUrl);
        } else {
          setError('Không tìm thấy thửa đất trong cơ sở dữ liệu.');
        }
      })
      .catch((err) => setError(err.message || 'Lỗi kết nối cơ sở dữ liệu.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBookPlotClick = () => {
    if (!isAuthenticated) {
      setShowSignInModal(true);
    } else if (plot) {
      const code = normalizePlotCode(plot.code || plot.id);
      const cart = loadCartCodes();
      const codes = cart && cart.length > 0 ? dedupeCodes([...cart, code]) : [code];
      navigate(`/marketplace/plot/${encodeURIComponent(code)}/book?plots=${codes.map(encodeURIComponent).join(',')}`);
    }
  };
  const handleStartBooking = handleBookPlotClick;

  const compatibleVarietiesList = plot?.compatibleVarieties || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
          <p className="text-sm font-semibold text-stone-600">Đang tải thông tin thửa đất từ Database...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !plot) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 space-y-4 max-w-md mx-auto text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-black text-brand-dark">Không tìm thấy thửa đất</h2>
          <p className="text-sm text-stone-600">{error || 'Thửa đất yêu cầu không tồn tại trong hệ thống.'}</p>
          <Link to="/marketplace">
            <Button variant="primary">Quay lại Marketplace</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

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
            <span>Quay lại Bản đồ Marketplace</span>
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
              <Link
                to={`/marketplace?plot=${plot.code || plot.id}${!isAuthenticated ? '&authRequired=true' : ''}`}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Xem trên Bản đồ GIS</span>
                <span aria-hidden="true">→</span>
              </Link>
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
              {activeImage ? (
                <img src={activeImage} alt={plot.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white">Chưa có ảnh thửa đất</div>
              )}
            </div>

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
                  Mặt bằng canh tác chuẩn hóa, kết nối trọn gói trạm quan trắc vi khí hậu.
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

              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {plot.status === 'AVAILABLE' ? (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full uppercase font-black tracking-wider text-xs shadow-yellow-glow"
                      onClick={handleStartBooking}
                    >
                      BẮT ĐẦU ĐẶT THUÊ THỬA ĐẤT
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full text-xs font-bold"
                      onClick={() => setShowVisitModal(true)}
                    >
                      Đăng Ký Tham Quan Khảo Sát Thửa Đất
                    </Button>
                  </>
                ) : (
                  <div className="p-4 rounded-2xl bg-stone-100 text-center text-xs font-bold text-stone-500">
                    Thửa đất này hiện không mở cho thuê
                  </div>
                )}
              </div>

              {/* Guarantees */}
              <div className="p-3.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-[11px] text-stone-600 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Quyền lợi khi thuê thửa đất tại Farmely:
                </p>
                <p>• Khóa giữ chỗ 15 phút + 10 phút Grace Period khi nhập mã thanh toán.</p>
                <p>• Chính sách hoàn tiền minh bạch (80% trước 3 ngày, 50% dưới 3 ngày).</p>
              </div>
            </div>
          </div>

        </div>

        {/* Compatible Crop Varieties Section */}
        {compatibleVarietiesList.length > 0 && <div className="space-y-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-green/10 text-brand-green uppercase tracking-wider">
              Tiêu Chuẩn Giống Cây Trồng
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark mt-2">
              Các Giống Cây Trồng Được Phê Duyệt Cho Thửa Này
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compatibleVarietiesList.map((variety) => (
              <div key={variety.varietyId} className="editorial-card p-6 bg-white space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
                      {variety.cropName}
                    </span>
                    <h4 className="font-heading text-base font-bold text-brand-dark">
                      {variety.varietyName}
                    </h4>
                  </div>
                </div>

                {variety.expectedDuration && (
                  <p className="text-xs text-stone-600">Thời gian sinh trưởng: {variety.expectedDuration} ngày</p>
                )}
              </div>
            ))}
          </div>
        </div>}

      </main>

      {/* Modal: Sign In Required matching Screen Flow */}
      <AuthRequiredBookingModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        plot={plot}
        onLogin={() => {
          setShowSignInModal(false);
          navigate(`/login?redirect=${encodeURIComponent(`/marketplace/plot/${plot.id}/book`)}`);
        }}
        onQuickDemoLogin={async () => {
          await login('customer@farmely.vn', '123456');
          setShowSignInModal(false);
          navigate(`/marketplace/plot/${plot.id}/book`);
        }}
        onRegister={() => {
          setShowSignInModal(false);
          navigate(`/register?redirect=${encodeURIComponent(`/marketplace/plot/${plot.id}/book`)}`);
        }}
        onViewMap={() => {
          setShowSignInModal(false);
          navigate(`/marketplace?plotId=${encodeURIComponent(plot.code || plot.id)}`);
        }}
      />

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
            <p className="font-bold">⏱ Thời gian giữ chỗ: 15 Phút</p>
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
              <span>Tiền thuê thửa đất ({plot.area}):</span>
              <strong>{plot.formattedPrice}</strong>
            </div>
            <div className="flex justify-between">
              <span>Gói canh tác:</span>
              <strong>{selectedCultivationMode === 'ASSISTED' ? `${plot.careServicePrice.toLocaleString('vi-VN')} đ/tháng` : '0 đ'}</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-border text-sm font-extrabold text-brand-green">
              <span>Tổng thanh toán một lần:</span>
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
