import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Camera, ChevronRight, Headphones, MessageSquareText, Paperclip, Send } from 'lucide-react';
import CustomerAccountLayout from '../../components/customer/CustomerAccountLayout';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import { supportApi } from '../../api/supportApi';

const categories = {
  ACCOUNT: 'Tài khoản & hệ thống',
  RENTAL: 'Thuê đất, hợp đồng & thanh toán',
  CULTIVATION: 'Canh tác & theo dõi',
  SERVICE: 'Dịch vụ & lịch tham quan',
  FEEDBACK: 'Góp ý',
};
const titles = {
  ACCOUNT: 'Hỗ trợ về tài khoản & hệ thống',
  RENTAL: 'Hỗ trợ về thuê đất, hợp đồng & thanh toán',
  CULTIVATION: 'Hỗ trợ về canh tác & theo dõi',
  SERVICE: 'Hỗ trợ về dịch vụ & lịch tham quan',
  FEEDBACK: 'Góp ý cho Farmely',
};
const statuses = { NEW: 'Mới', RESPONDED: 'Đã phản hồi', CLOSED: 'Đã đóng' };
const statusOrder = ['NEW', 'RESPONDED', 'CLOSED'];
const visibleStatus = (value) => value === 'IN_PROGRESS' ? 'NEW' : value;
const date = (value) => value ? new Date(value).toLocaleString('vi-VN') : '';
const field = 'w-full rounded-xl border border-[#d9ded8] bg-white px-4 py-3 text-sm text-[#173b2e] outline-none focus:border-[#06754e] focus:ring-2 focus:ring-emerald-100';
const card = 'rounded-2xl border border-[#e2e5df] bg-white p-5 shadow-sm sm:p-6';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#075b3c] px-5 py-3 text-sm font-bold text-white hover:bg-[#064b37] disabled:cursor-not-allowed disabled:opacity-50';

function StatusBadge({ status }) {
  const value = visibleStatus(status);
  const tone = value === 'NEW' ? 'bg-amber-100 text-amber-900' : value === 'RESPONDED' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700';
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{statuses[value] || value}</span>;
}

function Attachment({ ticketId, file }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    supportApi.image(ticketId, file.id).then((value) => {
      if (active) setUrl(value);
      else URL.revokeObjectURL(value);
    }).catch(() => {});
    return () => { active = false; };
  }, [ticketId, file.id]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url && <a href={url} target="_blank" rel="noreferrer" className="inline-block"><img src={url} alt={file.fileName} className="max-h-52 max-w-full rounded-xl border object-contain" /></a>;
}

function StatusSelect({ ticket, busy, onChange }) {
  const current = visibleStatus(ticket.status);
  const currentIndex = statusOrder.indexOf(current);
  return <select aria-label={`Đổi trạng thái yêu cầu #${ticket.id}`} className="rounded-xl border border-[#cbd6cb] bg-white px-2 py-2 text-xs font-semibold text-[#173b2e]" value={current} disabled={busy || current === 'CLOSED'} onChange={(e) => onChange(ticket.id, e.target.value)}>
    {statusOrder.map((value, index) => <option key={value} value={value} disabled={index !== currentIndex && index !== currentIndex + 1}>{statuses[value]}</option>)}
  </select>;
}

export function SupportPanel({ admin = false, selectedTicketId = null, onSelectTicket, onBack }) {
  const { user, token, login } = useAuthStore();
  const [authReady, setAuthReady] = useState(() => !/^(demo-token-|farmely-jwt-token-)/.test(token || ''));
  const upgradeAttempted = useRef(false);
  const { id: routeId } = useParams();
  const id = admin ? selectedTicketId : routeId;
  const [tickets, setTickets] = useState([]);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({ q: '', category: '', status: '' });
  const [form, setForm] = useState({ category: 'ACCOUNT', description: '' });
  const [file, setFile] = useState(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const root = '/customer/support';

  const refresh = async () => {
    if (id) setDetail(await supportApi.detail(id));
    else setTickets(await supportApi.list(admin ? filters : {}));
  };
  useEffect(() => {
    if (!/^(demo-token-|farmely-jwt-token-)/.test(token || '') || upgradeAttempted.current) return;
    upgradeAttempted.current = true;
    if (!DEMO_ACCOUNTS.some((account) => account.email === user?.email)) { setError('Vui lòng đăng nhập lại bằng tài khoản hợp lệ.'); return; }
    login(user.email, '123456').then((result) => {
      if (result.success && result.user?.role === user.role && (useAuthStore.getState().token || '').split('.').length === 3) { setError(''); setAuthReady(true); }
      else setError('Phiên demo đã hết hạn. Vui lòng đăng nhập lại.');
    }).catch(() => setError('Không thể làm mới phiên đăng nhập.'));
  }, [token, user?.email]);
  useEffect(() => { if (authReady) refresh().catch((e) => setError(e.message)); }, [id, filters.q, filters.category, filters.status, authReady]);

  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const create = (e) => {
    e.preventDefault();
    if (file && (file.size > 5_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setError('Ảnh phải là JPEG, PNG hoặc WebP và tối đa 5 MB'); return;
    }
    run(async () => {
      const created = await supportApi.create(form);
      if (file) await supportApi.upload(created.id, file);
      setForm({ category: 'ACCOUNT', description: '' }); setFile(null);
    });
  };
  const changeStatus = (ticketId, status) => run(() => supportApi.status(ticketId, status));
  const sendReply = (e) => {
    e.preventDefault();
    run(async () => { await supportApi.reply(id, reply); setReply(''); });
  };

  return <div className={`${admin ? 'w-full' : 'mx-auto max-w-[1440px] px-4 pb-20 pt-7 sm:px-6'} space-y-6 text-[#173b2e]`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-medium text-[#728078]">{admin ? 'Vận hành / CSKH' : 'Tài khoản / Hỗ trợ'}</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">{admin ? 'CSKH' : 'Hỗ trợ'}</h1><p className="mt-1 text-sm text-stone-600">{admin ? 'Tiếp nhận và phản hồi yêu cầu khách hàng' : 'Chúng tôi luôn sẵn sàng giúp bạn.'}</p></div>
      {id && (admin ? <button type="button" className="font-bold text-[#075b3c] hover:underline" onClick={onBack}>← Về danh sách</button> : <Link className="font-bold text-[#075b3c] hover:underline" to={root}>← Về danh sách</Link>)}
    </div>
    {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

    {!id && !admin && <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
      <form onSubmit={create} className={`${card} space-y-5`}>
        <h2 className="flex items-center gap-3 text-xl font-black"><span className="rounded-xl bg-emerald-50 p-2 text-[#075b3c]"><Send size={21}/></span>Gửi yêu cầu</h2>
        <div><label className="mb-2 block text-sm font-bold">Chọn danh mục hỗ trợ</label><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(categories).map(([value, label]) => <button type="button" key={value} aria-pressed={form.category === value} onClick={() => setForm({ ...form, category: value })} className={`min-h-16 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${form.category === value ? 'border-amber-400 bg-[#fff0b8] text-[#173b2e]' : 'border-[#dfe5df] bg-white hover:bg-emerald-50'}`}>{label}</button>)}</div></div>
        <p className="rounded-xl bg-[#f3f5f2] px-4 py-3 text-sm"><strong>Tiêu đề:</strong> {titles[form.category]}</p>
        <label className="block text-sm font-bold">Mô tả vấn đề<textarea required maxLength={10000} rows={6} className={`${field} mt-2 resize-y`} placeholder="Hãy mô tả vấn đề bạn gặp phải..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></label>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cbd6cb] bg-[#fafbf9] px-4 py-3 text-center text-sm text-stone-600 hover:bg-emerald-50"><Camera className="mb-2 text-[#075b3c]" size={25}/><span>{file ? file.name : 'Thêm ảnh (nếu có)'}</span><small>JPEG, PNG hoặc WebP · tối đa 5 MB</small><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)}/></label>
        <button className={`${primary} bg-[#f5cf62] text-[#173b2e] hover:bg-[#e9be45]`} disabled={busy}><Send size={17}/>Gửi yêu cầu</button>
      </form>
      <section className={card}><h2 className="mb-3 flex items-center gap-3 text-xl font-black"><span className="rounded-xl bg-emerald-50 p-2 text-[#075b3c]"><MessageSquareText size={21}/></span>Yêu cầu của tôi</h2>{tickets.length === 0 && <p className="text-sm text-stone-500">Bạn chưa có yêu cầu nào.</p>}<div className="divide-y">{tickets.map((t) => <Link key={t.id} to={`${root}/${t.id}`} className="flex items-center justify-between gap-3 py-4 hover:text-[#075b3c]"><span className="min-w-0"><strong className="block truncate text-sm">#{t.id} · {t.title}</strong><span className="mt-1 block line-clamp-2 text-sm text-stone-600">{t.description}</span><small className="mt-1 block text-stone-500">{date(t.createdAt)}</small></span><span className="flex shrink-0 items-center gap-2"><StatusBadge status={t.status}/><ChevronRight size={16}/></span></Link>)}</div></section>
    </div>}

    {!id && admin && <section className={card}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-black">Danh sách yêu cầu</h2><span className="text-sm text-stone-500">Mới nhất trước · {tickets.length} yêu cầu</span></div>
      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(180px,1fr)_minmax(160px,1fr)]"><input aria-label="Tìm kiếm yêu cầu" className={field} placeholder="Tìm mã, khách hàng hoặc nội dung..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })}/><select aria-label="Lọc danh mục" className={field} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">Tất cả danh mục</option>{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Lọc trạng thái" className={field} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Tất cả trạng thái</option>{statusOrder.map((value) => <option key={value} value={value}>{statuses[value]}</option>)}</select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm"><thead><tr className="bg-[#f6f3eb] text-[#3a4e43]"><th className="rounded-l-xl px-3 py-3">Mã</th><th className="px-3 py-3">Khách hàng</th><th className="px-3 py-3">Danh mục</th><th className="px-3 py-3">Nội dung yêu cầu</th><th className="px-3 py-3">Thời gian</th><th className="px-3 py-3">Trạng thái</th><th className="rounded-r-xl px-3 py-3">Đổi trạng thái</th></tr></thead><tbody>{tickets.map((t) => <tr key={t.id} className="border-b hover:bg-[#fafbf8]"><td className="border-b px-3 py-4 font-bold"><button type="button" className="text-[#075b3c] hover:underline" onClick={() => onSelectTicket?.(t.id)}>#{t.id}</button></td><td className="border-b px-3 py-4 font-bold">{t.customerName || `Khách #${t.customerId}`}</td><td className="border-b px-3 py-4">{categories[t.category] || t.category}</td><td className="max-w-xs border-b px-3 py-4"><button type="button" className="line-clamp-2 text-left hover:text-[#075b3c] hover:underline" onClick={() => onSelectTicket?.(t.id)}>{t.description}</button></td><td className="whitespace-nowrap border-b px-3 py-4 text-stone-600">{date(t.createdAt)}</td><td className="border-b px-3 py-4"><StatusBadge status={t.status}/></td><td className="border-b px-3 py-4"><StatusSelect ticket={t} busy={busy} onChange={changeStatus}/></td></tr>)}</tbody></table>{tickets.length === 0 && <p className="py-8 text-center text-sm text-stone-500">Không có yêu cầu phù hợp.</p>}</div>
    </section>}

    {id && detail && <>
      <section className={`${card} flex flex-wrap items-center justify-between gap-4`}><div><p className="text-sm text-stone-500">CSKH / Yêu cầu #{detail.ticket.id}</p><h2 className="mt-1 text-2xl font-black">{detail.ticket.title}</h2><p className="mt-2 text-sm text-stone-600">{admin && <><strong>{detail.ticket.customerName || `Khách #${detail.ticket.customerId}`}</strong><span className="mx-2">·</span></>}{date(detail.ticket.createdAt)}</p></div><div className="flex items-center gap-3"><StatusBadge status={detail.ticket.status}/>{admin && <StatusSelect ticket={detail.ticket} busy={busy} onChange={changeStatus}/>}</div></section>
      <div className={`grid items-start gap-6 ${admin ? 'xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.65fr)]' : ''}`}><div className="space-y-6"><section className={card}><h3 className="mb-4 flex items-center gap-2 text-lg font-black"><MessageSquareText size={20} className="text-[#075b3c]"/>Nội dung khách gửi</h3><p className="whitespace-pre-wrap text-sm leading-7">{detail.ticket.description}</p>{detail.attachments?.length > 0 && <div className="mt-5"><p className="mb-2 flex items-center gap-2 text-sm font-bold"><Paperclip size={16}/>Ảnh đính kèm ({detail.attachments.length})</p><div className="flex flex-wrap gap-3">{detail.attachments.map((f) => <Attachment key={f.id} ticketId={id} file={f}/>)}</div></div>}</section>
        {!admin && <section className={card}><h3 className="mb-4 text-lg font-black">Phản hồi từ Farmely</h3><div className="space-y-3">{detail.events?.filter((event) => event.type === 'REPLY').map((event) => <div key={event.id} className={`rounded-xl p-4 ${event.actorRole === 'ADMIN' ? 'bg-emerald-50' : 'bg-[#f5f3eb]'}`}><p className="text-xs font-bold text-[#075b3c]">{event.actorRole === 'ADMIN' ? 'CSKH Farmely' : 'Bạn'} · {date(event.createdAt)}</p><p className="mt-2 whitespace-pre-wrap text-sm">{event.body}</p></div>)}{!detail.events?.some((event) => event.type === 'REPLY') && <p className="text-sm text-stone-500">Chưa có phản hồi.</p>}</div></section>}
        {visibleStatus(detail.ticket.status) !== 'CLOSED' && <form onSubmit={sendReply} className={`${card} space-y-4`}><h3 className="flex items-center gap-2 text-lg font-black"><Send size={20} className="text-[#075b3c]"/>{admin ? 'Trả lời khách hàng' : 'Trả lời tiếp'}</h3><textarea aria-label="Nội dung phản hồi" required maxLength={10000} rows={5} className={field} placeholder="Nhập phản hồi..." value={reply} onChange={(e) => setReply(e.target.value)}/><button disabled={busy} className={primary}><Send size={17}/>Gửi phản hồi</button></form>}
      </div>{admin && <aside className={card}><h3 className="mb-3 flex items-center gap-2 text-lg font-black"><Headphones size={20} className="text-[#075b3c]"/>Thông tin yêu cầu</h3><dl className="divide-y text-sm"><div className="py-3"><dt className="text-stone-500">Khách hàng</dt><dd className="mt-1 font-bold">{detail.ticket.customerName || `Khách #${detail.ticket.customerId}`}</dd></div><div className="py-3"><dt className="text-stone-500">Email</dt><dd className="mt-1 break-all">{detail.ticket.customerEmail || '—'}</dd></div><div className="py-3"><dt className="text-stone-500">Danh mục</dt><dd className="mt-1">{categories[detail.ticket.category]}</dd></div><div className="py-3"><dt className="text-stone-500">Thời gian tạo</dt><dd className="mt-1">{date(detail.ticket.createdAt)}</dd></div><div className="py-3"><dt className="text-stone-500">Mã yêu cầu</dt><dd className="mt-1 font-bold">#{detail.ticket.id}</dd></div></dl></aside>}</div>
    </>}
  </div>;
}

export default function SupportPage() {
  return <CustomerAccountLayout><SupportPanel /></CustomerAccountLayout>;
}
