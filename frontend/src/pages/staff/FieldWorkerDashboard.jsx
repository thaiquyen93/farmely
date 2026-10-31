import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Check,
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
  X,
  ShoppingBag,
  Activity,
  Sun,
  Thermometer,
  Gauge
} from 'lucide-react';
import { recordStaffActivity, resolveStandardCropProcess } from '../../services/cropStandardProcess';



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
  if (task.status === 'COMPLETED') {
    return {
      key: 'COMPLETED',
      label: 'Hoàn thành',
      tone: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      dot: 'bg-emerald-500',
      row: 'border-l-emerald-400 bg-emerald-50/30'
    };
  }

  const rawDate = task.dueDate || (/^\d{4}-\d{2}-\d{2}$/.test(task.deadline || '') ? task.deadline : null);
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

  // 1. Nếu hạn ở tương lai (sau ngày hôm nay) -> Bắt buộc là Chưa tới hạn (không lôi vào Việc Hôm Nay)
  if (rawDate && rawDate > todayStr) {
    const isPriority = task.priority === 'HIGH' || task.priority === 'URGENT' || task.priority === 'EMERGENCY';
    return {
      key: 'NOT_DUE',
      label: isPriority ? 'Ưu tiên cao (Chưa tới hạn)' : 'Chưa tới hạn',
      tone: isPriority ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-stone-100 text-stone-600 border border-stone-200',
      dot: isPriority ? 'bg-amber-500' : 'bg-stone-400',
      row: 'border-l-stone-300 bg-white'
    };
  }

  // 2. Nếu đang làm trong ca
  if (task.status === 'IN_PROGRESS') {
    return {
      key: 'TODAY',
      label: 'Đang làm trong ca',
      tone: 'bg-sky-100 text-sky-800 border border-sky-300 font-bold',
      dot: 'bg-sky-500 animate-pulse',
      row: 'border-l-sky-500 bg-sky-50/60'
    };
  }

  // 3. Nếu là sự cố khẩn cấp (LÀM NGAY) trong ca hôm nay
  if (task.priority === 'EMERGENCY' || String(task.title || '').includes('[LÀM NGAY]')) {
    return {
      key: 'URGENT',
      label: 'Khẩn cấp',
      tone: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
      dot: 'bg-rose-500 animate-pulse',
      row: 'border-l-rose-500 bg-rose-50/80'
    };
  }

  // 4. Nếu quá hạn (ở quá khứ)
  if (rawDate && rawDate < todayStr) {
    const isHigh = task.priority === 'HIGH' || task.priority === 'URGENT';
    return {
      key: 'OVERDUE',
      label: isHigh ? 'Cần làm gấp (Quá hạn)' : 'Cần làm (Quá hạn)',
      tone: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold',
      dot: 'bg-rose-500',
      row: 'border-l-rose-400 bg-rose-50/70'
    };
  }

  // 5. Nếu đến hạn hôm nay
  if (task.priority === 'HIGH' || task.priority === 'URGENT') {
    return {
      key: 'TODAY',
      label: 'Ưu tiên hôm nay',
      tone: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      dot: 'bg-amber-500 animate-pulse',
      row: 'border-l-amber-500 bg-amber-50/50'
    };
  }

  return {
    key: 'TODAY',
    label: 'Hôm nay',
    tone: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold',
    dot: 'bg-emerald-500',
    row: 'border-l-emerald-500 bg-emerald-50/40'
  };
};

const issueStatusMeta = (issue) => {
  if (issue.status === 'RESOLVED') return { key: 'CLOSED', label: 'Đã đóng', tone: 'bg-emerald-100 text-emerald-800' };
  if (issue.expertAdvice && !issue.expertAdvice.startsWith('Đang chờ')) return { key: 'ASSIGNED', label: 'Đã giao việc', tone: 'bg-amber-100 text-amber-800' };
  return { key: 'WAITING', label: 'Chờ chuyên gia', tone: 'bg-stone-100 text-stone-600' };
};

const formatDateVN = (dateStr) => {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return dateStr;
};

const formatCleanArea = (val) => {
  if (!val || val === '—') return '—';
  const num = String(val).replace(/[^0-9.]/g, '');
  return num ? `${num} m²` : '—';
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
        <section className="rounded-3xl border border-brand-border bg-white p-4 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">1</span><div><h3 className="font-heading text-lg font-black text-brand-dark">Thửa đất thu hoạch</h3><p className="text-xs text-brand-muted">Chọn đúng thửa trước khi ghi nhận.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{workItems.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${selected?.id === item.id ? 'border-emerald-600 bg-emerald-50' : 'border-brand-border'}`}><div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold font-mono text-sm">{item.plotCode}</div><div className="min-w-0"><strong className="block truncate text-sm text-brand-dark">{item.plotCode} · {item.crop}</strong><span className="mt-1 block text-xs text-stone-500">{item.plotName}</span></div>{selected?.id === item.id ? <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" /> : null}</button>)}</div></section>
        <section className="rounded-3xl border border-brand-border bg-white p-4 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">2</span><div><h3 className="font-heading text-lg font-black text-brand-dark">Ảnh thu hoạch thực tế</h3><p className="text-xs text-brand-muted">Tối thiểu một ảnh rõ toàn bộ nông sản tại thửa.</p></div></div><label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-center"><Camera className="h-8 w-8 text-emerald-700" /><strong className="mt-2 text-sm text-brand-dark">Chụp ảnh hoặc tải ảnh lên</strong><span className="mt-1 text-xs text-brand-muted">Tối đa 4 ảnh</span><input type="file" accept="image/*" capture="environment" multiple onChange={(event) => onPhotos(event.target.files)} className="sr-only" /></label>{photos.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((photo, index) => <div key={`${photo.slice(-20)}-${index}`} className="group relative"><img src={photo} alt={`Ảnh thu hoạch ${index + 1}`} className="h-28 w-full rounded-xl object-cover" /><button type="button" onClick={() => onRemovePhoto(index)} aria-label={`Xóa ảnh ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}</div> : null}</section>
        <section className="rounded-3xl border border-brand-border bg-white p-4 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-black text-white">3</span><div><h3 className="font-heading text-lg font-black text-brand-dark">Khối lượng và người ghi nhận</h3><p className="text-xs text-brand-muted">Nhập số cân thực tế và kiểm tra người thực hiện.</p></div></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-stone-50 p-4"><UserCheck className="h-6 w-6 text-emerald-700" /><strong className="mt-3 block text-brand-dark">{user?.fullName || user?.name || 'Nhân viên hiện trường'}</strong><span className="text-xs text-stone-500">Nhân viên ghi nhận</span><div className="mt-4 border-t pt-3 text-xs"><span className="text-stone-400">Thửa đất</span><strong className="mt-1 block text-brand-dark">{selected?.plotCode || 'Chưa chọn thửa'}</strong></div></div><label className="rounded-2xl border border-brand-border p-4"><span className="text-xs font-black text-brand-dark">Khối lượng thu hoạch</span><div className="mt-3 flex items-center rounded-xl border border-brand-border bg-white px-4 focus-within:border-emerald-500"><input type="number" min="0.01" step="0.01" inputMode="decimal" value={weight} onChange={(event) => onWeight(event.target.value)} placeholder="0.00" className="min-w-0 flex-1 py-3 text-xl font-black text-brand-dark outline-none" /><span className="font-bold text-stone-500">kg</span></div><p className="mt-2 text-[11px] text-stone-400">Nhập tổng khối lượng đã cân tại thửa.</p></label></div><label className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"><input type="checkbox" checked={confirmed} onChange={(event) => onConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4" />Tôi xác nhận hình ảnh và số cân trên được ghi nhận trực tiếp tại đúng thửa đất.</label></section>
      </div>
      <aside className="h-fit rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm xl:sticky xl:top-24"><h3 className="font-heading text-lg font-black text-brand-dark">Tóm tắt thu hoạch</h3><div className="mt-4 space-y-4 text-xs"><div><span className="text-stone-400">Thửa đất</span><strong className="mt-1 block text-brand-dark">{selected ? `${selected.plotCode} · ${selected.crop}` : 'Chưa chọn thửa'}</strong></div><div><span className="text-stone-400">Người ghi nhận</span><strong className="mt-1 block text-brand-dark">{user?.fullName || user?.name || 'Nhân viên hiện trường'}</strong></div><div><span className="text-stone-400">Khối lượng</span><strong className="mt-1 block text-lg text-brand-dark">{Number(weight) > 0 ? `${Number(weight).toLocaleString('vi-VN')} kg` : 'Chưa nhập'}</strong></div><div><span className="text-stone-400">Ảnh đã chụp</span><strong className="mt-1 block text-brand-dark">{photos.length} ảnh</strong></div></div><Button type="submit" disabled={!selected || photos.length === 0 || !(Number(weight) > 0) || !confirmed} className="mt-5 w-full"><Scale className="mr-2 h-4 w-4" />Hoàn tất thu hoạch</Button></aside>
    </form>
  );
}

export default function FieldWorkerDashboard() {
  const { user } = useAuthStore();
  const workerId = Number(user?.userId || user?.id || 8);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (['tasks', 'services', 'issues', 'harvest', 'chat'].includes(p)) return p;
    }
    return 'tasks';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dataError, setDataError] = useState('');
  const [dataSuccess, setDataSuccess] = useState('');

  // Service requests purchased by customers
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceStatusFilter, setServiceStatusFilter] = useState('ALL');
  const [plotModalTab, setPlotModalTab] = useState('tasks');
  const [plotTaskFilter, setPlotTaskFilter] = useState('ALL');
  const [isUpdatingService, setIsUpdatingService] = useState(false);

  // Assigned care tasks loaded from the cultivation service.
  const [tasks, setTasks] = useState([]);
  const [focusedTaskId, setFocusedTaskId] = useState(null);

  // Modal State for Viewing Detailed Task Instructions & Expert Notes
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  // Modal State for Task Execution / Completing with Photo Proof
  const [selectedTaskToExecute, setSelectedTaskToExecute] = useState(null);
  const [taskProofNote, setTaskProofNote] = useState('');
  const [taskProofPhoto, setTaskProofPhoto] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Worker field issue reports loaded from the cultivation service.
  const [myIssues, setMyIssues] = useState([]);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [newIssuePlot, setNewIssuePlot] = useState('');
  const [newIssueType, setNewIssueType] = useState('Sâu bệnh mặt lá (Bọ trĩ, rầy mềm)');
  const [customIssueType, setCustomIssueType] = useState('');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [newIssueUrgency, setNewIssueUrgency] = useState('NORMAL');
  const [newIssuePhoto, setNewIssuePhoto] = useState('');

  const readPhoto = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target?.result || '');
    reader.readAsDataURL(file);
  };

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
  const [selectedPlotCode, setSelectedPlotCode] = useState('P-01');
  const [selectedPlotModalCode, setSelectedPlotModalCode] = useState(null);

  const loadPlots = useCallback(() => {
    apiFetch('/api/rentals')
      .then((res) => {
        const list = unwrapData(res) || [];
        if (Array.isArray(list)) {
          // Lọc các hợp đồng ACTIVE và thuộc diện Farmely hỗ trợ chăm sóc
          const activeOnly = list.filter((p) => p.status === 'ACTIVE' && p.cultivationMode !== 'SELF' && p.mode !== 'Self-Growing');
          const finalList = activeOnly.length > 0 ? activeOnly : list.filter((p) => p.status === 'ACTIVE');
          setAssignedPlots(finalList.map((p) => ({
            ...p,
            key: String(p.rentalId || p.id),
            plotCode: p.plotCode || p.code || p.name,
            plotName: p.plotName || p.name || `Thửa ${p.plotCode || p.code || ''}`,
            crop: p.crop || p.varietyName || 'Đang canh tác',
            customerName: p.customerName || p.renterName || 'Khách thuê',
            contractCode: p.contractCode || p.contract_number || `#CTR-${p.rentalId || p.id}`,
            area: p.area ? `${p.area} m²` : (p.area_sqm ? `${p.area_sqm} m²` : '—'),
            location: p.location || p.landName || 'Trang trại Farmely',
            rentalId: p.rentalId || p.id,
            startDate: p.startDate,
            endDate: p.endDate,
            expectedHarvestDate: p.expectedHarvestDate,
            currentDay: p.currentDay !== undefined ? p.currentDay : 1,
            totalDays: p.totalDays || 55,
            cycleDays: p.cycleDays || p.totalDays || 55,
            termDays: p.termDays || 90,
            progressPercent: p.progressPercent !== undefined ? p.progressPercent : 15,
            temp: p.temp || '28.5°C',
            soilMoisture: p.soilMoisture || '68%',
            airHumidity: p.airHumidity || '74%',
            light: p.light || '45.000 Lux',
            ph: p.ph || '6.5',
            stage: p.stage || 'Sinh trưởng & phát triển',
            expectedYield: p.expectedYield || '35 - 45 kg',
            healthStatus: p.healthStatus || 'HEALTHY'
          })));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch live rentals:', err);
      });
  }, []);

  const loadTasksAndData = useCallback(() => {
    setDataError('');

    Promise.all([
      apiFetch('/api/tasks').then((res) => unwrapData(res) || []),
      apiFetch('/api/issues'),
      apiFetch('/api/harvest'),
      apiFetch('/api/services/requests').catch(() => ({ data: [] }))
    ])
      .then(([taskBody, issueBody, harvestBody, serviceBody]) => {
        const taskData = unwrapData(taskBody) || [];
        const issueData = unwrapData(issueBody) || [];
        const harvestData = unwrapData(harvestBody) || [];
        const rawServices = unwrapData(serviceBody) || [];

        setTasks(taskData.map((task) => ({
          id: task.taskCode || `TSK-${task.taskId || task.id}`,
          apiId: task.taskId || task.id,
          serviceRequestId: task.serviceRequestId,
          rentalId: task.rentalId,
          session: task.session || 'MORNING',
          title: task.title || 'Nhiệm vụ chăm sóc',
          plotCode: task.plotCode || (task.rentalId ? `P-${String(task.rentalId).padStart(2, '0')}` : 'Chưa gán'),
          plotName: task.plotName || (task.plotCode ? `Thửa ${task.plotCode}` : (task.rentalId ? `Thửa #${task.rentalId}` : 'Thửa đất')),
          crop: task.crop || task.cropName || task.varietyName || 'Đang canh tác',
          customerName: task.customerName || 'Khách thuê',
          plotImage: task.plotImageUrl || task.image || null,
          deadline: task.deadline || '08:30 AM',
          dueDate: task.dueDate || null,
          instructions: task.instructions || task.notes || 'Tuân thủ định mức và kỹ thuật VietGAP.',
          notes: task.notes || '',
          expertName: task.expertName || 'Chuyên gia Nông nghiệp VietGAP',
          stepOrder: task.stepOrder || 1,
          cropDay: task.cropDay || task.dayOffset || null,
          dayOffset: task.dayOffset || task.cropDay || null,
          workerName: task.workerName || task.assignedTo || 'Kỹ thuật viên hiện trường chuyên trách',
          assignedTo: task.assignedTo || task.workerName || 'Kỹ thuật viên hiện trường chuyên trách',
          taskAssignedTo: task.taskAssignedTo || task.workerId,
          status: normalizeTaskStatus(task.displayStatus || task.status),
          priority: task.priority || (task.serviceRequestId ? 'HIGH' : (task.isOverdue ? 'OVERDUE' : 'NORMAL')),
          completedAt: task.completedAt || (task.updatedAt ? new Date(task.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null),
          proofPhoto: task.evidenceImageUrl || task.proofPhoto || null
        })));

        setMyIssues(issueData.map((issue) => ({
          id: issue.issueCode || `ISS-${issue.issueId || issue.id}`,
          apiId: issue.issueId || issue.id,
          rentalId: issue.rentalId,
          plotCode: issue.plotCode || (issue.rentalId ? `P-${String(issue.rentalId).padStart(2, '0')}` : 'Chưa gán'),
          plotName: issue.plotName || (issue.plotCode ? `Thửa ${issue.plotCode}` : (issue.rentalId ? `Thửa #${issue.rentalId}` : 'Thửa đất')),
          issueType: issue.issueType || 'Sự cố hiện trường',
          urgency: issue.urgency || 'NORMAL',
          sentTime: issue.reportedTime || (issue.createdAt ? new Date(issue.createdAt).toLocaleString('vi-VN') : 'Vừa xong'),
          status: issue.displayStatus || issue.status || 'OPEN',
          expertAdvice: issue.diagnosis || issue.resolutionNotes || 'Đang chờ chuyên gia chẩn đoán.',
          description: issue.description || '',
          imageUrl: issue.photoUrl || issue.imageUrl || '',
          reporterName: issue.workerName || issue.reportedByName || user?.fullName || 'Nhân viên hiện trường',
          expertName: issue.expertName || '',
          createdAt: issue.createdAt || null
        })));

        const mappedHarvests = harvestData.map((harvest) => ({
          id: harvest.harvestCode || `HRV-${harvest.harvestId || harvest.id}`,
          apiId: harvest.harvestId || harvest.id,
          rentalId: harvest.rentalId,
          plotCode: harvest.plotCode || (harvest.rentalId ? `P-${String(harvest.rentalId).padStart(2, '0')}` : 'Chưa gán'),
          plotName: harvest.plotName || (harvest.plotCode ? `Thửa ${harvest.plotCode}` : (harvest.rentalId ? `Thửa #${harvest.rentalId}` : 'Thửa đất')),
          crop: harvest.cropName || harvest.crop || 'Nông sản VietGAP',
          customerName: harvest.customerName || 'Khách thuê',
          expectedYield: 'Theo kết quả cân thực tế',
          status: harvest.customerConfirmed ? 'COMPLETED' : 'READY_TO_HARVEST',
          actualWeight: harvest.yieldAmount ? `${harvest.yieldAmount} kg` : '',
          photoUrl: harvest.evidenceImageUrl || '',
          staffName: harvest.workerName || user?.fullName || 'Nhân viên hiện trường',
          verifiedAt: harvest.createdAt ? new Date(harvest.createdAt).toLocaleString('vi-VN') : ''
        }));
        setHarvestTasks(mappedHarvests);
        setSelectedHarvestTask((current) => current || mappedHarvests.find((item) => item.status !== 'COMPLETED') || mappedHarvests[0] || null);

        // Map Customer Purchased Service Requests
        const mappedServices = (Array.isArray(rawServices) ? rawServices : []).map((s) => ({
          id: s.id || `REQ-${s.requestId}`,
          requestId: s.requestId,
          rentalId: s.rentalId,
          serviceId: s.serviceId,
          serviceName: s.serviceName || s.service?.serviceName || 'Dịch vụ nông nghiệp',
          plotCode: s.plotCode || (s.rentalId ? `P-${String(s.rentalId).padStart(2, '0')}` : 'P-01'),
          plotName: s.plotName || (s.plotCode ? `Thửa ${s.plotCode}` : 'Thửa đất'),
          customerName: s.customerName || s.renterName || 'Khách thuê',
          customerPhone: s.customerPhone || '',
          scheduledDate: s.scheduledDate || s.requestedDate || '',
          status: s.status || 'PENDING',
          price: s.price || s.paidAmount || 0,
          notes: s.notes || s.note || '',
          taskId: s.taskId,
          taskStatus: s.taskStatus,
          proofPhoto: s.proofPhoto,
          proofNotes: s.proofNotes,
          completedAt: s.completedAt,
          createdAt: s.createdAt
        }));
        setServiceRequests(mappedServices);

        const plotExpansion = {};
        taskData.forEach((task) => {
          const code = task.plotCode || (task.rentalId ? `P-${String(task.rentalId).padStart(2, '0')}` : null);
          if (code) plotExpansion[code] = true;
        });
        setExpandedPlots(plotExpansion);
      })
      .catch((error) => {
        setTasks([]);
        setMyIssues([]);
        setHarvestTasks([]);
        setDataError(error.message || 'Không thể tải dữ liệu ca trực từ hệ thống.');
      });
  }, [user?.id, user?.userId, user?.role, user?.fullName]);

  useEffect(() => {
    loadPlots();
    loadTasksAndData();

    // Đồng bộ tức thời khi Admin nhảy số IoT trạm, Expert giao việc hoặc khách hàng yêu cầu dịch vụ
    let bc = null;
    let bcStaff = null;
    let bcDispatch = null;
    let bcTasks = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_iot_telemetry');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'TELEMETRY_UPDATED') {
            loadPlots();
          }
        };

        const handleStaffSync = () => {
          loadTasksAndData();
          loadPlots();
        };

        bcStaff = new BroadcastChannel('farmely_staff_activity_channel');
        bcStaff.onmessage = handleStaffSync;

        bcDispatch = new BroadcastChannel('farmely_staff_dispatch');
        bcDispatch.onmessage = handleStaffSync;

        bcTasks = new BroadcastChannel('farmely_staff_tasks');
        bcTasks.onmessage = handleStaffSync;
      }
    } catch {}

    const handleStorage = (e) => {
      if (e.key === 'farmely_iot_sync_ping') {
        loadPlots();
      }
      if (e.key === 'farmely_task_sync' || e.key === 'farmely_staff_sync_ping' || e.key === 'farmely_persisted_staff_activities_v2') {
        loadTasksAndData();
        loadPlots();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Chu kỳ 10 giây đồng bộ số liệu IoT và công việc thực địa
    const pollInterval = setInterval(() => {
      loadPlots();
      loadTasksAndData();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      if (bc) try { bc.close(); } catch {}
      if (bcStaff) try { bcStaff.close(); } catch {}
      if (bcDispatch) try { bcDispatch.close(); } catch {}
      if (bcTasks) try { bcTasks.close(); } catch {}
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadPlots, loadTasksAndData]);

  useEffect(() => {
    if (!newIssuePlot && (assignedPlots.length || tasks.length)) {
      setNewIssuePlot(assignedPlots[0]?.plotCode || tasks[0]?.plotCode || '');
    }
  }, [newIssuePlot, assignedPlots, tasks]);

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

    setIsUploadingPhoto(true);
    const targetTaskId = selectedTaskToExecute.apiId || selectedTaskToExecute.taskId || parseInt(String(selectedTaskToExecute.id).replace(/\D/g, ''), 10);

    try {
      // 1. Cập nhật trạng thái nhiệm vụ và tự động đồng bộ vào farm_diaries của khách hàng
      await apiFetch(`/api/tasks/${targetTaskId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({
          evidenceImageUrl: taskProofPhoto,
          proofPhoto: taskProofPhoto,
          notes: taskProofNote,
          taskProofNote: taskProofNote,
          status: 'DONE',
          syncToDiary: true,
          rentalId: selectedTaskToExecute.rentalId
        })
      });

      // 2. Ghi nhận Staff Activity
      try {
        const pCode = selectedTaskToExecute.plotCode || (selectedTaskToExecute.rentalId ? `P-${String(selectedTaskToExecute.rentalId).padStart(2, '0')}` : 'Chưa gán');
        const matchedPlot = assignedPlots.find(p => p.plotCode === pCode);
        recordStaffActivity({
          activityId: `ACT-${targetTaskId}-${Date.now()}`,
          plotId: pCode,
          plotCode: pCode,
          rentalId: selectedTaskToExecute.rentalId || matchedPlot?.rentalId || 1,
          workerName: user?.fullName || 'Kỹ thuật viên hiện trường chuyên trách',
          workerRole: 'Kỹ thuật viên hiện trường chuyên trách',
          title: selectedTaskToExecute.title || 'Chăm sóc luống cây trồng',
          timestamp: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Hôm nay`,
          status: 'COMPLETED',
          notes: taskProofNote || 'Nhiệm vụ đã được hoàn tất và nghiệm thu đạt tiêu chuẩn VietGAP.',
          proofPhoto: taskProofPhoto,
          sensorSnapshot: {
            temp: matchedPlot?.temp || '28.0°C',
            soilMoisture: matchedPlot?.soilMoisture || '65%'
          }
        });
      } catch (e) {
        console.warn('Could not record staff activity:', e);
      }

      // 3. Phát tin hiệu Realtime qua BroadcastChannel và LocalStorage để trang Khách Hàng (CustomerPlotWorkspace) ngay lập tức cập nhật nhật ký & kế hoạch mới
      try {
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          const bc = new BroadcastChannel('farmely_staff_activity_channel');
          bc.postMessage({
            type: 'TASK_COMPLETED',
            taskId: targetTaskId,
            rentalId: selectedTaskToExecute.rentalId,
            plotCode: selectedTaskToExecute.plotCode,
            photo: taskProofPhoto,
            timestamp: Date.now()
          });
          bc.close();
        }
      } catch {}

      try {
        localStorage.setItem('farmely_task_sync', String(Date.now()));
        localStorage.setItem('farmely_persisted_staff_activities_v2', String(Date.now()));
      } catch {}

      // 4. Cập nhật state nội bộ của FieldWorkerDashboard
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTaskToExecute.id || t.apiId === targetTaskId
            ? {
                ...t,
                status: 'COMPLETED',
                completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                proofPhoto: taskProofPhoto
              }
            : t
        )
      );

      // 5. Cập nhật Service Requests nếu nhiệm vụ này thuộc về Yêu cầu dịch vụ khách hàng đặt mua
      if (selectedTaskToExecute.serviceRequestId) {
        try {
          await apiFetch(`/api/services/requests/${selectedTaskToExecute.serviceRequestId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'DONE',
              notes: taskProofNote,
              workerId: workerId
            })
          });
        } catch (e) {
          console.warn('Could not update service request status:', e);
        }

        setServiceRequests((prev) =>
          prev.map((s) =>
            s.requestId === selectedTaskToExecute.serviceRequestId
              ? { ...s, status: 'DONE', proofPhoto: taskProofPhoto, completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
              : s
          )
        );
      }

      // 5B. Tự động đóng sự cố nếu nhiệm vụ này là xử lý sự cố (ISS-xxx)
      const issMatch = (selectedTaskToExecute.notes || selectedTaskToExecute.title || '').match(/\[(?:ISS|ISSUE)-(\d+)\]/i);
      if (issMatch && issMatch[1]) {
        try {
          const issId = issMatch[1];
          await apiFetch(`/api/issue-reports/${issId}`, {
            method: 'PUT',
            body: JSON.stringify({
              markResolved: true,
              resolutionNotes: taskProofNote || 'CVLĐ đã thực địa xử lý theo chỉ đạo và chụp ảnh minh chứng thành công.'
            })
          });
          setMyIssues(prev => prev.map(iss => (iss.apiId === parseInt(issId, 10) || iss.id === `ISS-${issId}`) ? { ...iss, status: 'RESOLVED' } : iss));
        } catch (e) {
          console.warn('Could not auto-resolve issue:', e);
        }
      }

      setSelectedTaskToExecute(null);
      setTaskProofNote('');
      setTaskProofPhoto('');
      setDataError('');
      setDataSuccess('Đã nghiệm thu hoàn tất và tự động đồng bộ ảnh minh chứng vào nhật ký của khách hàng.');
    } catch (error) {
      setDataError(error.message || 'Không thể cập nhật nhiệm vụ lên hệ thống.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAcceptServiceRequest = async (reqId) => {
    setIsUpdatingService(true);
    try {
      await apiFetch(`/api/services/requests/${reqId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'IN_PROG',
          workerId: workerId
        })
      });
      setServiceRequests(prev => prev.map(s => s.requestId === reqId ? { ...s, status: 'IN_PROG' } : s));
      setDataSuccess(`Đã tiếp nhận thực hiện yêu cầu dịch vụ #${reqId}`);
      loadTasksAndData();
    } catch (err) {
      setDataError('Không thể tiếp nhận yêu cầu: ' + (err.message || 'Lỗi hệ thống'));
    } finally {
      setIsUpdatingService(false);
    }
  };

  const handleStartCompleteService = (service) => {
    const linkedTask = tasks.find(t => t.serviceRequestId === service.requestId);
    if (linkedTask) {
      setSelectedTaskToExecute(linkedTask);
    } else {
      setSelectedTaskToExecute({
        id: `SR-${service.requestId}`,
        apiId: service.taskId || null,
        serviceRequestId: service.requestId,
        rentalId: service.rentalId,
        plotCode: service.plotCode,
        plotName: service.plotName,
        title: service.serviceName,
        instructions: service.notes || 'Thực hiện dịch vụ khách hàng yêu cầu theo tiêu chuẩn chất lượng Farmely.',
        customerName: service.customerName
      });
    }
  };

  // Handle Submit New Issue
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    const sourcePlot = assignedPlots.find(p => p.plotCode === newIssuePlot) || tasks.find(t => t.plotCode === newIssuePlot);
    const reporterId = Number(String(user?.userId || user?.id || '').replace(/\D/g, '')) || 8;
    const targetRentalId = sourcePlot?.rentalId || sourcePlot?.id;

    if (!targetRentalId) {
      setDataError('Chưa có mã lượt thuê cho thửa đã chọn.');
      return;
    }

    const finalIssueType = newIssueType === 'Khác' ? (customIssueType.trim() || 'Sự cố nông nghiệp khác') : newIssueType;

    let saved;
    try {
      saved = unwrapData(await apiFetch('/api/issues', {
        method: 'POST',
        body: JSON.stringify({
          rentalId: targetRentalId,
          reportedBy: reporterId,
          issueType: finalIssueType,
          description: newIssueDesc,
          imageUrl: newIssuePhoto || ''
        })
      })) || {};
    } catch (error) {
      setDataError(error.message || 'Không thể gửi báo cáo lên hệ thống.');
      return;
    }
    const newIssue = {
      id: saved.issueCode || `ISS-${saved.issueId || Date.now()}`,
      apiId: saved.issueId,
      rentalId: targetRentalId,
      plotCode: newIssuePlot,
      plotName: `Thửa ${newIssuePlot}`,
      issueType: finalIssueType,
      urgency: newIssueUrgency,
      sentTime: 'Vừa xong',
      status: 'OPEN',
      expertAdvice: 'Đang chờ chuyên gia chẩn đoán.',
      description: newIssueDesc,
      imageUrl: newIssuePhoto || '',
      reporterName: user?.fullName || 'Nhân viên hiện trường'
    };

    setMyIssues((prev) => [newIssue, ...prev]);
    setShowNewIssueModal(false);
    setNewIssueDesc('');
    setNewIssuePhoto('');
    setCustomIssueType('');
    setNewIssueType('Sâu bệnh mặt lá (Bọ trĩ, rầy mềm)');
    setDataError('');
    setDataSuccess('Đã gửi báo cáo sự cố thành công lên cơ sở dữ liệu cho Chuyên gia.');
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

    try {
      const shared = JSON.parse(localStorage.getItem('farmely_shared_harvest_plans') || '[]');
      const code = selectedHarvestTask.plotCode;
      const updated = shared.map((item) => {
        if (item.plotCode === code || item.plotId === selectedHarvestTask.rentalId) {
          return {
            ...item,
            status: 'COMPLETED',
            actualYield: `${parsedWeight.toFixed(2)} kg`,
            evidenceImageUrl: saved.evidenceImageUrl || harvestPhotos[0],
            completedAt: new Date().toISOString(),
            workerName: user?.fullName || 'Trần Văn Lực (CVLĐ)'
          };
        }
        return item;
      });
      localStorage.setItem('farmely_shared_harvest_plans', JSON.stringify(updated));
      const bc = new BroadcastChannel('farmely_harvest_sync');
      bc.postMessage({ type: 'HARVEST_COMPLETED' });
      bc.close();
    } catch {}

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

  const plotSummaryList = useMemo(() => {
    const map = new Map();

    // 1. Khởi tạo từ danh sách hợp đồng thuê thửa đất phụ trách thực tế (phân biệt rõ từng vụ/hợp đồng)
    if (Array.isArray(assignedPlots)) {
      assignedPlots.forEach((p) => {
        const itemKey = String(p?.rentalId || p?.id || p?.plotCode || p?.name);
        if (!itemKey) return;
        map.set(itemKey, {
          key: itemKey,
          plotCode: p.plotCode || p.code || p.name,
          plotName: p.name || `Thửa ${p.plotCode || p.code || ''}`,
          customerName: p.renterName || p.customerName || 'Khách thuê',
          contractCode: p.contractCode || (p.plotCode ? `#CTR-${p.plotCode}` : 'Hợp đồng điện tử'),
          crop: p.crop || 'Rau củ chuẩn VietGAP',
          area: p.area ? `${p.area} m²` : (p.area_sqm ? `${p.area_sqm} m²` : '—'),
          location: p.location || 'Trang trại Farmely',
          rentalId: p.rentalId || p.id || 1,
          startDate: p.startDate,
          endDate: p.endDate,
          expectedHarvestDate: p.expectedHarvestDate,
          currentDay: p.currentDay !== undefined ? p.currentDay : 1,
          totalDays: p.totalDays || 55,
          cycleDays: p.cycleDays || p.totalDays || 55,
          termDays: p.termDays || 90,
          progressPercent: p.progressPercent !== undefined ? p.progressPercent : 15,
          temp: p.temp || '28.5°C',
          soilMoisture: p.soilMoisture || '68%',
          airHumidity: p.airHumidity || '74%',
          light: p.light || '45.000 Lux',
          ph: p.ph || '6.5',
          stage: p.stage || 'Sinh trưởng & phát triển',
          expectedYield: p.expectedYield || '35 - 45 kg',
          healthStatus: p.healthStatus || 'HEALTHY',
          tasks: []
        });
      });
    }

    // 2. Gộp nhiệm vụ thực tế từ Database (khớp chuẩn xác theo rentalId nếu có)
    orderedTasks.forEach((task) => {
      const taskRentalKey = task?.rentalId ? String(task.rentalId) : null;
      let targetPlot = taskRentalKey ? map.get(taskRentalKey) : null;

      // Nếu chưa khớp trực tiếp bằng rentalId, thử tìm theo plotCode
      if (!targetPlot) {
        const taskCode = task?.plotCode || task?.plotName;
        for (const p of map.values()) {
          if (p.plotCode === taskCode || p.plotName === taskCode) {
            targetPlot = p;
            break;
          }
        }
      }

      // Nếu thửa chưa có trong danh sách phân công
      if (!targetPlot) {
        const fallbackKey = taskRentalKey || task?.plotCode || task?.plotName || `TASK-${task.id}`;
        targetPlot = {
          key: fallbackKey,
          plotCode: task.plotCode || 'P-01',
          plotName: task.plotName || `Thửa ${task.plotCode || ''}`,
          customerName: task.customerName || 'Khách thuê',
          contractCode: task.rentalId ? `#CTR-${task.rentalId}` : 'Hợp đồng điện tử',
          crop: task.crop || 'Rau củ chuẩn VietGAP',
          area: '—',
          location: 'Trang trại Farmely',
          rentalId: task.rentalId || 1,
          startDate: null,
          endDate: null,
          expectedHarvestDate: null,
          currentDay: 1,
          totalDays: 55,
          cycleDays: 55,
          termDays: 90,
          progressPercent: 15,
          temp: '28.5°C',
          soilMoisture: '68%',
          airHumidity: '74%',
          light: '45.000 Lux',
          ph: '6.5',
          stage: 'Sinh trưởng & phát triển',
          expectedYield: '35 - 45 kg',
          healthStatus: 'HEALTHY',
          tasks: []
        };
        map.set(fallbackKey, targetPlot);
      }

      targetPlot.tasks.push(task);
    });

    const list = Array.from(map.values());
    return list.sort((a, b) => {
      const aPending = (a.tasks || []).filter((t) => t.status !== 'COMPLETED').length;
      const bPending = (b.tasks || []).filter((t) => t.status !== 'COMPLETED').length;
      return bPending - aPending;
    });
  }, [assignedPlots, orderedTasks]);
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
      const resolvedCrop = task.crop || 'Rau củ chuẩn VietGAP';
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
  const candidatePlotCodes = new Set(harvestTaskCandidates.map((item) => item.plotCode).filter(Boolean));

  let sharedApprovedHarvests = [];
  try {
    const shared = JSON.parse(localStorage.getItem('farmely_shared_harvest_plans') || '[]');
    if (Array.isArray(shared)) {
      sharedApprovedHarvests = shared
        .filter((item) => item.status === 'APPROVED' && !candidatePlotCodes.has(item.plotCode))
        .map((item) => ({
          id: `SHARED-${item.id}`,
          sourceTaskId: null,
          apiTaskId: null,
          rentalId: item.rentalId || 1,
          plotCode: item.plotCode,
          plotName: item.plotName || `Thửa ${item.plotCode}`,
          crop: item.crop || 'Rau củ chuẩn VietGAP',
          customerName: item.renterName || 'Khách hàng Farmely',
          expectedYield: item.expectedYield || 'Theo kết quả cân thực tế',
          status: 'READY_TO_HARVEST',
          actualWeight: '',
          deadline: item.requestedDate || 'Hôm nay'
        }));
    }
  } catch {}

  const harvestWorkItems = [
    ...harvestTaskCandidates,
    ...sharedApprovedHarvests,
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
            <h1 className="mt-1 font-heading text-3xl font-black text-brand-dark sm:text-4xl">
              {activeTab === 'tasks' ? 'Việc hôm nay' : activeTab === 'services' ? 'Yêu cầu dịch vụ' : activeTab === 'harvest' ? 'Thu hoạch' : 'Lịch sử báo cáo'}
            </h1>
            <p className="mt-1 text-xs text-brand-muted">
              {activeTab === 'tasks'
                ? `${tasks.length} nhiệm vụ tại ${plotSummaryList.length} thửa đất phụ trách ca trực`
                : activeTab === 'services'
                  ? `${serviceRequests.length} yêu cầu dịch vụ do khách hàng đặt mua theo yêu cầu`
                  : activeTab === 'harvest'
                    ? 'Chụp ảnh, nhập số cân và xác nhận kết quả thu hoạch tại thửa.'
                    : 'Theo dõi các sự cố đã gửi và tiến độ xử lý từ chuyên gia.'}
            </p>
          </div>
          {activeTab === 'tasks' && <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-xs shadow-sm"><span className="font-bold text-stone-500">{currentSession === 'MORNING' ? 'Ca sáng' : 'Ca chiều'} · </span><strong className="text-emerald-800">{completedCount}/{tasks.length} nhiệm vụ hoàn thành</strong></div>}
          {activeTab === 'services' && (
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-xs shadow-sm flex items-center gap-2">
              <span className="font-bold text-stone-500">Tiến độ dịch vụ: </span>
              <strong className="text-emerald-800">
                {serviceRequests.filter(s => s.status === 'DONE' || s.status === 'COMPLETED').length}/{serviceRequests.length} đã hoàn tất
              </strong>
            </div>
          )}
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
          <div className="grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
              <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Tổng nhiệm vụ</span>
              <strong className="font-heading text-2xl font-black text-stone-900 mt-1 block">{tasks.length}</strong>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
              <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider">Cần làm hôm nay</span>
              <strong className="font-heading text-2xl font-black text-amber-900 mt-1 block">{pendingCount}</strong>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-2xs">
              <span className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">Đã nghiệm thu</span>
              <strong className="font-heading text-2xl font-black text-emerald-900 mt-1 block">{completedCount}</strong>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="grid grid-cols-2 gap-3 sm:max-w-xl sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
              <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Tổng yêu cầu</span>
              <strong className="font-heading text-2xl font-black text-stone-900 mt-1 block">{serviceRequests.length}</strong>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
              <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider">Cần thực hiện</span>
              <strong className="font-heading text-2xl font-black text-amber-900 mt-1 block">
                {serviceRequests.filter(s => s.status !== 'DONE' && s.status !== 'COMPLETED').length}
              </strong>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-2xs">
              <span className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">Đã hoàn tất</span>
              <strong className="font-heading text-2xl font-black text-emerald-900 mt-1 block">
                {serviceRequests.filter(s => s.status === 'DONE' || s.status === 'COMPLETED').length}
              </strong>
            </div>
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
              { id: 'services', label: 'Yêu cầu dịch vụ', icon: ShoppingBag, count: serviceRequests.filter(s => s.status !== 'DONE' && s.status !== 'COMPLETED').length },
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
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-lg font-black text-brand-dark flex items-center gap-2">
                        <Layers className="h-5 w-5 text-emerald-800" />
                        <span>Thửa đất phụ trách ca trực</span>
                      </h3>
                      <p className="text-xs text-stone-500">
                        Bấm vào từng thửa đất để mở cửa sổ popup chi tiết công việc cần làm hôm nay, thực hiện nghiệm thu (BR15) hoặc báo sự cố (BR16).
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                      {plotSummaryList.length} Thửa đất phụ trách
                    </span>
                  </div>

                  {/* Grid các thửa đất phụ trách - Bấm vào sẽ mở popup chi tiết công việc */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plotSummaryList.map((plot) => {
                      const pending = plot.tasks.filter((t) => t.status !== 'COMPLETED').length;
                      const done = plot.tasks.filter((t) => t.status === 'COMPLETED').length;
                      const total = plot.tasks.length;
                      const progress = total > 0 ? Math.round((done / total) * 100) : 100;

                      const todayPending = plot.tasks.filter((t) => {
                        if (t.status === 'COMPLETED') return false;
                        const meta = getTaskTimingMeta(t);
                        return meta.key === 'TODAY' || meta.key === 'DUE_SOON' || meta.key === 'URGENT' || meta.key === 'OVERDUE';
                      }).length;

                      return (
                        <div
                          key={plot.key || plot.plotCode}
                          onClick={() => setSelectedPlotModalCode(plot.key || plot.plotCode)}
                          className="group relative flex flex-col justify-between p-5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all text-left cursor-pointer space-y-3.5"
                        >
                          <div>
                            {/* Header Thửa & Trạng Thái Việc */}
                            <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-md font-mono font-black text-xs bg-emerald-800 text-white shadow-2xs">
                                  {plot.plotCode}
                                </span>
                                <span className="font-heading font-black text-base text-brand-dark truncate">
                                  {plot.plotName}
                                </span>
                              </div>
                              {todayPending > 0 ? (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  🔥 {todayPending} việc hôm nay
                                </span>
                              ) : pending > 0 ? (
                                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 border border-stone-200">
                                  ⏳ {pending} sắp tới
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
                                  <Check className="h-3 w-3 stroke-[3]" /> Xong ca
                                </span>
                              )}
                            </div>

                            {/* Thông Tin Khách & Cây Trồng */}
                            <div className="mt-2.5 text-xs space-y-1 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                              <p className="font-bold text-emerald-900 truncate">🌱 Giống: {plot.crop}</p>
                              <p className="text-stone-600 truncate">👤 Khách hàng: <strong className="text-stone-800">{plot.customerName}</strong></p>
                              <p className="text-stone-400 text-[11px]">📍 {plot.location || 'Trang trại Farmely'} {plot.area ? `• ${plot.area}` : ''}</p>
                            </div>

                            {/* Trạm Quan Trắc IoT Vi Khí Hậu (BR18) */}
                            <div className="mt-2 flex items-center justify-between text-[11px] bg-sky-50/60 px-2.5 py-1.5 rounded-xl border border-sky-100 text-sky-950">
                              <span className="font-semibold flex items-center gap-1">
                                🌡️ {plot.temp || '28.5°C'}
                              </span>
                              <span className="font-semibold flex items-center gap-1">
                                💧 Ẩm đất: {plot.soilMoisture || '68%'}
                              </span>
                              <span className="text-[10px] text-stone-500">
                                {plot.ph ? `pH ${plot.ph}` : 'pH 6.5'}
                              </span>
                            </div>
                          </div>

                          {/* Chu kỳ vườn & Tiến độ ca trực */}
                          <div className="border-t border-stone-100 pt-2.5 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-stone-500">
                              <span className="font-semibold text-emerald-950 truncate max-w-[65%]">
                                🌿 {plot.stage || 'Sinh trưởng & phát triển'}
                              </span>
                              <span className="font-bold text-stone-700 shrink-0">
                                {done}/{total} việc
                              </span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100/60">
                              <span className="text-[11px] font-bold text-emerald-700 group-hover:text-emerald-900 flex items-center gap-1">
                                <ListTodo className="w-3.5 h-3.5" />
                                Mở việc cần làm
                                <ArrowRight className="w-3 h-3 transition group-hover:translate-x-0.5" />
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewIssuePlot(plot.plotCode || 'P-01');
                                  setShowNewIssueModal(true);
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Báo cáo sự cố phát sinh tại thửa đất này"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Báo sự cố
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SERVICE REQUESTS (Yêu Cầu Dịch Vụ Từ Khách Hàng) */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-800" />
                      <span>Yêu Cầu Dịch Vụ Canh Tác Từ Khách Hàng</span>
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Danh sách dịch vụ nông nghiệp khách thuê đặt mua cho thửa đất. Bạn có thể tiếp nhận và nghiệm thu kết quả kèm ảnh chứng thực.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {serviceRequests.length} Yêu cầu
                    </span>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'PENDING', label: 'Chờ thực hiện' },
                    { id: 'IN_PROG', label: 'Đang thực hiện' },
                    { id: 'DONE', label: 'Đã hoàn thành' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setServiceStatusFilter(f.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        serviceStatusFilter === f.id
                          ? 'bg-[#07533d] text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Service Requests List */}
                <div className="space-y-4">
                  {(() => {
                    const filtered = serviceRequests.filter((s) => {
                      if (serviceStatusFilter === 'ALL') return true;
                      if (serviceStatusFilter === 'PENDING') return s.status === 'PENDING' || s.status === 'PAID' || s.status === 'ASSIGNED';
                      if (serviceStatusFilter === 'IN_PROG') return s.status === 'IN_PROG' || s.status === 'IN_PROGRESS';
                      if (serviceStatusFilter === 'DONE') return s.status === 'DONE' || s.status === 'COMPLETED';
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-stone-500 space-y-2">
                          <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
                          <p className="font-bold text-sm">Chưa có yêu cầu dịch vụ nào trong mục này</p>
                          <p className="text-xs text-stone-400">Các gói dịch vụ khách hàng thanh toán sẽ tự động hiển thị tại đây.</p>
                        </div>
                      );
                    }

                    return filtered.map((req) => {
                      const isDone = req.status === 'DONE' || req.status === 'COMPLETED';
                      const isInProg = req.status === 'IN_PROG' || req.status === 'IN_PROGRESS';
                      return (
                        <div
                          key={req.id || req.requestId}
                          className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-400 transition-all shadow-2xs space-y-3.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                                {req.id || `REQ-${req.requestId}`}
                              </span>
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                                {req.plotCode}
                              </span>
                              <h4 className="font-heading font-black text-stone-900 text-sm">
                                {req.serviceName}
                              </h4>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isInProg
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {isDone ? '● Đã hoàn thành' : isInProg ? '● Đang thực hiện' : '● Chờ thực hiện'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/60">
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">Khách hàng yêu cầu:</span>
                              <strong className="text-stone-800 block">{req.customerName}</strong>
                              {req.customerPhone && <span className="text-stone-500 font-mono">{req.customerPhone}</span>}
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">Thửa đất & Lịch hẹn:</span>
                              <strong className="text-emerald-800 block">{req.plotName} ({req.plotCode})</strong>
                              <span className="text-stone-500">📅 {req.scheduledDate || 'Thực hiện ngay'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">Giá trị dịch vụ:</span>
                              <strong className="text-brand-dark block">{Number(req.price || 0).toLocaleString('vi-VN')} đ</strong>
                              <span className="text-emerald-700 text-[11px]">✓ Đã thanh toán</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-400 uppercase font-bold block">Thời gian tạo:</span>
                              <span className="text-stone-600">{req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : 'Gần đây'}</span>
                            </div>
                          </div>

                          {req.notes && (
                            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                              <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Ghi chú của khách hàng: </span>
                                <span>{req.notes}</span>
                              </div>
                            </div>
                          )}

                          {isDone && req.proofPhoto && (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                              <img
                                src={req.proofPhoto}
                                alt="Ảnh minh chứng"
                                className="w-12 h-12 rounded-lg object-cover border border-emerald-300 cursor-pointer hover:scale-105 transition"
                                onClick={() => window.open(req.proofPhoto, '_blank')}
                              />
                              <div>
                                <span className="font-bold text-emerald-900 block">Đã nghiệm thu có ảnh minh chứng</span>
                                <span className="text-stone-500 text-[11px]">{req.completedAt ? `Hoàn tất lúc: ${req.completedAt}` : 'Đã nghiệm thu chuẩn VietGAP'}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap justify-end gap-2 pt-1">
                            {!isDone && !isInProg && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAcceptServiceRequest(req.requestId)}
                                disabled={isUpdatingService}
                                className="font-bold text-xs gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Tiếp Nhận Thực Hiện</span>
                              </Button>
                            )}

                            {!isDone && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleStartCompleteService(req)}
                                className="font-bold text-xs gap-1.5 bg-[#07533d] hover:bg-[#053d2d] text-white"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Nghiệm Thu & Hoàn Tất (Chụp Ảnh)</span>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPlotModalCode(req.rentalId ? String(req.rentalId) : req.plotCode);
                                setPlotModalTab('services');
                              }}
                              className="font-bold text-xs gap-1.5 text-stone-700"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Xem Thửa Đất Này</span>
                            </Button>
                          </div>
                        </div>
                      );
                    });
                  })()}
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
                  const issueKey = issue.id || `ISS-${issue.apiId}`;
                  const linked = tasks.find(
                    (task) =>
                      (String(task.notes || task.title || '').includes(`[${issueKey}]`) ||
                       String(task.notes || task.title || '').includes(issueKey) ||
                       (task.plotCode === issue.plotCode && String(task.title || '').toLowerCase().includes('chỉ đạo'))) &&
                      task.status !== 'COMPLETED'
                  ) || tasks.find((task) => task.plotCode === issue.plotCode && task.status !== 'COMPLETED');

                  setActiveTab('tasks');
                  const targetModalCode = issue.rentalId ? String(issue.rentalId) : issue.plotCode;
                  setSelectedPlotModalCode(targetModalCode);
                  setPlotModalTab('tasks');
                  if (linked) {
                    setFocusedTaskId(linked.id);
                    handleTaskAction(linked);
                  }
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

      {/* POPUP MODAL: CHI TIẾT THỬA ĐẤT & CHU KỲ VƯỜN (BR14, BR18, DỊCH VỤ, THU HOẠCH) */}
      {selectedPlotModalCode && (() => {
        const activePlot = plotSummaryList.find((p) => p.key === selectedPlotModalCode || String(p.rentalId) === String(selectedPlotModalCode) || p.plotCode === selectedPlotModalCode) || plotSummaryList[0];
        if (!activePlot) return null;

        const plotTasks = activePlot.tasks || [];
        const completedTasks = plotTasks.filter((t) => t.status === 'COMPLETED');
        const pendingTasks = plotTasks.filter((t) => t.status !== 'COMPLETED');

        const isTaskToday = (t) => {
          if (t.status === 'COMPLETED') return false;
          const rawDate = t.dueDate || (/^\d{4}-\d{2}-\d{2}$/.test(t.deadline || '') ? t.deadline : null);
          const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
          if (rawDate && rawDate > todayStr) return false;
          const meta = getTaskTimingMeta(t);
          return meta.key === 'TODAY' || meta.key === 'DUE_SOON' || meta.key === 'URGENT' || meta.key === 'OVERDUE';
        };

        const todayTasks = pendingTasks.filter(isTaskToday);
        const upcomingTasks = pendingTasks.filter((t) => !isTaskToday(t));
        const plotServices = serviceRequests.filter((s) => (s.rentalId && activePlot.rentalId ? Number(s.rentalId) === Number(activePlot.rentalId) : s.plotCode === activePlot.plotCode));
        const harvest = harvestWorkItems.find((item) => (item.rentalId && activePlot.rentalId ? Number(item.rentalId) === Number(activePlot.rentalId) : item.plotCode === activePlot.plotCode));

        const isNotStarted = activePlot.currentDay === 0;

        const plotProcess = resolveStandardCropProcess(activePlot);
        const activeStage = plotProcess?.stages?.find((s) => s.status === 'IN_PROGRESS') || plotProcess?.stages?.[0];
        const currentStageName = activeStage?.name ? `${activeStage.name} (${activeStage.label || ''})` : (activePlot.stage || 'Sinh trưởng & phát triển');

        return (
          <Modal
            isOpen={Boolean(selectedPlotModalCode)}
            onClose={() => setSelectedPlotModalCode(null)}
            title={activePlot.plotName?.startsWith('Thửa') ? `${activePlot.plotName} (${activePlot.plotCode})` : `Thửa ${activePlot.plotCode} • ${activePlot.plotName}`}
            subtitle={`🌱 ${activePlot.crop || 'Rau củ VietGAP'} • Khách thuê: ${activePlot.customerName || 'Khách hàng'} • ${activePlot.contractCode || `#CTR-${activePlot.plotCode}`}`}
            maxWidth="max-w-4xl"
            headerVariant="green"
            zIndex="z-[95]"
          >
            <div className="space-y-4 text-left max-h-[78vh] overflow-y-auto pr-1">
              
              {/* THANH ĐIỀU HÀNH & TỔNG QUAN THỬA ĐẤT (TINH GỌN, TRỰC QUAN) */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
                {/* Dòng 1: Định danh + Nút hành động */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg font-mono font-black text-xs bg-emerald-800 text-white shadow-2xs">
                      {activePlot.plotCode}
                    </span>
                    <strong className="font-heading font-black text-sm text-stone-900">{activePlot.plotName}</strong>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-600">👤 Khách thuê: <strong className="text-stone-800">{activePlot.customerName}</strong></span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500">📍 {activePlot.location || 'Trang trại Farmely'}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500">📐 {formatCleanArea(activePlot.area)}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setNewIssuePlot(activePlot.plotCode || 'P-01');
                        setShowNewIssueModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span>Báo sự cố</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlotModalCode(null);
                        if (harvest) openHarvestWorkspace(harvest);
                        else setActiveTab('harvest');
                      }}
                      className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-900 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Scale className="h-3.5 w-3.5" />
                      <span>Thu hoạch</span>
                    </button>
                  </div>
                </div>

                {/* Dòng 2: Chu kỳ sinh trưởng + Tiến độ vụ */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-stone-600 font-medium">Giai đoạn:</span>
                      <strong className="text-emerald-950 font-heading">
                        {isNotStarted ? 'Sắp khởi động' : currentStageName}
                      </strong>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {isNotStarted
                        ? `Khởi động ${formatDateVN(activePlot.startDate) || '—'}`
                        : `Ngày ${activePlot.currentDay}/${activePlot.totalDays} ngày (${activePlot.progressPercent}%)`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${isNotStarted ? 0 : Math.min(100, Math.max(3, activePlot.progressPercent))}%` }}
                    />
                  </div>
                </div>

                {/* Dòng 3: 4 Trạm IoT & Chỉ số Vi Khí Hậu Trực Quan (BR18) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center gap-2">
                    <span className="text-base">🌡️</span>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">Nhiệt độ</span>
                      <strong className="text-stone-800 font-mono">{activePlot.temp || '28.5°C'}</strong>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center gap-2">
                    <span className="text-base">💧</span>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">Ẩm độ đất</span>
                      <strong className="text-emerald-800 font-mono">{activePlot.soilMoisture || '68%'}</strong>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center gap-2">
                    <span className="text-base">🧪</span>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">Độ pH đất</span>
                      <strong className="text-stone-800 font-mono">{activePlot.ph ? `pH ${activePlot.ph}` : 'pH 6.5'}</strong>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">Dự kiến thu</span>
                      <strong className="text-stone-800 font-mono">{formatDateVN(activePlot.expectedHarvestDate) || '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 SUB-TABS NAVIGATION: CÔNG VIỆC, IOT, YÊU CẦU DỊCH VỤ, THU HOẠCH */}
              <div className="border-b border-stone-200">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'tasks', label: 'Công việc', icon: CheckCircle2, count: todayTasks.length > 0 ? todayTasks.length : pendingTasks.length },
                    { id: 'iot', label: 'Thời Tiết & Khí Tượng', icon: Activity },
                    { id: 'services', label: 'Yêu cầu dịch vụ', icon: ShoppingBag, count: plotServices.filter(s => s.status !== 'DONE' && s.status !== 'COMPLETED').length },
                    { id: 'harvest', label: 'Thu hoạch', icon: PackageCheck }
                  ].map((subTab) => {
                    const Icon = subTab.icon;
                    const isActive = plotModalTab === subTab.id;
                    return (
                      <button
                        key={subTab.id}
                        type="button"
                        onClick={() => setPlotModalTab(subTab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-heading font-black text-xs transition cursor-pointer ${
                          isActive
                            ? 'border-[#07533d] text-[#07533d]'
                            : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#07533d]' : 'text-stone-400'}`} />
                        <span>{subTab.label}</span>
                        {subTab.count !== undefined && subTab.count > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-[#07533d] text-white' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {subTab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SUBTAB 1: CÔNG VIỆC (TASKS) */}
              {plotModalTab === 'tasks' && (
                <div className="space-y-4">
                  {/* Thanh bộ lọc con cho Công việc */}
                  <div className="flex items-center justify-between gap-3 flex-wrap border-b border-stone-200/80 pb-2.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { id: 'ALL', label: `Tất cả (${plotTasks.length})` },
                        { id: 'TODAY', label: `🔥 Việc hôm nay (${todayTasks.length})`, highlight: todayTasks.length > 0 },
                        { id: 'UPCOMING', label: `⏳ Kế hoạch sắp tới (${upcomingTasks.length})` },
                        { id: 'COMPLETED', label: `✅ Đã nghiệm thu (${completedTasks.length})` }
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setPlotTaskFilter(chip.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            plotTaskFilter === chip.id
                              ? 'bg-[#07533d] text-white shadow-xs'
                              : chip.highlight
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium hidden sm:inline-block">
                      💡 Bấm vào từng nhiệm vụ để xem chi tiết &amp; chỉ đạo CGNN
                    </span>
                  </div>

                  {/* PHẦN 1: 🔥 VIỆC CẦN LÀM HÔM NAY */}
                  {(plotTaskFilter === 'ALL' || plotTaskFilter === 'TODAY') && (
                    <div className="space-y-2.5">
                      {todayTasks.length > 0 ? (
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                            <Flame className="w-4 h-4 text-amber-600" />
                            <span>Việc Cần Thực Hiện Hôm Nay ({todayTasks.length})</span>
                          </h4>
                          <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                            Ưu tiên ca trực
                          </span>
                        </div>
                      ) : plotTaskFilter === 'TODAY' ? (
                        <div className="p-4 text-center bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Hôm nay không có việc tồn đọng tại thửa này.</span>
                        </div>
                      ) : null}

                      {todayTasks.length > 0 && (
                        <div className="grid gap-2.5">
                          {todayTasks.map((task) => {
                            const isHarvestTask = /thu hoạch|cân|đóng thùng/i.test(task.title);
                            const timing = getTaskTimingMeta(task);

                            return (
                              <div
                                key={task.id}
                                onClick={() => setSelectedTaskDetail(task)}
                                className="p-3.5 rounded-2xl border-2 border-amber-300 bg-amber-50/20 hover:border-emerald-500 hover:bg-white hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
                              >
                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${timing.tone}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${timing.dot}`} />
                                      {timing.label}
                                    </span>
                                    {(task.cropDay || task.dayOffset) ? (
                                      <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                        Ngày tuổi {task.cropDay || task.dayOffset}
                                      </span>
                                    ) : null}
                                    <span className="text-xs font-semibold text-stone-600">
                                      ⏰ {task.deadline || '08:30 AM'}
                                    </span>
                                    {task.dueDate && (
                                      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                                        📅 {formatDateVN(task.dueDate)}
                                      </span>
                                    )}
                                    {task.workerName && (
                                      <span className="text-[11px] text-stone-500 font-medium">
                                        👤 {task.workerName}
                                      </span>
                                    )}
                                  </div>

                                  <h5 className="font-heading font-black text-sm text-stone-900 group-hover:text-emerald-900 transition-colors">
                                    {task.title}
                                  </h5>

                                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                                    <span className="font-semibold text-stone-700">VietGAP: </span>
                                    {task.instructions}
                                  </p>

                                  {task.notes && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300">
                                      <span className="text-amber-800">👨‍🌾 Lưu ý CGNN:</span>
                                      <span className="font-normal truncate max-w-[360px]">{task.notes}</span>
                                      <span className="text-[11px] underline text-amber-800 ml-auto shrink-0">Chi tiết &gt;</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTaskDetail(task);
                                    }}
                                    className="px-3 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                                    <span>Chi tiết</span>
                                  </button>

                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isHarvestTask) {
                                        const hItem = harvestWorkItems.find((item) => item.plotCode === task.plotCode);
                                        setSelectedPlotModalCode(null);
                                        if (hItem) openHarvestWorkspace(hItem);
                                        else handleTaskAction(task);
                                      } else {
                                        handleTaskAction(task);
                                      }
                                    }}
                                    className="gap-1.5 font-bold px-3 py-2 bg-[#07533d] hover:bg-[#053d2d] text-white shadow-xs text-xs"
                                  >
                                    {isHarvestTask ? <Scale className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                                    <span>{isHarvestTask ? 'Thu hoạch' : 'Nghiệm thu (BR15)'}</span>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PHẦN 2: ⏳ DANH SÁCH VIỆC KẾ HOẠCH SẮP TỚI */}
                  {(plotTaskFilter === 'ALL' || plotTaskFilter === 'UPCOMING') && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between border-b border-stone-200/80 pb-1.5">
                        <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-sky-700" />
                          <span>Kế Hoạch Sắp Tới ({upcomingTasks.length})</span>
                        </h4>
                        <span className="text-[11px] text-stone-500">Chuẩn bị trước ca</span>
                      </div>

                      {upcomingTasks.length === 0 ? (
                        <p className="text-xs text-stone-400 italic p-3 text-center bg-stone-50 rounded-xl">
                          Không có nhiệm vụ kế hoạch sắp tới nào.
                        </p>
                      ) : (
                        <div className="grid gap-2.5">
                          {upcomingTasks.map((task) => {
                            const isHarvestTask = /thu hoạch|cân|đóng thùng/i.test(task.title);
                            const timing = getTaskTimingMeta(task);

                            return (
                              <div
                                key={task.id}
                                onClick={() => setSelectedTaskDetail(task)}
                                className="p-3.5 rounded-2xl border border-stone-200/90 bg-stone-50/40 hover:bg-white hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
                              >
                                <div className="space-y-1.5 min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                                      <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                                      {timing.label}
                                    </span>
                                    {(task.cropDay || task.dayOffset) ? (
                                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        Ngày tuổi {task.cropDay || task.dayOffset}
                                      </span>
                                    ) : null}
                                    {task.dueDate && (
                                      <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-sky-600" />
                                        Ngày {formatDateVN(task.dueDate)}
                                      </span>
                                    )}
                                    <span className="text-xs text-stone-500">
                                      ⏰ {task.deadline || '08:30 AM'}
                                    </span>
                                    {task.workerName && (
                                      <span className="text-[11px] text-stone-500 font-medium">
                                        👤 {task.workerName}
                                      </span>
                                    )}
                                  </div>

                                  <h5 className="font-heading font-bold text-sm text-stone-800 group-hover:text-emerald-900 transition-colors">
                                    {task.title}
                                  </h5>

                                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                                    <span className="font-semibold text-stone-700">VietGAP: </span>
                                    {task.instructions}
                                  </p>

                                  {task.notes && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-300">
                                      <span className="text-amber-800">👨‍🌾 Lưu ý CGNN:</span>
                                      <span className="font-normal truncate max-w-[360px]">{task.notes}</span>
                                      <span className="text-[11px] underline text-amber-800 ml-auto shrink-0">Chi tiết &gt;</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTaskDetail(task);
                                    }}
                                    className="px-3 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                                    <span>Chi tiết</span>
                                  </button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isHarvestTask) {
                                        const hItem = harvestWorkItems.find((item) => item.plotCode === task.plotCode);
                                        setSelectedPlotModalCode(null);
                                        if (hItem) openHarvestWorkspace(hItem);
                                        else handleTaskAction(task);
                                      } else {
                                        handleTaskAction(task);
                                      }
                                    }}
                                    className="gap-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-800 hover:border-emerald-500 cursor-pointer"
                                  >
                                    <Camera className="h-3.5 w-3.5 text-stone-500" />
                                    Làm sớm
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PHẦN 3: ✅ DANH SÁCH VIỆC ĐÃ HOÀN THÀNH */}
                  {(plotTaskFilter === 'ALL' || plotTaskFilter === 'COMPLETED') && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between border-b border-stone-200/80 pb-1.5">
                        <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Lịch Sử Đã Nghiệm Thu ({completedTasks.length})</span>
                        </h4>
                      </div>

                      {completedTasks.length === 0 ? (
                        <p className="text-xs text-stone-400 italic p-3 text-center bg-stone-50 rounded-xl">
                          Chưa có nhiệm vụ nào hoàn tất trong ca trực này.
                        </p>
                      ) : (
                        <div className="grid gap-2">
                          {completedTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTaskDetail(task)}
                              className="p-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 flex items-center justify-between gap-3 transition hover:bg-emerald-50/70 cursor-pointer group"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    {task.title}
                                  </span>
                                  <span className="text-xs font-mono text-stone-500">
                                    {task.completedAt ? `• ${task.completedAt}` : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-stone-600">{task.instructions}</p>
                                <p className="text-[11px] text-emerald-800 font-semibold">
                                  👷 Nghiệm thu: <strong>{task.workerName || user?.fullName || 'Trần Văn Lực (CVLĐ)'}</strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {task.proofPhoto && (
                                  <img
                                    src={task.proofPhoto}
                                    alt="Ảnh nghiệm thu"
                                    className="w-12 h-12 object-cover rounded-xl border border-emerald-300 shadow-2xs hover:scale-105 transition cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(task.proofPhoto, '_blank');
                                    }}
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskDetail(task);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-stone-600 bg-white hover:bg-stone-100 border border-stone-200 shadow-2xs flex items-center gap-1"
                                >
                                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                                  <span>Chi tiết</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: THỜI TIẾT & KHÍ TƯỢNG */}
              {plotModalTab === 'iot' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                    <div>
                      <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-700" />
                        <span>Dữ Liệu Thời Tiết &amp; Khí Tượng Nông Trại (Weather API)</span>
                      </h4>
                      <p className="text-xs text-stone-500">
                        Cập nhật tự động theo tọa độ địa lý nông trại (10.97°N, 106.49°E), hỗ trợ kiểm soát vi khí hậu và cảnh báo BR18.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Weather API · Trực tuyến
                    </span>
                  </div>

                  {/* 5 Sensor Dials */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 text-center space-y-1">
                      <Thermometer className="w-5 h-5 text-amber-600 mx-auto" />
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Nhiệt độ KK</span>
                      <strong className="text-lg font-heading font-black text-stone-900 block">{activePlot.temp || '28.5°C'}</strong>
                      <span className="text-[10px] text-amber-700 font-medium">Lý tưởng 25-32°C</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/40 border border-sky-200/80 text-center space-y-1">
                      <Droplets className="w-5 h-5 text-sky-600 mx-auto" />
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Độ ẩm đất</span>
                      <strong className="text-lg font-heading font-black text-stone-900 block">{activePlot.soilMoisture || '68%'}</strong>
                      <span className="text-[10px] text-sky-700 font-medium">Độ ẩm tối ưu</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50/40 border border-cyan-200/80 text-center space-y-1">
                      <Droplets className="w-5 h-5 text-cyan-600 mx-auto" />
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Độ ẩm không khí</span>
                      <strong className="text-lg font-heading font-black text-stone-900 block">{activePlot.airHumidity || '74%'}</strong>
                      <span className="text-[10px] text-cyan-700 font-medium">Ẩm độ thích hợp</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50/40 border border-yellow-200/80 text-center space-y-1">
                      <Sun className="w-5 h-5 text-yellow-600 mx-auto" />
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Cường độ sáng</span>
                      <strong className="text-lg font-heading font-black text-stone-900 block">{activePlot.light || '45.000 Lux'}</strong>
                      <span className="text-[10px] text-yellow-800 font-medium">Quang hợp mạnh</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/40 border border-emerald-200/80 text-center space-y-1">
                      <Gauge className="w-5 h-5 text-emerald-600 mx-auto" />
                      <span className="text-[10px] text-stone-500 uppercase font-bold block">Độ pH đất</span>
                      <strong className="text-lg font-heading font-black text-stone-900 block">{activePlot.ph || '6.5'}</strong>
                      <span className="text-[10px] text-emerald-700 font-medium">Đất trung tính</span>
                    </div>
                  </div>

                  {/* BR18 Irrigation Rule Notice */}
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-sky-700" />
                      <strong className="font-heading font-black text-sky-900">Quy tắc tự động hóa BR18:</strong>
                    </div>
                    <p className="text-sky-800 leading-relaxed">
                      Trạm quan trắc sẽ <strong>tự động tạm hoãn lệnh tưới</strong> nếu độ ẩm đất đo được vượt ngưỡng <strong>80%</strong> để chống ngập úng rễ và ngăn ngừa nấm bệnh. Hệ thống sẽ kích hoạt lại khi độ ẩm đất hạ về dưới 65%.
                    </p>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: YÊU CẦU DỊCH VỤ CỦA THỬA ĐẤT (SERVICE REQUESTS) */}
              {plotModalTab === 'services' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <div>
                      <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-700" />
                        <span>Dịch Vụ Khách Hàng Đặt Cho Thửa {activePlot.plotCode} ({plotServices.length})</span>
                      </h4>
                      <p className="text-xs text-stone-500">Các gói dịch vụ chăm sóc, bón thúc, phòng bệnh do khách hàng yêu cầu riêng.</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {plotServices.filter(s => s.status === 'DONE' || s.status === 'COMPLETED').length}/{plotServices.length} đã hoàn tất
                    </span>
                  </div>

                  {plotServices.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-500 space-y-1.5">
                      <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="font-heading font-bold text-stone-800 text-sm">Chưa có yêu cầu dịch vụ nào cho thửa này</p>
                      <p className="text-xs text-stone-400">Khi khách hàng đặt mua dịch vụ bổ sung, yêu cầu sẽ tự động đồng bộ ngay tại đây.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {plotServices.map((req) => {
                        const isDone = req.status === 'DONE' || req.status === 'COMPLETED';
                        const isInProg = req.status === 'IN_PROG' || req.status === 'IN_PROGRESS';
                        return (
                          <div
                            key={req.id || req.requestId}
                            className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 transition shadow-2xs space-y-2.5 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                                  {req.id || `REQ-${req.requestId}`}
                                </span>
                                <strong className="font-heading font-black text-stone-900 text-sm">
                                  {req.serviceName}
                                </strong>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isInProg
                                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isDone ? '● Đã hoàn thành' : isInProg ? '● Đang thực hiện' : '● Chờ thực hiện'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-stone-50/70 p-2.5 rounded-xl text-stone-600">
                              <div>
                                <span className="text-[10px] text-stone-400 block font-bold">Lịch hẹn:</span>
                                <strong>📅 {req.scheduledDate || 'Hôm nay'}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-400 block font-bold">Giá dịch vụ:</span>
                                <strong className="text-brand-dark">{Number(req.price || 0).toLocaleString('vi-VN')} đ (Đã trả)</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-stone-400 block font-bold">Khách đặt:</span>
                                <strong>{req.customerName}</strong>
                              </div>
                            </div>

                            {req.notes && (
                              <p className="text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
                                💬 <strong>Ghi chú khách hàng:</strong> {req.notes}
                              </p>
                            )}

                            {isDone && req.proofPhoto && (
                              <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                                <img
                                  src={req.proofPhoto}
                                  alt="Minh chứng"
                                  className="w-10 h-10 rounded-lg object-cover border border-emerald-300 cursor-pointer"
                                  onClick={() => window.open(req.proofPhoto, '_blank')}
                                />
                                <div>
                                  <span className="font-bold text-emerald-900 block text-xs">Đã chụp ảnh nghiệm thu</span>
                                  <span className="text-[10px] text-stone-500">{req.completedAt ? `Hoàn tất: ${req.completedAt}` : 'Nghiệm thu đạt chuẩn'}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                              {!isDone && !isInProg && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleAcceptServiceRequest(req.requestId)}
                                  disabled={isUpdatingService}
                                  className="font-bold text-xs gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tiếp nhận</span>
                                </Button>
                              )}
                              {!isDone && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    handleStartCompleteService(req);
                                  }}
                                  className="font-bold text-xs gap-1.5 bg-[#07533d] hover:bg-[#053d2d] text-white"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>Nghiệm thu ảnh</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 4: THU HOẠCH (HARVEST) */}
              {plotModalTab === 'harvest' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <div>
                      <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-700" />
                        <span>Kế Hoạch & Trạm Cân Thu Hoạch Thửa {activePlot.plotCode}</span>
                      </h4>
                      <p className="text-xs text-stone-500">Nghiệm thu sản lượng thực tế, kết nối cân điện tử tử và in tem QR truy xuất.</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Giống nông sản:</span>
                        <strong className="text-brand-dark text-sm block">{activePlot.crop}</strong>
                        <span className="text-stone-500">Tiêu chuẩn VietGAP</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Ngày dự kiến thu hoạch:</span>
                        <strong className="text-emerald-800 text-sm block">{activePlot.expectedHarvestDate || '—'}</strong>
                        <span className="text-stone-500">
                          {isNotStarted ? 'Chưa bắt đầu vụ' : `Còn khoảng ${Math.max(0, activePlot.totalDays - activePlot.currentDay)} ngày`}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">Sản lượng kỳ vọng:</span>
                        <strong className="text-brand-dark text-sm block">{activePlot.expectedYield || '35 - 45 kg'}</strong>
                        <span className="text-stone-500">Đóng thùng 5kg</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <strong className="font-heading font-black text-stone-900 text-sm block">Vận hành trạm cân điện tử</strong>
                        <p className="text-xs text-stone-500">Mở giao diện trạm cân Bluetooth/Serial để ghi nhận số cân thực tế và đóng gói.</p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedPlotModalCode(null);
                          if (harvest) openHarvestWorkspace(harvest);
                          else setActiveTab('harvest');
                        }}
                        className="font-bold text-xs gap-2 bg-[#07533d] hover:bg-[#053d2d] text-white shrink-0"
                      >
                        <Scale className="w-4 h-4" />
                        <span>Mở Trạm Cân Điện Tử</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Nút đóng modal */}
              <div className="flex justify-end pt-3 border-t border-stone-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPlotModalCode(null)}
                >
                  Đóng cửa sổ
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Modal 0: Chi Tiết Nhiệm Vụ & Lưu Ý / Chỉ Đạo Từ Chuyên Gia Nông Nghiệp (CGNN) */}
      <Modal
        isOpen={Boolean(selectedTaskDetail)}
        onClose={() => setSelectedTaskDetail(null)}
        title={selectedTaskDetail ? `Nhiệm Vụ: ${selectedTaskDetail.id}` : 'Chi Tiết Nhiệm Vụ'}
        subtitle={selectedTaskDetail ? `${selectedTaskDetail.plotCode ? `Thửa ${selectedTaskDetail.plotCode}` : ''} • Giống: ${selectedTaskDetail.crop || 'Rau củ'}` : ''}
        maxWidth="max-w-2xl"
        headerVariant="green"
        zIndex="z-[110]"
      >
        {selectedTaskDetail && (() => {
          const isDone = selectedTaskDetail.status === 'COMPLETED';
          const isInProg = selectedTaskDetail.status === 'IN_PROGRESS';
          const isHarvest = /thu hoạch|cân|đóng thùng/i.test(selectedTaskDetail.title);

          return (
            <div className="space-y-4 text-left text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* 1. Header Tên việc & Trạng thái */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-800 text-white shadow-2xs">
                    {selectedTaskDetail.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isInProg
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {isDone ? '● Đã hoàn thành' : isInProg ? '● Đang làm trong ca' : '● Chờ thực hiện'}
                    </span>
                    {(selectedTaskDetail.priority === 'HIGH' || selectedTaskDetail.priority === 'EMERGENCY') && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Ưu tiên cao
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-heading text-lg font-black text-brand-dark">
                  {selectedTaskDetail.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-stone-600 text-xs pt-1 border-t border-stone-200/60">
                  <span>📍 <strong>{selectedTaskDetail.plotName || `Thửa ${selectedTaskDetail.plotCode}`}</strong></span>
                  <span className="text-stone-300">•</span>
                  <span>🌱 Giống: <strong>{selectedTaskDetail.crop}</strong></span>
                  <span className="text-stone-300">•</span>
                  <span>👤 Khách thuê: <strong>{selectedTaskDetail.customerName}</strong></span>
                  <span className="text-stone-300">•</span>
                  <span>⏰ Hạn: <strong>{selectedTaskDetail.deadline || '08:30 AM'}</strong> ({selectedTaskDetail.dueDate ? formatDateVN(selectedTaskDetail.dueDate) : 'Hôm nay'})</span>
                </div>
              </div>

              {/* 2. CHỈ ĐẠO & GHI CHÚ CHUYÊN GIA NÔNG NGHIỆP (CGNN) - RẤT NỔI BẬT */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                    <span className="p-1 rounded-lg bg-amber-200 text-amber-900">👨‍🌾</span>
                    <span>Chỉ Đạo Kỹ Thuật & Ghi Chú Của Chuyên Gia Nông Nghiệp</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md">
                    {selectedTaskDetail.expertName || 'KS. Chuyên Gia VietGAP'}
                  </span>
                </div>

                <div className="text-xs text-amber-950 leading-relaxed font-medium whitespace-pre-line bg-white/70 p-3 rounded-xl border border-amber-200/60">
                  {selectedTaskDetail.notes || selectedTaskDetail.instructions || 'Chưa có ghi chú đặc biệt từ Chuyên gia. Kỹ thuật viên thực hiện đúng tiêu chuẩn quy trình VietGAP ban hành.'}
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-amber-900 font-semibold">
                  <span>💡 Khuyến cáo: Luôn kiểm tra ẩm độ đất và dự báo mưa từ Weather API trước khi tưới hoặc bón phân.</span>
                  <span className="text-emerald-800">BR15 - Bắt buộc chụp ảnh minh chứng</span>
                </div>
              </div>

              {/* 3. QUY TRÌNH KỸ THUẬT TIÊU CHUẨN VIETGAP */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs border-b border-emerald-200/70 pb-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Hướng Dẫn Thao Tác Chuẩn VietGAP Tại Hiện Trường:</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {selectedTaskDetail.instructions || 'Tuân thủ định mức và kỹ thuật VietGAP, kiểm tra dữ liệu thời tiết trước và sau ca trực.'}
                </p>
              </div>

              {/* 4. ẢNH MINH CHỨNG (NẾU ĐÃ HOÀN THÀNH) */}
              {isDone && selectedTaskDetail.proofPhoto && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="font-bold text-stone-700 text-xs block">Ảnh minh chứng nghiệm thu thực địa (BR15):</span>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedTaskDetail.proofPhoto}
                      alt="Minh chứng"
                      className="w-24 h-24 object-cover rounded-xl border border-stone-300 cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(selectedTaskDetail.proofPhoto, '_blank')}
                    />
                    <div className="space-y-1 text-xs text-stone-600">
                      <p className="font-bold text-emerald-800">✓ Đã nghiệm thu vào nhật ký canh tác của khách hàng.</p>
                      <p className="text-[11px] text-stone-500">Thời gian: {selectedTaskDetail.completedAt || 'Gần đây'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. NÚT HÀNH ĐỘNG Ở CHÂN MODAL */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTaskDetail(null)}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </Button>

                {!isDone && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const taskToExec = selectedTaskDetail;
                      setSelectedTaskDetail(null);
                      if (isHarvest) {
                        const hItem = harvestWorkItems.find((item) => item.plotCode === taskToExec.plotCode);
                        setSelectedPlotModalCode(null);
                        if (hItem) openHarvestWorkspace(hItem);
                        else handleTaskAction(taskToExec);
                      } else {
                        handleTaskAction(taskToExec);
                      }
                    }}
                    className="text-xs font-bold gap-1.5 bg-[#07533d] hover:bg-[#053d2d] text-white cursor-pointer"
                  >
                    {isHarvest ? <Scale className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    <span>{isHarvest ? 'Mở Màn Thu Hoạch' : 'Nghiệm Thu & Chụp Ảnh (BR15)'}</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal 1: Execute Task & Upload Proof Photo */}
      <Modal
        isOpen={Boolean(selectedTaskToExecute)}
        onClose={() => setSelectedTaskToExecute(null)}
        title="Xác Nhận Hoàn Thành Ca Trực Hiện Trường"
        subtitle={selectedTaskToExecute?.title}
        zIndex="z-[110]"
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
        zIndex="z-[110]"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Thửa Đất Phát Hiện Sự Cố:</label>
            <select
              value={newIssuePlot || (plotSummaryList[0]?.plotCode || '')}
              onChange={(e) => setNewIssuePlot(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
            >
              {plotSummaryList.map((plot) => (
                <option key={plot.plotCode} value={plot.plotCode}>{plot.plotName} ({plot.plotCode})</option>
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
              <option value="Khác">Bệnh / Sự cố khác (Tự nhập)</option>
            </select>

            {newIssueType === 'Khác' && (
              <div className="mt-2.5 space-y-1">
                <label className="block text-[11px] font-bold text-emerald-900">
                  Nhập tên bệnh / bất thường cụ thể: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customIssueType}
                  onChange={(e) => setCustomIssueType(e.target.value)}
                  placeholder="Ví dụ: Nấm phấn trắng, sương mai, đốm mắt cua, rỉ sắt, xoăn ngọn..."
                  className="w-full p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
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
          { id: 'services', label: 'Dịch vụ', icon: ShoppingBag },
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
