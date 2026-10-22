import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import DashboardRail from '../../components/dashboard/DashboardRail';
import { apiFetch, unwrapData } from '../../api/apiClient';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  Apple,
  Droplets,
  Flame,
  ShieldCheck,
  Layers,
  Calendar,
  Sparkles,
  QrCode,
  Scale,
  MapPin,
  PlusCircle,
  Eye,
  ArrowRight,
  PackageCheck,
  ListTodo,
  BookOpen,
  Radio,
  Trash2,
  Save,
  Printer,
  ChevronRight,
  ChevronDown,
  Box,
  Wifi,
  WifiOff,
  Home,
  Search,
  FileText,
  X
} from 'lucide-react';

// SSoT danh mục giống canh tác chuẩn theo từng thửa đất tại Happy Valley
const DEFAULT_PLOT_CROPS = {
  'P-01': 'Cà chua bi đỏ F1',
  'P-02': 'Xà lách Romaine VietGAP',
  'P-03': 'Dưa leo baby F1',
  'P-04': 'Cà chua bi đỏ F1',
  'P-05': 'Cải ngọt bông F1',
  'P-06': 'Xà lách xoăn Lollo Bionda',
  'P-07': 'Dưa leo baby F1',
  'P-08': 'Cải ngọt bông F1',
  'P-09': 'Xà lách Romaine VietGAP',
  'P-10': 'Cà chua bi đỏ F1',
  'P-11': 'Dưa leo baby F1',
  'P-12': 'Cà chua bi đỏ F1',
  'P-13': 'Cải ngọt bông F1',
  'P-14': 'Cà chua bi đỏ F1',
  'P-15': 'Cải ngọt bông F1',
  'P-16': 'Xà lách Romaine VietGAP'
};

const readPhoto = async (file, onLoad) => {
  if (!file) {
    onLoad('');
    return;
  }
  // Thử tải lên dịch vụ lưu trữ tệp Farmely (/api/files/upload - Non-Screen #22)
  try {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers,
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.fileUrl) {
        onLoad(data.data.fileUrl);
        return;
      }
    }
  } catch (err) {
    console.warn('Backend file upload fallback to DataURL:', err);
  }

  // Fallback đọc DataURL trực tiếp từ file
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result || ''));
  reader.onerror = () => onLoad('');
  reader.readAsDataURL(file);
};

const normalizeTaskStatus = (status) => {
  if (status === 'DONE' || status === 'COMPLETED') return 'COMPLETED';
  if (status === 'IN_PROG' || status === 'IN_PROGRESS') return 'IN_PROGRESS';
  return status || 'PENDING';
};

const getTaskTimingMeta = (task) => {
  if (task.status === 'COMPLETED') return { key: 'COMPLETED', label: 'Hoàn thành', tone: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', row: 'border-l-emerald-200 bg-emerald-50/30' };
  if (task.priority === 'HIGH') return { key: 'URGENT', label: 'Khẩn cấp', tone: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500', row: 'border-l-rose-500 bg-rose-50/80' };
  if (task.status === 'OVERDUE') return { key: 'OVERDUE', label: 'Quá hạn', tone: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500', row: 'border-l-rose-400 bg-rose-50/70' };
  if (task.status === 'IN_PROGRESS') return { key: 'DUE_SOON', label: 'Cần làm', tone: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500', row: 'border-l-sky-400 bg-sky-50/70' };

  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(task.deadline || '') ? new Date(`${task.deadline}T00:00:00`) : null;
  if (dueDate && !Number.isNaN(dueDate.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
    if (daysUntilDue <= 2) return { key: 'DUE_SOON', label: 'Cần làm', tone: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', row: 'border-l-amber-400 bg-amber-50/50' };
  }

  return { key: 'NOT_DUE', label: 'Chưa tới hạn', tone: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400', row: 'border-l-stone-200 bg-white' };
};

const issueStatusMeta = (issue) => {
  if (issue.status === 'RESOLVED') return { key: 'CLOSED', label: 'Đã đóng', tone: 'bg-emerald-100 text-emerald-800' };
  if (issue.expertAdvice && !issue.expertAdvice.startsWith('Đang chờ')) return { key: 'ASSIGNED', label: 'Đã giao việc', tone: 'bg-amber-100 text-amber-800' };
  return { key: 'WAITING', label: 'Chờ chuyên gia', tone: 'bg-stone-100 text-stone-600' };
};

function IssueHistory({ issues, filter, onFilter, search, onSearch, selectedIssue, onSelect, onOpenTask }) {
  const normalizedSearch = search.trim().toLowerCase();
  const visibleIssues = issues.filter((issue) => {
    const status = issueStatusMeta(issue).key;
    const matchesFilter = filter === 'ALL' || filter === status;
    const matchesSearch = !normalizedSearch || `${issue.id} ${issue.plotCode} ${issue.issueType} ${issue.description}`.toLowerCase().includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });
  const filters = [['ALL', 'Tất cả'], ['WAITING', 'Chờ chuyên gia'], ['ASSIGNED', 'Đã giao việc'], ['CLOSED', 'Đã đóng']];
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 rounded-3xl border border-brand-border bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Tìm theo mã báo cáo, nội dung, thửa đất..." className="w-full rounded-xl border border-brand-border py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" /></label>
          <div className="flex gap-2 overflow-x-auto pb-1">{filters.map(([key, label]) => <button key={key} type="button" onClick={() => onFilter(key)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${filter === key ? 'bg-[#07533d] text-white' : 'bg-stone-100 text-stone-600'}`}>{label}</button>)}</div>
        </div>
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">Để báo sự cố mới, mở thửa đất liên quan trong Việc hôm nay.</div>
        <div className="mt-4 space-y-3">
          {visibleIssues.length === 0 ? <div className="rounded-2xl border border-dashed border-brand-border p-10 text-center text-sm text-brand-muted">Không có báo cáo phù hợp bộ lọc.</div> : visibleIssues.map((issue) => {
            const meta = issueStatusMeta(issue);
            return <button key={issue.id} type="button" onClick={() => onSelect(issue)} className={`grid w-full gap-3 rounded-2xl border p-4 text-left transition sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center ${selectedIssue?.id === issue.id ? 'border-emerald-600 bg-emerald-50/60' : 'border-brand-border hover:border-emerald-300'}`}>
              <div className="flex h-14 w-16 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><FileText className="h-6 w-6" /></div>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-brand-dark">{issue.id}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${meta.tone}`}>{meta.label}</span></div><p className="mt-1 font-bold text-brand-dark">{issue.issueType}</p><p className="mt-1 truncate text-xs text-stone-500">{issue.plotCode} · {issue.sentTime}</p></div>
              <ChevronRight className="hidden h-5 w-5 text-stone-400 sm:block" />
            </button>;
          })}
        </div>
      </section>
      <aside className="rounded-3xl border border-brand-border bg-white p-5 shadow-sm xl:sticky xl:top-24">
        {selectedIssue ? <div className="space-y-5"><div className="flex items-start justify-between"><div><p className="text-xs font-black text-emerald-700">{selectedIssue.id}</p><h3 className="mt-1 font-heading text-xl font-black text-brand-dark">{selectedIssue.issueType}</h3><p className="mt-1 text-xs text-stone-500">{selectedIssue.plotCode} · {selectedIssue.sentTime}</p></div><button type="button" onClick={() => onSelect(null)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"><X className="h-4 w-4" /></button></div>{selectedIssue.imageUrl ? <img src={selectedIssue.imageUrl} alt="Ảnh báo cáo" className="h-44 w-full rounded-2xl object-cover" /> : null}<div><h4 className="text-xs font-black text-brand-dark">Tiến trình xử lý</h4><div className="mt-3 space-y-3 text-xs">{['Đã gửi báo cáo', selectedIssue.expertName ? 'Chuyên gia đã xem' : 'Chờ chuyên gia tiếp nhận', issueStatusMeta(selectedIssue).key === 'ASSIGNED' ? 'Đã giao nhiệm vụ xử lý' : null].filter(Boolean).map((label) => <div key={label} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span>{label}</span></div>)}</div></div><div className="rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-900"><strong>Phản hồi chuyên gia</strong><p className="mt-1">{selectedIssue.expertAdvice}</p></div>{issueStatusMeta(selectedIssue).key === 'ASSIGNED' ? <Button onClick={() => onOpenTask(selectedIssue)} className="w-full">Mở công việc</Button> : null}</div> : <div className="flex min-h-64 flex-col items-center justify-center text-center"><FileText className="h-9 w-9 text-emerald-200" /><p className="mt-3 text-sm font-bold text-brand-dark">Chọn một báo cáo</p><p className="mt-1 text-xs text-brand-muted">Xem tiến trình và phản hồi từ chuyên gia.</p></div>}
      </aside>
    </div>
  );
}

function HarvestRecorder({ workItems, selected, onSelect, photos, onPhotos, onRemovePhoto, weight, onWeight, confirmed, onConfirmed, user, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <section className="rounded-3xl border border-brand-border bg-white p-4 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">1</span><div><h3 className="font-heading text-lg font-black text-brand-dark">Thửa đất thu hoạch</h3><p className="text-xs text-brand-muted">Chọn đúng thửa trước khi ghi nhận.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{workItems.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${selected?.id === item.id ? 'border-emerald-600 bg-emerald-50' : 'border-brand-border'}`}><img src={item.plotCode === 'P-04' ? '/images/moc-chau-2811.jpg' : '/images/Mucangchai3.jpg'} alt="" className="h-16 w-20 rounded-xl object-cover" /><div className="min-w-0"><strong className="block truncate text-sm text-brand-dark">{item.plotCode} · {item.crop}</strong><span className="mt-1 block text-xs text-stone-500">{item.plotName}</span></div>{selected?.id === item.id ? <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" /> : null}</button>)}</div></section>
        <section className="rounded-3xl border border-brand-border bg-white p-4 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">2</span><div><h3 className="font-heading text-lg font-black text-brand-dark">Ảnh thu hoạch thực tế</h3><p className="text-xs text-brand-muted">Tối thiểu một ảnh rõ toàn bộ nông sản tại thửa.</p></div></div><label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-center"><Camera className="h-8 w-8 text-emerald-700" /><strong className="mt-2 text-sm text-brand-dark">Chụp ảnh hoặc tải ảnh lên</strong><span className="mt-1 text-xs text-brand-muted">Tối đa 4 ảnh</span><input type="file" accept="image/*" capture="environment" multiple onChange={(event) => onPhotos(event.target.files)} className="sr-only" /></label>{photos.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((photo, index) => <div key={`${photo.slice(-20)}-${index}`} className="group relative"><img src={photo} alt={`Ảnh thu hoạch ${index + 1}`} className="h-28 w-full rounded-xl object-cover" /><button type="button" onClick={() => onRemovePhoto(index)} aria-label={`Xóa ảnh ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}</div> : null}</section>
        <section className="rounded-3xl border border-brand-border bg-white p-4 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">3</span><div><h3 className="font-heading text-lg font-black text-brand-dark">Khối lượng và người ghi nhận</h3><p className="text-xs text-brand-muted">Nhập số cân thực tế và kiểm tra người thực hiện.</p></div></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-stone-50 p-4"><UserCheck className="h-6 w-6 text-emerald-700" /><strong className="mt-3 block text-brand-dark">{user?.fullName || user?.name || 'Nhân viên hiện trường'}</strong><span className="text-xs text-stone-500">Nhân viên ghi nhận</span><div className="mt-4 border-t pt-3 text-xs"><span className="text-stone-400">Thửa đất</span><strong className="mt-1 block text-brand-dark">{selected?.plotCode || 'Chưa chọn thửa'}</strong></div></div><label className="rounded-2xl border border-brand-border p-4"><span className="text-xs font-black text-brand-dark">Khối lượng thu hoạch</span><div className="mt-3 flex items-center rounded-xl border border-brand-border bg-white px-4 focus-within:border-emerald-500"><input type="number" min="0.01" step="0.01" inputMode="decimal" value={weight} onChange={(event) => onWeight(event.target.value)} placeholder="0.00" className="min-w-0 flex-1 py-3 text-xl font-black text-brand-dark outline-none" /><span className="font-bold text-stone-500">kg</span></div><p className="mt-2 text-[11px] text-stone-400">Nhập tổng khối lượng đã cân tại thửa.</p></label></div><label className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"><input type="checkbox" checked={confirmed} onChange={(event) => onConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4" />Tôi xác nhận hình ảnh và số cân trên được ghi nhận trực tiếp tại đúng thửa đất.</label></section>
      </div>
      <aside className="h-fit rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm xl:sticky xl:top-24"><h3 className="font-heading text-lg font-black text-brand-dark">Tóm tắt thu hoạch</h3><div className="mt-4 space-y-4 text-xs"><div><span className="text-stone-400">Thửa đất</span><strong className="mt-1 block text-brand-dark">{selected ? `${selected.plotCode} · ${selected.crop}` : 'Chưa chọn thửa'}</strong></div><div><span className="text-stone-400">Người ghi nhận</span><strong className="mt-1 block text-brand-dark">{user?.fullName || user?.name || 'Nhân viên hiện trường'}</strong></div><div><span className="text-stone-400">Khối lượng</span><strong className="mt-1 block text-lg text-brand-dark">{Number(weight) > 0 ? `${Number(weight).toLocaleString('vi-VN')} kg` : 'Chưa nhập'}</strong></div><div><span className="text-stone-400">Ảnh đã chụp</span><strong className="mt-1 block text-brand-dark">{photos.length} ảnh</strong></div></div><Button type="submit" disabled={!selected || photos.length === 0 || !(Number(weight) > 0) || !confirmed} className="mt-5 w-full"><Scale className="mr-2 h-4 w-4" />Hoàn tất thu hoạch</Button></aside>
    </form>
  );
}

export default function FieldWorkerDashboard() {
  const { user } = useAuthStore();
  const workerId = Number(user?.userId || user?.id);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (['tasks', 'plots', 'issues', 'harvest', 'chat'].includes(p)) return p;
    }
    return 'tasks';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dataError, setDataError] = useState('');
  const [dataSuccess, setDataSuccess] = useState('');

  // Assigned care tasks loaded from the cultivation service.
  const [tasks, setTasks] = useState([]);
  const [focusedTaskId, setFocusedTaskId] = useState(null);

  // Modal State for Task Execution / Completing with Photo Proof
  const [selectedTaskToExecute, setSelectedTaskToExecute] = useState(null);
  const [taskProofNote, setTaskProofNote] = useState('');
  const [taskProofPhoto, setTaskProofPhoto] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Worker field issue reports loaded from the cultivation service.
  const [myIssues, setMyIssues] = useState([]);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [newIssuePlot, setNewIssuePlot] = useState('');
  const [newIssueType, setNewIssueType] = useState('Sâu bệnh mặt lá');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [newIssueUrgency, setNewIssueUrgency] = useState('NORMAL');
  const [newIssuePhoto, setNewIssuePhoto] = useState('');

  // Harvest records loaded from the cultivation service.
  const [harvestTasks, setHarvestTasks] = useState([]);
  const [selectedHarvestTask, setSelectedHarvestTask] = useState(null);
  const [harvestPhotos, setHarvestPhotos] = useState([]);
  const [harvestWeight, setHarvestWeight] = useState('');
  const [harvestConfirmed, setHarvestConfirmed] = useState(false);
  const [issueFilter, setIssueFilter] = useState('ALL');
  const [issueSearch, setIssueSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [scaleWeightInput, setScaleWeightInput] = useState('');
  const [scaleTareInput, setScaleTareInput] = useState('0.50');
  const [weightBatches, setWeightBatches] = useState([]);
  const [boxSize, setBoxSize] = useState(5);
  const [boxCount, setBoxCount] = useState(0);
  const [qrReady, setQrReady] = useState(false);
  const [scaleStatus, setScaleStatus] = useState('DISCONNECTED');
  const [scaleDeviceLabel, setScaleDeviceLabel] = useState('Chưa chọn thiết bị');
  const [expandedPlots, setExpandedPlots] = useState({});
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);

  const [assignedPlots, setAssignedPlots] = useState([]);

  const loadPlots = () => {
    apiFetch('/api/rentals')
      .then((res) => {
        const list = unwrapData(res) || [];
        if (Array.isArray(list) && list.length > 0) {
          setAssignedPlots(list.map((p) => ({
            ...p,
            crop: p.varietyName || p.crop || DEFAULT_PLOT_CROPS[p.plotCode] || 'Rau củ chuẩn VietGAP'
          })));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live rentals:', err);
      });
  };

  useEffect(() => {
    loadPlots();
    if (!Number.isFinite(workerId)) return undefined;
    let cancelled = false;
    setDataError('');
    Promise.all([
      apiFetch(`/api/tasks?workerId=${workerId}`),
      apiFetch(`/api/issues?reportedBy=${workerId}`),
      apiFetch(`/api/harvest?enteredBy=${workerId}`)
    ])
      .then(([taskBody, issueBody, harvestBody]) => {
        if (cancelled) return;
        const taskData = unwrapData(taskBody) || [];
        const issueData = unwrapData(issueBody) || [];
        const harvestData = unwrapData(harvestBody) || [];
        setTasks(taskData.map((task) => ({
          id: task.taskCode || `TASK-${task.taskId}`,
          apiId: task.taskId,
          serviceRequestId: task.serviceRequestId,
          rentalId: task.rentalId,
          session: task.session || 'MORNING',
          title: task.title || 'Nhiệm vụ chăm sóc',
          plotCode: task.plotCode || 'Chưa có mã thửa',
          plotName: task.plotName || task.plotCode || 'Chưa có tên thửa',
          crop: task.cropName || task.varietyName || DEFAULT_PLOT_CROPS[task.plotCode] || 'Rau củ chuẩn VietGAP',
          customerName: task.customerName || 'Khách hàng Farmely',
          plotImage: task.plotImageUrl || (task.plotCode === 'P-04' ? '/images/moc-chau-2811.jpg' : '/images/Mucangchai3.jpg'),
          deadline: task.dueDate || 'Chưa có hạn thực hiện',
          instructions: task.instructions || task.notes || 'Chưa có hướng dẫn từ hệ thống.',
          status: normalizeTaskStatus(task.displayStatus || task.status),
          priority: task.serviceRequestId ? 'HIGH' : (task.isOverdue ? 'OVERDUE' : 'NORMAL'),
          completedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null,
          proofPhoto: task.evidenceImageUrl || null
        })));
        setMyIssues(issueData.map((issue) => ({
          id: issue.issueCode || `ISSUE-${issue.issueId}`,
          apiId: issue.issueId,
          plotCode: issue.plotCode || 'Chưa có mã thửa',
          plotName: issue.plotName || issue.plotCode || 'Chưa có tên thửa',
          issueType: issue.issueType || 'Sự cố hiện trường',
          urgency: issue.urgency || 'NORMAL',
          sentTime: issue.createdAt ? new Date(issue.createdAt).toLocaleString('vi-VN') : 'Chưa có thời gian',
          status: issue.displayStatus || issue.status || 'OPEN',
          expertAdvice: issue.resolutionNotes || 'Đang chờ chuyên gia phản hồi.',
          description: issue.description || '',
          imageUrl: issue.imageUrl || '',
          reporterName: issue.reporterName || user?.fullName || 'Nhân viên hiện trường',
          expertName: issue.expertName || '',
          createdAt: issue.createdAt || null
        })));
        const mappedHarvests = harvestData.map((harvest) => ({
          id: harvest.harvestCode || `HARVEST-${harvest.harvestId}`,
          apiId: harvest.harvestId,
          rentalId: harvest.rentalId,
          plotCode: harvest.plotCode || 'Chưa có mã thửa',
          plotName: harvest.plotName || harvest.plotCode || 'Chưa có tên thửa',
          crop: harvest.cropName || harvest.varietyName || DEFAULT_PLOT_CROPS[harvest.plotCode] || 'Rau củ chuẩn VietGAP',
          customerName: harvest.customerName || 'Khách hàng Farmely',
          expectedYield: 'Theo kết quả cân thực tế',
          status: harvest.customerConfirmed ? 'COMPLETED' : 'READY_TO_HARVEST',
          actualWeight: harvest.yieldAmount ? `${harvest.yieldAmount} kg` : '',
          photoUrl: harvest.evidenceImageUrl || '',
          staffName: harvest.workerName || 'Nhân viên hiện trường',
          verifiedAt: harvest.createdAt ? new Date(harvest.createdAt).toLocaleString('vi-VN') : ''
        }));
        setHarvestTasks(mappedHarvests);
        setSelectedHarvestTask((current) => current || mappedHarvests.find((item) => item.status !== 'COMPLETED') || mappedHarvests[0] || null);

        const plotExpansion = {};
        taskData.forEach((task) => {
          plotExpansion[task.plotCode || task.plotName || 'Chưa xác định'] = true;
        });
        setExpandedPlots(plotExpansion);
      })
      .catch((error) => {
        if (!cancelled) {
          setTasks([]);
          setMyIssues([]);
          setHarvestTasks([]);
          setDataError(error.message || 'Không thể tải dữ liệu ca trực từ hệ thống.');
        }
      });
    return () => { cancelled = true; };
  }, [workerId]);

  useEffect(() => {
    if (!newIssuePlot && tasks.length) setNewIssuePlot(tasks[0].plotCode);
  }, [newIssuePlot, tasks]);

  useEffect(() => {
    if (!selectedIssue && myIssues.length) setSelectedIssue(myIssues[0]);
  }, [myIssues, selectedIssue]);

  useEffect(() => () => {
    const reader = serialReaderRef.current;
    if (reader) reader.cancel().catch(() => {});
    const port = serialPortRef.current;
    if (port?.readable || port?.writable) port.close().catch(() => {});
  }, []);

  const handleTaskAction = async (task) => {
    setSelectedTaskToExecute(task);
  };

  // Handle Complete Task
  const handleConfirmCompleteTask = async (e) => {
    e.preventDefault();
    if (!selectedTaskToExecute) return;
    if (!taskProofPhoto) {
      setDataError('Ảnh minh chứng là bắt buộc theo quy trình nghiệm thu công việc.');
      return;
    }

    if (selectedTaskToExecute.apiId) {
      setIsUploadingPhoto(true);
      try {
        await apiFetch(`/api/tasks/${selectedTaskToExecute.apiId}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ evidenceImageUrl: taskProofPhoto, notes: taskProofNote, syncToDiary: true })
        });
      } catch (error) {
        setDataError(error.message || 'Không thể cập nhật nhiệm vụ lên hệ thống.');
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTaskToExecute.id
          ? {
              ...t,
              status: 'COMPLETED',
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              proofPhoto: taskProofPhoto
            }
      : t)
    );
    setSelectedTaskToExecute(null);
    setTaskProofNote('');
    setTaskProofPhoto('');
    setDataError('');
    setDataSuccess('Đã hoàn thành nhiệm vụ và đồng bộ ảnh vào nhật ký nông trại.');
  };

  // Handle Submit New Issue
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    const sourceTask = tasks.find((task) => task.plotCode === newIssuePlot);
    const reporterId = Number(String(user?.userId || user?.id || '').replace(/\D/g, ''));
    if (!sourceTask?.rentalId || !Number.isFinite(reporterId)) {
      alert('Hệ thống chưa có mã lượt thuê hoặc mã nhân viên cho thửa đã chọn.');
      return;
    }
    let saved;
    try {
      saved = unwrapData(await apiFetch('/api/issues', {
        method: 'POST',
        body: JSON.stringify({ rentalId: sourceTask.rentalId, reportedBy: reporterId, issueType: newIssueType, description: newIssueDesc, imageUrl: newIssuePhoto })
      })) || {};
    } catch (error) {
      setDataError(error.message || 'Không thể gửi báo cáo lên hệ thống.');
      return;
    }
    const newIssue = {
      id: saved.issueCode || `ISSUE-${saved.issueId}`,
      apiId: saved.issueId,
      plotCode: newIssuePlot,
      plotName: `Thửa ${newIssuePlot}`,
      issueType: newIssueType,
      urgency: newIssueUrgency,
      sentTime: 'Vừa xong',
      status: 'SENT',
      expertAdvice: 'Đang chờ ThS. Nam phân tích ảnh và chẩn đoán...'
    };

    setMyIssues((prev) => [newIssue, ...prev]);
    setShowNewIssueModal(false);
    setNewIssueDesc('');
    setNewIssuePhoto('');
    setDataError('');
    setDataSuccess('Đã gửi báo cáo sự cố và ảnh hiện trường cho chuyên gia.');
  };

  const connectElectronicScale = async () => {
    if (!('serial' in navigator)) {
      setScaleStatus('MANUAL');
      setScaleDeviceLabel('Trình duyệt không hỗ trợ Web Serial · nhập số cân thủ công');
      return;
    }

    try {
      setScaleStatus('CONNECTING');
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      setScaleStatus('CONNECTED');
      setScaleDeviceLabel('Cân điện tử qua cổng nối tiếp');

      const reader = port.readable.getReader();
      serialReaderRef.current = reader;
      const decoder = new TextDecoder();
      let pending = '';

      while (port.readable) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const readings = pending.split(/\r?\n/);
        pending = readings.pop() || '';
        readings.forEach((line) => {
          const match = line.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
          if (match) setScaleWeightInput(Number(match[0]).toFixed(2));
        });
      }
    } catch (error) {
      if (error?.name !== 'NotFoundError') {
        setScaleDeviceLabel('Không thể kết nối cân · có thể nhập thủ công');
      }
      setScaleStatus('MANUAL');
    } finally {
      if (serialReaderRef.current) {
        serialReaderRef.current.releaseLock();
        serialReaderRef.current = null;
      }
    }
  };

  const grossWeight = Number.parseFloat(scaleWeightInput) || 0;
  const tareWeight = Number.parseFloat(scaleTareInput) || 0;
  const currentNetWeight = Math.max(grossWeight - tareWeight, 0);
  const totalBatchWeight = weightBatches.reduce((total, batch) => total + batch.netWeight, 0);

  const addWeightBatch = () => {
    if (currentNetWeight <= 0) {
      alert('Khối lượng tịnh phải lớn hơn 0 kg.');
      return;
    }
    const nextBatch = {
      id: `${Date.now()}-${weightBatches.length + 1}`,
      order: weightBatches.length + 1,
      grossWeight,
      tareWeight,
      netWeight: currentNetWeight,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    const nextBatches = [...weightBatches, nextBatch];
    setWeightBatches(nextBatches);
    setBoxCount(Math.ceil(nextBatches.reduce((total, batch) => total + batch.netWeight, 0) / boxSize));
    setScaleWeightInput('');
    setQrReady(false);
  };

  const removeWeightBatch = (batchId) => {
    const nextBatches = weightBatches.filter((batch) => batch.id !== batchId).map((batch, index) => ({ ...batch, order: index + 1 }));
    setWeightBatches(nextBatches);
    setBoxCount(nextBatches.length ? Math.ceil(nextBatches.reduce((total, batch) => total + batch.netWeight, 0) / boxSize) : 0);
    setQrReady(false);
  };

  const openHarvestWorkspace = (task) => {
    setSelectedHarvestTask(task);
    setActiveTab('harvest');
    setHarvestPhotos([]);
    setHarvestWeight('');
    setHarvestConfirmed(false);
  };

  const handleHarvestPhotos = (files) => {
    Array.from(files || []).slice(0, Math.max(0, 4 - harvestPhotos.length)).forEach((file) => {
      readPhoto(file, (photo) => photo && setHarvestPhotos((current) => [...current, photo].slice(0, 4)));
    });
  };

  // Handle Record Harvest Scale
  const handleConfirmHarvestScale = async (e) => {
    e.preventDefault();
    const parsedWeight = Number(harvestWeight);
    if (!selectedHarvestTask || harvestPhotos.length === 0 || !(parsedWeight > 0) || !harvestConfirmed) {
      setDataError('Vui lòng chụp ít nhất một ảnh, nhập số cân và xác nhận thông tin trước khi hoàn tất.');
      return;
    }

    const enteredBy = Number(String(user?.userId || user?.id || '').replace(/\D/g, ''));
    if (!selectedHarvestTask.rentalId || !Number.isFinite(enteredBy)) {
      alert('Hệ thống chưa có mã lượt thuê hoặc mã nhân viên để ghi nhận thu hoạch.');
      return;
    }
    let saved;
    try {
      saved = unwrapData(await apiFetch('/api/harvest', {
        method: 'POST',
        body: JSON.stringify({
          rentalId: selectedHarvestTask.rentalId,
          enteredBy,
          harvestDate: new Date().toISOString().slice(0, 10),
          yieldAmount: parsedWeight,
          evidenceImageUrl: harvestPhotos[0],
          deliveryType: 'PICKUP'
        })
      })) || {};
    } catch (error) {
      setDataError(error.message || 'Không thể lưu ghi nhận thu hoạch lên hệ thống.');
      return;
    }
    const completedHarvest = {
      ...selectedHarvestTask,
      id: saved.harvestCode || `HARVEST-${saved.harvestId || Date.now()}`,
      apiId: saved.harvestId,
      status: 'COMPLETED',
      actualWeight: `${parsedWeight.toFixed(2)} kg`,
      photoUrl: saved.evidenceImageUrl || harvestPhotos[0],
      staffId: user?.id,
      staffName: user?.fullName || 'Nhân viên hiện trường',
      verifiedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setHarvestTasks((prev) => [completedHarvest, ...prev.filter((item) => item.id !== selectedHarvestTask.id)]);
    if (selectedHarvestTask.sourceTaskId) {
      setTasks((prev) => prev.map((task) => task.id === selectedHarvestTask.sourceTaskId ? { ...task, status: 'COMPLETED', completedAt: completedHarvest.verifiedAt } : task));
    }
    setSelectedHarvestTask(completedHarvest);
    setHarvestPhotos([]);
    setHarvestWeight('');
    setHarvestConfirmed(false);
    setDataError('');
    setDataSuccess('Đã lưu hình ảnh, số cân và người ghi nhận thu hoạch tại thửa.');
  };

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingCount = tasks.length - completedCount;
  const overdueCount = tasks.filter((task) => task.status === 'OVERDUE').length;
  const dueSoonCount = tasks.filter((task) => ['DUE_SOON', 'URGENT'].includes(getTaskTimingMeta(task).key)).length;
  const notDueCount = tasks.filter((task) => getTaskTimingMeta(task).key === 'NOT_DUE').length;
  const actionableCount = overdueCount + dueSoonCount;
  const nextTask = tasks.find((task) => task.status === 'IN_PROGRESS') || tasks.find((task) => task.status === 'OVERDUE') || tasks.find((task) => task.status === 'PENDING');
  const focusedTask = tasks.find((task) => task.id === focusedTaskId) || nextTask || tasks[0] || null;
  const taskRank = (task) => task.status === 'COMPLETED' ? 4 : task.priority === 'HIGH' ? 0 : task.status === 'OVERDUE' ? 1 : task.status === 'IN_PROGRESS' ? 2 : 3;
  const orderedTasks = [...tasks].sort((first, second) => taskRank(first) - taskRank(second));
  const tasksByPlot = orderedTasks.reduce((groups, task) => {
    const key = task.plotCode || task.plotName || 'Chưa xác định';
    if (!groups[key]) groups[key] = { plotCode: task.plotCode, plotName: task.plotName, crop: task.crop, plotImage: task.plotImage, tasks: [] };
    groups[key].tasks.push(task);
    return groups;
  }, {});
  const currentSession = new Date().getHours() < 12 ? 'MORNING' : 'AFTERNOON';
  const currentSessionTasks = tasks.filter((task) => task.session === currentSession);
  const harvestedWeight = harvestTasks.reduce((sum, item) => sum + (Number.parseFloat(item.actualWeight) || 0), 0);
  const harvestCandidateTasks = [...tasks.reduce((byRental, task) => {
    if (!task.rentalId) return byRental;
    const current = byRental.get(task.rentalId);
    const isHarvestTask = /thu hoạch|cân|đóng thùng/i.test(`${task.title} ${task.instructions}`);
    if (!current || isHarvestTask) byRental.set(task.rentalId, task);
    return byRental;
  }, new Map()).values()];
  const harvestTaskCandidates = harvestCandidateTasks
    .map((task) => {
      const recordedHarvest = harvestTasks.find((item) => item.rentalId === task.rentalId);
      const isHarvestTask = /thu hoạch|cân|đóng thùng/i.test(`${task.title} ${task.instructions}`);
      const resolvedCrop = task.crop || DEFAULT_PLOT_CROPS[task.plotCode] || 'Rau củ chuẩn VietGAP';
      return {
        id: `WORK-${task.id}`,
        sourceTaskId: isHarvestTask ? task.id : null,
        apiTaskId: isHarvestTask ? task.apiId : null,
        apiId: recordedHarvest?.apiId,
        rentalId: task.rentalId,
        plotCode: task.plotCode,
        plotName: task.plotName,
        crop: resolvedCrop,
        customerName: task.customerName,
        expectedYield: 'Theo kết quả cân thực tế',
        status: task.status === 'COMPLETED' || recordedHarvest ? 'COMPLETED' : 'READY_TO_HARVEST',
        actualWeight: recordedHarvest?.actualWeight || '',
        deadline: task.deadline
      };
    });
  const candidateRentalIds = new Set(harvestTaskCandidates.map((item) => item.rentalId).filter(Boolean));
  const harvestWorkItems = [
    ...harvestTaskCandidates,
    ...harvestTasks.filter((item) => !candidateRentalIds.has(item.rentalId))
  ];

  useEffect(() => {
    if (!harvestWorkItems.length) {
      setSelectedHarvestTask(null);
      return;
    }
    setSelectedHarvestTask((current) => harvestWorkItems.find((item) => item.id === current?.id) || harvestWorkItems.find((item) => item.status !== 'COMPLETED') || harvestWorkItems[0]);
  }, [tasks, harvestTasks]);

  return (
    <div className="dashboard-readable min-h-screen bg-[#F5F3E9] flex flex-col font-sans overflow-x-hidden">
      <PublicNavbar dashboardRailCollapsed={sidebarCollapsed} />

      <main className={`box-border flex-1 pt-24 sm:pt-28 pb-28 lg:pb-16 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 w-full lg:w-auto space-y-6 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ca trực hiện trường</div>
            <h1 className="mt-1 font-heading text-3xl font-black text-brand-dark sm:text-4xl">{activeTab === 'tasks' ? 'Việc hôm nay' : activeTab === 'harvest' ? 'Thu hoạch' : 'Lịch sử báo cáo'}</h1>
            <p className="mt-1 text-xs text-brand-muted">{activeTab === 'tasks' ? `${tasks.length} nhiệm vụ tại ${Object.keys(tasksByPlot).length} thửa đất` : activeTab === 'harvest' ? 'Chụp ảnh, nhập số cân và xác nhận kết quả thu hoạch tại thửa.' : 'Theo dõi các sự cố đã gửi và tiến độ xử lý từ chuyên gia.'}</p>
          </div>
          {activeTab === 'tasks' && <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-xs shadow-sm"><span className="font-bold text-stone-500">{currentSession === 'MORNING' ? 'Ca sáng' : 'Ca chiều'} · </span><strong className="text-emerald-800">{completedCount}/{tasks.length} nhiệm vụ hoàn thành</strong></div>}
        </section>

        {dataError ? (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            <span>{dataError}</span>
            <button type="button" onClick={() => setDataError('')} className="shrink-0 text-xs underline">Đóng</button>
          </div>
        ) : null}
        {dataSuccess ? (
          <div role="status" className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <span>{dataSuccess}</span>
            <button type="button" onClick={() => setDataSuccess('')} className="shrink-0 text-xs underline">Đóng</button>
          </div>
        ) : null}

        {activeTab === 'tasks' && (
          <div className="grid grid-cols-2 gap-2 sm:max-w-3xl sm:grid-cols-4 sm:gap-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 sm:px-4"><span className="block text-[10px] font-bold text-rose-700">Quá hạn</span><strong className="font-heading text-2xl text-rose-900">{overdueCount}</strong></div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 sm:px-4"><span className="block text-[10px] font-bold text-amber-700">Cần làm</span><strong className="font-heading text-2xl text-amber-900">{dueSoonCount}</strong></div>
            <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3 sm:px-4"><span className="block text-[10px] font-bold text-stone-500">Chưa tới hạn</span><strong className="font-heading text-2xl text-stone-700">{notDueCount}</strong></div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 sm:px-4"><span className="block text-[10px] font-bold text-emerald-700">Hoàn thành</span><strong className="font-heading text-2xl text-emerald-900">{completedCount}</strong></div>
          </div>
        )}

        {activeTab === 'tasks' && overdueCount > 0 ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
            Có {overdueCount} công việc đang thực hiện đã quá hạn. Nhân viên vẫn có thể mở và hoàn thành các công việc này.
          </div>
        ) : null}

        {/* Layout Left Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Worker Menu */}
          <div className="hidden lg:block">
          <DashboardRail user={user} fallbackName="Trần Văn Lực" roleLabel="Nhân sự hiện trường" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}>
            <div className={`px-2 pb-2 text-xs font-bold text-emerald-100/70 uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Nghiệp Vụ Hiện Trường</div>

            {[
              { id: 'tasks', label: 'Việc hôm nay', icon: CheckCircle2, count: pendingCount },
              { id: 'plots', label: 'Thửa Đất Phụ Trách', icon: Layers, count: assignedPlots.length },
              { id: 'harvest', label: 'Thu hoạch & đóng gói', icon: PackageCheck, count: harvestWorkItems.filter(h => h.status !== 'COMPLETED').length },
              { id: 'issues', label: 'Báo cáo sự cố', icon: AlertTriangle, count: myIssues.length }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={sidebarCollapsed ? tab.label : undefined}
                  aria-label={sidebarCollapsed ? tab.label : undefined}
                  className={`relative group min-h-11 w-full px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
                    isActive
                      ? 'bg-white text-[#064b37] shadow-sm'
                      : 'text-emerald-50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-emerald-100/80'}`} />
                    <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{tab.label}</span>
                  </div>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`${sidebarCollapsed ? 'lg:hidden' : ''} px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-brand-yellow text-brand-dark' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {sidebarCollapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">{tab.label}</span>}
                </button>
              );
            })}
          </DashboardRail>
          </div>

          {/* Worker Main Section */}
          <section className="flex-1 min-w-0 w-full space-y-6">

            {/* Assigned care tasks */}
            {activeTab === 'tasks' && (
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5 rounded-3xl border border-brand-border bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex flex-col justify-between gap-3 border-b border-brand-border/60 pb-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-heading text-xl font-black text-brand-dark">Nhiệm vụ theo thửa</h3>
                      <p className="mt-0.5 text-xs text-brand-muted">Chọn một nhiệm vụ để xem hướng dẫn và thao tác tại hiện trường.</p>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-brand-green">{actionableCount} việc cần làm</span>
                  </div>

                  <div className="space-y-4">
                  {Object.values(tasksByPlot).length === 0 && (
                    <div className="rounded-2xl border border-dashed border-brand-border p-8 text-center text-sm text-brand-muted">Chưa có nhiệm vụ được phân công từ hệ thống.</div>
                  )}
                  {Object.values(tasksByPlot).map((plotGroup) => {
                    const plotKey = plotGroup.plotCode || plotGroup.plotName;
                    const isExpanded = expandedPlots[plotKey] !== false;
                    const completedForPlot = plotGroup.tasks.filter((task) => task.status === 'COMPLETED').length;
                    return (
                      <section key={plotKey} className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
                        <div className="relative h-28 overflow-hidden bg-emerald-950 sm:h-36">
                          <img src={plotGroup.plotImage} alt="" className="h-full w-full object-cover opacity-75" />
                          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent" />
                          <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
                            <div><span className="rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-black">Đang trực</span><h4 className="mt-2 font-heading text-xl font-black">{plotGroup.plotCode} · {plotGroup.crop}</h4></div>
                            <Button type="button" variant="danger" size="sm" onClick={() => { setNewIssuePlot(plotGroup.plotCode); setShowNewIssueModal(true); }}><AlertTriangle className="mr-1 h-3.5 w-3.5" />Báo sự cố</Button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedPlots((current) => ({ ...current, [plotKey]: !isExpanded }))}
                          className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-emerald-50/40"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate font-heading text-base font-black text-brand-dark">{plotGroup.plotName}</h4>
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">{plotGroup.crop}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-stone-100">
                                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${plotGroup.tasks.length ? (completedForPlot / plotGroup.tasks.length) * 100 : 0}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-stone-500">{completedForPlot}/{plotGroup.tasks.length} nhiệm vụ</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown className="h-5 w-5 text-stone-400" /> : <ChevronRight className="h-5 w-5 text-stone-400" />}
                        </button>

                        {isExpanded && (
                          <div className="divide-y divide-brand-border/60 border-t border-brand-border/60">
                            {plotGroup.tasks.map((task) => {
                              const isDone = task.status === 'COMPLETED';
                              const isHarvestTask = /thu hoạch|cân|đóng thùng/i.test(task.title);
                              const isFocused = focusedTask?.id === task.id;
                              const timing = getTaskTimingMeta(task);
                              return (
                                <div
                                  key={task.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setFocusedTaskId(task.id)}
                                  onKeyDown={(event) => event.key === 'Enter' && setFocusedTaskId(task.id)}
                                  className={`grid cursor-pointer gap-3 border-l-4 p-4 text-xs transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${isFocused ? 'ring-1 ring-inset ring-emerald-500/40' : ''} ${timing.row}`}
                                >
                                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${timing.tone}`}>
                                    <span className={`h-2 w-2 rounded-full ${timing.dot}`} />
                                    {timing.label}
                                  </span>
                                  <div className="min-w-0">
                                    <h5 className="font-heading text-sm font-black text-brand-dark">{task.title}</h5>
                                    <p className="mt-1 line-clamp-2 text-stone-500"><Clock className="mr-1 inline h-3.5 w-3.5" />{task.deadline} · {task.instructions}</p>
                                  </div>
                                  {!isDone && (
                                    <Button
                                      variant={isHarvestTask ? 'secondary' : 'outline'}
                                      size="sm"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (isHarvestTask) {
                                           const harvest = harvestWorkItems.find((item) => item.plotCode === task.plotCode) || harvestWorkItems.find((item) => item.status !== 'COMPLETED');
                                          if (harvest) openHarvestWorkspace(harvest);
                                           else handleTaskAction(task);
                                        } else {
                                           handleTaskAction(task);
                                        }
                                      }}
                                      className="w-full gap-1.5 font-bold sm:w-auto"
                                    >
                                      {isHarvestTask ? <Scale className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                      {isHarvestTask ? 'Thu hoạch' : 'Hoàn thành'}
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
                </div>

                <aside className="overflow-hidden rounded-3xl border border-brand-border bg-white shadow-sm xl:sticky xl:top-24">
                  {focusedTask ? (
                    <>
                      <div className="bg-gradient-to-br from-[#07533d] to-[#16785a] p-5 text-white">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black tracking-wide">{focusedTask.plotCode}</span>
                            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">Chi tiết công việc</p>
                            <h3 className="mt-1 font-heading text-xl font-black leading-tight">{focusedTask.title}</h3>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${getTaskTimingMeta(focusedTask).tone}`}>
                            {getTaskTimingMeta(focusedTask).label}
                          </span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-50"><MapPin className="h-4 w-4" />{focusedTask.plotName}</div>
                      </div>

                      <div className="space-y-5 p-5">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl bg-stone-50 p-3"><p className="text-stone-400">Cây trồng</p><p className="mt-1 font-bold text-brand-dark">{focusedTask.crop || 'Theo thửa'}</p></div>
                          <div className="rounded-xl bg-stone-50 p-3"><p className="text-stone-400">Hạn thực hiện</p><p className="mt-1 font-bold text-brand-dark">{focusedTask.deadline || 'Trong ca'}</p></div>
                        </div>

                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-dark"><BookOpen className="h-4 w-4 text-emerald-700" />Hướng dẫn kỹ thuật</h4>
                          <p className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs leading-5 text-stone-600">{focusedTask.instructions}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wide text-brand-dark">Các bước thực hiện</h4>
                          <div className="mt-2 space-y-2 text-xs text-stone-600">
                            {['Đọc hướng dẫn kỹ thuật', `Thực hiện tại ${focusedTask.plotName}`, 'Chụp ảnh minh chứng trước khi hoàn tất'].map((label, index) => (
                              <div key={label} className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800">{index + 1}</span>{label}</div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-center">
                          {focusedTask.proofPhoto ? <img src={focusedTask.proofPhoto} alt="Ảnh minh chứng" className="mx-auto h-28 w-full rounded-xl object-cover" /> : <><Camera className="mx-auto h-6 w-6 text-stone-400" /><p className="mt-2 text-xs font-bold text-stone-600">Ảnh minh chứng hiện trường</p><p className="mt-1 text-[10px] text-stone-400">Ảnh được tải lên khi hoàn thành công việc</p></>}
                        </div>

                        {focusedTask.status !== 'COMPLETED' ? (
                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                            <Button
                              variant="primary"
                              onClick={() => {
                                if (/thu hoạch|cân|đóng thùng/i.test(focusedTask.title)) {
                                   const harvest = harvestWorkItems.find((item) => item.plotCode === focusedTask.plotCode) || harvestWorkItems.find((item) => item.status !== 'COMPLETED');
                                  if (harvest) openHarvestWorkspace(harvest);
                                   else handleTaskAction(focusedTask);
                                 } else handleTaskAction(focusedTask);
                              }}
                              className="w-full gap-2 font-bold"
                            >
                              {/thu hoạch|cân|đóng thùng/i.test(focusedTask.title) ? <Scale className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                              {/thu hoạch|cân|đóng thùng/i.test(focusedTask.title) ? 'Thu hoạch' : 'Hoàn thành công việc'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowNewIssueModal(true)} className="w-full gap-2 font-bold"><AlertTriangle className="h-4 w-4" />Báo sự cố</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Đã hoàn thành {focusedTask.completedAt ? `lúc ${focusedTask.completedAt}` : ''}</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-sm text-brand-muted">Chọn một nhiệm vụ để xem chi tiết.</div>
                  )}
                </aside>
              </div>
            )}

            {/* TAB: ASSIGNED PLOTS (Thửa Đất Được Phân Công Phụ Trách - BR14) */}
            {activeTab === 'plots' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-800" />
                      <span>Thửa Đất Được Phân Công Chăm Sóc</span>
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Danh sách các thửa đất thực địa được Ban Quản Trị giao cho bạn phụ trách canh tác và vận hành trạm IoT.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    {assignedPlots.length} Thửa Đất Phụ Trách
                  </span>
                </div>

                <div className="space-y-4">
                  {assignedPlots.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 space-y-2">
                      <Layers className="w-10 h-10 mx-auto text-stone-300" />
                      <p className="font-bold text-sm">Chưa có thửa đất nào được phân công</p>
                    </div>
                  ) : (
                    assignedPlots.map((plot) => (
                      <div
                        key={plot.id || plot.rentalId}
                        className="p-5 rounded-2xl border border-brand-border bg-white hover:border-emerald-300 transition-all shadow-2xs space-y-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-emerald-800 text-sm">{plot.plotCode}</span>
                            <span className="font-bold text-brand-dark text-sm">{plot.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                              {plot.contractCode}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              👷 CVLĐ Phụ trách: {plot.staffName && !String(plot.staffName).includes('Chưa') ? `${plot.staffName} (CVLĐ)` : 'Chưa chỉ định CVLĐ'}
                            </span>
                            {plot.expertName && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                                🔬 CGNN Cố Vấn: {plot.expertName}
                              </span>
                            )}
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ● Đang chăm sóc
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-stone-600 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/60">
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Khách Hàng Thuê:</span>
                            <span className="font-bold text-brand-dark text-xs block">{plot.renterName}</span>
                            <span className="text-[11px] text-stone-500">{plot.renterEmail || 'Khách thuê'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Giống Canh Tác:</span>
                            <span className="font-bold text-emerald-800 text-xs block">{plot.crop}</span>
                            <span className="text-[11px] text-stone-500">{plot.stage}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Vị Trí & Diện Tích:</span>
                            <span className="font-bold text-brand-dark text-xs block">{plot.location}</span>
                            <span className="text-[11px] text-stone-500">{plot.area}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Trạm Quan Trắc IoT:</span>
                            <span className="font-bold text-sky-800 text-xs block">{plot.temp} • Ẩm: {plot.soilMoisture}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold">Tự động hoãn tưới nếu độ ẩm đất &ge; 80%</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setNewIssuePlot(plot.plotCode || 'P-01');
                              setShowNewIssueModal(true);
                            }}
                            className="font-bold text-xs gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Báo Cáo Sự Cố Thửa Đất Này</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Field issues */}
            {activeTab === 'issues' && (
              <IssueHistory
                issues={myIssues}
                filter={issueFilter}
                onFilter={setIssueFilter}
                search={issueSearch}
                onSearch={setIssueSearch}
                selectedIssue={selectedIssue}
                onSelect={setSelectedIssue}
                onOpenTask={(issue) => {
                  const linked = tasks.find((task) => task.plotCode === issue.plotCode && task.status !== 'COMPLETED');
                  if (linked) setFocusedTaskId(linked.id);
                  setActiveTab('tasks');
                }}
              />
            )}

            {activeTab === 'harvest' && (
              <HarvestRecorder
                workItems={harvestWorkItems}
                selected={selectedHarvestTask}
                onSelect={openHarvestWorkspace}
                photos={harvestPhotos}
                onPhotos={handleHarvestPhotos}
                onRemovePhoto={(index) => setHarvestPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                weight={harvestWeight}
                onWeight={setHarvestWeight}
                confirmed={harvestConfirmed}
                onConfirmed={setHarvestConfirmed}
                user={user}
                onSubmit={handleConfirmHarvestScale}
              />
            )}

            {/* Legacy weighing workspace retained temporarily for data migration, never rendered. */}
            {false && activeTab === 'harvest' && (
              <div className="grid min-h-[680px] overflow-hidden rounded-3xl border border-brand-border bg-white shadow-sm xl:grid-cols-[minmax(260px,0.75fr)_minmax(430px,1.25fr)]">
                <aside className="border-b border-brand-border bg-[#faf9f4] p-4 sm:p-6 xl:border-b-0 xl:border-r">
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Thu hoạch & đóng gói</p>
                    <h3 className="mt-1 font-heading text-xl font-black text-brand-dark">Đợt cần xử lý</h3>
                    <p className="mt-1 text-xs text-brand-muted">Chọn thửa để mở cân điện tử và hồ sơ đóng thùng.</p>
                  </div>
                  <div className="space-y-3">
                    {harvestWorkItems.length === 0 && <div className="rounded-2xl border border-dashed border-brand-border p-6 text-center text-xs text-brand-muted">Chưa có nhiệm vụ thu hoạch từ hệ thống.</div>}
                    {harvestWorkItems.map((task) => {
                      const active = selectedHarvestTask?.id === task.id;
                      return (
                        <button key={task.id} type="button" onClick={() => openHarvestWorkspace(task)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-brand-border bg-white hover:border-emerald-300'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-heading text-sm font-black text-brand-dark">{task.plotName}</p>
                              <p className="mt-0.5 truncate text-[11px] text-stone-500">{task.plotCode} · {task.crop}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{task.status === 'COMPLETED' ? 'Đã ghi nhận' : 'Sẵn sàng cân'}</span>
                            {task.actualWeight && <strong className="text-xs text-emerald-800">{task.actualWeight}</strong>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <section className="min-w-0 p-4 sm:p-6">
                  {!selectedHarvestTask ? (
                    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                      <Scale className="h-12 w-12 text-emerald-200" />
                      <h4 className="mt-3 font-heading text-lg font-black text-brand-dark">Chọn một đợt thu hoạch</h4>
                      <p className="mt-1 max-w-sm text-xs text-brand-muted">Dữ liệu cân, đóng thùng và QR sẽ được ghi nhận theo đúng thửa đã chọn.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleConfirmHarvestScale} className="space-y-4">
                      <div className="flex flex-col gap-3 border-b border-brand-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /><span className="text-xs font-bold text-sky-700">Đang làm</span></div>
                          <h3 className="mt-1 font-heading text-xl font-black text-brand-dark">Cân và đóng thùng</h3>
                          <p className="mt-1 text-xs text-stone-500">{selectedHarvestTask.plotName} ({selectedHarvestTask.plotCode}) · {selectedHarvestTask.crop}</p>
                        </div>
                        <Button type="button" variant="danger" size="sm" onClick={() => { setNewIssuePlot(selectedHarvestTask.plotCode); setShowNewIssueModal(true); }}><AlertTriangle className="mr-1 h-3.5 w-3.5" />Báo sự cố</Button>
                      </div>

                      <div className="rounded-2xl border border-brand-border bg-stone-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><Scale className="h-6 w-6" /></div>
                            <div><p className="font-heading text-sm font-black text-brand-dark">Cân điện tử</p><p className="text-[11px] text-stone-500">{scaleDeviceLabel}</p></div>
                          </div>
                          <Button type="button" variant={scaleStatus === 'CONNECTED' ? 'secondary' : 'outline'} size="sm" onClick={connectElectronicScale} disabled={scaleStatus === 'CONNECTING'}>
                            {scaleStatus === 'CONNECTED' ? <Wifi className="mr-1 h-3.5 w-3.5" /> : <WifiOff className="mr-1 h-3.5 w-3.5" />}
                            {scaleStatus === 'CONNECTED' ? 'Đã kết nối' : scaleStatus === 'CONNECTING' ? 'Đang kết nối...' : 'Kết nối cân'}
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                        <p className="text-xs font-bold text-brand-dark">Khối lượng hiện tại</p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_110px] sm:items-end">
                          <label className="block"><span className="sr-only">Khối lượng tổng</span><div className="relative"><input type="number" min="0" step="0.01" value={scaleWeightInput} onChange={(event) => setScaleWeightInput(event.target.value)} placeholder="0.00" className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 pr-14 font-heading text-3xl font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-300" /><span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">kg</span></div></label>
                          <label className="text-[10px] font-bold text-stone-500">Bì (kg)<input type="number" min="0" step="0.01" value={scaleTareInput} onChange={(event) => setScaleTareInput(event.target.value)} className="mt-1 w-full rounded-xl border border-brand-border bg-white px-3 py-3 text-sm font-black text-brand-dark" /></label>
                          <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5"><span className="block text-[10px] font-bold text-stone-500">Tịnh</span><strong className="text-lg text-emerald-800">{currentNetWeight.toFixed(2)} kg</strong></div>
                        </div>
                        <Button type="button" variant="secondary" onClick={addWeightBatch} className="mt-3 w-full"><Save className="mr-1.5 h-4 w-4" />Lưu mẻ cân</Button>
                      </div>

                      <div className="rounded-2xl border border-brand-border p-4">
                        <div className="mb-3 flex items-center justify-between"><h4 className="font-heading text-sm font-black text-brand-dark">Danh sách mẻ cân</h4><span className="text-[11px] font-bold text-stone-400">{weightBatches.length} mẻ</span></div>
                        {weightBatches.length === 0 ? <p className="rounded-xl bg-stone-50 p-4 text-center text-xs text-stone-400">Chưa lưu mẻ cân nào.</p> : <div className="divide-y divide-brand-border/60">{weightBatches.map((batch) => <div key={batch.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 py-2.5 text-xs"><span className="font-bold text-brand-dark">Mẻ #{String(batch.order).padStart(2, '0')}</span><strong className="text-emerald-800">{batch.netWeight.toFixed(2)} kg</strong><span className="text-stone-400">{batch.time}</span><button type="button" onClick={() => removeWeightBatch(batch.id)} className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Xóa mẻ cân ${batch.order}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}
                        <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5"><span className="text-xs font-black text-brand-dark">Tổng tịnh</span><strong className="text-lg text-emerald-800">{totalBatchWeight.toFixed(2)} kg</strong></div>
                      </div>

                      <div className="rounded-2xl border border-brand-border p-4">
                        <h4 className="font-heading text-sm font-black text-brand-dark">Đóng thùng & tạo QR</h4>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                          <label className="text-[10px] font-bold text-stone-500">Loại thùng<select value={boxSize} onChange={(event) => { const next = Number(event.target.value); setBoxSize(next); setBoxCount(totalBatchWeight ? Math.ceil(totalBatchWeight / next) : 0); setQrReady(false); }} className="mt-1 w-full rounded-xl border border-brand-border bg-white px-3 py-3 text-sm font-bold text-brand-dark"><option value={2}>2 kg</option><option value={5}>5 kg</option><option value={10}>10 kg</option></select></label>
                          <label className="text-[10px] font-bold text-stone-500">Số lượng thùng<input type="number" min="0" value={boxCount} onChange={(event) => { setBoxCount(Number(event.target.value)); setQrReady(false); }} className="mt-1 w-full rounded-xl border border-brand-border px-3 py-3 text-sm font-bold text-brand-dark" /></label>
                          <Button type="button" variant="outline" onClick={() => {
                            if (totalBatchWeight <= 0 || boxCount <= 0) {
                              alert('Vui lòng lưu mẻ cân và chọn số lượng thùng.');
                              return;
                            }
                            if (qrReady) window.print();
                            else setQrReady(true);
                          }}><Printer className="mr-1.5 h-4 w-4" />{qrReady ? 'In tem QR' : 'Tạo tem QR'}</Button>
                        </div>
                        {qrReady && <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><QrCode className="h-12 w-12 text-brand-dark" /><div><p className="text-xs font-black text-brand-dark">Tem truy xuất đã sẵn sàng</p><p className="text-[10px] text-emerald-700">{boxCount} thùng · {boxSize} kg/thùng · {selectedHarvestTask.plotCode}</p></div></div>}
                      </div>

                      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-brand-border bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
                        <Button type="button" variant="outline"><Save className="mr-1 h-4 w-4" />Lưu tạm</Button>
                        <Button type="submit" variant="secondary" disabled={totalBatchWeight <= 0 || boxCount <= 0}><CheckCircle2 className="mr-1 h-4 w-4" />Hoàn tất & gửi nghiệm thu</Button>
                      </div>
                    </form>
                  )}
                </section>
              </div>
            )}

          </section>
        </div>

      </main>

      {/* Modal 1: Execute Task & Upload Proof Photo */}
      <Modal
        isOpen={Boolean(selectedTaskToExecute)}
        onClose={() => setSelectedTaskToExecute(null)}
        title="Xác Nhận Hoàn Thành Ca Trực Hiện Trường"
        subtitle={selectedTaskToExecute?.title}
      >
        {selectedTaskToExecute && (
          <form onSubmit={handleConfirmCompleteTask} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-brand-cream border border-brand-border space-y-1">
              <p><strong>Nhiệm vụ:</strong> {selectedTaskToExecute.title}</p>
              <p><strong>Thửa đất:</strong> {selectedTaskToExecute.plotName} ({selectedTaskToExecute.plotCode})</p>
              <p><strong>Khách hàng:</strong> {selectedTaskToExecute.customerName}</p>
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-1.5 bg-stone-50">
              <Camera className="w-7 h-7 text-brand-green mx-auto" />
              <p className="font-bold text-stone-700">Đính kèm ảnh minh chứng thực tế</p>
              <p className="text-[10px] text-stone-400">Ảnh này sẽ tự động xuất hiện trên Farm Diary của khách hàng</p>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(event) => readPhoto(event.target.files?.[0], setTaskProofPhoto)}
                className="mx-auto block max-w-full text-[10px] text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:font-bold file:text-emerald-800"
              />
              {taskProofPhoto && <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800">✓ Đã chọn ảnh minh chứng</span>}
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">
                Ghi chú ca trực gửi khách hàng (Tùy chọn):
              </label>
              <textarea
                rows={2}
                value={taskProofNote}
                onChange={(e) => setTaskProofNote(e.target.value)}
                placeholder="Ví dụ: Đã tưới đẫm đất, lá xanh tốt, không phát hiện sâu bệnh..."
                className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTaskToExecute(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                {isUploadingPhoto ? 'ĐANG ĐỒNG BỘ...' : 'XÁC NHẬN HOÀN TẤT & ĐỒNG BỘ DIARY'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 2: Report Field Issue */}
      <Modal
        isOpen={showNewIssueModal}
        onClose={() => setShowNewIssueModal(false)}
        title="Gửi Báo Cáo Sự Cố Đồng Ruộng Mới"
        subtitle="Chuyển ngay tới Chuyên gia Nông nghiệp ThS. Nam"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Thửa Đất Phát Hiện Sự Cố:</label>
            <select
              value={newIssuePlot}
              onChange={(e) => setNewIssuePlot(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
            >
              {[...new Map(tasks.map((task) => [task.plotCode, task])).values()].map((task) => (
                <option key={task.plotCode} value={task.plotCode}>{task.plotName} ({task.plotCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Loại Bất Thường:</label>
            <select
              value={newIssueType}
              onChange={(e) => setNewIssueType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
            >
              <option value="Sâu bệnh mặt lá (Bọ trĩ, rầy mềm)">Sâu bệnh mặt lá (Bọ trĩ, rầy mềm)</option>
              <option value="Ống tưới nhỏ giọt bị rò rỉ / nghẹt cặn">Ống tưới nhỏ giọt bị rò rỉ / nghẹt cặn</option>
              <option value="Đất nứt nẻ thiếu ẩm">Đất nứt nẻ thiếu ẩm</option>
              <option value="Cây héo rũ gốc / thối rễ">Cây héo rũ gốc / thối rễ</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mức Độ Khẩn Cấp:</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={newIssueUrgency === 'NORMAL'}
                  onChange={() => setNewIssueUrgency('NORMAL')}
                />
                <span>Bình thường (Xử lý trong ngày)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-border cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={newIssueUrgency === 'HIGH'}
                  onChange={() => setNewIssueUrgency('HIGH')}
                />
                <span className="text-rose-600 font-bold">Khẩn cấp (Cần phác đồ ngay)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Mô Tả Hiện Trường:</label>
            <textarea
              rows={3}
              required
              value={newIssueDesc}
              onChange={(e) => setNewIssueDesc(e.target.value)}
              placeholder="Mô tả cụ thể vị trí, số lượng cây bị ảnh hưởng..."
              className="w-full p-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-green/20"
            />
          </div>

          <div className="p-3 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-1 bg-stone-50">
            <Camera className="w-5 h-5 text-stone-400 mx-auto" />
            <p className="font-bold text-stone-600">Đính kèm ảnh chụp lá / hiện trường</p>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(event) => readPhoto(event.target.files?.[0], setNewIssuePhoto)}
              className="mx-auto block max-w-full text-[10px] text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-1.5 file:font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowNewIssueModal(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              GỬI BÁO CÁO CHO CHUYÊN GIA
            </Button>
          </div>
        </form>
      </Modal>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-brand-border bg-white/95 p-1.5 shadow-elevated backdrop-blur lg:hidden" aria-label="Điều hướng nhân viên hiện trường">
        {[
          { id: 'tasks', label: 'Công việc', icon: ListTodo },
          { id: 'plots', label: 'Thửa đất', icon: Layers },
          { id: 'harvest', label: 'Thu hoạch', icon: Camera },
          { id: 'issues', label: 'Sự cố', icon: FileText }
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${active ? 'bg-[#064b37] text-white' : 'text-stone-500 hover:bg-stone-50'}`}><Icon className="h-5 w-5" />{item.label}</button>;
        })}
        <button type="button" onClick={() => window.dispatchEvent(new Event('farmely:open-profile'))} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-stone-500 hover:bg-stone-50"><UserCheck className="h-5 w-5" />Tài khoản</button>
      </nav>

      <div className={`transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        <Footer />
      </div>
    </div>
  );
}
