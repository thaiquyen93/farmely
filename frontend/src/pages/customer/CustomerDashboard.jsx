import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Camera, Leaf, ShoppingBag, Sprout, UserRound, X } from 'lucide-react';
import CustomerNavbar from '../../components/layout/CustomerNavbar';
import Footer from '../../components/layout/Footer';
import DraggableChatWidget from '../../components/common/DraggableChatWidget';
import Marketplace from '../public/Marketplace';
import { useAuthStore } from '../../stores/authStore';
import { plotsData } from '../../data/plots';
import { initialTasks, readDemo, readImage, saveDemo } from '../../data/operationsDemo';

const tabs = [
  { id: 'yards', label: 'Vườn của tôi', icon: Sprout },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
];
const demoPlot = plotsData.find(plot => plot.id === 'PLT-102');

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some(item => item.id === params.get('tab')) ? params.get('tab') : 'yards';
  const [plotPanel, setPlotPanel] = useState(null);
  const [service, setService] = useState('Tưới và kiểm tra đất');
  const [note, setNote] = useState('');
  const [requests, setRequests] = useState(() => { try { return JSON.parse(localStorage.getItem('farmely_customer_requests') || '[]'); } catch { return []; } });
  const [diary, setDiary] = useState(() => readDemo('farmely_diary_entries', []));
  const [cultivationMode] = useState(() => readDemo(`farmely_cultivation_mode_${demoPlot.code}`, 'ASSISTED'));
  const [diaryModalOpen, setDiaryModalOpen] = useState(false);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryNote, setDiaryNote] = useState('');
  const [diaryPhotoFile, setDiaryPhotoFile] = useState(null);
  const [diaryError, setDiaryError] = useState('');
  const [harvests, setHarvests] = useState(() => readDemo('farmely_harvests', []));
  const [advice, setAdvice] = useState(() => readDemo('farmely_expert_advice', []));
  const [question, setQuestion] = useState('');
  const chooseTab = id => setParams(id === 'yards' ? {} : { tab: id });
  const openDiary = () => {
    chooseTab('yards');
    setPlotPanel('diary');
    window.setTimeout(() => document.getElementById('customer-plot-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  const submitDiary = async event => {
    event.preventDefault();
    if (cultivationMode !== 'SELF') return;
    if (!diaryTitle.trim() || !diaryNote.trim()) {
      setDiaryError('Nhập tiêu đề và nội dung nhật ký trước khi đăng.');
      return;
    }
    try {
      const photo = diaryPhotoFile ? await readImage(diaryPhotoFile) : null;
      const next = [{
        id: `DIARY-CUSTOMER-${Date.now()}`,
        plot: demoPlot.code,
        title: diaryTitle.trim(),
        text: diaryNote.trim(),
        photo,
        date: new Date().toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
        author: user?.fullName || 'Khách hàng',
        authorType: 'CUSTOMER',
      }, ...diary];
      setDiary(next);
      saveDemo('farmely_diary_entries', next);
      setDiaryTitle('');
      setDiaryNote('');
      setDiaryPhotoFile(null);
      setDiaryError('');
      setDiaryModalOpen(false);
    } catch (error) {
      setDiaryError(error.message || 'Không thể đọc ảnh đã chọn.');
    }
  };
  const submitRequest = event => {
    event.preventDefault();
    const next = [{ id: Date.now(), service, note, plot: demoPlot.code, status: 'Chờ tiếp nhận' }, ...requests];
    saveDemo('farmely_customer_requests', next);
    const tasks = readDemo('farmely_staff_tasks', initialTasks);
    saveDemo('farmely_staff_tasks', [{ id: `REQ-${Date.now()}`, plot: demoPlot.code, title: service, sector: demoPlot.landName, priority: 'Thường', status: 'PENDING', instruction: note || 'Yêu cầu chăm sóc từ khách hàng. Chụp ảnh sau khi hoàn tất.' }, ...tasks]);
    setRequests(next);
    setNote('');
  };
  const submitQuestion = event => {
    event.preventDefault();
    if (!question.trim()) return;
    const next = [{ id: `ADV-${Date.now()}`, customerId: user?.id, customer: user?.fullName || 'Khách hàng', contact: user?.email || user?.phone, stage: 'Đang thuê', plot: demoPlot.code, question: question.trim(), response: '' }, ...advice];
    setAdvice(next); saveDemo('farmely_expert_advice', next); setQuestion('');
  };
  const acceptHarvest = id => {
    const next = harvests.map(item => item.id === id ? { ...item, status: 'Đã xác nhận' } : item);
    setHarvests(next); saveDemo('farmely_harvests', next);
  };

  return <div className="flex min-h-screen flex-col bg-brand-cream"><CustomerNavbar />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Không gian khách hàng</p><h1 className="mt-1 font-heading text-3xl font-black text-brand-dark">Vườn của tôi</h1><p className="mt-1 text-sm text-brand-muted">Chào {user?.fullName}. Theo dõi vườn và xử lý những việc cần làm tại đây.</p></div><span className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs text-brand-muted">Dữ liệu minh họa</span></div>
      <div className="mb-7 flex gap-2 overflow-x-auto border-b border-brand-border pb-3" role="tablist" aria-label="Chức năng khách hàng">{tabs.map(item => <button key={item.id} role="tab" aria-selected={tab === item.id} type="button" onClick={() => chooseTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${tab === item.id ? 'bg-brand-dark text-white' : 'bg-white text-brand-dark hover:bg-brand-green/10'}`}><item.icon size={16} />{item.label}</button>)}</div>
      {tab === 'yards' && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm"><button type="button" onClick={() => setPlotPanel(plotPanel ? null : 'diary')} className="grid w-full text-left md:grid-cols-[240px_1fr]"><img src={demoPlot.imageUrl} alt={demoPlot.name} className="h-56 w-full object-cover md:h-full" /><div className="p-6"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Đang canh tác</span><h2 className="mt-3 font-heading text-2xl font-black text-brand-dark">{demoPlot.name}</h2><p className="mt-1 text-sm text-brand-muted">{demoPlot.landName} · {demoPlot.area}</p><p className="mt-4 text-sm text-brand-dark">Cây đang trồng: <strong>{demoPlot.currentCrop}</strong></p><p className="mt-5 text-sm font-bold text-brand-green">Mở trang quản lý plot →</p></div></button></section>
        <aside className="space-y-4"><div className="rounded-2xl border border-brand-border bg-white p-5"><h3 className="font-heading text-lg font-bold text-brand-dark">Việc cần chú ý</h3><p className="mt-3 text-sm text-brand-muted">Vườn đang trong giai đoạn sinh trưởng. Xem nhật ký để biết lần chăm sóc gần nhất.</p><button onClick={openDiary} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-green">Mở nhật ký <ArrowRight size={15} /></button></div><button onClick={() => chooseTab('marketplace')} className="w-full rounded-xl bg-brand-yellow px-4 py-3 text-sm font-bold text-brand-dark">Thuê thêm plot</button></aside>
      </div>}
      {tab === 'marketplace' && <Marketplace embedded />}
      {tab === 'yards' && plotPanel && <section id="customer-plot-detail" className="mt-6 scroll-mt-24 rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Chi tiết vườn</p><h2 className="font-heading text-2xl font-black text-brand-dark">{demoPlot.name}</h2></div>
          <button type="button" onClick={() => setPlotPanel(null)} className="rounded-full border border-brand-border p-2 text-brand-muted hover:bg-brand-cream" aria-label="Đóng chi tiết plot"><X size={17} /></button>
        </div>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-brand-cream p-4">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-green">{cultivationMode === 'SELF' ? <Sprout size={19} /> : <UserRound size={19} />}</span><div><p className="text-xs font-bold uppercase tracking-wider text-brand-green">Hình thức canh tác theo hợp đồng</p><h3 className="mt-1 font-heading text-lg font-black text-brand-dark">{cultivationMode === 'SELF' ? 'Tự canh tác' : 'Farmely hỗ trợ canh tác'}</h3><p className="mt-1 text-sm text-brand-muted">{cultivationMode === 'SELF' ? 'Bạn trực tiếp chăm sóc và tự đăng nhật ký kèm ảnh.' : 'CVLĐ thực hiện task; báo cáo và ảnh hoàn tất tự đồng bộ vào nhật ký.'}</p></div></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-dark">Đã chọn khi thuê</span>
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-brand-border pb-3">{[['diary','Nhật ký'],['services','Dịch vụ'],['alerts','Cảnh báo'],['harvest','Thu hoạch'],['contracts','Hợp đồng']].map(([id,label]) => <button key={id} type="button" onClick={() => setPlotPanel(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${plotPanel === id ? 'bg-brand-dark text-white' : 'bg-brand-cream text-brand-dark'}`}>{label}</button>)}</div>
        {plotPanel === 'diary' && <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-heading text-lg font-black text-brand-dark">Nhật ký canh tác</h3><p className="mt-1 text-sm text-brand-muted">{cultivationMode === 'SELF' ? 'Bạn có thể ghi lại công việc và ảnh thực tế của vườn.' : 'Nhật ký được đồng bộ từ task có ảnh minh chứng do CVLĐ hoàn tất.'}</p></div>{cultivationMode === 'SELF' ? <button type="button" onClick={() => { setDiaryError(''); setDiaryModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white"><Camera size={17} /> Ghi nhật ký</button> : <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">CVLĐ cập nhật</span>}</div>
          <div className="space-y-3">{diary.filter(item => item.plot === demoPlot.code).map(item => <DiaryItem key={item.id} date={item.date} title={item.title} text={item.text} photo={item.photo} author={item.author || (item.authorType === 'CUSTOMER' ? user?.fullName : 'CVLĐ Farmely')} />)}{!diary.some(item => item.plot === demoPlot.code) && <p className="rounded-xl bg-brand-cream p-4 text-sm text-brand-muted">{cultivationMode === 'SELF' ? 'Chưa có nhật ký. Bấm “Ghi nhật ký” để tạo bài đầu tiên.' : 'Chưa có công việc nào được CVLĐ hoàn tất.'}</p>}</div>
        </div>}
        {plotPanel === 'services' && <p className="text-sm text-brand-muted">Dịch vụ chăm sóc và yêu cầu hỗ trợ của plot này sẽ hiển thị tại đây.</p>}
        {plotPanel === 'alerts' && <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><Leaf size={20} /><div><strong>Vườn đang ổn định</strong><p className="mt-1">Độ ẩm đất mẫu {demoPlot.recentSensorReadings.soilMoisture}; hiện chưa cần tưới thêm.</p></div></div>}
        {plotPanel === 'harvest' && <p className="text-sm text-brand-muted">Các đợt thu hoạch của {demoPlot.code} sẽ hiển thị sau khi CVLĐ ghi nhận.</p>}
        {plotPanel === 'contracts' && <p className="text-sm text-brand-muted">Hợp đồng thuê {demoPlot.code}: đang canh tác · {demoPlot.formattedPrice}.</p>}
      </section>}
      {tab === 'services' && <div className="grid gap-5 md:grid-cols-2"><Section title="Yêu cầu chăm sóc" description="Gửi yêu cầu cho đội ngũ Farmely khi bạn cần hỗ trợ."><form onSubmit={submitRequest} className="space-y-4"><label className="block text-sm font-semibold">Dịch vụ<select value={service} onChange={event => setService(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3"><option>Tưới và kiểm tra đất</option><option>Nhổ cỏ, bắt sâu</option><option>Kiểm tra cây có dấu hiệu bất thường</option></select></label><label className="block text-sm font-semibold">Ghi chú<textarea value={note} onChange={event => setNote(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border p-3" rows="3" placeholder="Mô tả điều bạn cần hỗ trợ" /></label><button className="rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Gửi yêu cầu</button></form></Section><Section title="Yêu cầu đã gửi" description="Trạng thái lưu trong bản demo trên trình duyệt này.">{requests.length ? requests.map(item => <div key={item.id} className="mb-2 rounded-xl border border-brand-border p-3 text-sm"><strong>{item.service}</strong><span className="float-right text-amber-700">{item.status}</span><p className="mt-1 text-brand-muted">{item.plot} · {item.note || 'Không có ghi chú'}</p></div>) : <p className="text-sm text-brand-muted">Chưa có yêu cầu nào.</p>}</Section></div>}
      {tab === 'alerts' && <Section title="Tình trạng và cảnh báo" description="Thông báo để bạn biết vườn có cần xử lý gì không."><div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><Leaf size={20} /><div><strong>Vườn đang ổn định</strong><p className="mt-1">Độ ẩm đất mẫu {demoPlot.recentSensorReadings.soilMoisture}; hiện chưa cần tưới thêm.</p></div></div><div className="mt-3 flex items-start gap-3 rounded-xl border border-brand-border p-4 text-sm"><AlertTriangle size={20} className="text-amber-600" /><p>Đây là dữ liệu minh họa. Khi kết nối cảm biến thật, cảnh báo sẽ cập nhật theo từng plot.</p></div></Section>}
      {tab === 'advice' && <Section title="Hỏi chuyên gia" description="Gửi câu hỏi về cây trồng. CGNN sẽ trả lời trong mục tư vấn của họ."><form onSubmit={submitQuestion} className="mb-5 flex flex-wrap gap-2"><input required value={question} onChange={event => setQuestion(event.target.value)} placeholder="Bạn muốn hỏi điều gì về vườn?" className="min-w-56 flex-1 rounded-xl border border-brand-border p-3 text-sm" /><button className="rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Gửi câu hỏi</button></form>{advice.filter(item => item.customerId === user?.id || (!item.customerId && item.customer === user?.fullName)).map(item => <article key={item.id} className="mb-3 rounded-xl border border-brand-border p-4 text-sm"><strong>{item.question}</strong><p className="mt-2 text-brand-muted">{item.response ? `CGNN: ${item.response}` : 'Đang chờ chuyên gia trả lời.'}</p></article>)}</Section>}
      {tab === 'harvest' && <Section title="Thu hoạch" description="Xem ảnh cân và xác nhận kết quả thu hoạch.">{harvests.filter(item => item.plot === demoPlot.code).length ? harvests.filter(item => item.plot === demoPlot.code).map(item => <div key={item.id} className="mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-brand-border p-4"><img src={item.photo} alt="Ảnh cân nông sản" className="h-24 w-28 rounded-lg object-cover" /><div className="flex-1 text-sm"><strong>{item.plot} · {item.weight} kg</strong><p className="mt-1 text-brand-muted">{item.status}</p></div>{item.status !== 'Đã xác nhận' && <button onClick={() => acceptHarvest(item.id)} className="rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white">Xác nhận kết quả</button>}</div>) : <p className="rounded-xl bg-brand-cream p-4 text-sm text-brand-muted">Chưa có đợt thu hoạch nào cần xác nhận cho plot này.</p>}</Section>}
      {tab === 'contracts' && <Section title="Hợp đồng thuê" description="Theo dõi thời hạn và chi phí thuê các plot của bạn."><div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-border p-4 text-sm"><div><strong>{demoPlot.code} · {demoPlot.name}</strong><p className="mt-1 text-brand-muted">Hợp đồng minh họa · Đang canh tác</p></div><span className="font-bold text-brand-green">{demoPlot.formattedPrice}</span></div><p className="mt-4 text-xs text-brand-muted">Gia hạn và thanh toán sẽ khả dụng khi backend hợp đồng được kết nối.</p></Section>}
    </main><Footer />
    <DraggableChatWidget title="Chat với CGNN" subtitle="Lịch sử được giữ lại trong suốt quá trình thuê" currentUser="Bạn" value={question} onChange={event => setQuestion(event.target.value)} onSend={submitQuestion} messages={[{ id: 'welcome', from: 'CGNN', text: 'Chào bạn, mình có thể hỗ trợ vấn đề gì trong vườn?' }, ...advice.filter(item => item.customerId === user?.id).flatMap(item => [{ id: `${item.id}-q`, from: 'Bạn', text: item.question }, ...(item.response ? [{ id: `${item.id}-a`, from: 'CGNN', text: item.response }] : [])])]} />
    {diaryModalOpen && cultivationMode === 'SELF' && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 p-4" role="dialog" aria-modal="true" aria-labelledby="diary-modal-title" onMouseDown={event => { if (event.target === event.currentTarget) setDiaryModalOpen(false); }}>
      <form onSubmit={submitDiary} className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">{demoPlot.code} · Tự canh tác</p><h2 id="diary-modal-title" className="mt-1 font-heading text-2xl font-black text-brand-dark">Ghi nhật ký vườn</h2><p className="mt-1 text-sm text-brand-muted">Ghi công việc bạn vừa làm và thêm ảnh để dễ theo dõi.</p></div><button type="button" onClick={() => setDiaryModalOpen(false)} className="rounded-full border border-brand-border p-2 text-brand-muted hover:bg-brand-cream" aria-label="Đóng cửa sổ nhật ký"><X size={17} /></button></div>
        <div className="mt-5 space-y-4"><label className="block text-sm font-semibold text-brand-dark">Tiêu đề<input autoFocus required value={diaryTitle} onChange={event => setDiaryTitle(event.target.value)} placeholder="Ví dụ: Tưới nước buổi sáng" className="mt-1 w-full rounded-xl border border-brand-border p-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15" /></label><label className="block text-sm font-semibold text-brand-dark">Nội dung<textarea required rows="4" value={diaryNote} onChange={event => setDiaryNote(event.target.value)} placeholder="Tình trạng cây, công việc đã làm..." className="mt-1 w-full resize-none rounded-xl border border-brand-border p-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/15" /></label><label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-brand-green/40 bg-emerald-50/60 p-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-green"><Camera size={21} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-brand-dark">Chụp hoặc chọn ảnh</strong><span className="block truncate text-xs text-brand-muted">{diaryPhotoFile?.name || 'JPG/PNG, tối đa 5 MB'}</span></span><input type="file" accept="image/*" capture="environment" onChange={event => { setDiaryPhotoFile(event.target.files?.[0] || null); setDiaryError(''); }} className="sr-only" /></label>{diaryError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{diaryError}</p>}</div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDiaryModalOpen(false)} className="rounded-xl border border-brand-border px-4 py-2.5 text-sm font-bold text-brand-dark">Để sau</button><button type="submit" className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white">Đăng nhật ký</button></div>
      </form>
    </div>}
  </div>;
}

function Section({ title, description, children }) {
  return <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-7"><h2 className="font-heading text-xl font-black text-brand-dark">{title}</h2><p className="mb-5 mt-1 text-sm text-brand-muted">{description}</p>{children}</section>;
}
function DiaryItem({ date, title, text, photo, author }) {
  return <article className="rounded-xl border border-brand-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-brand-green">{date}</span><span className="inline-flex items-center gap-1 text-xs text-brand-muted"><UserRound size={13} /> {author || 'CVLĐ Farmely'}</span></div><h3 className="mt-1 font-bold text-brand-dark">{title}</h3><p className="mt-1 text-sm text-brand-muted">{text}</p>{photo && <img src={photo} alt={`Ảnh ${title}`} className="mt-3 h-40 w-56 rounded-xl object-cover" />}</article>;
}
