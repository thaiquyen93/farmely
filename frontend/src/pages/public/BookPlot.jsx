import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { plotsData } from '../../data/plots';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Sprout,
  Maximize2,
  Radio,
  MapPin,
  CreditCard,
  QrCode,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import VietQrModal from '../../components/payment/VietQrModal';
import CardPaymentModal from '../../components/payment/CardPaymentModal';

export default function BookPlot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login } = useAuthStore();

  const plot = plotsData.find((p) => p.id === id) || plotsData[0];

  // 15-minute reservation timer (BR08)
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [selectedMode, setSelectedMode] = useState('ASSISTED');
  const [rentalMonths, setRentalMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('VIETQR');
  const [isSuccess, setIsSuccess] = useState(false);
  const [contractCode, setContractCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const careMonthlyPrice = selectedMode === 'ASSISTED' ? plot.careServicePrice : 0;
  const subtotalPlot = plot.rentalPrice * rentalMonths;
  const subtotalCare = careMonthlyPrice * rentalMonths;
  const totalAmount = subtotalPlot + subtotalCare;

  const handleConfirmBooking = async () => {
    setIsProcessing(true);

    if (paymentMethod === 'VIETQR') {
      try {
        const descText = `FARMELY ${plot.code} ${user?.fullName ? user.fullName.replace(/\s+/g, '') : 'KHACH'}`;
        const response = await fetch('http://localhost:8085/api/v1/payments/vietqr/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            plotCode: plot.code,
            description: descText,
            customerName: user?.fullName || 'Khách hàng Farmely'
          })
        });

        const resData = await response.json();
        if (resData?.success && resData?.data) {
          setQrData(resData.data);
          setShowQrModal(true);
          setIsProcessing(false);
          return;
        }
      } catch (err) {
        console.warn('Backend payment-service offline, using quick VietQR client fallback:', err);
      }

      // Fallback if backend service is unreachable
      const fallbackDesc = `FARMELY ${plot.code} KHACH`;
      const fallbackImg = `https://img.vietqr.io/image/ICB-108876543210-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(fallbackDesc)}&accountName=${encodeURIComponent('FARMELY AGRIRENT CORP')}`;
      setQrData({
        transactionId: null,
        qrImageUrl: fallbackImg,
        amount: totalAmount,
        bankName: 'VietinBank (ICB)',
        accountNo: '108876543210',
        accountName: 'FARMELY AGRIRENT CORP',
        description: fallbackDesc
      });
      setShowQrModal(true);
      setIsProcessing(false);
      return;
    }

    if (paymentMethod === 'CARD') {
      setIsProcessing(false);
      setShowCardModal(true);
      return;
    }

    // Default flow for other payment methods
    setTimeout(() => {
      setIsProcessing(false);
      const generatedCode = `CTR-FARM-${Math.floor(100000 + Math.random() * 900000)}`;
      setContractCode(generatedCode);
      setIsSuccess(true);
    }, 1000);
  };

  const handlePaymentSuccess = (paidResult) => {
    setShowQrModal(false);
    setShowCardModal(false);
    const generatedCode = `CTR-FARM-${Math.floor(100000 + Math.random() * 900000)}`;
    setContractCode(generatedCode);
    setIsSuccess(true);
  };

  const handleQuickCustomerLogin = () => {
    const customer = DEMO_ACCOUNTS.find((a) => a.role === 'CUSTOMER') || DEMO_ACCOUNTS[0];
    login(customer.email, 'Farmely@2026');
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <PublicNavbar />

      {/* Top Breadcrumb Header */}
      <div className="pt-28 pb-8 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`/marketplace/plot/${plot.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-brand-yellow font-bold hover:underline mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại chi tiết thửa đất</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-yellow text-brand-dark">
                  Màn hình: Book Plot
                </span>
                <span className="text-xs text-stone-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
                  {plot.landName}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-white">
                Đặt Thuê Thửa Đất Canh Tác
              </h1>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
                <Clock className="w-5 h-5 text-brand-yellow animate-pulse" />
                <div>
                  <span className="text-[10px] text-stone-300 block font-bold uppercase tracking-wider">
                    Khóa giữ chỗ 15 phút
                  </span>
                  <span className="font-mono text-lg font-black text-brand-yellow">
                    {formattedTimer}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* GATE: Sign In Required if not authenticated */}
        {!isAuthenticated ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-brand-border shadow-elevated text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 uppercase tracking-wider inline-block mb-3 border border-amber-200">
                Sign In Required (Yêu Cầu Đăng Nhập)
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
                Vui lòng đăng nhập để tiếp tục thuê đất
              </h2>
              <p className="text-sm text-brand-muted mt-2 max-w-lg mx-auto leading-relaxed">
                Theo quy trình an toàn của Farmely, bạn cần tài khoản để kích hoạt mã giữ chỗ 15 phút cho thửa đất <strong>{plot.code} - {plot.name}</strong> và quản lý hợp đồng điện tử.
              </p>
            </div>

            {/* Quick Plot Preview */}
            <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-border flex items-center gap-4 text-left">
              <img
                src={plot.imageUrl}
                alt={plot.name}
                className="w-16 h-16 rounded-xl object-cover border border-brand-border shrink-0"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-brand-green">{plot.code}</span>
                <h4 className="font-heading font-bold text-sm text-brand-dark">{plot.name}</h4>
                <p className="text-xs text-stone-500">{plot.area} • {plot.formattedPrice}/tháng</p>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/login?redirect=${encodeURIComponent(`/marketplace/plot/${plot.id}/book`)}`}
                className="flex-1"
              >
                <Button variant="primary" size="lg" className="w-full uppercase font-bold text-xs tracking-wider">
                  ĐĂNG NHẬP NGAY
                </Button>
              </Link>
              <Link
                to={`/register?redirect=${encodeURIComponent(`/marketplace/plot/${plot.id}/book`)}`}
                className="flex-1"
              >
                <Button variant="outline" size="lg" className="w-full uppercase font-bold text-xs tracking-wider">
                  ĐĂNG KÝ TÀI KHOẢN MỚI
                </Button>
              </Link>
            </div>

            {/* 1-Click Demo Customer Login Shortcut */}
            <div className="pt-4 border-t border-brand-border/60">
              <p className="text-xs text-brand-muted mb-2 font-medium">
                Dành cho người kiểm thử (Tester / Giảng viên):
              </p>
              <button
                type="button"
                onClick={handleQuickCustomerLogin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>1-Click Đăng nhập Demo Customer (Nguyen Van An)</span>
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          /* SUCCESS CONFIRMATION */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-brand-border shadow-elevated text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider inline-block mb-3 border border-emerald-200">
                Thanh Toán & Kích Hoạt Thành Công
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-brand-dark">
                Chúc Mừng Bạn Đã Thuê Thửa Đất!
              </h2>
              <p className="text-sm text-brand-muted mt-2 max-w-lg mx-auto">
                Hợp đồng điện tử đã được ghi nhận. Thửa đất của bạn đã sẵn sàng và được kích hoạt trên hệ thống giám sát Farmely.
              </p>
            </div>

            {/* Contract Details Card */}
            <div className="p-5 rounded-2xl bg-brand-cream/80 border border-brand-border text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                <span className="text-stone-500">Mã hợp đồng:</span>
                <span className="font-mono font-bold text-brand-green text-sm">{contractCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Khách hàng:</span>
                <span className="font-bold text-brand-dark">{user?.fullName} ({user?.email})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Thửa đất:</span>
                <span className="font-bold text-brand-dark">{plot.code} - {plot.name} ({plot.area})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Hình thức canh tác:</span>
                <span className="font-bold text-brand-dark">
                  {selectedMode === 'ASSISTED' ? 'Assisted-growing (Trọn gói chăm sóc)' : 'Self-growing (Tự chăm sóc)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Chuyên gia phụ trách:</span>
                <span className="font-bold text-emerald-800">ThS. Nguyễn Hoàng Nam</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Công nhân phụ trách (CVLĐ):</span>
                <span className="font-bold text-amber-900">
                  {selectedMode === 'ASSISTED' ? 'Trần Văn Lực (Tổ trưởng CVLĐ)' : 'Khách tự chăm sóc'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Thời hạn:</span>
                <span className="font-bold text-brand-dark">{rentalMonths} Tháng canh tác</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-brand-border text-sm font-black text-brand-green">
                <span>Tổng giá trị:</span>
                <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/marketplace" className="flex-1">
                <Button variant="outline" size="md" className="w-full">
                  Xem thêm thửa đất khác
                </Button>
              </Link>
              <Link to="/customer/dashboard" className="flex-1">
                <Button variant="primary" size="md" className="w-full">
                  Về trang Dashboard cá nhân
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* BOOK PLOT FORM WORKFLOW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 7 cols: Configuration */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Plot Summary Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm flex flex-col sm:flex-row gap-5 items-center">
                <img
                  src={plot.imageUrl}
                  alt={plot.name}
                  className="w-full sm:w-40 h-32 rounded-2xl object-cover border border-brand-border shrink-0"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-yellow text-brand-dark">
                      {plot.code}
                    </span>
                    <span className="text-xs text-brand-muted">{plot.landName}</span>
                  </div>
                  <h3 className="font-heading font-black text-xl text-brand-dark">{plot.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-stone-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <Maximize2 className="w-3.5 h-3.5 text-brand-green" /> {plot.area}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Radio className="w-3.5 h-3.5 text-brand-green" /> {plot.iotStationId}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-1">
                    Thổ nhưỡng: {plot.soilType}
                  </p>
                </div>
              </div>

              {/* Cultivation Mode Selection */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-brand-dark">
                  1. Chọn Hình Thức Canh Tác
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('SELF')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedMode === 'SELF'
                        ? 'border-brand-green bg-emerald-50/70 ring-2 ring-brand-green/20'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50'
                    }`}
                  >
                    <p className="font-heading text-sm font-bold text-brand-dark">Self-Growing</p>
                    <p className="text-xs text-stone-500 mt-1">Tự chăm sóc tại vườn cuối tuần</p>
                    <div className="mt-2.5 space-y-1 text-[11px] text-stone-600 border-t border-brand-border/40 pt-2">
                      <p className="flex items-center gap-1 font-medium text-emerald-800">
                        ✓ Chuyên gia đồng hành: ThS. Nam (Tư vấn kỹ thuật online)
                      </p>
                      <p className="text-stone-500">
                        ✓ Khách hàng tự trải nghiệm làm nông tại vườn
                      </p>
                    </div>
                    <p className="text-xs font-bold text-brand-green mt-3">Miễn phí dịch vụ chăm sóc</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('ASSISTED')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedMode === 'ASSISTED'
                        ? 'border-brand-yellow bg-amber-50/70 ring-2 ring-brand-yellow/30'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50'
                    }`}
                  >
                    <p className="font-heading text-sm font-bold text-brand-dark">Assisted-Growing</p>
                    <p className="text-xs text-stone-500 mt-1">Đội ngũ Farmely chăm sóc trọn gói hàng ngày</p>
                    <div className="mt-2.5 space-y-1 text-[11px] text-stone-600 border-t border-brand-border/40 pt-2">
                      <p className="flex items-center gap-1 font-medium text-emerald-800">
                        ✓ Chuyên gia phụ trách: ThS. Nguyễn Hoàng Nam (Quy trình VietGAP)
                      </p>
                      <p className="text-amber-900 font-medium">
                        ✓ Công nhân phụ trách (CVLĐ): Phân công cố định (Tưới, nhổ cỏ 2 ca/ngày)
                      </p>
                    </div>
                    <p className="text-xs font-bold text-brand-green mt-3">+{plot.careServicePrice.toLocaleString('vi-VN')} đ/tháng</p>
                  </button>
                </div>
              </div>

              {/* Rental Duration */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-brand-dark">
                  2. Thời Hạn Thuê Thửa Đất
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRentalMonths(m)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        rentalMonths === m
                          ? 'border-brand-green bg-brand-green text-white font-black'
                          : 'border-brand-border bg-white text-brand-dark hover:bg-brand-cream'
                      }`}
                    >
                      <span className="text-sm font-bold block">{m} Tháng</span>
                      <span className="text-[10px] opacity-80">{m >= 6 ? 'Ưu đãi' : 'Tiêu chuẩn'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-brand-dark">
                  3. Phương Thức Thanh Toán
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      paymentMethod === 'VIETQR'
                        ? 'border-brand-green bg-emerald-50/60 ring-2 ring-brand-green/20'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-brand-green" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-brand-dark">Chuyển khoản VietQR</p>
                      <p className="text-[10px] text-stone-500">Quét mã ngân hàng 24/7</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      paymentMethod === 'CARD'
                        ? 'border-brand-green bg-emerald-50/60 ring-2 ring-brand-green/20'
                        : 'border-brand-border bg-white hover:bg-brand-cream/50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-brand-green" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-brand-dark">Thẻ Quốc Tế / Nội Địa</p>
                      <p className="text-[10px] text-stone-500">Visa, Mastercard, ATM</p>
                    </div>
                  </button>
                </div>
              </div>

            </div>

            {/* Right 5 cols: Order Summary & Checkout */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-elevated space-y-6 sticky top-28">
                <div className="border-b border-brand-border/60 pb-4">
                  <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">
                    Đơn Đặt Thuê Thửa Đất
                  </span>
                  <h3 className="text-xl font-heading font-black text-brand-dark mt-1">
                    Tổng Kết Chi Phí
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Giá thuê đất ({plot.area} x {rentalMonths} tháng):</span>
                    <strong className="text-brand-dark">{subtotalPlot.toLocaleString('vi-VN')} đ</strong>
                  </div>

                  <div className="flex justify-between text-stone-600">
                    <span>Dịch vụ canh tác ({selectedMode === 'ASSISTED' ? 'Trọn gói' : 'Tự chăm sóc'} x {rentalMonths} tháng):</span>
                    <strong className="text-brand-dark">{subtotalCare.toLocaleString('vi-VN')} đ</strong>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-brand-border text-base font-black text-brand-green">
                    <span>Tổng thanh toán 100% Upfront:</span>
                    <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-cream/60 border border-brand-border text-[11px] text-stone-600 space-y-1">
                  <p className="font-bold text-brand-dark flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
                    Chính sách hoàn tiền hợp đồng:
                  </p>
                  <p>• Hoàn 80% khi hủy trước ngày bắt đầu 3 ngày.</p>
                  <p>• Hoàn 50% khi hủy trong vòng 3 ngày trước ngày bắt đầu.</p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full uppercase font-black tracking-wider text-sm shadow-yellow-glow"
                  onClick={handleConfirmBooking}
                  loading={isProcessing}
                >
                  XÁC NHẬN THANH TOÁN & THUÊ ĐẤT
                </Button>

                <p className="text-[11px] text-center text-brand-muted">
                  Bằng việc bấm xác nhận, bạn đồng ý với Điều khoản thuê đất Farmely và quy chuẩn canh tác VietGAP.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* VietQR Payment Pop-up Modal */}
      <VietQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        qrData={qrData}
        onPaymentSuccess={handlePaymentSuccess}
        plotInfo={plot}
        totalAmount={totalAmount}
      />

      {/* Card Payment Pop-up Modal */}
      <CardPaymentModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        totalAmount={totalAmount}
        plotInfo={plot}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <Footer />
    </div>
  );
}
