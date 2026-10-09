import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoleDashboardShell from '../../components/layout/RoleDashboardShell';
import { processTemplatesData } from '../../data/processTemplates';
import { varietiesData } from '../../data/varieties';
import { readDemo, saveDemo } from '../../data/operationsDemo';
import { MessageCircle, Search, Send, UserRound } from 'lucide-react';

const tabs = [{ id: 'issues', label: 'Vấn đề hiện trường' }, { id: 'advice', label: 'Tư vấn khách hàng' }, { id: 'templates', label: 'Quy trình canh tác' }];
const initialAdvice = [
  { id: 'ADV-01', customerId: 'USR-001', customer: 'Lô Thái Quyền', contact: 'customer@farmely.vn', stage: 'Đang thuê', plot: 'P-102', question: 'Cà chua bi giai đoạn này có cần tưới thêm không?', response: '' },
  { id: 'ADV-GUEST-01', customerId: 'LEAD-0908123456', customer: 'Minh Anh', contact: '0908 123 456', stage: 'Trước khi thuê', plot: 'Đang quan tâm P-109', question: 'Plot này có phù hợp để trồng rau cùng trẻ nhỏ cuối tuần không?', response: '' },
];

export default function ExpertDashboard() {
  const [params, setParams] = useSearchParams();
  const tab = tabs.some(item => item.id === params.get('tab')) ? params.get('tab') : 'issues';
  const [issues, setIssues] = useState(() => readDemo('farmely_field_issues', []));
  const [advice, setAdvice] = useState(() => {
    const saved = readDemo('farmely_expert_advice', []);
    return saved.length ? [...saved, ...initialAdvice.filter(seed => !saved.some(item => item.id === seed.id))] : initialAdvice;
  });
  const [templates, setTemplates] = useState(() => readDemo('farmely_expert_templates', processTemplatesData));
  const [drafts, setDrafts] = useState({});
  const [varietyId, setVarietyId] = useState(varietiesData[0].id);
  const [templateName, setTemplateName] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAdviceId, setSelectedAdviceId] = useState('ADV-01');
  const [adviceSearch, setAdviceSearch] = useState('');
  const [adviceFilter, setAdviceFilter] = useState('all');
  const replyIssue = id => {
    const response = drafts[id]?.trim();
    if (!response) { setMessage('Vui lòng nhập hướng dẫn trước khi gửi.'); return; }
    const next = issues.map(issue => issue.id === id ? { ...issue, response, status: 'Đã có hướng dẫn' } : issue);
    setIssues(next); saveDemo('farmely_field_issues', next); setMessage('Đã gửi hướng dẫn cho CVLĐ trong bản demo.');
  };
  const replyAdvice = id => {
    const response = drafts[id]?.trim();
    if (!response) { setMessage('Vui lòng nhập câu trả lời.'); return; }
    const next = advice.map(item => item.id === id ? { ...item, response } : item);
    setAdvice(next); saveDemo('farmely_expert_advice', next); setMessage('Đã lưu tư vấn trong bản demo.');
  };
  const promoteConversation = id => {
    const next = advice.map(item => item.id === id ? { ...item, stage: 'Đang thuê', plot: item.plot?.startsWith('Đang quan tâm') ? 'Chưa gán plot' : item.plot } : item);
    setAdvice(next); saveDemo('farmely_expert_advice', next); setMessage('Đã chuyển khách sang giai đoạn đang thuê và giữ nguyên lịch sử tư vấn.');
  };
  const publishTemplate = event => {
    event.preventDefault();
    const steps = stepsText.split('\n').map(line => line.trim()).filter(Boolean);
    if (!templateName.trim() || !steps.length) { setMessage('Nhập tên quy trình và ít nhất một bước chăm sóc.'); return; }
    const variety = varietiesData.find(item => item.id === varietyId);
    const next = [{ id: `TMPL-DEMO-${Date.now()}`, name: templateName.trim(), varietyId, varietyName: variety.name, version: 'v1.0', status: 'ACTIVE', totalSteps: steps.length, steps: steps.map((taskName, index) => ({ stepNumber: index + 1, taskName, dayOffset: index * 7 })) }, ...templates];
    setTemplates(next); saveDemo('farmely_expert_templates', next); setTemplateName(''); setStepsText(''); setMessage('Đã lưu quy trình mẫu trên trình duyệt này.');
  };

  return <RoleDashboardShell eyebrow="CGNN · Chuyên môn canh tác" title="Trung tâm chuyên gia" description="Ưu tiên xử lý vấn đề tại vườn, trả lời khách và quản lý quy trình giống cây." tabs={tabs} activeTab={tab} onTabChange={id => { setParams(id === 'issues' ? {} : { tab: id }); setMessage(''); }}>
    {message && <p role="status" className="mb-5 rounded-xl bg-brand-yellow/30 px-4 py-3 text-sm font-semibold text-brand-dark">{message}</p>}
    {tab === 'issues' && <section className="space-y-4"><div className="rounded-2xl border border-brand-border bg-white p-5"><h2 className="font-heading text-xl font-black text-brand-dark">Vấn đề CVLĐ báo về</h2><p className="mt-1 text-sm text-brand-muted">Hướng dẫn trực tiếp cho người đang làm tại vườn.</p></div>{issues.length ? issues.map(issue => <article key={issue.id} className="grid gap-4 rounded-2xl border border-brand-border bg-white p-5 md:grid-cols-[1fr_160px]"><div><span className="text-xs font-bold text-brand-green">{issue.plot} · {issue.type}</span><h3 className="mt-1 font-heading text-lg font-bold text-brand-dark">{issue.text}</h3><p className="mt-2 text-xs text-brand-muted">{issue.status}</p>{issue.response ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Hướng dẫn đã gửi: {issue.response}</p> : <div className="mt-4 flex flex-wrap gap-2"><input value={drafts[issue.id] || ''} onChange={event => setDrafts(current => ({ ...current, [issue.id]: event.target.value }))} placeholder="Hướng dẫn xử lý cho CVLĐ" className="min-w-56 flex-1 rounded-xl border border-brand-border p-3 text-sm" /><button onClick={() => replyIssue(issue.id)} className="rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white">Gửi hướng dẫn</button></div>}</div>{issue.photo && <img src={issue.photo} alt="Ảnh vấn đề tại vườn" className="h-36 w-full rounded-xl object-cover" />}</article>) : <p className="rounded-2xl border border-brand-border bg-white p-6 text-sm text-brand-muted">Chưa có vấn đề nào từ CVLĐ. Khi CVLĐ gửi báo cáo, nó sẽ xuất hiện ở đây.</p>}</section>}
    {tab === 'advice' && <AdviceInbox advice={advice} drafts={drafts} setDrafts={setDrafts} selectedId={selectedAdviceId} setSelectedId={setSelectedAdviceId} search={adviceSearch} setSearch={setAdviceSearch} filter={adviceFilter} setFilter={setAdviceFilter} onReply={replyAdvice} onPromote={promoteConversation} />}
    {tab === 'templates' && <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"><section className="space-y-3">{templates.map(template => <article key={template.id} className="rounded-2xl border border-brand-border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div><span className="text-xs font-bold text-brand-green">{template.varietyName} · {template.version}</span><h2 className="mt-1 font-heading text-lg font-bold text-brand-dark">{template.name}</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{template.status === 'ACTIVE' ? 'Đang áp dụng' : template.status}</span></div><p className="mt-2 text-sm text-brand-muted">{template.totalSteps || template.steps?.length || 0} bước chăm sóc</p><details className="mt-3 text-sm"><summary className="cursor-pointer font-bold text-brand-green">Xem các bước</summary><ol className="mt-2 list-inside list-decimal space-y-1 text-brand-muted">{template.steps?.map(step => <li key={step.stepNumber}>{step.taskName}</li>)}</ol></details></article>)}</section><form onSubmit={publishTemplate} className="space-y-4 rounded-2xl border border-brand-border bg-white p-5"><h2 className="font-heading text-lg font-black text-brand-dark">Tạo quy trình mẫu</h2><label className="block text-sm font-semibold">Giống cây<select value={varietyId} onChange={event => setVarietyId(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3">{varietiesData.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block text-sm font-semibold">Tên quy trình<input required value={templateName} onChange={event => setTemplateName(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3" /></label><label className="block text-sm font-semibold">Các bước (mỗi dòng một bước)<textarea required rows="5" value={stepsText} onChange={event => setStepsText(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3" placeholder={'Làm đất\nXuống giống\nKiểm tra và tưới'} /></label><button className="rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Lưu quy trình</button><p className="text-xs text-brand-muted">Quy trình mới là dữ liệu demo lưu trên trình duyệt; cần API để áp dụng cho công việc thật.</p></form></div>}
  </RoleDashboardShell>;
}

function AdviceInbox({ advice, drafts, setDrafts, selectedId, setSelectedId, search, setSearch, filter, setFilter, onReply, onPromote }) {
  const normalized = advice.map(item => ({ ...item, stage: item.stage || (item.plot && item.plot !== 'Chưa thuê' ? 'Đang thuê' : 'Trước khi thuê'), contact: item.contact || item.customerId || 'Chưa có liên hệ' }));
  const filtered = normalized.filter(item => {
    const matchesFilter = filter === 'all' || item.stage === filter;
    const keyword = search.trim().toLowerCase();
    return matchesFilter && (!keyword || `${item.customer} ${item.contact} ${item.plot} ${item.question}`.toLowerCase().includes(keyword));
  });
  const selected = normalized.find(item => item.id === selectedId) || filtered[0] || normalized[0];
  const replyInputRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!replyInputRef.current) return;
      replyInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      replyInputRef.current.focus({ preventScroll: true });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [selected?.id]);

  return <section className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
    <div className="grid lg:h-[calc(100vh-280px)] lg:min-h-[520px] lg:max-h-[700px] lg:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="border-b border-brand-border bg-brand-cream/55 lg:border-b-0 lg:border-r">
        <div className="border-b border-brand-border p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-heading text-xl font-black text-brand-dark">Hộp thư tư vấn</h2><p className="text-xs text-brand-muted">{normalized.length} cuộc trò chuyện</p></div><MessageCircle className="text-brand-green" /></div><label className="relative block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm khách, SĐT hoặc plot" className="w-full rounded-xl border border-brand-border bg-white py-2.5 pl-9 pr-3 text-sm" /></label><div className="mt-3 flex gap-2 overflow-x-auto">{[['all','Tất cả'],['Trước khi thuê','Trước thuê'],['Đang thuê','Đang thuê']].map(([id,label]) => <button key={id} type="button" onClick={() => setFilter(id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${filter === id ? 'bg-brand-dark text-white' : 'bg-white text-brand-dark'}`}>{label}</button>)}</div></div>
        <div className="max-h-[430px] overflow-y-auto p-2">{filtered.map(item => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`mb-1 w-full rounded-xl p-3 text-left transition ${selected?.id === item.id ? 'bg-white shadow-sm ring-1 ring-brand-green/25' : 'hover:bg-white/70'}`}><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 font-bold text-brand-green">{item.customer?.charAt(0)}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-brand-dark">{item.customer}</strong><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.stage === 'Đang thuê' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{item.stage}</span></div><p className="mt-1 truncate text-xs text-brand-muted">{item.question}</p><p className="mt-1 text-[11px] font-semibold text-brand-green">{item.plot}</p></div></div></button>)}{!filtered.length && <p className="p-5 text-center text-sm text-brand-muted">Không tìm thấy cuộc trò chuyện.</p>}</div>
      </aside>
      {selected ? <div className="flex min-h-0 min-w-0 flex-col"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green/10 text-brand-green"><UserRound /></span><div><h3 className="font-heading font-black text-brand-dark">{selected.customer}</h3><p className="text-xs text-brand-muted">{selected.contact} · {selected.plot}</p></div></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${selected.stage === 'Đang thuê' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{selected.stage}</span>{selected.stage === 'Trước khi thuê' && <button type="button" onClick={() => onPromote(selected.id)} className="rounded-full border border-brand-green px-3 py-1 text-xs font-bold text-brand-green hover:bg-emerald-50">Đánh dấu đã thuê</button>}</div></header><div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-brand-cream/35 p-5"><div className="max-w-[78%] rounded-2xl rounded-tl-sm border border-brand-border bg-white p-4 text-sm text-brand-dark"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-brand-muted">{selected.customer}</span>{selected.question}</div>{selected.response && <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-brand-green p-4 text-sm text-white"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/65">CGNN Farmely</span>{selected.response}</div>}<div className="rounded-xl border border-dashed border-brand-border bg-white/70 p-3 text-xs text-brand-muted">Hội thoại được gắn với hồ sơ liên hệ <strong>{selected.customerId || selected.contact}</strong>. Khi khách chuyển từ tư vấn sang thuê, lịch sử này vẫn được giữ nguyên.</div></div><div className="border-t border-brand-border bg-white p-4"><div className="flex gap-2"><input ref={replyInputRef} id="expert-chat-reply" value={drafts[selected.id] || ''} onChange={event => setDrafts(current => ({ ...current, [selected.id]: event.target.value }))} placeholder="Nhập nội dung tư vấn..." className="min-w-0 flex-1 rounded-xl border border-brand-border p-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15" /><button type="button" onClick={() => onReply(selected.id)} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white"><Send size={16} /> Gửi</button></div></div></div> : <div className="flex items-center justify-center p-10 text-sm text-brand-muted">Chọn một cuộc trò chuyện.</div>}
    </div>
  </section>;
}
