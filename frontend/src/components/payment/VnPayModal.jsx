import React, { useState } from 'react';
import {
  X,
  ShieldCheck
} from 'lucide-react';
import Button from '../common/Button';

export default function VnPayModal({
  isOpen,
  onClose,
  totalAmount,
  plotInfo,
  serviceInfo,
  contractId,
  additionalPayload,
  onPaymentSuccess
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentAmount = totalAmount || (serviceInfo ? serviceInfo.price : 1800000);

  // Xử lý khi nhấn nút "THANH TOÁN"
  const handlePayment = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        amount: currentAmount,
        orderInfo: serviceInfo
          ? `Thanh toan dich vu ${serviceInfo.name}`
          : `Thanh toan thue dat ${plotInfo?.code || ''}`,
        contractId: contractId || null,
        serviceId: serviceInfo?.id || null,
        serviceName: serviceInfo?.name || null,
        plotCode: plotInfo?.code || null,
        bankCode: '', // Để trống để VNPay hiển thị đầy đủ các lựa chọn trên cổng
        returnUrl: `${window.location.origin}/payment/vnpay-return`,
        ...additionalPayload
      };

      const res = await fetch('http://localhost:8085/api/v1/payments/vnpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Không thể kết nối đến cổng thanh toán VNPAY');
      }

      const data = await res.json();
      if (data?.data?.paymentUrl) {
        // Chuyển hướng trực tiếp sang cổng thanh toán VNPay
        window.location.href = data.data.paymentUrl;
      } else {
        throw new Error('Không nhận được liên kết thanh toán từ VNPAY');
      }
    } catch (err) {
      console.error('Lỗi khởi tạo thanh toán VNPay:', err);
      setErrorMessage(err.message || 'Đã có lỗi xảy ra khi tạo giao dịch thanh toán.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scale-up">
        
        {/* Header - Màu xanh lá phẳng (Không gradient) */}
        <div className="bg-[#294C3B] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-emerald-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> VNPAY PAYMENT GATEWAY
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
            Cổng Thanh Toán VNPAY
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            Nhấn Thanh Toán để chuyển sang cổng VNPAY
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">

          {/* Amount & Service Summary - Nền phẳng (Không gradient) */}
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-center">
            <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider block">
              Tổng tiền thanh toán
            </span>
            <div className="text-2xl sm:text-3xl font-heading font-black text-[#294C3B] mt-1">
              {(Number(currentAmount) || 0).toLocaleString('vi-VN')} đ
            </div>
            {(serviceInfo || plotInfo) && (
              <span className="text-xs text-stone-600 block mt-2 font-medium">
                {serviceInfo ? (
                  <>Dịch vụ: <strong className="text-[#294C3B]">{serviceInfo.name}</strong> {plotInfo ? <>• Thửa: <strong>{plotInfo.name || plotInfo.code}</strong></> : null}</>
                ) : (
                  <>Đặt thuê thửa: <strong>{plotInfo?.code} - {plotInfo?.name}</strong></>
                )}
              </span>
            )}
          </div>

          {/* Error Notice if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Primary Action Button: "THANH TOÁN" - Màu xanh lá phẳng (Không gradient) */}
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onClick={handlePayment}
              className="w-full font-black uppercase tracking-wider text-sm shadow-md bg-[#294C3B] hover:bg-[#1f3a2d] text-white border-0 py-3.5 flex items-center justify-center transition-colors"
            >
              <span>THANH TOÁN</span>
            </Button>
          </div>

          {/* Cancel button */}
          <div className="pt-0 text-center">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-1 text-xs text-stone-500 font-bold hover:text-[#294C3B] transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
