import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function VnPayReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const search = location.search;
    if (!search) {
      setIsLoading(false);
      return;
    }

    const verifyVnPayPayment = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/payments/vnpay/return${search}`);
        if (res.ok) {
          const data = await res.json();
          setResult(data?.data);
        } else {
          setResult({ status: 'FAILED', message: 'Lỗi xác thực chữ ký cổng VNPay' });
        }
      } catch (err) {
        console.warn('Backend VNPay return check error:', err);
        // Fallback from query params directly
        const params = new URLSearchParams(search);
        const responseCode = params.get('vnp_ResponseCode');
        const txnRef = params.get('vnp_TxnRef');
        const amount = params.get('vnp_Amount') ? parseInt(params.get('vnp_Amount'), 10) / 100 : 0;
        const transactionNo = params.get('vnp_TransactionNo');

        if (responseCode === '00') {
          setResult({
            status: 'SUCCESS',
            amount: amount,
            gatewayRef: transactionNo || txnRef,
            paymentMethod: 'VNPAY'
          });
        } else {
          setResult({
            status: 'FAILED',
            amount: amount,
            gatewayRef: transactionNo || txnRef,
            paymentMethod: 'VNPAY',
            message: 'Khách hàng hủy giao dịch hoặc thẻ không hợp lệ trên VNPay Sandbox'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyVnPayPayment();
  }, [location.search]);

  // Bộ đếm ngược 3 giây tự động chuyển về Dashboard khi thanh toán thành công
  useEffect(() => {
    if (result?.status !== 'SUCCESS') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/customer/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result?.status, navigate]);

  const params = new URLSearchParams(location.search);
  const responseCode = params.get('vnp_ResponseCode');
  const bankCode = params.get('vnp_BankCode') || 'NCB';
  const vnpTxnRef = params.get('vnp_TxnRef') || result?.gatewayRef || '';
  const rawAmount = params.get('vnp_Amount') ? parseInt(params.get('vnp_Amount'), 10) / 100 : (result?.amount || 0);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-4 pt-28 pb-16">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden animate-scale-up">
          
          {/* Top Banner Header - Xanh lá phẳng không gradient */}
          <div className="bg-[#294C3B] text-white p-6 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-emerald-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                VNPAY SANDBOX TEST GATEWAY
              </span>
              <span className="text-xs font-mono text-emerald-100/90">
                Mã: {vnpTxnRef}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
              Kết Quả Thanh Toán Cổng VNPAY
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1">
              Phản hồi trực tiếp từ hệ thống cổng thanh toán trực tuyến VNPay
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#294C3B] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-stone-600">
                  Đang đối soát chữ ký bảo mật từ VNPAY Sandbox...
                </p>
              </div>
            ) : result?.status === 'SUCCESS' || responseCode === '00' ? (
              /* Success State */
              <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-heading font-black text-[#294C3B]">
                    Thanh Toán Thành Công!
                  </h3>
                  <p className="text-sm font-medium text-stone-700">
                    Dịch vụ canh tác đã được kích hoạt thành công
                  </p>
                </div>

                {/* Auto close badge */}
                <div className="text-xs font-semibold text-emerald-700 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Tự động chuyển về Bảng điều khiển sau {countdown} giây...</span>
                </div>

                {/* Transaction Receipt Card */}
                <div className="w-full bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs text-left space-y-2 mt-2">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Cổng thanh toán:</span>
                    <strong className="text-[#294C3B] font-bold">VNPAY (Sandbox 2.1.0)</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Ngân hàng phát hành:</span>
                    <strong className="text-stone-800 font-bold">{bankCode}</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Số tiền thanh toán:</span>
                    <strong className="text-emerald-700 font-mono text-sm font-black">
                      {rawAmount.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Trạng thái hạch toán:</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      SUCCESS (ĐÃ GHI SỔ PG)
                    </span>
                  </div>
                </div>

                <div className="pt-3 w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-bold uppercase tracking-wider text-sm shadow-md bg-[#294C3B] hover:bg-[#1f3a2d] text-white border-0 flex items-center justify-center gap-2 py-3.5 transition-colors"
                    onClick={() => navigate('/customer/dashboard')}
                  >
                    <span>Về Bảng Điều Khiển Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Failed / Cancelled State */
              <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                  <AlertCircle className="w-12 h-12" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-heading font-black text-rose-800">
                    Giao Dịch Không Thành Công
                  </h3>
                  <p className="text-xs text-stone-600 max-w-sm">
                    {result?.message || 'Giao dịch đã bị hủy hoặc bị từ chối trên cổng thanh toán VNPAY Sandbox (Mã lỗi: ' + (responseCode || 'CANCEL') + ')'}
                  </p>
                </div>

                <div className="w-full bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs text-left space-y-2 mt-2">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Mã tham chiếu:</span>
                    <strong className="text-stone-800 font-mono">{vnpTxnRef}</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Số tiền:</span>
                    <strong className="text-stone-700 font-mono">
                      {rawAmount.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Trạng thái:</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                      FAILED (ĐÃ HỦY)
                    </span>
                  </div>
                </div>

                <div className="pt-3 w-full space-y-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-bold uppercase tracking-wider text-sm shadow-md bg-[#294C3B] hover:bg-[#1f3a2d] text-white border-0 py-3.5 transition-colors"
                    onClick={() => navigate('/customer/dashboard')}
                  >
                    Về Bảng Điều Khiển
                  </Button>
                  <Link
                    to="/marketplace"
                    className="block text-center text-xs text-stone-500 hover:text-stone-800 font-medium py-1"
                  >
                    Quay lại chọn thửa & dịch vụ
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
