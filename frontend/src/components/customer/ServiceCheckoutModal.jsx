import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, CreditCard, LockKeyhole, MapPin, X } from 'lucide-react';
import { customerServices, formatServicePrice } from '../../data/customerServices';

const slots = [
  'Sáng mai · 08:00–10:00',
  'Chiều mai · 14:00–16:00',
  'Sáng ngày kia · 08:00–10:00',
];

export default function ServiceCheckoutModal({ open, initialServiceId, lockedPlot, plots, onClose, onComplete }) {
  const compact = Boolean(lockedPlot);
  const [step, setStep] = useState(compact ? 'service' : 'plot');
  const [serviceId, setServiceId] = useState(initialServiceId || customerServices[0].id);
  const [plotCode, setPlotCode] = useState(lockedPlot?.code || plots[0]?.code || '');
  const [time, setTime] = useState(compact ? 'Farmely liên hệ xác nhận thời gian' : slots[0]);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('QR');

  useEffect(() => {
    if (!open) return;
    setServiceId(initialServiceId || customerServices[0].id);
    setPlotCode(lockedPlot?.code || plots[0]?.code || '');
    setTime(compact ? 'Farmely liên hệ xác nhận thời gian' : slots[0]);
    setStep(compact ? 'service' : 'plot');
    setNote('');
    setPaymentMethod('QR');
  }, [open, initialServiceId, lockedPlot, compact, plots]);

  const service = useMemo(() => customerServices.find(item => item.id === serviceId) || customerServices[0], [serviceId]);
  const plot = plots.find(item => item.code === plotCode) || lockedPlot || plots[0];
  if (!open) return null;

  const pay = event => {
    event.preventDefault();
    onComplete({ service, plot, time, note, paymentMethod });
  };

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-dark/65 p-4" role="dialog" aria-modal="true" aria-labelledby="service-checkout-title" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-brand-border bg-white px-5 py-4 sm:px-7">
        <div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Đặt dịch vụ tại vườn</p><h2 id="service-checkout-title" className="mt-1 font-heading text-2xl font-black text-brand-dark">{compact ? `Dịch vụ cho ${lockedPlot.code}` : 'Hoàn tất yêu cầu dịch vụ'}</h2></div>
        <button type="button" onClick={onClose} className="rounded-full border border-brand-border p-2 text-brand-muted hover:bg-brand-cream" aria-label="Đóng"><X size={17} /></button>
      </header>

      <div className="px-5 py-5 sm:px-7">
        <div className="mb-6 flex items-center gap-2 text-xs font-bold text-brand-muted">
          {(compact ? [['service','Chọn dịch vụ'],['payment','Thanh toán']] : [['plot','Chọn plot'],['time','Thời gian'],['payment','Thanh toán']]).map(([id, label], index, all) => <React.Fragment key={id}><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${step === id ? 'bg-brand-dark text-white' : 'bg-brand-cream text-brand-muted'}`}>{step !== id && ((compact ? ['service','payment'] : ['plot','time','payment']).indexOf(step) > index) && <Check size={12} />}{label}</span>{index < all.length - 1 && <span className="h-px flex-1 bg-brand-border" />}</React.Fragment>)}
        </div>

        {step === 'service' && <div><h3 className="font-heading text-lg font-black text-brand-dark">Chọn dịch vụ cần thêm</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{customerServices.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setServiceId(item.id)} className={`rounded-2xl border p-4 text-left transition ${serviceId === item.id ? 'border-brand-green bg-emerald-50 ring-2 ring-brand-green/15' : 'border-brand-border hover:border-brand-green/45'}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-green"><Icon size={20} /></span><strong className="mt-3 block text-brand-dark">{item.name}</strong><span className="mt-1 block text-xs leading-relaxed text-brand-muted">{item.description}</span><span className="mt-3 block text-sm font-black text-brand-green">{formatServicePrice(item.price)}</span></button>; })}</div><button type="button" onClick={() => setStep('payment')} className="mt-6 w-full rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Tiếp tục thanh toán</button></div>}

        {step === 'plot' && <div><h3 className="font-heading text-lg font-black text-brand-dark">Thực hiện tại plot nào?</h3><p className="mt-1 text-sm text-brand-muted">Dịch vụ đã chọn: <strong>{service.name}</strong></p><div className="mt-4 space-y-3">{plots.map(item => <button key={item.code} type="button" onClick={() => setPlotCode(item.code)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left ${plotCode === item.code ? 'border-brand-green bg-emerald-50 ring-2 ring-brand-green/15' : 'border-brand-border'}`}><img src={item.imageUrl} alt="" className="h-16 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><strong className="block text-brand-dark">{item.code} · {item.name}</strong><span className="mt-1 block text-xs text-brand-muted">{item.currentCrop || 'Chưa xuống giống'} · {item.area}</span></div>{plotCode === item.code && <Check className="text-brand-green" />}</button>)}</div><button type="button" onClick={() => setStep('time')} className="mt-6 w-full rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Chọn thời gian thực hiện</button></div>}

        {step === 'time' && <div><h3 className="font-heading text-lg font-black text-brand-dark">Chọn thời gian mong muốn</h3><div className="mt-4 grid gap-3 sm:grid-cols-3">{slots.map(slot => <button key={slot} type="button" onClick={() => setTime(slot)} className={`rounded-2xl border p-4 text-left text-sm font-bold ${time === slot ? 'border-brand-green bg-emerald-50 text-brand-dark ring-2 ring-brand-green/15' : 'border-brand-border text-brand-muted'}`}><CalendarDays size={18} className="mb-3 text-brand-green" />{slot}</button>)}</div><label className="mt-5 block text-sm font-semibold text-brand-dark">Ghi chú cho Farmely<textarea value={note} onChange={event => setNote(event.target.value)} rows="3" placeholder="Ví dụ: ưu tiên kiểm tra cây ở góc gần lối đi" className="mt-1 w-full resize-none rounded-xl border border-brand-border p-3 text-sm outline-none focus:border-brand-green" /></label><div className="mt-6 flex gap-2"><button type="button" onClick={() => setStep('plot')} className="inline-flex items-center gap-1 rounded-xl border border-brand-border px-4 py-3 text-sm font-bold text-brand-dark"><ChevronLeft size={16} /> Quay lại</button><button type="button" onClick={() => setStep('payment')} className="flex-1 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Tiếp tục thanh toán</button></div></div>}

        {step === 'payment' && <form onSubmit={pay}><div className="rounded-2xl bg-brand-cream p-4"><div className="flex items-center gap-2 text-sm font-bold text-brand-dark"><MapPin size={17} className="text-brand-green" /> {plot?.code} · {plot?.name}</div><div className="mt-3 flex items-start justify-between gap-4 border-t border-brand-border pt-3"><div><strong className="text-brand-dark">{service.name}</strong><p className="mt-1 text-xs text-brand-muted">{time}</p></div><strong className="shrink-0 text-brand-green">{formatServicePrice(service.price)}</strong></div></div><fieldset className="mt-5"><legend className="text-sm font-bold text-brand-dark">Phương thức thanh toán demo</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{[['QR','Quét mã QR'],['CARD','Thẻ nội địa'],['WALLET','Ví điện tử']].map(([id,label]) => <label key={id} className={`cursor-pointer rounded-xl border p-3 text-sm font-semibold ${paymentMethod === id ? 'border-brand-green bg-emerald-50' : 'border-brand-border'}`}><input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="mr-2 accent-brand-green" />{label}</label>)}</div></fieldset><p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900"><LockKeyhole size={15} className="mt-0.5 shrink-0" /> Đây là thanh toán mô phỏng cho bản demo. Sau khi xác nhận, Farmely tiếp nhận yêu cầu và tự phân công CVLĐ phù hợp.</p><div className="mt-6 flex gap-2"><button type="button" onClick={() => setStep(compact ? 'service' : 'time')} className="inline-flex items-center gap-1 rounded-xl border border-brand-border px-4 py-3 text-sm font-bold text-brand-dark"><ChevronLeft size={16} /> Quay lại</button><button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white"><CreditCard size={17} /> Thanh toán {formatServicePrice(service.price)}</button></div></form>}
      </div>
    </section>
  </div>;
}
