import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, FileText, Loader2, Sprout } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../stores/authStore';
import { apiFetch, unwrapData } from '../../api/apiClient';

const Empty = ({ children }) => <div className="rounded-2xl border border-dashed border-brand-border bg-white p-10 text-center text-sm text-brand-muted">{children}</div>;

export default function ExpertDashboard() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('issues');
  const [issues, setIssues] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [resolveNow, setResolveNow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    const results = await Promise.allSettled([apiFetch('/api/issues'), apiFetch('/api/templates'), apiFetch('/api/v1/knowledge-documents')]);
    setIssues(results[0].status === 'fulfilled' ? unwrapData(results[0].value) || [] : []);
    setTemplates(results[1].status === 'fulfilled' ? unwrapData(results[1].value) || [] : []);
    setDocuments(results[2].status === 'fulfilled' ? unwrapData(results[2].value) || [] : []);
    const failures = results.filter((item) => item.status === 'rejected').map((item) => item.reason?.message).filter(Boolean);
    setError(failures.join(' · ')); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitDiagnosis = async (event) => {
    event.preventDefault();
    if (!user?.userId || !selectedIssue) return;
    setSubmitting(true); setError('');
    try {
      await apiFetch(`/api/issues/${selectedIssue.issueId}/diagnose`, { method: 'PUT', body: JSON.stringify({ handledBy: user.userId, resolutionNotes: diagnosis, markResolved: resolveNow }) });
      setMessage('Chỉ đạo kỹ thuật đã được lưu vào database.'); setSelectedIssue(null); setDiagnosis(''); setResolveNow(false); await load();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  return <div className="min-h-screen overflow-x-hidden bg-brand-cream"><PublicNavbar /><main className="mx-auto max-w-[1500px] px-4 pb-16 pt-24 sm:px-8 sm:pt-28"><header className="rounded-3xl bg-brand-dark p-6 text-white"><p className="text-xs font-bold text-brand-yellow">Expert Dashboard</p><h1 className="mt-1 text-2xl font-black">Bàn làm việc chuyên gia</h1><p className="mt-2 text-sm text-white/70">Sự cố, quy trình VietGAP và tài liệu được tải từ backend.</p></header><nav className="my-5 flex gap-2 overflow-x-auto">{[['issues','Sự cố',AlertTriangle],['templates','Quy trình',Sprout],['documents','Tài liệu',BookOpen]].map(([id,label,Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? 'bg-brand-green text-white' : 'border border-brand-border bg-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>{message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</div>}{error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error} <button onClick={load} className="font-bold underline">Thử lại</button></div>}{loading ? <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div> : <>{tab === 'issues' && (issues.length ? <div className="grid gap-4 lg:grid-cols-2">{issues.map((issue) => <article key={issue.issueId} className="rounded-2xl border border-brand-border bg-white p-5"><div className="flex justify-between gap-3"><h2 className="font-black text-brand-dark">{issue.issueType}</h2><span className="text-xs font-bold text-brand-green">{issue.displayStatus || issue.status}</span></div><p className="mt-2 text-sm text-brand-muted">{issue.description}</p>{issue.imageUrl && <img src={issue.imageUrl} alt="Ảnh sự cố" className="mt-4 h-52 w-full rounded-xl object-cover" />}{issue.resolutionNotes && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><b>Chỉ đạo:</b> {issue.resolutionNotes}</div>}<Button className="mt-4" disabled={issue.status === 'RESOLVED'} onClick={() => { setSelectedIssue(issue); setDiagnosis(issue.resolutionNotes || ''); }}>Chẩn đoán / cập nhật</Button></article>)}</div> : <Empty>Không có sự cố hiện trường.</Empty>)}{tab === 'templates' && (templates.length ? <div className="grid gap-4 lg:grid-cols-2">{templates.map((template) => <button key={template.templateId} onClick={() => setSelectedTemplate(template)} className="rounded-2xl border border-brand-border bg-white p-5 text-left"><p className="text-xs font-bold text-brand-green">Phiên bản {template.version || '—'}</p><h2 className="mt-1 font-black">{template.templateName || template.name}</h2><p className="mt-2 text-sm text-brand-muted">{template.description}</p><p className="mt-3 text-xs">{template.steps?.length || 0} bước · {template.durationDays || '—'} ngày</p></button>)}</div> : <Empty>Backend chưa có quy trình canh tác.</Empty>)}{tab === 'documents' && (documents.length ? <div className="space-y-3">{documents.map((doc) => <article key={doc.documentId || doc.id} className="rounded-2xl border border-brand-border bg-white p-5"><FileText className="mb-2 h-5 w-5 text-brand-green" /><h2 className="font-black">{doc.title}</h2><p className="mt-2 text-sm text-brand-muted">{doc.description || doc.content}</p>{doc.fileUrl && <a className="mt-3 inline-block text-sm font-bold text-brand-green underline" href={doc.fileUrl} target="_blank" rel="noreferrer">Mở tài liệu</a>}</article>)}</div> : <Empty>Backend chưa có tài liệu kiến thức.</Empty>)}</>}</main><Modal isOpen={Boolean(selectedIssue)} onClose={() => setSelectedIssue(null)} title="Chẩn đoán sự cố"><form onSubmit={submitDiagnosis} className="space-y-4"><textarea required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="min-h-36 w-full rounded-xl border p-3" placeholder="Chỉ đạo kỹ thuật" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={resolveNow} onChange={(e) => setResolveNow(e.target.checked)} />Đánh dấu đã giải quyết</label><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Gửi chỉ đạo'}</Button></form></Modal><Modal isOpen={Boolean(selectedTemplate)} onClose={() => setSelectedTemplate(null)} title={selectedTemplate?.templateName || selectedTemplate?.name} subtitle={`Phiên bản ${selectedTemplate?.version || '—'} · Chế độ chỉ đọc`}><div className="space-y-3">{(selectedTemplate?.steps || []).map((step) => <div key={step.stepId || step.stepOrder} className="rounded-xl bg-brand-cream p-3"><b>Ngày +{step.dayOffset || 0}: {step.stepName}</b><p className="mt-1 text-sm">{step.description}</p></div>)}{!selectedTemplate?.steps?.length && <Empty>Quy trình chưa có bước.</Empty>}<p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Backend hiện chỉ hỗ trợ đọc template; chức năng tạo/sửa/versioning không được giả lập trên frontend.</p></div></Modal></div>;
}
