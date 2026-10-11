import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  ExternalLink
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
  const [countdown, setCountdown] = useState(15 * 60);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(15 * 60);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

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

  const handleConfirmPaid = async () => {
    setIsConfirming(true);
    try {
      if (qrData?.transactionId) {
        await fetch(`http://localhost:8085/api/v1/payments/${qrData.transactionId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (err) {
      console.warn('Backend confirmation warning:', err);
    } finally {
      setIsConfirming(false);
      if (onPaymentSuccess) {
        onPaymentSuccess(qrData);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-stone-900/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scale-up">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-brand-green to-emerald-900 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-yellow text-brand-dark flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Chuẩn Napas 24/7
            </span>
            <div className="flex items-center gap-1 text-xs text-emerald-200 font-mono">
              <Clock className="w-3.5 h-3.5 text-brand-yellow animate-pulse" />
              <span>Hết hạn sau: <strong>{formattedCountdown}</strong></span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
            Quét Mã VietQR Thanh Toán
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Mở app ngân hàng bất kỳ để quét mã và thanh toán tự động
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* QR Image Display */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-500 shadow-md">
              <img
                src={qrData.qrImageUrl}
                alt="Mã QR thanh toán VietQR"
                className="w-56 h-auto sm:w-64 object-contain rounded-xl"
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-2 text-center">
              Mã QR tự động điền sẵn <strong>số tiền</strong> và <strong>nội dung chuyển khoản</strong>
            </p>
          </div>

          {/* Amount Box */}
          <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 text-center">
            <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider block">
              Tổng số tiền cần thanh toán
            </span>
            <div className="text-2xl sm:text-3xl font-heading font-black text-brand-green mt-0.5">
              {(Number(qrData.amount) || totalAmount || 0).toLocaleString('vi-VN')} đ
            </div>
            {(serviceInfo || plotInfo) && (
              <span className="text-xs text-stone-600 block mt-1 font-medium">
                {serviceInfo ? (
                  <>Đăng ký dịch vụ: <strong className="text-emerald-700">{serviceInfo.name}</strong> {plotInfo ? <>• Thửa: <strong>{plotInfo.name || plotInfo.code}</strong></> : null}</>
                ) : (
                  <>Đặt thuê thửa đất: <strong>{plotInfo.code} - {plotInfo.name}</strong></>
                )}
              </span>
            )}
          </div>

          {/* Bank Transfer Details with Copy Buttons */}
          <div className="space-y-2.5 bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
              <span className="text-stone-500">Ngân hàng thụ hưởng:</span>
              <strong className="text-stone-800 font-semibold">{qrData.bankName || 'VietinBank (ICB)'}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
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

            <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
              <span className="text-stone-500">Tên người thụ hưởng:</span>
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
              <span>Tôi đã chuyển khoản thành công</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs text-stone-500 font-bold hover:text-stone-800 transition-colors"
            >
              Hủy bỏ / Quay lại chọn phương thức khác
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
