import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CustomerAccountLayout from '../../components/customer/CustomerAccountLayout';
import { useAuthStore, DEMO_ACCOUNTS } from '../../stores/authStore';
import { supportApi } from '../../api/supportApi';

const categories = { ACCOUNT: 'Tài khoản & hệ thống', RENTAL: 'Thuê đất, hợp đồng & thanh toán', CULTIVATION: 'Canh tác & theo dõi', SERVICE: 'Dịch vụ & lịch tham quan', FEEDBACK: 'Góp ý' };
const statuses = { NEW: 'Mới', IN_PROGRESS: 'Đang xử lý', RESPONDED: 'Đã phản hồi', CLOSED: 'Đã đóng' };
const next = { NEW: 'IN_PROGRESS', IN_PROGRESS: 'RESPONDED', RESPONDED: 'CLOSED' };
const input = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700';
const button = 'rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50';
const date = (value) => value ? new Date(value).toLocaleString('vi-VN') : '';

function Attachment({ ticketId, file }) {
  const [url, setUrl] = useState('');
  useEffect(() => { let active = true; supportApi.image(ticketId, file.id).then((value) => { if (active) setUrl(value); else URL.revokeObjectURL(value); }).catch(() => {}); return () => { active = false; }; }, [ticketId, file.id]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url && <a href={url} target="_blank" rel="noreferrer" className="block w-fit"><img src={url} alt={file.fileName} className="max-h-48 rounded-xl border object-contain" /></a>;
}

export function SupportPanel({ admin = false, selectedTicketId = null, onSelectTicket, onBack }) {
  const { user, token, login } = useAuthStore();
  const [authReady, setAuthReady] = useState(() => !/^(demo-token-|farmely-jwt-token-)/.test(token || ''));
  const upgradeAttempted = useRef(false);
  const { id: routeId } = useParams();
  const id = admin ? selectedTicketId : routeId;
  const [tickets, setTickets] = useState([]);
  const [detail, setDetail] = useState(null);
  const [related, setRelated] = useState({});
  const [filters, setFilters] = useState({ q: '', category: '', status: '' });
  const [form, setForm] = useState({ category: 'ACCOUNT', title: '', description: '', plotId: '', contractId: '', paymentId: '' });
  const [file, setFile] = useState(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const root = '/customer/support';
  const refresh = async () => { if (id) setDetail(await supportApi.detail(id)); else setTickets(await supportApi.list(filters)); };
  useEffect(() => {
    if (!/^(demo-token-|farmely-jwt-token-)/.test(token || '') || upgradeAttempted.current) return;
    upgradeAttempted.current = true;
    if (!DEMO_ACCOUNTS.some((account) => account.email === user?.email)) { setError('Vui lòng đăng nhập lại bằng tài khoản hợp lệ.'); return; }
    login(user.email, '123456').then((result) => {
      if (result.success && result.user?.role === user.role && (useAuthStore.getState().token || '').split('.').length === 3) { setError(''); setAuthReady(true); }
      else setError('Phiên demo đã hết hạn. Vui lòng đăng nhập lại.');
    }).catch(() => setError('Không thể làm mới phiên đăng nhập.'));
  }, [token, user?.email]);
  useEffect(() => { if (authReady) supportApi.related().then(setRelated).catch((e) => setError(e.message)); }, [admin, authReady]);
  useEffect(() => { if (authReady) refresh().catch((e) => setError(e.message)); }, [id, filters.q, filters.category, filters.status, authReady]);
  const run = async (fn) => { setBusy(true); setError(''); try { await fn(); await refresh(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const create = (e) => { e.preventDefault(); if (file && (file.size > 5_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setError('Ảnh phải là JPEG, PNG hoặc WebP và tối đa 5 MB'); return; } run(async () => { const created = await supportApi.create({ ...form, plotId: form.plotId || null, contractId: form.contractId || null, paymentId: form.paymentId || null }); if (file) await supportApi.upload(created.id, file); setForm({ category: 'ACCOUNT', title: '', description: '', plotId: '', contractId: '', paymentId: '' }); setFile(null); }); };
  const content = <div className={`${admin ? 'w-full' : 'mx-auto max-w-6xl px-4 pb-20 pt-6'} space-y-5 text-[#173b2e]`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-stone-500">{admin ? 'Vận hành / CSKH' : 'Tài khoản / Hỗ trợ'}</p><h1 className="mt-1 text-3xl font-black">{admin ? 'CSKH' : 'Hỗ trợ khách hàng'}</h1></div>{id && (admin ? <button type="button" className="text-sm font-bold text-emerald-800 underline" onClick={onBack}>← Danh sách yêu cầu</button> : <Link className="text-sm font-bold text-emerald-800 underline" to={root}>← Danh sách yêu cầu</Link>)}</div>
    {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {!id && <>
      {!admin && <form onSubmit={create} className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Gửi yêu cầu mới</h2><select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input className={input} required maxLength={200} placeholder="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/><textarea className={input} required rows={4} placeholder="Mô tả vấn đề" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/><div className="grid gap-3 sm:grid-cols-3">{[['plotId','Thửa đất','plots'],['contractId','Hợp đồng','contracts'],['paymentId','Đơn thanh toán','payments']].map(([key,label,source]) => <label key={key} className="text-sm font-bold">{label} liên quan<select className={input} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}><option value="">Không chọn</option>{(related[source] || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>)}</div><label className="text-sm font-bold">Ảnh đính kèm (tùy chọn, tối đa 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block" onChange={(e) => setFile(e.target.files?.[0] || null)}/></label><button className={button} disabled={busy}>Gửi yêu cầu</button></form>}
      <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold">Danh sách yêu cầu</h2>{admin && <div className="mb-4 grid gap-2 sm:grid-cols-3"><input aria-label="Tìm kiếm" className={input} placeholder="Tìm tiêu đề, mô tả" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })}/><select aria-label="Lọc chủ đề" className={input} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">Tất cả chủ đề</option>{Object.entries(categories).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Lọc trạng thái" className={input} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>}<div className="space-y-2">{tickets.length === 0 && <p className="text-sm text-stone-500">Chưa có yêu cầu.</p>}{tickets.map((t) => { const item = <><span><strong>#{t.id} · {t.title}</strong><small className="mt-1 block text-stone-500">{categories[t.category]} · {date(t.updatedAt)}{admin && ` · Khách #${t.customerId}`}</small></span><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold">{statuses[t.status]}</span></>; const classes = 'flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-left hover:bg-emerald-50'; return admin ? <button type="button" key={t.id} onClick={() => onSelectTicket?.(t.id)} className={classes}>{item}</button> : <Link key={t.id} to={`${root}/${t.id}`} className={classes}>{item}</Link>; })}</div></section>
    </>}
    {id && detail && <><section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-sm text-stone-500">#{detail.ticket.id} · {categories[detail.ticket.category]}</p><h2 className="text-2xl font-black">{detail.ticket.title}</h2></div><span className="h-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold">{statuses[detail.ticket.status]}</span></div><p className="mt-4 whitespace-pre-wrap text-sm">{detail.ticket.description}</p><p className="mt-4 text-sm text-stone-500">{detail.ticket.plotId && `Thửa ${detail.plot?.[0]?.name || `#${detail.ticket.plotId}`} · `}{detail.ticket.contractId && `Hợp đồng ${detail.contract?.[0]?.name || `#${detail.ticket.contractId}`} · `}{detail.ticket.paymentId && `Thanh toán #${detail.ticket.paymentId} (${detail.payment?.[0]?.status || '—'})`}</p>{detail.attachments.map((f) => <Attachment key={f.id} ticketId={id} file={f}/>)}</section>
      {admin && <section className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-5"><label className="text-sm font-bold">Người xử lý<select className={input} value={detail.ticket.assigneeId || ''} onChange={(e) => run(() => supportApi.assign(id, e.target.value ? Number(e.target.value) : null))}><option value="">Chưa phân công</option>{(related.assignees || []).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>{next[detail.ticket.status] && <button disabled={busy} className={button} onClick={() => run(() => supportApi.status(id, next[detail.ticket.status]))}>Chuyển sang {statuses[next[detail.ticket.status]]}</button>}</section>}
      <section className="rounded-2xl border bg-white p-5"><h2 className="mb-4 text-xl font-bold">Lịch sử trao đổi</h2><div className="space-y-3">{detail.events.map((e) => <div key={e.id} className="rounded-xl border-l-4 border-emerald-600 bg-stone-50 p-3"><small className="text-stone-500">{date(e.createdAt)} · {e.actorRole === 'ADMIN' ? 'CSKH' : 'Khách hàng'} · {e.type === 'STATUS' ? `${statuses[e.fromStatus] || 'Khởi tạo'} → ${statuses[e.toStatus]}` : e.type === 'ASSIGNED' ? 'Phân công' : e.type === 'ATTACHMENT' ? 'Ảnh đính kèm' : e.type === 'CREATED' ? 'Tạo yêu cầu' : 'Phản hồi'}</small>{e.body && <p className="mt-1 whitespace-pre-wrap text-sm">{e.body}</p>}</div>)}</div></section>{detail.ticket.status !== 'CLOSED' && <form onSubmit={(e) => { e.preventDefault(); run(async () => { await supportApi.reply(id, reply); setReply(''); }); }} className="rounded-2xl border bg-white p-5"><label className="text-sm font-bold">Trả lời<textarea required maxLength={10000} rows={4} className={`${input} mt-2`} value={reply} onChange={(e) => setReply(e.target.value)}/></label><button disabled={busy} className={`${button} mt-3`}>Gửi phản hồi</button></form>}</>}
  </div>;
  return content;
}

export default function SupportPage() {
  return <CustomerAccountLayout><SupportPanel /></CustomerAccountLayout>;
}
