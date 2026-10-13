import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ClipboardList, FileText, Loader2, Radio, Sprout, TriangleAlert, Wheat } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../stores/authStore';
import { apiFetch, unwrapData } from '../../api/apiClient';

const TABS = [
  ['plots', 'Thửa đất', Sprout], ['tasks', 'Công việc', ClipboardList], ['diary', 'Nhật ký', BookOpen],
  ['services', 'Dịch vụ', Calendar], ['process', 'Quy trình', FileText], ['iot', 'IoT', Radio], ['harvest', 'Thu hoạch', Wheat]
];

const Empty = ({ text }) => <div className="rounded-2xl border border-dashed border-brand-border bg-white p-10 text-center text-sm text-brand-muted">{text}</div>;
const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState('plots');
  const [selectedRentalId, setSelectedRentalId] = useState(null);
  const [data, setData] = useState({ contracts: [], rentals: [], plots: [], lands: [], tasks: [], diaries: [], services: [], requests: [], harvests: [], templates: [] });
  const [iot, setIot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diaryForm, setDiaryForm] = useState({ rentalId: '', content: '', imageUrl: '' });

  const load = async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError('');
    try {
      const contracts = unwrapData(await apiFetch(`/api/contracts?renterId=${user.userId}`)) || [];
      const contractIds = new Set(contracts.map((item) => Number(item.contractId)));
      const results = await Promise.all([
        apiFetch(`/api/rentals?renterId=${user.userId}`), apiFetch('/api/plots'), apiFetch('/api/lands'), apiFetch('/api/tasks'),
        apiFetch('/api/diary'), apiFetch('/api/services'), apiFetch('/api/services/requests'), apiFetch('/api/harvest'), apiFetch('/api/templates')
      ]);
      const rentals = (unwrapData(results[0]) || []).filter((item) => contractIds.has(Number(item.contractId)));
      const rentalIds = new Set(rentals.map((item) => Number(item.rentalId)));
      setData({
        contracts,
        rentals,
        plots: unwrapData(results[1]) || [],
        lands: unwrapData(results[2]) || [],
        tasks: (unwrapData(results[3]) || []).filter((item) => rentalIds.has(Number(item.rentalId))),
        diaries: (unwrapData(results[4]) || []).filter((item) => rentalIds.has(Number(item.rentalId))),
        services: unwrapData(results[5]) || [],
        requests: (unwrapData(results[6]) || []).filter((item) => rentalIds.has(Number(item.rentalId))),
        harvests: (unwrapData(results[7]) || []).filter((item) => rentalIds.has(Number(item.rentalId))),
        templates: unwrapData(results[8]) || []
      });
    } catch (err) {
      setError(err.message);
      setData({ contracts: [], rentals: [], plots: [], lands: [], tasks: [], diaries: [], services: [], requests: [], harvests: [], templates: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.userId]);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const requestedView = query.get('view');
    const rentalId = Number(query.get('rental'));
    if (requestedView) setView(requestedView);
    if (rentalId) setSelectedRentalId(rentalId);
  }, [location.search]);

  const rentals = useMemo(() => data.rentals.map((rental) => {
    const plot = data.plots.find((item) => Number(item.plotId) === Number(rental.plotId));
    const land = data.lands.find((item) => Number(item.landId) === Number(plot?.landId));
    return { ...rental, plot, land, plotCode: rental.plotCode || plot?.plotCode, plotName: rental.plotName || plot?.plotName || `Thửa ${rental.plotCode || rental.plotId}` };
  }), [data]);
  const selectedRental = rentals.find((item) => Number(item.rentalId) === Number(selectedRentalId));
  const scope = (items) => selectedRentalId ? items.filter((item) => Number(item.rentalId) === Number(selectedRentalId)) : items;

  useEffect(() => {
    const plotId = selectedRental?.plotId;
    if (view !== 'iot' || !plotId) return;
    setIot(null);
    apiFetch(`/api/sensors/plots/${plotId}/latest`).then((payload) => setIot(unwrapData(payload))).catch((err) => setError(err.message));
  }, [view, selectedRental?.plotId]);

  const selectView = (nextView) => {
    setView(nextView);
    navigate(`/customer/dashboard?view=${nextView}${selectedRentalId ? `&rental=${selectedRentalId}` : ''}`);
  };

  const submitDiary = async (event) => {
    event.preventDefault();
    if (!diaryForm.imageUrl) return setError('Nhật ký Self-growing bắt buộc có ảnh minh chứng.');
    setSubmitting(true);
    try {
      await apiFetch('/api/diary', { method: 'POST', body: JSON.stringify({ rentalId: Number(diaryForm.rentalId), content: diaryForm.content, imageUrl: diaryForm.imageUrl }) });
      setDiaryOpen(false); setDiaryForm({ rentalId: '', content: '', imageUrl: '' }); setMessage('Đã lưu nhật ký vào database.'); await load();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const bookService = async (service, rental, emergency = false) => {
    setSubmitting(true); setError('');
    try {
      await apiFetch('/api/services/requests', { method: 'POST', body: JSON.stringify({ rentalId: rental.rentalId, serviceId: service.serviceId, scheduledDate: new Date().toISOString().slice(0, 10), notes: emergency ? 'Yêu cầu chăm sóc khẩn cấp cho Self-growing' : 'Yêu cầu từ Customer Dashboard' }) });
      setMessage('Yêu cầu dịch vụ đã được ghi nhận.'); await load();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const confirmHarvest = async (harvest, deliveryType) => {
    setSubmitting(true); setError('');
    try {
      await apiFetch(`/api/harvest/${harvest.harvestId}/confirm`, { method: 'PUT', body: JSON.stringify({ confirmed: true, deliveryType }) });
      setMessage('Đã xác nhận nghiệm thu và phương thức nhận nông sản.'); await load();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const renderContent = () => {
    if (view === 'contracts') return data.contracts.length ? <div className="grid gap-4">{data.contracts.map((contract) => <article key={contract.contractId} className="rounded-2xl border border-brand-border bg-white p-5"><h3 className="font-black text-brand-dark">{contract.contractNumber || `Hợp đồng #${contract.contractId}`}</h3><p className="mt-2 text-sm text-brand-muted">Trạng thái: {contract.status} · Tổng tiền: {Number(contract.totalAmount || 0).toLocaleString('vi-VN')} đ</p></article>)}</div> : <Empty text="Chưa có hợp đồng hoặc lịch sử thuê." />;
    if (view === 'plots') return rentals.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rentals.map((rental) => <article key={rental.rentalId} className="rounded-2xl border border-brand-border bg-white p-5 text-left shadow-sm"><button onClick={() => { setSelectedRentalId(rental.rentalId); navigate(`/customer/dashboard?view=tasks&rental=${rental.rentalId}`); }} className="w-full text-left"><p className="text-xs font-bold text-brand-green">{rental.plotCode}</p><h3 className="mt-1 text-lg font-black text-brand-dark">{rental.plotName}</h3><p className="mt-2 text-sm text-brand-muted">{rental.land?.address || 'Chưa có địa chỉ'} · {rental.plot?.area || rental.plotArea || '—'} m²</p><p className="mt-3 text-xs">{formatDate(rental.startDate)} → {formatDate(rental.endDate)} · {rental.cultivationMode}</p></button>{rental.cultivationMode === 'SELF_GROWING' && data.services[0] && <Button size="sm" variant="outline" disabled={submitting} className="mt-4" onClick={() => bookService(data.services[0], rental, true)}>Yêu cầu chăm sóc khẩn cấp</Button>}</article>)}</div> : <Empty text="Tài khoản này chưa có lượt thuê nào." />;
    if (view === 'tasks') { const items = scope(data.tasks); return items.length ? <div className="space-y-3">{items.map((task) => <article key={task.taskId} className="rounded-2xl border border-brand-border bg-white p-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-brand-dark">{task.title}</h3><p className="mt-1 text-xs text-brand-muted">{task.instructions}</p></div><span className="text-xs font-bold text-brand-green">{task.displayStatus || task.status}</span></div>{task.evidenceImageUrl && <img src={task.evidenceImageUrl} alt="Ảnh minh chứng" className="mt-3 h-36 rounded-xl object-cover" />}</article>)}</div> : <Empty text="Không có công việc cho phạm vi đã chọn." />; }
    if (view === 'diary') { const items = scope(data.diaries); return <><div className="mb-4 flex justify-end"><Button onClick={() => { setDiaryForm((value) => ({ ...value, rentalId: selectedRentalId || rentals[0]?.rentalId || '' })); setDiaryOpen(true); }}>Thêm nhật ký</Button></div>{items.length ? <div className="space-y-3">{items.map((entry) => <article key={entry.diaryId} className="rounded-2xl border border-brand-border bg-white p-4"><h3 className="font-bold">{entry.taskTitle || 'Nhật ký canh tác'}</h3><p className="mt-2 text-sm text-brand-muted">{entry.content}</p>{entry.imageUrl && <img src={entry.imageUrl} alt="Ảnh nhật ký" className="mt-3 h-40 rounded-xl object-cover" />}</article>)}</div> : <Empty text="Chưa có nhật ký canh tác." />}</>; }
    if (view === 'services') return <div className="grid gap-4 lg:grid-cols-2">{data.services.length ? data.services.map((service) => <article key={service.serviceId} className="rounded-2xl border border-brand-border bg-white p-5"><h3 className="font-black">{service.serviceName}</h3><p className="mt-2 text-sm text-brand-muted">{service.description}</p><p className="mt-3 font-bold text-brand-green">{Number(service.price || 0).toLocaleString('vi-VN')} đ</p><div className="mt-4 flex flex-wrap gap-2">{rentals.map((rental) => <Button key={rental.rentalId} size="sm" disabled={submitting} onClick={() => bookService(service, rental)}>Đặt cho {rental.plotCode}</Button>)}</div></article>) : <Empty text="Backend chưa có danh mục dịch vụ." />}<div className="lg:col-span-2"><h3 className="mb-3 font-black">Lịch sử yêu cầu</h3>{scope(data.requests).length ? scope(data.requests).map((request) => <p key={request.requestId} className="mb-2 rounded-xl bg-white p-3 text-sm">#{request.requestId} · {request.serviceName || request.service?.serviceName} · {request.status}</p>) : <Empty text="Chưa có yêu cầu dịch vụ." />}</div></div>;
    if (view === 'process') { const template = data.templates.find((item) => !selectedRental || Number(item.varietyId) === Number(selectedRental.varietyId)); return template ? <div className="rounded-2xl border border-brand-border bg-white p-5"><h3 className="text-lg font-black">{template.templateName || template.name}</h3><p className="text-xs text-brand-muted">Phiên bản {template.version || '—'}</p><div className="mt-4 space-y-3">{(template.steps || []).map((step) => <div key={step.stepId || step.stepOrder} className="rounded-xl bg-brand-cream p-3"><b>Ngày +{step.dayOffset || 0}: {step.stepName}</b><p className="mt-1 text-sm">{step.description}</p></div>)}</div></div> : <Empty text="Backend chưa có quy trình phù hợp cho lượt thuê này." />; }
    if (view === 'iot') return !selectedRental ? <Empty text="Chọn một thửa đất trước khi xem dữ liệu IoT." /> : iot ? <div className="grid gap-4 sm:grid-cols-3">{[['Nhiệt độ', iot.temperature, '°C'], ['Độ ẩm không khí', iot.airHumidity, '%'], ['Độ ẩm đất', iot.soilMoisture, '%']].map(([label, value, unit]) => <div key={label} className="rounded-2xl border border-brand-border bg-white p-5"><p className="text-sm text-brand-muted">{label}</p><p className="mt-2 text-3xl font-black">{value ?? '—'}{value != null ? unit : ''}</p></div>)}</div> : <Empty text="Đang tải hoặc chưa có dữ liệu cảm biến cho thửa này." />;
    if (view === 'harvest') { const items = scope(data.harvests); return items.length ? <div className="space-y-4">{items.map((harvest) => <article key={harvest.harvestId} className="rounded-2xl border border-brand-border bg-white p-5"><h3 className="font-black">Kết quả thu hoạch #{harvest.harvestId}</h3><p className="mt-2 text-sm">Khối lượng: <b>{harvest.yieldAmount} kg</b> · {formatDate(harvest.harvestDate)}</p>{harvest.evidenceImageUrl && <img src={harvest.evidenceImageUrl} alt="Ảnh cân điện tử" className="mt-3 h-40 rounded-xl object-cover" />}{harvest.customerConfirmed ? <p className="mt-3 font-bold text-emerald-700"><CheckCircle2 className="mr-1 inline h-4 w-4" />Đã nghiệm thu · {harvest.deliveryType}</p> : <div className="mt-4 flex gap-2"><Button disabled={submitting} onClick={() => confirmHarvest(harvest, 'PICKUP')}>Nhận tại nông trại</Button><Button disabled={submitting} variant="outline" onClick={() => confirmHarvest(harvest, 'DELIVERY')}>Giao tận nhà</Button></div>}</article>)}</div> : <Empty text="Chưa có kết quả thu hoạch." />; }
    return <Empty text="Không có dữ liệu." />;
  };

  return <div className="min-h-screen overflow-x-hidden bg-brand-cream"><PublicNavbar /><main className="mx-auto max-w-[1500px] px-4 pb-16 pt-24 sm:px-8 sm:pt-28"><header className="rounded-3xl bg-brand-dark p-6 text-white"><p className="text-xs font-bold text-brand-yellow">Customer Dashboard</p><h1 className="mt-1 text-2xl font-black">Vườn của {user?.fullName}</h1><p className="mt-2 text-sm text-white/70">Dữ liệu được đồng bộ qua API gateway và PostgreSQL.</p></header><nav className="my-5 flex gap-2 overflow-x-auto pb-2">{TABS.map(([id, label, Icon]) => <button key={id} onClick={() => selectView(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${view === id ? 'bg-brand-green text-white' : 'border border-brand-border bg-white text-brand-dark'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>{selectedRental && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-white p-3"><button onClick={() => { setSelectedRentalId(null); navigate(`/customer/dashboard?view=${view}`); }} className="flex items-center gap-1 text-xs font-bold text-brand-green"><ArrowLeft className="h-4 w-4" />Xem tất cả thửa</button><span className="text-xs font-bold">Phạm vi: {selectedRental.plotName} ({selectedRental.plotCode})</span></div>}{message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</div>}{error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><TriangleAlert className="mr-2 inline h-4 w-4" />{error} <button onClick={load} className="ml-2 font-bold underline">Thử lại</button></div>}{loading ? <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div> : renderContent()}</main><Modal isOpen={diaryOpen} onClose={() => setDiaryOpen(false)} title="Thêm nhật ký Self-growing"><form onSubmit={submitDiary} className="space-y-4"><select required value={diaryForm.rentalId} onChange={(e) => setDiaryForm({ ...diaryForm, rentalId: e.target.value })} className="w-full rounded-xl border p-3">{rentals.map((rental) => <option key={rental.rentalId} value={rental.rentalId}>{rental.plotName}</option>)}</select><textarea required value={diaryForm.content} onChange={(e) => setDiaryForm({ ...diaryForm, content: e.target.value })} placeholder="Nội dung nhật ký" className="min-h-28 w-full rounded-xl border p-3" /><input required type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => setDiaryForm({ ...diaryForm, imageUrl: String(reader.result) }); reader.readAsDataURL(file); } }} /><Button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu nhật ký'}</Button></form></Modal></div>;
}
