import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Home, MapPin, Package, Scissors, Sprout, Truck, User } from 'lucide-react';
import Modal from '../common/Modal';

/** '18/11/2026' -> '2026-11-18' (định dạng của <input type="date">) */
export function toIsoDate(viDate) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(viDate || '').trim());
  if (!m) return '';
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** '2026-11-18' -> '18/11/2026' */
export function toViDate(isoDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Giai đoạn thu hoạch của 1 thửa, tính từ số ngày còn lại của vụ */
export function getHarvestStage(plot) {
  const daysLeft = Math.max((plot?.totalDays || 0) - (plot?.currentDay || 0), 0);
  if (daysLeft === 0) return { key: 'READY', label: 'Sẵn sàng thu hoạch', daysLeft, step: 2 };
  if (daysLeft <= 7) return { key: 'SOON', label: 'Sắp thu hoạch', daysLeft, step: 1 };
  return { key: 'GROWING', label: 'Đang chăm sóc', daysLeft, step: 0 };
}

/** Các hình thức nhận nông sản phụ thuộc mô hình canh tác của thửa */
export function getHarvestMethods(plot) {
  if (plot?.mode === 'Self-Growing') {
    return [
      { id: 'SELF_PICK', label: 'Tôi tự thu hoạch tại vườn', note: 'Farmely chuẩn bị dụng cụ, thùng và cân tại nông trại', icon: Scissors, needsAddress: false },
      { id: 'FARMELY_PICK_DELIVER', label: 'Thuê Farmely thu hoạch & giao tận nhà', note: 'Phí dịch vụ 50.000 đ, giao trong 24 giờ sau khi hái', icon: Truck, needsAddress: true }
    ];
  }
  return [
    { id: 'DELIVERY', label: 'Farmely thu hoạch & giao tận nhà', note: 'Đóng thùng bảo quản lạnh, giao trong 24 giờ sau khi hái', icon: Truck, needsAddress: true },
    { id: 'FARM_PICKUP', label: 'Tôi đến nông trại nhận', note: 'Nhận tại trạm đóng gói, có thể tham quan thửa của bạn', icon: Home, needsAddress: false }
  ];
}

const STEPS = ['Đang chăm sóc', 'Sắp thu hoạch', 'Thu hoạch', 'Nghiệm thu'];

export default function PlotHarvestModal({ plot, isOpen, onClose, existingPlan = null, onConfirm, onCancelPlan }) {
  const methods = useMemo(() => getHarvestMethods(plot), [plot]);
  const stage = useMemo(() => getHarvestStage(plot), [plot]);
  const expectedIso = toIsoDate(plot?.expectedHarvestDate);
  const minDate = todayIso();

  const [method, setMethod] = useState('');
  const [date, setDate] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Mỗi lần mở cho 1 thửa: nạp lại kế hoạch đã lưu của ĐÚNG thửa đó (nếu có)
  useEffect(() => {
    if (!isOpen || !plot) return;
    setMethod(existingPlan?.method || methods[0].id);
    setDate(existingPlan?.date || (expectedIso && expectedIso >= minDate ? expectedIso : minDate));
    setAddress(existingPlan?.address || '');
    setPhone(existingPlan?.phone || '');
    setNotes(existingPlan?.notes || '');
    setError('');
  }, [isOpen, plot?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!plot) return null;

  const selectedMethod = methods.find((m) => m.id === method) || methods[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date) return setError('Vui lòng chọn ngày thu hoạch mong muốn.');
    if (date < minDate) return setError('Ngày thu hoạch không thể ở trong quá khứ.');
    if (selectedMethod.needsAddress) {
      if (address.trim().length < 8) return setError('Vui lòng nhập địa chỉ nhận hàng đầy đủ.');
      if (!/^0\d{9,10}$/.test(phone.replace(/\s+/g, ''))) return setError('Số điện thoại nhận hàng không hợp lệ (10–11 số, bắt đầu bằng 0).');
    }
    onConfirm?.({
      plotId: plot.id,
      method: selectedMethod.id,
      methodLabel: selectedMethod.label,
      date,
      address: selectedMethod.needsAddress ? address.trim() : '',
      phone: selectedMethod.needsAddress ? phone.replace(/\s+/g, '') : '',
      notes: notes.trim(),
      status: 'PENDING_CONFIRM',
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" title="Chuẩn bị thu hoạch" subtitle={`${plot.name} · ${plot.crop}`}>
      <form onSubmit={handleSubmit} className="space-y-5 text-left text-sm" noValidate>
        {/* Tóm tắt vụ của riêng thửa này */}
        <div className="flex gap-4 rounded-2xl border border-brand-border bg-brand-cream/40 p-3">
          <img src={plot.image} alt="" className="hidden h-20 w-28 shrink-0 rounded-xl object-cover sm:block" />
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <div><p className="text-[11px] text-brand-muted">Ngày dự kiến</p><p className="font-bold text-brand-dark">{plot.expectedHarvestDate}</p></div>
            <div><p className="text-[11px] text-brand-muted">Sản lượng dự kiến</p><p className="font-bold text-brand-dark">{plot.expectedYield}</p></div>
            <div><p className="text-[11px] text-brand-muted">Còn lại</p><p className="font-bold text-brand-dark">{stage.daysLeft > 0 ? `${stage.daysLeft} ngày` : 'Đã đến vụ'}</p></div>
            <div><p className="text-[11px] text-brand-muted">Diện tích</p><p className="font-bold text-brand-dark">{plot.area}</p></div>
          </div>
        </div>

        {/* Tiến trình vụ mùa */}
        <ol className="grid grid-cols-4 gap-2" aria-label="Tiến trình thu hoạch">
          {STEPS.map((label, i) => {
            const done = i < stage.step;
            const current = i === stage.step;
            return (
              <li key={label} className="flex flex-col items-center gap-1.5 text-center" aria-current={current ? 'step' : undefined}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${done ? 'border-emerald-600 bg-emerald-600 text-white' : current ? 'border-emerald-600 bg-white text-emerald-700 ring-4 ring-emerald-100' : 'border-stone-200 bg-white text-stone-400'}`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`text-[11px] font-semibold leading-tight ${current ? 'text-emerald-800' : done ? 'text-brand-dark' : 'text-stone-400'}`}>{label}</span>
              </li>
            );
          })}
        </ol>

        {stage.key === 'GROWING' && (
          <p className="flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs text-sky-900">
            <Sprout className="mt-0.5 h-4 w-4 shrink-0" />
            Cây còn {stage.daysLeft} ngày nữa mới tới vụ. Bạn có thể đăng ký trước, Farmely sẽ nhắc bạn 3 ngày trước ngày hái.
          </p>
        )}

        {/* Hình thức nhận */}
        <fieldset>
          <legend className="mb-2 font-bold text-brand-dark">Hình thức nhận nông sản</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {methods.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <label key={m.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${active ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100' : 'border-brand-border bg-white hover:border-emerald-300'}`}>
                  <input type="radio" name={`harvest-method-${plot.id}`} value={m.id} checked={active} onChange={() => setMethod(m.id)} className="sr-only" />
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-brand-dark">{m.label}</span>
                    <span className="mt-0.5 block text-xs text-brand-muted">{m.note}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 font-bold text-brand-dark"><CalendarDays className="h-4 w-4" />Ngày thu hoạch mong muốn</span>
            <input type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-brand-border px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </label>
          {selectedMethod.needsAddress && (
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 font-bold text-brand-dark"><User className="h-4 w-4" />Số điện thoại nhận hàng</span>
              <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" className="w-full rounded-xl border border-brand-border px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </label>
          )}
        </div>

        {selectedMethod.needsAddress && (
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 font-bold text-brand-dark"><MapPin className="h-4 w-4" />Địa chỉ nhận hàng</span>
            <input type="text" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" className="w-full rounded-xl border border-brand-border px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block font-bold text-brand-dark">Ghi chú cho đội thu hoạch <span className="font-normal text-brand-muted">(không bắt buộc)</span></span>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} placeholder="Ví dụ: hái trái chín 80%, để lại 1 khay cho tôi tự hái…" className="w-full resize-none rounded-xl border border-brand-border px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
        </label>

        {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}

        <p className="flex items-start gap-2 text-xs text-brand-muted">
          <Package className="mt-0.5 h-4 w-4 shrink-0" />
          Kế hoạch sẽ ở trạng thái "Chờ xác nhận" cho tới khi kỹ sư phụ trách thửa xác nhận lịch hái.
        </p>

        <div className="flex flex-col-reverse gap-2 border-t border-brand-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          {existingPlan ? (
            <button type="button" onClick={() => onCancelPlan?.(plot.id)} className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">Huỷ kế hoạch thu hoạch</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-brand-border px-4 py-2.5 text-xs font-bold text-brand-dark hover:bg-stone-50">Đóng</button>
            <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
              {existingPlan ? 'Cập nhật kế hoạch' : 'Đăng ký thu hoạch'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
