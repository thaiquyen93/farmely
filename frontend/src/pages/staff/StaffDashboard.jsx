import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';
import RoleDashboardShell from '../../components/layout/RoleDashboardShell';
import DraggableChatWidget from '../../components/common/DraggableChatWidget';
import { initialTasks, readDemo, readImage, saveDemo } from '../../data/operationsDemo';

const tabs = [{ id: 'tasks', label: 'Việc hôm nay' }, { id: 'plots', label: 'Plot đang trực' }, { id: 'issues', label: 'Báo vấn đề' }, { id: 'harvest', label: 'Ghi nhận thu hoạch' }];
const activePlots = [
  { code: 'P-102', land: 'Nông Trại Củ Chi Eco Farm', crop: 'Cà chua bi Cherry', status: 'Đang chăm sóc', last: 'Tưới và kiểm tra đất · 08:30' },
  { code: 'P-101', land: 'Nông Trại Củ Chi Eco Farm', crop: 'Rau ăn lá', status: 'Cần kiểm tra', last: 'Độ ẩm thấp · 09:10' },
  { code: 'P-108', land: 'Nông Trại Củ Chi Eco Farm', crop: 'Dưa leo Baby', status: 'Ổn định', last: 'Đã ghi nhận hôm qua' },
];

export default function StaffDashboard() {
  const [params, setParams] = useSearchParams();
  const tab = tabs.some(item => item.id === params.get('tab')) ? params.get('tab') : 'tasks';
  const [tasks, setTasks] = useState(() => readDemo('farmely_staff_tasks', initialTasks));
  const [issues, setIssues] = useState(() => readDemo('farmely_field_issues', []));
  const [harvests, setHarvests] = useState(() => readDemo('farmely_harvests', []));
  const [photoByTask, setPhotoByTask] = useState({});
  const [issueType, setIssueType] = useState('Sâu bệnh');
  const [issueText, setIssueText] = useState('');
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [weight, setWeight] = useState('');
  const [harvestPhoto, setHarvestPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chat, setChat] = useState(() => readDemo('farmely_staff_chat', [{ id: 1, from: 'CGNN', text: 'Chào Lực, hôm nay có vấn đề nào ở các plot cần mình hỗ trợ không?' }]));

  const updateTasks = next => { setTasks(next); saveDemo('farmely_staff_tasks', next); };
  const startTask = id => updateTasks(tasks.map(task => task.id === id ? { ...task, status: 'IN_PROGRESS' } : task));
  const completeTask = async id => {
    try {
      const photo = await readImage(photoByTask[id]);
      const task = tasks.find(item => item.id === id);
      updateTasks(tasks.map(item => item.id === id ? { ...item, status: 'COMPLETED', photo } : item));
      const diary = readDemo('farmely_diary_entries', []);
      saveDemo('farmely_diary_entries', [{ id: Date.now(), plot: task.plot, title: task.title, text: task.instruction, photo, date: new Date().toLocaleDateString('vi-VN'), author: 'CVLĐ Farmely', authorType: 'STAFF', sourceTaskId: task.id }, ...diary]);
      if (String(id).startsWith('REQ-')) {
        const requests = readDemo('farmely_customer_requests', []);
        saveDemo('farmely_customer_requests', requests.map(item => `REQ-${item.id}` === id ? { ...item, status: 'Đã hoàn tất' } : item));
      }
      setMessage('Đã hoàn tất công việc và lưu ảnh minh chứng trong bản demo.');
    } catch (error) { setMessage(error.message); }
  };
  const submitIssue = async event => {
    event.preventDefault();
    if (!issueText.trim()) { setMessage('Vui lòng mô tả vấn đề.'); return; }
    let photo = null;
    try { if (issuePhoto) photo = await readImage(issuePhoto); } catch (error) { setMessage(error.message); return; }
    const next = [{ id: Date.now(), plot: 'P-102', type: issueType, text: issueText.trim(), photo, status: 'Chờ chuyên gia', response: '' }, ...issues];
    setIssues(next); saveDemo('farmely_field_issues', next); setIssueText(''); setIssuePhoto(null); setMessage('Đã chuyển báo cáo cho CGNN trong bản demo.');
  };
  const submitHarvest = async event => {
    event.preventDefault();
    if (!(Number(weight) > 0)) { setMessage('Vui lòng nhập khối lượng hợp lệ.'); return; }
    try {
      const photo = await readImage(harvestPhoto);
      const next = [{ id: Date.now(), plot: 'P-102', weight: Number(weight), photo, status: 'Chờ khách xác nhận' }, ...harvests];
      setHarvests(next); saveDemo('farmely_harvests', next); setWeight(''); setHarvestPhoto(null); setMessage('Đã lưu cân nặng và ảnh cân trong bản demo.');
    } catch (error) { setMessage(error.message); }
  };
  const sendChat = event => {
    event.preventDefault();
    if (!chatMessage.trim()) return;
    const next = [...chat, { id: Date.now(), from: 'CVLĐ', text: chatMessage.trim() }];
    setChat(next);
    saveDemo('farmely_staff_chat', next);
    setChatMessage('');
  };

  return <><RoleDashboardShell eyebrow="CVLĐ · Vận hành hiện trường" title="Công việc tại vườn" description="Việc ưu tiên ở trên; bắt đầu việc trước khi hoàn tất và đính kèm ảnh hiện trường." tabs={tabs} activeTab={tab} onTabChange={id => { setParams(id === 'tasks' ? {} : { tab: id }); setMessage(''); }}>
    {message && <p role="status" className="mb-5 rounded-xl bg-brand-yellow/30 px-4 py-3 text-sm font-semibold text-brand-dark">{message}</p>}
    {tab === 'tasks' && <div className="grid gap-4 lg:grid-cols-2">{[...tasks].sort((a, b) => (a.priority === 'Ưu tiên' ? -1 : 1) - (b.priority === 'Ưu tiên' ? -1 : 1)).map(task => <article key={task.id} className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold text-brand-green">{task.plot} · {task.sector}</span><h2 className="mt-1 font-heading text-xl font-black text-brand-dark">{task.title}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${task.priority === 'Ưu tiên' ? 'bg-amber-100 text-amber-900' : 'bg-brand-cream text-brand-dark'}`}>{task.priority}</span></div><p className="mt-3 text-sm leading-relaxed text-brand-muted">{task.instruction}</p><p className="mt-4 text-xs font-bold text-brand-dark">Trạng thái: {task.status === 'PENDING' ? 'Chưa bắt đầu' : task.status === 'IN_PROGRESS' ? 'Đang làm' : 'Đã hoàn tất'}</p>{task.status === 'PENDING' && <button onClick={() => startTask(task.id)} className="mt-4 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white">Bắt đầu việc</button>}{task.status === 'IN_PROGRESS' && <div className="mt-4 space-y-3"><label className="block text-sm font-semibold text-brand-dark">Ảnh sau khi làm <input type="file" accept="image/*" capture="environment" onChange={event => setPhotoByTask(current => ({ ...current, [task.id]: event.target.files?.[0] }))} className="mt-1 block w-full text-xs" /></label><button onClick={() => completeTask(task.id)} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white"><Camera size={16} /> Hoàn tất với ảnh</button></div>}{task.status === 'COMPLETED' && <div className="mt-4 flex items-center gap-3 text-sm text-emerald-800"><CheckCircle2 size={18} /> Đã có ảnh minh chứng {task.photo && <img src={task.photo} alt={`Ảnh minh chứng ${task.title}`} className="h-12 w-16 rounded object-cover" />}</div>}</article>)}</div>}
    {tab === 'plots' && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{activePlots.map(plot => <article key={plot.code} className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-xl bg-brand-cream p-2 text-brand-green"><MapPin size={18} /></span><div><p className="text-xs font-bold text-brand-green">{plot.code}</p><h2 className="font-heading text-lg font-black text-brand-dark">{plot.crop}</h2></div></div><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${plot.status === 'Cần kiểm tra' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>{plot.status}</span></div><p className="mt-4 text-sm text-brand-muted">{plot.land}</p><p className="mt-3 border-t border-brand-border pt-3 text-xs text-brand-muted">{plot.last}</p><button type="button" onClick={() => setParams({ tab: 'tasks' })} className="mt-4 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white">Mở việc của plot</button></article>)}</div>}
    {tab === 'issues' && <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-brand-border bg-white p-6"><h2 className="font-heading text-xl font-black text-brand-dark">Báo vấn đề cho CGNN</h2><form onSubmit={submitIssue} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Loại vấn đề<select value={issueType} onChange={event => setIssueType(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3"><option>Sâu bệnh</option><option>Thiết bị tưới</option><option>Cây sinh trưởng bất thường</option></select></label><label className="block text-sm font-semibold">Mô tả<textarea required value={issueText} onChange={event => setIssueText(event.target.value)} rows="4" className="mt-1 w-full rounded-xl border border-brand-border p-3" /></label><label className="block text-sm font-semibold">Ảnh hiện trường (nếu có)<input type="file" accept="image/*" capture="environment" onChange={event => setIssuePhoto(event.target.files?.[0])} className="mt-1 block w-full text-xs" /></label><button className="rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Gửi chuyên gia</button></form></section><section className="rounded-2xl border border-brand-border bg-white p-6"><h2 className="font-heading text-xl font-black text-brand-dark">Vấn đề đã báo</h2>{issues.length ? issues.map(issue => <article key={issue.id} className="mt-4 rounded-xl border border-brand-border p-4 text-sm"><strong>{issue.type} · {issue.plot}</strong><p className="mt-1 text-brand-muted">{issue.text}</p>{issue.response && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-emerald-900">CGNN: {issue.response}</p>}<span className="mt-2 block text-xs text-brand-green">{issue.status}</span></article>) : <p className="mt-4 text-sm text-brand-muted">Chưa có vấn đề nào được báo.</p>}</section></div>}
    {tab === 'harvest' && <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-brand-border bg-white p-6"><h2 className="font-heading text-xl font-black text-brand-dark">Ghi nhận thu hoạch · P-102</h2><p className="mt-2 text-sm text-brand-muted">Cân nông sản và chụp rõ màn hình cân trước khi gửi khách hàng xác nhận.</p><form onSubmit={submitHarvest} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Khối lượng (kg)<input type="number" min="0.01" step="0.01" required value={weight} onChange={event => setWeight(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3" /></label><label className="block text-sm font-semibold">Ảnh cân bắt buộc<input type="file" accept="image/*" capture="environment" required onChange={event => setHarvestPhoto(event.target.files?.[0])} className="mt-1 block w-full text-xs" /></label><button className="rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Lưu kết quả</button></form></section><section className="rounded-2xl border border-brand-border bg-white p-6"><h2 className="font-heading text-xl font-black text-brand-dark">Kết quả đã ghi</h2>{harvests.length ? harvests.map(item => <div key={item.id} className="mt-4 flex items-center gap-3 rounded-xl border border-brand-border p-3"><img src={item.photo} alt="Ảnh cân thu hoạch" className="h-16 w-20 rounded object-cover" /><div className="text-sm"><strong>{item.plot} · {item.weight} kg</strong><p className="text-brand-muted">{item.status}</p></div></div>) : <p className="mt-4 text-sm text-brand-muted">Chưa có kết quả thu hoạch.</p>}</section></div>}
  </RoleDashboardShell><DraggableChatWidget title="Chat với CGNN" subtitle="Hỗ trợ công việc tại các plot đang trực" currentUser="CVLĐ" messages={chat} value={chatMessage} onChange={event => setChatMessage(event.target.value)} onSend={sendChat} placeholder="Nhập câu hỏi cho CGNN..." /></>;
}
