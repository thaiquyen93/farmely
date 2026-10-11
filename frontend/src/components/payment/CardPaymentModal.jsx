import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Button from '../common/Button';

export default function CardPaymentModal({
  isOpen,
  onClose,
  totalAmount,
  plotInfo,
  serviceInfo,
  chargeEndpoint,
  additionalPayload,
  onPaymentSuccess
}) {
  const [cardType, setCardType] = useState('VISA'); // 'VISA' | 'MASTERCARD' | 'NAPAS_ATM'
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format expiry date MM/YY
  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiryDate(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiryDate(raw);
    }
  };

  // Quick fill test card
  const fillDemoCard = (type) => {
    setErrorMessage('');
    if (type === 'VISA') {
      setCardType('VISA');
      setCardNumber('4242 4242 4242 4242');
      setCardHolder('NGUYEN VAN A');
      setExpiryDate('12/28');
      setCvv('123');
    } else if (type === 'MASTERCARD') {
      setCardType('MASTERCARD');
      setCardNumber('5412 7534 8899 1234');
      setCardHolder('TRAN THI MAI');
      setExpiryDate('09/27');
      setCvv('888');
    } else {
      setCardType('NAPAS_ATM');
      setCardNumber('9704 3668 1234 5678');
      setCardHolder('NGUYEN VAN A');
      setExpiryDate('08/25');
      setCvv('999');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (cardNumber.replace(/\s/g, '').length < 12) {
      setErrorMessage('Vui lòng nhập đầy đủ số thẻ thanh toán.');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMessage('Vui lòng nhập tên chủ thẻ.');
      return;
    }
    if (!expiryDate || expiryDate.length < 4) {
      setErrorMessage('Vui lòng nhập ngày hết hạn (MM/YY).');
      return;
    }

    setIsProcessing(true);
    try {
      const endpoint = chargeEndpoint || 'http://localhost:8085/api/v1/payments/card/charge';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolder: cardHolder.trim().toUpperCase(),
          expiryDate,
          cvv,
          cardType,
          paymentMethod: cardType,
          plotCode: plotInfo?.code || 'PLT',
          serviceName: serviceInfo?.name,
          serviceId: serviceInfo?.id,
          ...additionalPayload
        })
      });

      const data = await response.json();
      if (data?.success) {
        if (onPaymentSuccess) {
          onPaymentSuccess(data.data);
        }
        return;
      } else {
        setErrorMessage(data?.message || 'Không thể thực hiện thanh toán qua thẻ.');
        return;
      }
    } catch (err) {
      console.error('Backend payment-service error:', err);
      setErrorMessage('Lỗi kết nối cổng thanh toán. Vui lòng thử lại!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scale-up">
        
        {/* Header */}
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
              <ShieldCheck className="w-3 h-3" /> Bảo Mật PCI-DSS 256-bit
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
            Thanh Toán Thẻ Quốc Tế / Nội Địa
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Hỗ trợ thẻ Visa, Mastercard và thẻ ATM Napas tất cả các ngân hàng Việt Nam
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* Order Summary Item Banner */}
          {(serviceInfo || plotInfo) && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Nội dung thanh toán</span>
                <span className="font-heading font-black text-brand-dark text-sm block">
                  {serviceInfo ? serviceInfo.name : `Thuê thửa: ${plotInfo?.code} - ${plotInfo?.name}`}
                </span>
                {serviceInfo && plotInfo && (
                  <span className="text-[11px] text-stone-500 block mt-0.5">Thửa áp dụng: <strong>{plotInfo?.name || plotInfo?.code}</strong></span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Tổng tiền</span>
                <span className="font-heading font-black text-emerald-700 text-base">
                  {(totalAmount || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          )}

          {/* Card Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-stone-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setCardType('VISA')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                cardType === 'VISA'
                  ? 'bg-white text-brand-dark shadow-sm ring-1 ring-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Visa Card
            </button>
            <button
              type="button"
              onClick={() => setCardType('MASTERCARD')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                cardType === 'MASTERCARD'
                  ? 'bg-white text-brand-dark shadow-sm ring-1 ring-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Mastercard
            </button>
            <button
              type="button"
              onClick={() => setCardType('NAPAS_ATM')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                cardType === 'NAPAS_ATM'
                  ? 'bg-white text-brand-dark shadow-sm ring-1 ring-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              ATM Nội Địa
            </button>
          </div>

          {/* Virtual 3D Credit Card Preview */}
          <div className={`p-5 rounded-2xl text-white shadow-xl relative overflow-hidden transition-all duration-300 ${
            cardType === 'VISA'
              ? 'bg-gradient-to-tr from-sky-900 via-blue-800 to-indigo-900'
              : cardType === 'MASTERCARD'
              ? 'bg-gradient-to-tr from-stone-900 via-red-950 to-orange-950'
              : 'bg-gradient-to-tr from-emerald-900 via-teal-800 to-stone-900'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <span className="font-mono text-xs tracking-widest uppercase font-bold text-stone-300">
                Farmely Secure Pay
              </span>
              <span className="font-heading font-black text-sm tracking-wider uppercase px-2 py-0.5 rounded bg-white/20">
                {cardType === 'NAPAS_ATM' ? 'NAPAS' : cardType}
              </span>
            </div>

            <div className="font-mono text-lg sm:text-xl tracking-widest font-black mb-4 select-none">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between items-end text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-semibold">Chủ thẻ</span>
                <span className="font-mono font-bold tracking-wider uppercase">
                  {cardHolder || 'HO VA TEN'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-semibold">Hết hạn</span>
                <span className="font-mono font-bold tracking-wider">
                  {expiryDate || 'MM/YY'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Card Number */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Số Thẻ Ngân Hàng
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green font-mono text-sm"
                  maxLength={19}
                  required
                />
                <CreditCard className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
              </div>
            </div>

            {/* Card Holder */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Tên Chủ Thẻ (In không dấu trên thẻ)
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green font-mono text-sm uppercase"
                required
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Ngày Hết Hạn
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green font-mono text-sm"
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mã Bảo Mật (CVV/CVC)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.slice(0, 4))}
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green font-mono text-sm"
                    maxLength={4}
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isProcessing}
                className="w-full font-bold uppercase tracking-wider text-sm shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 mr-2 text-brand-dark" />
                <span>Thanh Toán {(totalAmount || 0).toLocaleString('vi-VN')} đ</span>
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-stone-500 font-bold hover:text-stone-800 transition-colors"
              >
                Hủy bỏ / Quay lại
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
