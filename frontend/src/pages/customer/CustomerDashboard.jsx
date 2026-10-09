import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BriefcaseBusiness, Camera, CheckCircle2, Clock3, Droplets, Gauge, Leaf, ShoppingBag, Sprout, ThermometerSun, UserRound, X } from 'lucide-react';
import CustomerNavbar from '../../components/layout/CustomerNavbar';
import Footer from '../../components/layout/Footer';
import DraggableChatWidget from '../../components/common/DraggableChatWidget';
import ServiceCheckoutModal from '../../components/customer/ServiceCheckoutModal';
import Marketplace from '../public/Marketplace';
import { useAuthStore } from '../../stores/authStore';
import { plotsData } from '../../data/plots';
import { initialTasks, readDemo, readImage, saveDemo } from '../../data/operationsDemo';
import { customerServices, formatServicePrice } from '../../data/customerServices';

const tabs = [
  { id: 'yards', label: 'Vườn của tôi', icon: Sprout },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'services', label: 'Dịch vụ', icon: BriefcaseBusiness },
];
const customerPlots = ['PLT-101', 'PLT-102'].map(id => plotsData.find(plot => plot.id === id)).filter(Boolean);
const cultivationModes = { 'P-101': 'SELF', 'P-102': 'ASSISTED' };

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some(item => item.id === params.get('tab')) ? params.get('tab') : 'yards';
  const [plotPanel, setPlotPanel] = useState(null);
  const [selectedPlotCode, setSelectedPlotCode] = useState('P-102');
  const [requests, setRequests] = useState(() => { try { return JSON.parse(localStorage.getItem('farmely_customer_requests') || '[]'); } catch { return []; } });
  const [serviceCheckout, setServiceCheckout] = useState(null);
  const [serviceFeedback, setServiceFeedback] = useState('');
  const [diary, setDiary] = useState(() => readDemo('farmely_diary_entries', []));
  const [diaryModalOpen, setDiaryModalOpen] = useState(false);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryNote, setDiaryNote] = useState('');
  const [diaryPhotoFile, setDiaryPhotoFile] = useState(null);
  const [diaryError, setDiaryError] = useState('');
  const [harvests, setHarvests] = useState(() => readDemo('farmely_harvests', []));
  const [advice, setAdvice] = useState(() => readDemo('farmely_expert_advice', []));
  const [question, setQuestion] = useState('');
  const activePlot = customerPlots.find(plot => plot.code === selectedPlotCode) || customerPlots[0];
  const cultivationMode = cultivationModes[activePlot.code];
  const pageMeta = tab === 'services'
    ? { title: 'Dịch vụ tại vườn', description: 'Đặt hỗ trợ theo từng plot và theo dõi lịch thực hiện.' }
    : tab === 'marketplace'
      ? { title: 'Marketplace', description: 'Khám phá và thuê thêm plot phù hợp với kế hoạch trồng.' }
      : { title: 'Vườn của tôi', description: 'Theo dõi vườn và xử lý những việc cần làm tại đây.' };
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
        plot: activePlot.code,
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
  const openServiceCheckout = (serviceId, fromPlot = false) => {
    setServiceFeedback('');
    setServiceCheckout({ serviceId, lockedPlot: fromPlot ? activePlot : null });
  };
  const completeServiceCheckout = ({ service, plot, time, note, paymentMethod }) => {
    const requestId = Date.now();
    const next = [{ id: requestId, service: service.name, serviceId: service.id, price: service.price, time, note, paymentMethod, plot: plot.code, status: 'Đã thanh toán · Chờ xếp lịch' }, ...requests];
    saveDemo('farmely_customer_requests', next);
    const tasks = readDemo('farmely_staff_tasks', initialTasks);
    saveDemo('farmely_staff_tasks', [{ id: `REQ-${requestId}`, plot: plot.code, title: service.name, sector: plot.landName, priority: service.id === 'pest-check' ? 'Ưu tiên' : 'Thường', status: 'PENDING', scheduledTime: time, instruction: note || `${service.description} Chụp ảnh sau khi hoàn tất.` }, ...tasks]);
    setRequests(next);
    setServiceCheckout(null);
    setServiceFeedback(`Đã thanh toán và gửi yêu cầu ${service.name} cho ${plot.code}.`);
  };
  const submitQuestion = event => {
    event.preventDefault();
    if (!question.trim()) return;
    const next = [{ id: `ADV-${Date.now()}`, customerId: user?.id, customer: user?.fullName || 'Khách hàng', contact: user?.email || user?.phone, stage: 'Đang thuê', plot: activePlot.code, question: question.trim(), response: '' }, ...advice];
    setAdvice(next); saveDemo('farmely_expert_advice', next); setQuestion('');
  };
  const acceptHarvest = id => {
    const next = harvests.map(item => item.id === id ? { ...item, status: 'Đã xác nhận' } : item);
    setHarvests(next); saveDemo('farmely_harvests', next);
  };

  return <div className="flex min-h-screen flex-col bg-brand-cream"><CustomerNavbar />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Không gian khách hàng</p><h1 className="mt-1 font-heading text-3xl font-black text-brand-dark">{pageMeta.title}</h1><p className="mt-1 text-sm text-brand-muted">Chào {user?.fullName}. {pageMeta.description}</p></div><span className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs text-brand-muted">Dữ liệu minh họa</span></div>
      <div className="mb-7 flex gap-2 overflow-x-auto border-b border-brand-border pb-3" role="tablist" aria-label="Chức năng khách hàng">{tabs.map(item => <button key={item.id} role="tab" aria-selected={tab === item.id} type="button" onClick={() => chooseTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${tab === item.id ? 'bg-brand-dark text-white' : 'bg-white text-brand-dark hover:bg-brand-green/10'}`}><item.icon size={16} />{item.label}</button>)}</div>
      {serviceFeedback && <p role="status" className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900"><CheckCircle2 size={18} /> {serviceFeedback}</p>}
      {tab === 'yards' && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">{customerPlots.map(plot => { const mode = cultivationModes[plot.code]; const selected = activePlot.code === plot.code && Boolean(plotPanel); return <button key={plot.code} type="button" onClick={() => { setSelectedPlotCode(plot.code); setPlotPanel('diary'); window.setTimeout(() => document.getElementById('customer-plot-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); }} className={`grid w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition md:grid-cols-[220px_1fr] ${selected ? 'border-brand-green ring-2 ring-brand-green/15' : 'border-brand-border hover:border-brand-green/45'}`}><img src={plot.imageUrl} alt={plot.name} className="h-52 w-full object-cover md:h-full" /><div className="p-6"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${mode === 'SELF' ? 'bg-sky-100 text-sky-900' : 'bg-emerald-100 text-emerald-900'}`}>{mode === 'SELF' ? <Sprout size={14} /> : <UserRound size={14} />}{mode === 'SELF' ? 'Tự canh tác' : 'Farmely hỗ trợ canh tác'}</span><h2 className="mt-3 font-heading text-2xl font-black text-brand-dark">{plot.name}</h2><p className="mt-1 text-sm text-brand-muted">{plot.landName} · {plot.area}</p><p className="mt-4 text-sm text-brand-dark">Cây đang trồng: <strong>{plot.currentCrop}</strong></p><p className="mt-5 text-sm font-bold text-brand-green">Mở trang quản lý plot →</p></div></button>; })}</section>
        <aside className="space-y-4"><div className="rounded-2xl border border-brand-border bg-white p-5"><span className="text-xs font-bold uppercase tracking-widest text-brand-green">2 vườn đang hoạt động</span><h3 className="mt-2 font-heading text-lg font-bold text-brand-dark">Việc cần chú ý</h3><p className="mt-3 text-sm text-brand-muted">Vườn đang trong giai đoạn sinh trưởng. Xem nhật ký để biết lần chăm sóc gần nhất.</p><button onClick={openDiary} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-green">Mở nhật ký {activePlot.code} <ArrowRight size={15} /></button></div><button onClick={() => chooseTab('marketplace')} className="w-full rounded-xl bg-brand-yellow px-4 py-3 text-sm font-bold text-brand-dark">Thuê thêm plot</button></aside>
      </div>}
      {tab === 'marketplace' && <Marketplace embedded />}
      {tab === 'yards' && plotPanel && <section id="customer-plot-detail" className="mt-6 scroll-mt-24 rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Chi tiết vườn</p><h2 className="font-heading text-2xl font-black text-brand-dark">{activePlot.name}</h2></div>
          <button type="button" onClick={() => setPlotPanel(null)} className="rounded-full border border-brand-border p-2 text-brand-muted hover:bg-brand-cream" aria-label="Đóng chi tiết plot"><X size={17} /></button>
        </div>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-brand-cream p-4">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-green">{cultivationMode === 'SELF' ? <Sprout size={19} /> : <UserRound size={19} />}</span><div><p className="text-xs font-bold uppercase tracking-wider text-brand-green">Hình thức canh tác theo hợp đồng</p><h3 className="mt-1 font-heading text-lg font-black text-brand-dark">{cultivationMode === 'SELF' ? 'Tự canh tác' : 'Farmely hỗ trợ canh tác'}</h3><p className="mt-1 text-sm text-brand-muted">{cultivationMode === 'SELF' ? 'Bạn trực tiếp chăm sóc và tự đăng nhật ký kèm ảnh.' : 'CVLĐ thực hiện task; báo cáo và ảnh hoàn tất tự đồng bộ vào nhật ký.'}</p></div></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-dark">Đã chọn khi thuê</span>
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-brand-border pb-3">{[['diary','Nhật ký'],['services','Dịch vụ'],['monitoring','Cảm biến & cảnh báo'],['harvest','Thu hoạch'],['contracts','Hợp đồng']].map(([id,label]) => <button key={id} type="button" onClick={() => setPlotPanel(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${plotPanel === id ? 'bg-brand-dark text-white' : 'bg-brand-cream text-brand-dark'}`}>{label}</button>)}</div>
        {plotPanel === 'diary' && <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-heading text-lg font-black text-brand-dark">Nhật ký canh tác</h3><p className="mt-1 text-sm text-brand-muted">{cultivationMode === 'SELF' ? 'Bạn có thể ghi lại công việc và ảnh thực tế của vườn.' : 'Nhật ký được đồng bộ từ task có ảnh minh chứng do CVLĐ hoàn tất.'}</p></div>{cultivationMode === 'SELF' ? <button type="button" onClick={() => { setDiaryError(''); setDiaryModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white"><Camera size={17} /> Ghi nhật ký</button> : <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">CVLĐ cập nhật</span>}</div>
          <div className="space-y-3">{diary.filter(item => item.plot === activePlot.code).map(item => <DiaryItem key={item.id} date={item.date} title={item.title} text={item.text} photo={item.photo} author={item.author || (item.authorType === 'CUSTOMER' ? user?.fullName : 'CVLĐ Farmely')} />)}{!diary.some(item => item.plot === activePlot.code) && <p className="rounded-xl bg-brand-cream p-4 text-sm text-brand-muted">{cultivationMode === 'SELF' ? 'Chưa có nhật ký. Bấm “Ghi nhật ký” để tạo bài đầu tiên.' : 'Chưa có công việc nào được CVLĐ hoàn tất.'}</p>}</div>
        </div>}
        {plotPanel === 'services' && <div><div className="mb-4"><h3 className="font-heading text-lg font-black text-brand-dark">Dịch vụ cho {activePlot.code}</h3><p className="mt-1 text-sm text-brand-muted">Plot đã được chọn sẵn. Chọn dịch vụ rồi thanh toán; Farmely sẽ liên hệ xác nhận lịch thực hiện.</p></div><div className="grid gap-3 md:grid-cols-2">{customerServices.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => openServiceCheckout(item.id, true)} className="group rounded-2xl border border-brand-border p-4 text-left transition hover:border-brand-green hover:bg-emerald-50/60"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cream text-brand-green group-hover:bg-white"><Icon size={20} /></span><div><strong className="text-brand-dark">{item.name}</strong><p className="mt-1 text-xs leading-relaxed text-brand-muted">{item.description}</p><p className="mt-3 text-sm font-black text-brand-green">{formatServicePrice(item.price)} · {item.duration}</p></div></div></button>; })}</div></div>}
        {plotPanel === 'monitoring' && <div><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-heading text-lg font-black text-brand-dark">Điều kiện tại {activePlot.code}</h3><p className="mt-1 text-sm text-brand-muted">Dữ liệu đọc gần nhất từ {activePlot.iotStationName}.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Đang kết nối</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><SensorCard icon={ThermometerSun} label="Nhiệt độ" value={activePlot.recentSensorReadings.temperature} hint="Trong ngưỡng" /><SensorCard icon={Gauge} label="Độ ẩm không khí" value={activePlot.recentSensorReadings.humidity} hint="Ổn định" /><SensorCard icon={Droplets} label="Độ ẩm đất" value={activePlot.recentSensorReadings.soilMoisture} hint={Number.parseInt(activePlot.recentSensorReadings.soilMoisture, 10) >= 80 ? 'Tạm hoãn tưới' : 'Chưa cần tưới thêm'} /></div><p className="mt-3 flex items-center gap-1.5 text-xs text-brand-muted"><Clock3 size={14} /> Cập nhật {activePlot.recentSensorReadings.lastUpdated}</p><div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><Leaf size={20} className="shrink-0" /><div><strong>Vườn đang ổn định</strong><p className="mt-1">Chưa có chỉ số nguy hiểm kéo dài hoặc công việc khẩn cấp cần xử lý.</p></div></div><div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900"><AlertTriangle size={20} className="shrink-0" /><div><strong>Quy tắc cảnh báo</strong><p className="mt-1">Khi chỉ số nguy hiểm kéo dài hơn 30 phút, Farmely sẽ thông báo và tạo việc khẩn cấp trong giờ vận hành.</p></div></div></div>}
        {plotPanel === 'harvest' && <p className="text-sm text-brand-muted">Các đợt thu hoạch của {activePlot.code} sẽ hiển thị sau khi CVLĐ ghi nhận.</p>}
        {plotPanel === 'contracts' && <p className="text-sm text-brand-muted">Hợp đồng thuê {activePlot.code} · {cultivationMode === 'SELF' ? 'Tự canh tác' : 'Farmely hỗ trợ canh tác'} · {activePlot.formattedPrice}.</p>}
      </section>}
      {tab === 'services' && <div className="space-y-6"><section className="rounded-3xl bg-brand-dark p-6 text-white shadow-sm sm:p-8"><div className="grid items-end gap-5 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-yellow">Dịch vụ tại vườn</p><h2 className="mt-2 font-heading text-2xl font-black text-white sm:text-3xl">Cần hỗ trợ, Farmely đến vườn giúp bạn</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">Chọn dịch vụ, plot và thời gian mong muốn. Sau khi thanh toán demo, Farmely sẽ tiếp nhận và phân công CVLĐ phù hợp.</p></div><div className="flex gap-2 text-xs font-bold"><span className="rounded-full bg-white/10 px-3 py-2">1 · Chọn dịch vụ</span><span className="rounded-full bg-white/10 px-3 py-2">2 · Chọn lịch</span><span className="rounded-full bg-brand-yellow px-3 py-2 text-brand-dark">3 · Thanh toán</span></div></div></section><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{customerServices.map(item => { const Icon = item.icon; return <article key={item.id} className="flex flex-col rounded-2xl border border-brand-border bg-white p-5 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-brand-green"><Icon size={22} /></span><h3 className="mt-4 font-heading text-lg font-black text-brand-dark">{item.name}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-brand-muted">{item.description}</p><div className="mt-4 border-t border-brand-border pt-4"><div className="flex items-center justify-between gap-2"><strong className="text-brand-green">{formatServicePrice(item.price)}</strong><span className="text-xs text-brand-muted">{item.duration}</span></div><button type="button" onClick={() => openServiceCheckout(item.id)} className="mt-4 w-full rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Chọn dịch vụ</button></div></article>; })}</div><Section title="Dịch vụ đã đặt" description="Theo dõi lịch và trạng thái các yêu cầu đã thanh toán.">{requests.length ? <div className="space-y-3">{requests.map(item => <article key={item.id} className="grid gap-3 rounded-xl border border-brand-border p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center"><div><strong className="text-brand-dark">{item.service}</strong><p className="mt-1 text-brand-muted">{item.plot} · {item.time || 'Chờ xác nhận lịch'}</p>{item.note && <p className="mt-1 text-xs text-brand-muted">Ghi chú: {item.note}</p>}</div><div className="text-left sm:text-right"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{item.status}</span>{item.price && <p className="mt-2 font-bold text-brand-green">{formatServicePrice(item.price)}</p>}</div></article>)}</div> : <p className="rounded-xl bg-brand-cream p-4 text-sm text-brand-muted">Bạn chưa đặt dịch vụ nào.</p>}</Section></div>}
      {tab === 'alerts' && <Section title="Tình trạng và cảnh báo" description="Thông báo để bạn biết vườn có cần xử lý gì không."><div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><Leaf size={20} /><div><strong>Vườn đang ổn định</strong><p className="mt-1">Độ ẩm đất mẫu {activePlot.recentSensorReadings.soilMoisture}; hiện chưa cần tưới thêm.</p></div></div><div className="mt-3 flex items-start gap-3 rounded-xl border border-brand-border p-4 text-sm"><AlertTriangle size={20} className="text-amber-600" /><p>Đây là dữ liệu minh họa. Khi kết nối cảm biến thật, cảnh báo sẽ cập nhật theo từng plot.</p></div></Section>}
      {tab === 'advice' && <Section title="Hỏi chuyên gia" description="Gửi câu hỏi về cây trồng. CGNN sẽ trả lời trong mục tư vấn của họ."><form onSubmit={submitQuestion} className="mb-5 flex flex-wrap gap-2"><input required value={question} onChange={event => setQuestion(event.target.value)} placeholder="Bạn muốn hỏi điều gì về vườn?" className="min-w-56 flex-1 rounded-xl border border-brand-border p-3 text-sm" /><button className="rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white">Gửi câu hỏi</button></form>{advice.filter(item => item.customerId === user?.id || (!item.customerId && item.customer === user?.fullName)).map(item => <article key={item.id} className="mb-3 rounded-xl border border-brand-border p-4 text-sm"><strong>{item.question}</strong><p className="mt-2 text-brand-muted">{item.response ? `CGNN: ${item.response}` : 'Đang chờ chuyên gia trả lời.'}</p></article>)}</Section>}
      {tab === 'harvest' && <Section title="Thu hoạch" description="Xem ảnh cân và xác nhận kết quả thu hoạch.">{harvests.filter(item => item.plot === activePlot.code).length ? harvests.filter(item => item.plot === activePlot.code).map(item => <div key={item.id} className="mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-brand-border p-4"><img src={item.photo} alt="Ảnh cân nông sản" className="h-24 w-28 rounded-lg object-cover" /><div className="flex-1 text-sm"><strong>{item.plot} · {item.weight} kg</strong><p className="mt-1 text-brand-muted">{item.status}</p></div>{item.status !== 'Đã xác nhận' && <button onClick={() => acceptHarvest(item.id)} className="rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white">Xác nhận kết quả</button>}</div>) : <p className="rounded-xl bg-brand-cream p-4 text-sm text-brand-muted">Chưa có đợt thu hoạch nào cần xác nhận cho plot này.</p>}</Section>}
      {tab === 'contracts' && <Section title="Hợp đồng thuê" description="Theo dõi thời hạn và chi phí thuê các plot của bạn."><div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-border p-4 text-sm"><div><strong>{activePlot.code} · {activePlot.name}</strong><p className="mt-1 text-brand-muted">Hợp đồng minh họa · Đang canh tác</p></div><span className="font-bold text-brand-green">{activePlot.formattedPrice}</span></div><p className="mt-4 text-xs text-brand-muted">Gia hạn và thanh toán sẽ khả dụng khi backend hợp đồng được kết nối.</p></Section>}
    </main><Footer />
    <DraggableChatWidget title="Chat với CGNN" subtitle="Lịch sử được giữ lại trong suốt quá trình thuê" currentUser="Bạn" value={question} onChange={event => setQuestion(event.target.value)} onSend={submitQuestion} messages={[{ id: 'welcome', from: 'CGNN', text: 'Chào bạn, mình có thể hỗ trợ vấn đề gì trong vườn?' }, ...advice.filter(item => item.customerId === user?.id).flatMap(item => [{ id: `${item.id}-q`, from: 'Bạn', text: item.question }, ...(item.response ? [{ id: `${item.id}-a`, from: 'CGNN', text: item.response }] : [])])]} />
    <ServiceCheckoutModal open={Boolean(serviceCheckout)} initialServiceId={serviceCheckout?.serviceId} lockedPlot={serviceCheckout?.lockedPlot} plots={customerPlots} onClose={() => setServiceCheckout(null)} onComplete={completeServiceCheckout} />
    {diaryModalOpen && cultivationMode === 'SELF' && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 p-4" role="dialog" aria-modal="true" aria-labelledby="diary-modal-title" onMouseDown={event => { if (event.target === event.currentTarget) setDiaryModalOpen(false); }}>
      <form onSubmit={submitDiary} className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-green">{activePlot.code} · Tự canh tác</p><h2 id="diary-modal-title" className="mt-1 font-heading text-2xl font-black text-brand-dark">Ghi nhật ký vườn</h2><p className="mt-1 text-sm text-brand-muted">Ghi công việc bạn vừa làm và thêm ảnh để dễ theo dõi.</p></div><button type="button" onClick={() => setDiaryModalOpen(false)} className="rounded-full border border-brand-border p-2 text-brand-muted hover:bg-brand-cream" aria-label="Đóng cửa sổ nhật ký"><X size={17} /></button></div>
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

function SensorCard({ icon: Icon, label, value, hint }) {
  return <article className="rounded-2xl border border-brand-border bg-brand-cream/55 p-4"><div className="flex items-center gap-2 text-brand-green"><Icon size={18} /><span className="text-xs font-bold uppercase tracking-wider">{label}</span></div><strong className="mt-3 block font-heading text-2xl font-black text-brand-dark">{value}</strong><span className="mt-1 block text-xs text-brand-muted">{hint}</span></article>;
}
