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
  pendingBooking,
  pendingRenewal,
  onPaymentSuccess
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentAmount = totalAmount || (serviceInfo ? serviceInfo.price : 1800000);
  const isRenewal = Boolean(pendingRenewal || additionalPayload?.isRenewal);

  // Xử lý khi nhấn nút "THANH TOÁN"
  const handlePayment = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (pendingRenewal) {
        localStorage.setItem('farmely_pending_vnpay_renewal', JSON.stringify(pendingRenewal));
        localStorage.removeItem('farmely_pending_vnpay_booking');
        localStorage.removeItem('farmely_pending_vnpay_service');
      } else if (pendingBooking) {
        localStorage.setItem('farmely_pending_vnpay_booking', JSON.stringify(pendingBooking));
        localStorage.removeItem('farmely_pending_vnpay_renewal');
        localStorage.removeItem('farmely_pending_vnpay_service');
      }

      // Đảm bảo serviceId luôn là kiểu số Integer hoặc null
      let rawServiceId = additionalPayload?.serviceId ?? serviceInfo?.serviceId ?? serviceInfo?.id;
      let resolvedServiceId = null;
      if (rawServiceId !== null && rawServiceId !== undefined) {
        if (typeof rawServiceId === 'number' && !isNaN(rawServiceId)) {
          resolvedServiceId = rawServiceId;
        } else {
          const parsed = parseInt(String(rawServiceId).replace(/\D/g, ''), 10);
          resolvedServiceId = !isNaN(parsed) && parsed > 0 ? parsed : 1;
        }
      }

      const resolvedPlotCode = plotInfo?.plotCode || plotInfo?.mapPlotId || plotInfo?.code || (additionalPayload?.plotCode ? String(additionalPayload.plotCode).replace(/^PLOT-/i, '') : null);

      const payload = {
        amount: currentAmount,
        orderInfo: serviceInfo
          ? `Thanh toan dich vu ${serviceInfo.name}`
          : isRenewal
            ? `Thanh toan gia han vu mua ${resolvedPlotCode || plotInfo?.name || ''}`
            : `Thanh toan thue dat ${plotInfo?.code || plotInfo?.name || ''}`,
        contractId: contractId || null,
        bankCode: '', // Để trống để VNPay hiển thị đầy đủ các lựa chọn trên cổng
        returnUrl: `${window.location.origin}/payment/vnpay-return`,
        ...additionalPayload,
        serviceId: serviceInfo ? resolvedServiceId : null,
        serviceName: serviceInfo ? (serviceInfo?.name || additionalPayload?.serviceName || null) : null,
        plotCode: serviceInfo ? resolvedPlotCode : null,
        rentalId: plotInfo?.rentalId || plotInfo?.rental_id || additionalPayload?.rentalId || 1
      };

      if (serviceInfo) {
        localStorage.setItem('farmely_pending_vnpay_service', JSON.stringify({
          serviceId: resolvedServiceId,
          serviceName: serviceInfo.name,
          amount: currentAmount,
          plotCode: resolvedPlotCode,
          plotName: plotInfo?.name || plotInfo?.code || 'Thửa đất đã chọn',
          rentalId: payload.rentalId,
          scheduledDate: payload.scheduledDate,
          notes: payload.notes
        }));
        localStorage.removeItem('farmely_pending_vnpay_renewal');
      }
      const endpoint = window.location.port === '3000' 
        ? '/api/v1/payments/vnpay/create' 
        : 'http://localhost:8085/api/v1/payments/vnpay/create';

      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (fetchErr) {
        // Fallback to direct port 8085 if proxy or direct fails
        const fallbackUrl = endpoint.startsWith('http') 
          ? '/api/v1/payments/vnpay/create' 
          : 'http://localhost:8085/api/v1/payments/vnpay/create';
        res = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        let errorDetail = 'Không thể kết nối đến cổng thanh toán VNPAY';
        try {
          const errBody = await res.json();
          if (errBody?.message) errorDetail = errBody.message;
        } catch (_) {}
        throw new Error(errorDetail);
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
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
                ) : isRenewal ? (
                  <>Gia hạn vụ mùa: <strong className="text-[#294C3B]">{plotInfo?.name || plotInfo?.code}</strong></>
                ) : (
                  <>Đặt thuê thửa: <strong>{plotInfo?.code} - {plotInfo?.name}</strong></>
                )}
              </span>
            )}
          </div>

          {/* Sandbox Test Card Credentials Guide */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 text-left">
            <div className="flex items-center justify-between font-bold text-emerald-950">
              <span>Thông tin thẻ Test VNPAY Sandbox (NCB):</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">SANDBOX</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-stone-700 pt-1 border-t border-emerald-200/60">
              <p>• Ngân hàng: <strong className="font-mono text-brand-green font-bold">NCB</strong></p>
              <p>• Số thẻ: <strong className="font-mono text-brand-green font-bold">9704198526191432198</strong></p>
              <p>• Tên chủ thẻ: <strong className="font-mono text-brand-green font-bold">NGUYEN VAN A</strong></p>
              <p>• Ngày phát hành: <strong className="font-mono text-brand-green font-bold">07/15</strong></p>
              <p className="col-span-2">• Mật khẩu OTP gửi về: <strong className="font-mono text-emerald-700 font-bold">123456</strong></p>
            </div>
          </div>

          {/* Error Notice if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePayment}
              className="w-full font-heading font-black uppercase tracking-wider text-xs sm:text-sm shadow-md bg-[#294C3B] hover:bg-[#1f3a2d] text-white border-0 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>ĐANG KẾT NỐI VNPAY...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  <span>CHUYỂN SANG CỔNG VNPAY THANH TOÁN</span>
                </>
              )}
            </button>

            {onPaymentSuccess && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await onPaymentSuccess(contractId);
                  } catch (e) {
                    console.error('Instant payment error:', e);
                    setErrorMessage('Không thể kích hoạt tự động. Vui lòng thử lại!');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full font-heading font-bold uppercase tracking-wider text-xs shadow-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <span>⚡ XÁC NHẬN THANH TOÁN & KÍCH HOẠT THỬA NGAY</span>
              </button>
            )}
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
