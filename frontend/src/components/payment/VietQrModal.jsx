import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import Button from '../common/Button';

export default function VietQrModal({
  isOpen,
  onClose,
  qrData,
  onPaymentSuccess,
  plotInfo,
  serviceInfo,
  totalAmount
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('PENDING'); // 'PENDING' | 'SUCCESS' | 'FAILED'
  const [countdown, setCountdown] = useState(15 * 60);
  const [successCountdown, setSuccessCountdown] = useState(3);
  const pollingRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // Stable references for callbacks to prevent re-render cancellation
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const onCloseRef = useRef(onClose);
  const qrDataRef = useRef(qrData);

  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
    onCloseRef.current = onClose;
    qrDataRef.current = qrData;
  });

  // Khởi tạo countdown và reset trạng thái mỗi khi mở modal
  useEffect(() => {
    if (!isOpen) return;
    setCountdown(15 * 60);
    setPaymentStatus('PENDING');
    setSuccessCountdown(3);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isOpen]);

  // Khi hết thời gian đếm ngược: tự động cập nhật status sang FAILED trong Database
  useEffect(() => {
    if (countdown === 0 && paymentStatus === 'PENDING' && qrData?.transactionId) {
      setPaymentStatus('FAILED');
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      fetch(`http://localhost:8085/api/v1/payments/${qrData.transactionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch((err) => console.warn('Hết hạn thanh toán, lỗi cập nhật FAILED:', err));
    }
  }, [countdown, paymentStatus, qrData?.transactionId]);

  // Tự động kiểm tra trạng thái giao dịch từ hệ thống mỗi 2.5s
  useEffect(() => {
    if (!isOpen || !qrData?.transactionId || paymentStatus !== 'PENDING') return;

    const checkTransactionStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8085/api/v1/payments/${qrData.transactionId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.status === 'SUCCESS') {
            setPaymentStatus('SUCCESS');
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        }
      } catch (err) {
        // Fallback silently if network hiccup
      }
    };

    pollingRef.current = setInterval(checkTransactionStatus, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, qrData?.transactionId, paymentStatus]);

  // Khi thanh toán thành công: dừng countdown 15p, đếm ngược đúng 3 giây và tự động đóng modal
  useEffect(() => {
    if (paymentStatus !== 'SUCCESS') return;

    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    setSuccessCountdown(3);

    const closeTimer = setInterval(() => {
      setSuccessCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(closeTimer);
          if (onPaymentSuccessRef.current) {
            onPaymentSuccessRef.current(qrDataRef.current);
          }
          if (onCloseRef.current) {
            onCloseRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(closeTimer);
  }, [paymentStatus]);

  if (!isOpen || !qrData) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const copyToClipboard = (text, fieldName) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Xác nhận thủ công nếu người dùng bấm nút
  const handleConfirmPaid = async () => {
    setIsConfirming(true);
    try {
      if (qrData?.transactionId) {
        await fetch(`http://localhost:8085/api/v1/payments/${qrData.transactionId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      }
      setPaymentStatus('SUCCESS');
    } catch (err) {
      console.warn('Backend confirmation warning:', err);
      setPaymentStatus('SUCCESS');
    } finally {
      setIsConfirming(false);
    }
  };

  // Hủy bỏ giao dịch và chuyển trạng thái sang FAILED trong Database
  const handleCancelPayment = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (qrData?.transactionId && paymentStatus === 'PENDING') {
      try {
        await fetch(`http://localhost:8085/api/v1/payments/${qrData.transactionId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.warn('Backend cancel payment error:', err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-stone-900/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scale-up">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-brand-green to-emerald-900 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={handleCancelPayment}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-emerald-200 font-mono">
            {paymentStatus === 'SUCCESS' ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Đang hoàn tất giao dịch... ({successCountdown}s)
              </span>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-brand-yellow animate-pulse" />
                <span>Hết hạn sau: <strong>{formattedCountdown}</strong></span>
              </>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
            Quét Mã VietQR Thanh Toán
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Mở app ngân hàng bất kỳ để quét mã và thanh toán tự động
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {paymentStatus === 'SUCCESS' ? (
            /* Success State - Hiện 3 giây rồi tự động ẩn */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-heading font-black text-emerald-800">
                Thanh Toán Thành Công!
              </h3>
              <p className="text-sm font-medium text-stone-700 max-w-sm">
                Dịch vụ canh tác đã được kích hoạt thành công
              </p>
              <div className="pt-2 text-xs font-semibold text-emerald-700 flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Tự động đóng sau {successCountdown} giây...</span>
              </div>
            </div>
          ) : paymentStatus === 'FAILED' ? (
            /* Expired / Failed State - Tự động chuyển FAILED khi hết hạn */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-heading font-black text-rose-800">
                Giao Dịch Đã Hết Hạn
              </h3>
              <p className="text-xs text-stone-600 max-w-sm">
                Thời gian thanh toán đã kết thúc. Giao dịch đã được hủy (FAILED). Vui lòng thực hiện lại nếu bạn muốn tiếp tục.
              </p>
              <div className="pt-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full font-bold text-xs"
                >
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Real-time Status Radar: Đang xác nhận giao dịch */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                  </span>
                  <span className="font-medium">Đang xác nhận giao dịch...</span>
                </div>
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              </div>

              {/* QR Image Display */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-500 shadow-md">
                  <img
                    src={qrData.qrImageUrl}
                    alt="Mã QR thanh toán VietQR"
                    className="w-52 h-auto sm:w-60 object-contain rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-2 text-center">
                  Mã QR tự động điền sẵn <strong>số tiền</strong> và <strong>nội dung chuyển khoản</strong>
                </p>
              </div>

              {/* Amount Box */}
              <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200 text-center">
                <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider block">
                  Tổng số tiền cần thanh toán
                </span>
                <div className="text-2xl sm:text-3xl font-heading font-black text-brand-green mt-0.5">
                  {(Number(qrData.amount) || totalAmount || 0).toLocaleString('vi-VN')} đ
                </div>
                {(serviceInfo || plotInfo) && (
                  <span className="text-xs text-stone-600 block mt-1 font-medium">
                    {serviceInfo ? (
                      <>Dịch vụ: <strong className="text-emerald-700">{serviceInfo.name}</strong> {plotInfo ? <>• Thửa: <strong>{plotInfo.name || plotInfo.code}</strong></> : null}</>
                    ) : (
                      <>Đặt thuê thửa: <strong>{plotInfo.code} - {plotInfo.name}</strong></>
                    )}
                  </span>
                )}
              </div>

              {/* Bank Transfer Details with Copy Buttons */}
              <div className="space-y-2 bg-stone-50 rounded-2xl p-3.5 border border-stone-200 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/80">
                  <span className="text-stone-500">Ngân hàng thụ hưởng:</span>
                  <strong className="text-stone-800 font-semibold">{qrData.bankName || 'VietinBank (ICB)'}</strong>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/80">
                  <span className="text-stone-500">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-stone-900 font-mono text-sm font-bold">{qrData.accountNo}</strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(qrData.accountNo, 'accountNo')}
                      className="p-1 rounded text-stone-500 hover:text-brand-green hover:bg-emerald-50 transition-colors"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'accountNo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/80">
                  <span className="text-stone-500">Người thụ hưởng:</span>
                  <strong className="text-stone-900 font-bold uppercase">{qrData.accountName}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-emerald-800 font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {qrData.description}
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(qrData.description, 'description')}
                      className="p-1 rounded text-stone-500 hover:text-brand-green hover:bg-emerald-50 transition-colors"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'description' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleConfirmPaid}
                  loading={isConfirming}
                  className="w-full font-bold uppercase tracking-wider text-sm shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 text-brand-dark" />
                  <span>Tôi đã chuyển khoản xong</span>
                </Button>

                <button
                  type="button"
                  onClick={handleCancelPayment}
                  className="w-full py-2 text-xs text-stone-500 font-bold hover:text-stone-800 transition-colors"
                >
                  Hủy bỏ / Quay lại chọn phương thức khác
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
