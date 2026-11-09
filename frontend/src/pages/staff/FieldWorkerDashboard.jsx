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
  Layers,
  Calendar,
  Sparkles,
  QrCode,
  Scale,
  MapPin,
  PlusCircle,
  Eye,
  ArrowLeft,
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
  Gauge,
  RefreshCw
} from 'lucide-react';
import { fetchLiveAgroIotData } from '../../services/weatherIotService';
import { recordStaffActivity, resolveStandardCropProcess } from '../../services/cropStandardProcess';
import { shouldShowExpertNote, splitLeadingTag, formatAgendaDate, groupTasksByDueDate } from '../../utils/staffTaskDisplay';



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

const getTaskTimingMeta = (task, plotCurrentDay = null) => {
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

  const taskAge = task.cropDay !== undefined && task.cropDay !== null ? Number(task.cropDay) : (task.dayOffset !== undefined && task.dayOffset !== null ? Number(task.dayOffset) : null);
  const plotAge = plotCurrentDay !== null && plotCurrentDay !== undefined ? Number(plotCurrentDay) : (task.plotCurrentDay !== undefined && task.plotCurrentDay !== null ? Number(task.plotCurrentDay) : null);

  // 1. Nếu hạn ở tương lai (sau ngày hôm nay) HOẶC task thuộc ngày tuổi tương lai của vụ mùa -> Bắt buộc là Chưa tới hạn
  if ((rawDate && rawDate > todayStr) || (plotAge !== null && taskAge !== null && taskAge > plotAge)) {
    const isPriority = task.priority === 'HIGH' || task.priority === 'URGENT' || task.priority === 'EMERGENCY';
    return {
      key: 'NOT_DUE',
      label: isPriority ? 'Ưu tiên cao (Chưa tới hạn)' : (taskAge ? `Chưa tới hạn (Ngày ${taskAge})` : 'Chưa tới hạn'),
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

// ponytail: parse an toàn qua Date + Intl stdlib; nâng lên date-fns khi cần nhiều format lạ
const formatHarvestTimestamp = (raw) => {
  if (!raw) return '';
  const d = new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const HARVEST_PHOTO_FALLBACK = '/images/harvest/rau-muong-p03.jpg';

const isHarvestTaskTitle = (title) => {
  if (!title) return false;
  if (/trước thu hoạch|chuẩn bị thu hoạch/i.test(title)) return false;
  return /thu hoạch|cân|đóng thùng|nghiệm thu/i.test(title);
};

const isTaskToday = (t, plotCurrentDay = null) => {
  if (t.status === 'COMPLETED') return false;

  const isHarvest = isHarvestTaskTitle(t.title);
  const plotAge = plotCurrentDay !== null && plotCurrentDay !== undefined ? Number(plotCurrentDay) : (t.plotCurrentDay !== undefined && t.plotCurrentDay !== null ? Number(t.plotCurrentDay) : null);

  // Nếu là task thu hoạch và thửa đang ở giai đoạn thu hoạch (ngày tuổi >= 25) -> Luôn là việc HÔM NAY cần làm
  if (isHarvest && plotAge !== null && plotAge >= 25) {
    return true;
  }

  const rawDate = t.dueDate || (/^\d{4}-\d{2}-\d{2}$/.test(t.deadline || '') ? t.deadline : null);
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  if (rawDate && rawDate > todayStr && !isHarvest) return false;

  const taskAge = t.cropDay !== undefined && t.cropDay !== null ? Number(t.cropDay) : (t.dayOffset !== undefined && t.dayOffset !== null ? Number(t.dayOffset) : null);
  if (plotAge !== null && taskAge !== null && taskAge > plotAge && !isHarvest) return false;

  const meta = getTaskTimingMeta(t, plotCurrentDay);
  return meta.key === 'TODAY' || meta.key === 'DUE_SOON' || meta.key === 'URGENT' || meta.key === 'OVERDUE';
};

// Left accent + status word for a task card. Default "Hôm nay" shows no status word.
const getTaskCardAccent = (task, variant, plotCurrentDay = null) => {
  if (variant === 'done') return { border: 'border-l-emerald-300', dot: 'bg-emerald-500', label: null };
  if (variant === 'upcoming') return { border: 'border-l-stone-300', dot: 'bg-stone-400', label: null };
  const timing = getTaskTimingMeta(task, plotCurrentDay);
  if (timing.key === 'URGENT') return { border: 'border-l-rose-500', dot: 'bg-rose-500', label: 'Khẩn cấp', text: 'text-rose-700' };
  if (timing.key === 'OVERDUE') return { border: 'border-l-rose-500', dot: 'bg-rose-500', label: 'Quá hạn', text: 'text-rose-700' };
  if (task.status === 'IN_PROGRESS' && timing.key === 'TODAY') return { border: 'border-l-sky-500', dot: 'bg-sky-500', label: 'Đang làm trong ca', text: 'text-sky-700' };
  if (timing.label === 'Ưu tiên hôm nay') return { border: 'border-l-amber-400', dot: 'bg-amber-500', label: 'Ưu tiên hôm nay', text: 'text-amber-800' };
  return { border: 'border-l-emerald-500', dot: 'bg-emerald-500', label: null };
};

function PlotTaskCard({ task, variant, onOpenDetail, onExecute, isExpanded, onToggleExpand, fallbackWorker, plotCurrentDay = null }) {
  const { tag, text: titleText } = splitLeadingTag(task.title);
  const accent = getTaskCardAccent(task, variant, plotCurrentDay || task.plotCurrentDay);
  const isDone = variant === 'done';
  const isHarvest = isHarvestTaskTitle(task.title);
  const dayAge = task.cropDay || task.dayOffset;
  const description = task.instructions || '';
  const isLong = description.length > 120;
  const showNote = !isDone && shouldShowExpertNote(task.notes, description);
  // Overdue tasks from earlier days sit in "Hôm nay"; keep their original due date visible.
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  const overdueSince = variant === 'today' && task.dueDate && task.dueDate < todayStr ? `Hạn ${formatAgendaDate(task.dueDate)}` : null;
  const metaParts = [overdueSince, dayAge ? `Ngày tuổi ${dayAge}` : null, task.workerName || fallbackWorker].filter(Boolean);
  const timeLabel = isDone ? (task.completedAt || '—') : (task.deadline || '—');

  // The title button is the single detail trigger; its ::after overlay makes the whole card clickable.
  // Action controls sit above the overlay (relative z-10) so they are siblings, not nested in a button.
  return (
    <article
      className={`group relative flex w-full min-w-0 flex-wrap items-start gap-3 rounded-xl border border-stone-200 border-l-4 ${accent.border} ${isDone ? 'bg-white/70' : variant === 'upcoming' ? 'bg-stone-50/60' : 'bg-white shadow-2xs'} p-3 transition hover:border-stone-300 hover:shadow-xs has-[.task-detail-trigger:focus-visible]:ring-2 has-[.task-detail-trigger:focus-visible]:ring-emerald-500/40 sm:flex-nowrap sm:items-center`}
    >
      <div className={`w-14 shrink-0 self-start pt-0.5 font-mono text-xs font-bold ${isDone ? 'text-stone-500' : 'text-stone-700'}`}>
        {isDone ? <Check className="mb-0.5 h-3.5 w-3.5 text-emerald-600" /> : null}
        {timeLabel}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {tag ? (
            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
              {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
            </span>
          ) : null}
          <h5 className={`font-heading text-sm ${isDone ? 'font-bold text-stone-500' : 'font-black text-stone-900 group-hover:text-emerald-900'}`}>
            <button
              type="button"
              onClick={() => onOpenDetail(task)}
              className="task-detail-trigger text-left cursor-pointer focus:outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
            >
              {titleText || task.title}
            </button>
          </h5>
        </div>

        <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-stone-500">
          {accent.label ? (
            <>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${accent.dot}`} />
              <span className={`shrink-0 whitespace-nowrap font-bold ${accent.text}`}>{accent.label}</span>
              {metaParts.length ? <span className="text-stone-300">·</span> : null}
            </>
          ) : null}
          <span className="min-w-0 truncate">{isDone ? `Hoàn thành: ${task.workerName || fallbackWorker}` : metaParts.join(' · ')}</span>
        </p>

        {!isDone && description ? (
          <div className="text-xs leading-relaxed text-stone-600">
            <p className={isExpanded ? '' : 'line-clamp-2'}>{description}</p>
            {isLong ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(task.id);
                }}
                aria-expanded={isExpanded}
                className="relative z-10 mt-0.5 text-[11px] font-bold text-emerald-700 hover:underline"
              >
                {isExpanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            ) : null}
          </div>
        ) : null}

        {showNote ? (
          <p className="flex min-w-0 items-center gap-1 text-[11px] text-amber-800">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="shrink-0 font-bold">CGNN:</span>
            <span className="min-w-0 truncate">{task.notes}</span>
          </p>
        ) : null}
      </div>

      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        {variant === 'today' ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onExecute(task);
            }}
            title={isHarvest ? 'Mở màn thu hoạch' : 'Báo cáo xong việc & chụp ảnh minh chứng'}
            className="relative z-10 flex-1 sm:flex-none"
          >
            {isHarvest ? <Scale className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
            <span>{isHarvest ? 'Thu hoạch' : 'Xong việc'}</span>
          </Button>
        ) : variant === 'upcoming' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onExecute(task);
            }}
            title="Thực hiện sớm và báo cáo xong việc"
            className="relative z-10 flex-1 border border-stone-200 text-stone-600 hover:text-emerald-800 sm:flex-none"
          >
            Làm sớm
          </Button>
        ) : task.proofPhoto ? (
          <button
            type="button"
            onClick={() => window.open(task.proofPhoto, '_blank')}
            title="Xem ảnh hoàn thành"
            className="relative z-10 shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <img
              src={task.proofPhoto}
              alt="Ảnh hoàn thành"
              className="h-10 w-10 rounded-lg border border-emerald-200 object-cover transition hover:scale-105"
            />
          </button>
        ) : null}
        <ChevronRight aria-hidden="true" className="hidden h-4 w-4 shrink-0 text-stone-300 group-hover:text-emerald-700 sm:block" />
      </div>
    </article>
  );
}

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

function IssueHistory({ issues, filter, onFilter, search, onSearch, selectedIssue, onSelect, onOpenTask, onCreate }) {
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <span>Phát hiện bất thường tại thửa đất? Gửi báo cáo kèm ảnh cho CGNN.</span>
          {onCreate ? (
            <button type="button" onClick={onCreate} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-50">
              <PlusCircle className="h-3.5 w-3.5" />
              Báo sự cố mới
            </button>
          ) : null}
        </div>
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
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState(() => new Set());
  const toggleTaskExpanded = (taskId) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };
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
  const [selectedHarvestProofModal, setSelectedHarvestProofModal] = useState(null);
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
          plotCurrentDay: task.plotCurrentDay !== undefined ? Number(task.plotCurrentDay) : null,
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
          // Với CVLĐ, phiếu hoàn tất ngay khi đã cân thực tế — không chờ khách nghiệm thu
          status: Number(harvest.yieldAmount) > 0 ? 'COMPLETED' : 'READY_TO_HARVEST',
          actualWeight: harvest.yieldAmount ? `${harvest.yieldAmount} kg` : '',
          photoUrl: harvest.evidenceImageUrl || '',
          staffName: harvest.workerName || user?.fullName || 'Nhân viên hiện trường',
          verifiedAt: formatHarvestTimestamp(harvest.createdAt || harvest.harvestDate)
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
      if (e.key === 'farmely_task_sync' || e.key === 'farmely_staff_sync_ping' || e.key === 'farmely_persisted_staff_activities_v2' || e.key === 'farmely_time_simulated_at') {
        loadTasksAndData();
        loadPlots();
      }
    };
    const handleTimeSimulated = () => {
      loadPlots();
      loadTasksAndData();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('farmely_time_simulated', handleTimeSimulated);

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
      window.removeEventListener('farmely_time_simulated', handleTimeSimulated);
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
      setDataError('Ảnh minh chứng là bắt buộc khi báo cáo xong việc.');
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
        const resolvedTaskCropDay = selectedTaskToExecute.cropDay || selectedTaskToExecute.day || matchedPlot?.currentDay || 1;
        const now = new Date();
        const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
        const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        recordStaffActivity({
          activityId: `ACT-${targetTaskId}-${Date.now()}`,
          plotId: pCode,
          plotCode: pCode,
          rentalId: selectedTaskToExecute.rentalId || matchedPlot?.rentalId || 1,
          workerName: user?.fullName || 'Kỹ thuật viên hiện trường chuyên trách',
          workerRole: 'Kỹ thuật viên hiện trường chuyên trách',
          title: selectedTaskToExecute.title || 'Chăm sóc luống cây trồng',
          timestamp: `${dateFormatted} • ${timeFormatted}`,
          status: 'COMPLETED',
          day: resolvedTaskCropDay,
          cropDay: resolvedTaskCropDay,
          completedAt: now.toISOString(),
          notes: taskProofNote || 'Nhiệm vụ đã được hoàn tất và báo cáo xong việc.',
          proofPhoto: taskProofPhoto
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
          setTimeout(() => {
            try { bc.close(); } catch {}
          }, 1500);
        }
      } catch {}

      try {
        localStorage.setItem('farmely_task_sync', String(Date.now()));
        localStorage.setItem('farmely_persisted_staff_activities_v2', String(Date.now()));
        window.dispatchEvent(new CustomEvent('farmely_task_completed', { detail: { taskId: targetTaskId } }));
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
      setDataSuccess('Đã báo cáo xong việc và tự động cập nhật ảnh minh chứng vào nhật ký của khách hàng.');
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
          evidenceImageUrl: harvestPhotos[0]
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

  const handleExecuteTask = (task) => {
    if (isHarvestTaskTitle(task.title)) {
      const hItem = harvestWorkItems.find((item) => item.plotCode === task.plotCode);
      setSelectedPlotModalCode(null);
      if (hItem) openHarvestWorkspace(hItem);
      else handleTaskAction(task);
    } else {
      handleTaskAction(task);
    }
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
  const orderedTasks = useMemo(() => [...tasks].sort((first, second) => taskRank(first) - taskRank(second)), [tasks]);
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

      // Tự động đồng bộ các task khi tua ngày (Fast-forward sync cho Demo):
      // Nếu thửa đã ở Ngày N (ví dụ Ngày 30), toàn bộ các task kỹ thuật từ các ngày trước
      // (trừ Thu hoạch & Nghiệm thu) tự động đánh dấu là COMPLETED
      const isHarvestTask = /thu hoạch|nghiệm thu/i.test(`${task.title} ${task.instructions || ''}`);
      const taskAge = task.cropDay !== null && task.cropDay !== undefined ? Number(task.cropDay) : (task.dayOffset !== null && task.dayOffset !== undefined ? Number(task.dayOffset) : 1);
      const plotAge = Number(targetPlot.currentDay) || 1;
      const totalPlotDays = Number(targetPlot.totalDays) || 30;

      let effectiveStatus = task.status;
      if (plotAge >= totalPlotDays && !isHarvestTask) {
        effectiveStatus = 'COMPLETED';
      } else if (plotAge > 1 && taskAge < plotAge && !isHarvestTask) {
        effectiveStatus = 'COMPLETED';
      } else if (isHarvestTask) {
        // Nhiệm vụ thu hoạch chỉ thực sự COMPLETED khi đã có bản ghi thu hoạch trong CSDL
        const hasRealHarvest = harvestTasks.some(h => (h.rentalId && task.rentalId && Number(h.rentalId) === Number(task.rentalId)) || (h.plotCode && h.plotCode === targetPlot.plotCode));
        effectiveStatus = hasRealHarvest ? 'COMPLETED' : 'IN_PROGRESS';
      }

      targetPlot.tasks.push({
        ...task,
        status: effectiveStatus,
        plotCurrentDay: targetPlot.currentDay !== undefined ? targetPlot.currentDay : task.plotCurrentDay
      });
    });

    const list = Array.from(map.values());
    return list.sort((a, b) => {
      const aPending = (a.tasks || []).filter((t) => t.status !== 'COMPLETED').length;
      const bPending = (b.tasks || []).filter((t) => t.status !== 'COMPLETED').length;
      return bPending - aPending;
    });
  }, [assignedPlots, orderedTasks]);

  // Tích hợp Open-Meteo Weather API thực địa cho Modal chi tiết thửa đất (SSoT: Không mock)
  const [modalWeather, setModalWeather] = useState(null);
  const [modalWeatherLoading, setModalWeatherLoading] = useState(false);
  const [modalWeatherError, setModalWeatherError] = useState(null);

  const loadPlotWeather = useCallback(async (plot, force = false) => {
    if (!plot) return;
    setModalWeatherLoading(true);
    setModalWeatherError(null);
    try {
      const res = await fetchLiveAgroIotData(plot, force);
      if (res && res.isLive3rdParty) {
        setModalWeather(res);
      } else {
        setModalWeather(null);
        setModalWeatherError('Không thể kết nối đến máy chủ Open-Meteo API. Vui lòng kiểm tra kết nối mạng.');
      }
    } catch (err) {
      setModalWeather(null);
      setModalWeatherError('Lỗi kết nối Weather API: ' + (err.message || 'Không có phản hồi'));
    } finally {
      setModalWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPlotModalCode) {
      setModalWeather(null);
      setModalWeatherError(null);
      return;
    }
    const current = plotSummaryList.find((p) => p.key === selectedPlotModalCode || String(p.rentalId) === String(selectedPlotModalCode) || p.plotCode === selectedPlotModalCode);
    if (current) {
      loadPlotWeather(current);
    }
  }, [selectedPlotModalCode, loadPlotWeather]);
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
        status: recordedHarvest ? 'COMPLETED' : 'READY_TO_HARVEST',
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

  // Danh sách các đợt thu hoạch đã hoàn tất đối chứng cân thực tế (BR20)
  const completedHarvests = useMemo(() => {
    return harvestTasks.filter((item) => {
      const weightNum = Number(String(item.actualWeight || item.yieldAmount || '').replace(/[^\d.]/g, ''));
      return item.status === 'COMPLETED' || weightNum > 0 || Boolean(item.photoUrl);
    });
  }, [harvestTasks]);

  // Sidebar badge counts (display only)
  const todayActionableCount = tasks.filter(isTaskToday).length;
  const overdueTodayCount = tasks.filter((t) => isTaskToday(t) && ['OVERDUE', 'URGENT'].includes(getTaskTimingMeta(t).key)).length;
  const servicesOpenCount = serviceRequests.filter((s) => s.status !== 'DONE' && s.status !== 'COMPLETED').length;
  const servicesAwaitingAcceptCount = serviceRequests.filter((s) => ['PENDING', 'PAID', 'ASSIGNED'].includes(s.status)).length;
  const harvestOpenCount = harvestWorkItems.filter((h) => h.status !== 'COMPLETED').length;
  const openIssueCount = myIssues.filter((i) => issueStatusMeta(i).key !== 'CLOSED').length;
  const openNewIssueModal = () => {
    setNewIssuePlot(newIssuePlot || plotSummaryList[0]?.plotCode || '');
    setShowNewIssueModal(true);
  };

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

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-brand-border bg-white/95 p-1.5 shadow-elevated backdrop-blur lg:hidden" aria-label="Điều hướng nhân viên hiện trường">
        {[
          { id: 'tasks', label: 'Thửa đất', icon: Layers, count: todayActionableCount, dot: overdueTodayCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-400 text-brand-dark' },
          { id: 'services', label: 'Dịch vụ', icon: ShoppingBag },
          { id: 'harvest', label: 'Thu hoạch', icon: PackageCheck },
          { id: 'issues', label: 'Sự cố', icon: FileText }
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button key={item.id} type="button" onClick={() => { setSelectedPlotModalCode(null); setActiveTab(item.id); }} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${active ? 'bg-[#064b37] text-white' : 'text-stone-500 hover:bg-stone-50'}`}>
              <span className="relative">
                <Icon className="h-5 w-5" />
                {item.count > 0 && <span title={`${item.count} việc cần làm hôm nay`} className={`absolute -right-2.5 -top-1.5 min-w-4 rounded-full px-1 text-center text-[9px] font-black leading-4 ${item.dot}`}>{item.count}</span>}
              </span>
              {item.label}
            </button>
          );
        })}
        <button type="button" onClick={() => window.dispatchEvent(new Event('farmely:open-profile'))} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-stone-500 hover:bg-stone-50"><UserCheck className="h-5 w-5" />Tài khoản</button>
      </nav>

      <main className={`box-border flex-1 pt-24 sm:pt-28 pb-28 lg:pb-16 max-w-[1720px] mx-auto lg:mr-0 px-4 sm:px-8 lg:px-10 w-full lg:w-auto space-y-6 transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        
        {!selectedPlotModalCode && (
          <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Ca trực hiện trường</div>
              <h1 className="mt-0.5 font-heading text-2xl font-black text-brand-dark sm:text-3xl">
                {activeTab === 'tasks' ? 'Thửa đất phụ trách' : activeTab === 'services' ? 'Yêu cầu dịch vụ' : activeTab === 'harvest' ? 'Thu hoạch' : 'Lịch sử báo cáo'}
              </h1>
              <p className="mt-0.5 text-xs text-brand-muted">
                {activeTab === 'tasks'
                  ? `${tasks.length} nhiệm vụ tại ${plotSummaryList.length} thửa đất phụ trách ca trực`
                  : activeTab === 'services'
                    ? `${serviceRequests.length} yêu cầu dịch vụ do khách hàng đặt mua theo yêu cầu`
                    : activeTab === 'harvest'
                      ? 'Chụp ảnh, nhập số cân và xác nhận kết quả thu hoạch tại thửa.'
                      : 'Theo dõi các sự cố đã gửi và tiến độ xử lý từ chuyên gia.'}
              </p>
            </div>

            {activeTab === 'tasks' && (
              <div className="flex flex-wrap items-center gap-2.5 lg:flex-nowrap">
                <div className="rounded-2xl border border-stone-200 bg-white px-3.5 py-2 shadow-2xs min-w-[110px]">
                  <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">Tổng nhiệm vụ</span>
                  <strong className="font-heading text-xl font-black text-stone-900 mt-0.5 block leading-tight">{tasks.length}</strong>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 shadow-2xs min-w-[125px]">
                  <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider whitespace-nowrap">Cần làm hôm nay</span>
                  <strong className="font-heading text-xl font-black text-amber-900 mt-0.5 block leading-tight">{todayActionableCount}</strong>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 shadow-2xs min-w-[115px]">
                  <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider whitespace-nowrap">Đã hoàn thành</span>
                  <strong className="font-heading text-xl font-black text-emerald-900 mt-0.5 block leading-tight">{completedCount}</strong>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-xs shadow-sm whitespace-nowrap">
                  <span className="font-bold text-stone-500">{currentSession === 'MORNING' ? 'Ca sáng' : 'Ca chiều'} · </span>
                  <strong className="text-emerald-800">{completedCount}/{tasks.length} nhiệm vụ hoàn thành</strong>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="flex flex-wrap items-center gap-2.5 lg:flex-nowrap">
                <div className="rounded-2xl border border-stone-200 bg-white px-3.5 py-2 shadow-2xs min-w-[110px]">
                  <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">Tổng yêu cầu</span>
                  <strong className="font-heading text-xl font-black text-stone-900 mt-0.5 block leading-tight">{serviceRequests.length}</strong>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 shadow-2xs min-w-[115px]">
                  <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider whitespace-nowrap">Cần thực hiện</span>
                  <strong className="font-heading text-xl font-black text-amber-900 mt-0.5 block leading-tight">
                    {serviceRequests.filter(s => s.status !== 'DONE' && s.status !== 'COMPLETED').length}
                  </strong>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 shadow-2xs min-w-[110px]">
                  <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider whitespace-nowrap">Đã hoàn tất</span>
                  <strong className="font-heading text-xl font-black text-emerald-900 mt-0.5 block leading-tight">
                    {serviceRequests.filter(s => s.status === 'DONE' || s.status === 'COMPLETED').length}
                  </strong>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-xs shadow-sm flex items-center gap-2 whitespace-nowrap">
                  <span className="font-bold text-stone-500">Tiến độ dịch vụ: </span>
                  <strong className="text-emerald-800">
                    {serviceRequests.filter(s => s.status === 'DONE' || s.status === 'COMPLETED').length}/{serviceRequests.length} đã hoàn tất
                  </strong>
                </div>
              </div>
            )}
          </section>
        )}

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
            {(() => {
              const badgeTones = {
                urgent: { pill: 'bg-rose-500 text-white', dot: 'bg-rose-400' },
                action: { pill: 'bg-amber-400/90 text-brand-dark', dot: 'bg-amber-300' },
                info: { pill: 'bg-white/15 text-emerald-50', dot: null }
              };
              const groupHeader = (label) => (
                <div className={`px-2 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-wider text-emerald-100/60 first:pt-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{label}</div>
              );
              const renderNavItem = (tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const tone = badgeTones[tab.tone] || badgeTones.info;
                const hasCount = tab.count > 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlotModalCode(null);
                      setActiveTab(tab.id);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={sidebarCollapsed ? tab.label : undefined}
                    className={`relative group min-h-11 w-full px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
                      isActive ? 'bg-white/[0.12] text-white' : 'text-emerald-50/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isActive && <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand-yellow" />}
                    <div className="relative flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brand-yellow' : 'text-emerald-100/80'}`} />
                      {sidebarCollapsed && hasCount && tone.dot && <span aria-hidden="true" className={`absolute -right-1 -top-1 hidden h-2 w-2 rounded-full ring-2 ring-[#064b37] lg:block ${tone.dot}`} />}
                      <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{tab.label}</span>
                    </div>
                    {hasCount && (
                      <span title={tab.countTitle} className={`${sidebarCollapsed ? 'lg:hidden' : ''} min-w-6 px-2 py-0.5 rounded-full text-center text-xs font-bold ${tone.pill}`}>
                        {tab.count}
                      </span>
                    )}
                    {sidebarCollapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">{tab.label}{hasCount ? ` · ${tab.count}` : ''}</span>}
                  </button>
                );
              };

              return (
                <div className="flex flex-col gap-0.5">
                  {groupHeader('Công việc')}
                  {[
                    { id: 'tasks', label: 'Thửa đất phụ trách', icon: Layers, count: todayActionableCount, tone: overdueTodayCount > 0 ? 'urgent' : todayActionableCount > 0 ? 'action' : 'info', countTitle: `${todayActionableCount} việc cần làm hôm nay` },
                    { id: 'services', label: 'Yêu cầu dịch vụ', icon: ShoppingBag, count: servicesOpenCount, tone: servicesAwaitingAcceptCount > 0 ? 'action' : 'info', countTitle: servicesAwaitingAcceptCount > 0 ? `${servicesAwaitingAcceptCount} yêu cầu chờ tiếp nhận` : `${servicesOpenCount} yêu cầu chưa hoàn tất` },
                    { id: 'harvest', label: 'Thu hoạch', icon: PackageCheck, count: harvestOpenCount, tone: 'info', countTitle: `${harvestOpenCount} thửa chưa ghi nhận thu hoạch` }
                  ].map(renderNavItem)}

                  {groupHeader('Sự cố hiện trường')}
                  <button
                    type="button"
                    onClick={openNewIssueModal}
                    aria-label={sidebarCollapsed ? 'Báo sự cố mới' : undefined}
                    className={`relative group min-h-11 w-full px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 cursor-pointer border border-amber-300/40 text-amber-100 hover:bg-amber-300/10 ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                  >
                    <PlusCircle className="w-4 h-4 text-amber-200" />
                    <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Báo sự cố mới</span>
                    {sidebarCollapsed && <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-3 py-2 text-xs text-white shadow-lg group-hover:lg:block">Báo sự cố mới</span>}
                  </button>
                  {renderNavItem({ id: 'issues', label: 'Lịch sử báo cáo', icon: FileText, count: openIssueCount, tone: 'info', countTitle: `${openIssueCount} báo cáo chưa đóng` })}
                </div>
              );
            })()}
          </DashboardRail>
          </div>

          {/* Worker Main Section */}
          <section className="flex-1 min-w-0 w-full space-y-6">

            {/* Assigned care tasks */}
            {!selectedPlotModalCode && activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-lg font-black text-brand-dark flex items-center gap-2">
                        <Layers className="h-5 w-5 text-emerald-800" />
                        <span>Thửa đất phụ trách ca trực</span>
                      </h3>
                      <p className="text-xs text-stone-500">
                        Bấm vào từng thửa đất để mở trang chi tiết công việc cần làm hôm nay, báo cáo xong việc hoặc báo sự cố.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                      {plotSummaryList.length} Thửa đất phụ trách
                    </span>
                  </div>

                  {/* Grid các thửa đất phụ trách - Bấm vào sẽ mở trang chi tiết công việc */}
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
                          onClick={() => {
                            setSelectedPlotModalCode(plot.key || plot.plotCode);
                            setPlotModalTab('tasks');
                          }}
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
            {!selectedPlotModalCode && activeTab === 'services' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
                  <div>
                    <h3 className="font-heading font-black text-xl text-brand-dark flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-800" />
                      <span>Yêu Cầu Dịch Vụ Canh Tác Từ Khách Hàng</span>
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Danh sách dịch vụ nông nghiệp khách thuê đặt mua cho thửa đất. Bạn có thể tiếp nhận và báo cáo xong việc kèm ảnh chứng thực.
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

                    return (
                      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                          <thead>
                            <tr className="bg-stone-50/90 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                              <th className="py-3.5 px-4 whitespace-nowrap">Mã YC</th>
                              <th className="py-3.5 px-4 whitespace-nowrap">Thửa Đất</th>
                              <th className="py-3.5 px-4 min-w-[160px]">Tên Dịch Vụ</th>
                              <th className="py-3.5 px-4 min-w-[150px]">Khách Hàng</th>
                              <th className="py-3.5 px-4 whitespace-nowrap">Lịch Hẹn</th>
                              <th className="py-3.5 px-4 whitespace-nowrap">Giá Tiền</th>
                              <th className="py-3.5 px-4 whitespace-nowrap text-center">Trạng Thái</th>
                              <th className="py-3.5 px-4 whitespace-nowrap text-right">Thao Tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 text-stone-700">
                            {filtered.map((req) => {
                              const isDone = req.status === 'DONE' || req.status === 'COMPLETED';
                              const isInProg = req.status === 'IN_PROG' || req.status === 'IN_PROGRESS';
                              return (
                                <tr
                                  key={req.id || req.requestId}
                                  className="hover:bg-emerald-50/30 transition-colors"
                                >
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-200/60">
                                      {req.id || `REQ-${req.requestId}`}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                                        {req.plotCode}
                                      </span>
                                      <span className="font-semibold text-stone-800">{req.plotName}</span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-stone-900">
                                    {req.serviceName}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className="font-semibold text-stone-800 block">{req.customerName}</span>
                                    {req.customerPhone && (
                                      <span className="text-[11px] text-stone-500 font-mono block mt-0.5">{req.customerPhone}</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                                    {req.scheduledDate || 'Thực hiện ngay'}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <strong className="text-brand-dark block">
                                      {Number(req.price || 0).toLocaleString('vi-VN')} đ
                                    </strong>
                                    <span className="text-emerald-700 text-[10px] font-medium block">✓ Đã thanh toán</span>
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                        isDone
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : isInProg
                                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}
                                    >
                                      {isDone ? '● Đã hoàn thành' : isInProg ? '● Đang thực hiện' : '● Chờ thực hiện'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {!isDone && !isInProg && (
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => handleAcceptServiceRequest(req.requestId)}
                                          disabled={isUpdatingService}
                                          className="font-bold text-xs gap-1 px-2.5 py-1"
                                          title="Tiếp nhận thực hiện"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Tiếp nhận</span>
                                        </Button>
                                      )}

                                      {!isDone && (
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() => handleStartCompleteService(req)}
                                          className="font-bold text-xs gap-1 bg-[#07533d] hover:bg-[#053d2d] text-white px-2.5 py-1"
                                          title="Báo cáo xong việc (chụp ảnh)"
                                        >
                                          <Camera className="w-3.5 h-3.5" />
                                          <span>Báo cáo</span>
                                        </Button>
                                      )}

                                      {isDone && req.proofPhoto && (
                                        <button
                                          type="button"
                                          onClick={() => window.open(req.proofPhoto, '_blank')}
                                          className="p-1 rounded-lg border border-emerald-200 hover:border-emerald-400 bg-emerald-50 transition cursor-pointer"
                                          title="Xem ảnh minh chứng"
                                        >
                                          <img
                                            src={req.proofPhoto}
                                            alt="Minh chứng"
                                            className="w-6 h-6 rounded object-cover"
                                          />
                                        </button>
                                      )}

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedPlotModalCode(req.rentalId ? String(req.rentalId) : req.plotCode);
                                          setPlotModalTab('services');
                                        }}
                                        className="font-bold text-xs gap-1 text-stone-700 px-2.5 py-1"
                                        title="Xem chi tiết thửa đất này"
                                      >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>Xem thửa</span>
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Field issues */}
            {!selectedPlotModalCode && activeTab === 'issues' && (
              <IssueHistory
                issues={myIssues}
                filter={issueFilter}
                onFilter={setIssueFilter}
                search={issueSearch}
                onSearch={setIssueSearch}
                selectedIssue={selectedIssue}
                onSelect={setSelectedIssue}
                onCreate={openNewIssueModal}
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

            {!selectedPlotModalCode && activeTab === 'harvest' && (
              <div className="space-y-6">
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

                {/* KHỐI LỊCH SỬ THU HOẠCH & BIÊN BẢN ĐỐI CHỨNG THEO VỤ MÙA (BR20) */}
                <section className="rounded-3xl border border-brand-border bg-white p-5 sm:p-7 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border/70 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                          <Scale className="h-4 w-4" />
                        </span>
                        <h3 className="font-heading text-lg font-black text-brand-dark">
                          Lịch Sử Thu Hoạch & Biên Bản Đối Chứng Theo Vụ Mùa (BR20)
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-brand-muted">
                        Danh sách các đợt thu hoạch đã hoàn tất cân thực tế, lưu ảnh minh chứng tại thửa và bàn giao cho khách hàng nghiệm thu.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {completedHarvests.length} Đợt Thu Hoạch Đã Ghi Nhận
                    </span>
                  </div>

                  {completedHarvests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center text-xs text-stone-500">
                      Chưa có đợt thu hoạch nào được hoàn tất ghi nhận tại nông trại.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {completedHarvests.map((h, idx) => {
                        const seasonLabel = h.seasonName || `Vụ ${idx % 2 === 0 ? 1 : 2}: ${h.crop || 'Nông sản VietGAP'}`;
                        return (
                          <div
                            key={h.id || h.apiId || idx}
                            className="p-4 sm:p-5 rounded-2xl border border-brand-border bg-stone-50/60 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3.5 text-xs"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-emerald-800 text-white shrink-0">
                                    {h.plotCode || 'P-01'}
                                  </span>
                                  <strong className="text-brand-dark font-heading text-sm truncate">{h.plotName}</strong>
                                </div>
                                <span className="shrink-0 whitespace-nowrap rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  ✓ Đã cân &amp; ghi nhận
                                </span>
                              </div>

                              <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 items-center">
                                <img
                                  src={h.photoUrl || HARVEST_PHOTO_FALLBACK}
                                  alt="Ảnh cân thu hoạch"
                                  onError={(e) => { e.currentTarget.src = HARVEST_PHOTO_FALLBACK; }}
                                  className="h-24 w-full rounded-xl object-cover border border-stone-200 bg-stone-100"
                                />
                                <div className="space-y-1.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-100 text-lime-900 border border-lime-200">
                                      {seasonLabel}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-stone-400 block font-bold">Khối lượng cân thực tế:</span>
                                    <strong className="text-emerald-800 font-heading text-base font-black">
                                      {h.actualWeight || `${h.yieldAmount || '35.0'} kg`}
                                    </strong>
                                  </div>
                                  <p className="text-[11px] text-stone-500 truncate">
                                    👤 Người cân: <strong className="text-stone-700">{h.staffName || user?.fullName || 'Trần Văn Lực'}</strong>
                                  </p>
                                  <p className="text-[10px] text-stone-400">
                                    🕒 Ngày ghi nhận: {h.verifiedAt || h.harvestDate || 'Hôm nay'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-stone-200/50">
                              <span className="font-mono text-[10px] text-stone-400">Mã biên bản: {h.id}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedHarvestProofModal(h)}
                                className="text-[11px] font-bold h-7 px-2.5"
                              >
                                Xem biên bản đối chứng
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* TRANG CHI TIẾT THỬA ĐẤT & CHU KỲ VƯỜN (BR14, BR18, DỊCH VỤ, THU HOẠCH) */}
            {selectedPlotModalCode && (() => {
              const activePlot = plotSummaryList.find((p) => p.key === selectedPlotModalCode || String(p.rentalId) === String(selectedPlotModalCode) || p.plotCode === selectedPlotModalCode) || plotSummaryList[0];
              if (!activePlot) return null;

              const plotTasks = activePlot.tasks || [];
              const completedTasks = plotTasks.filter((t) => t.status === 'COMPLETED');
              const pendingTasks = plotTasks.filter((t) => t.status !== 'COMPLETED');

              const todayTasks = pendingTasks.filter((t) => isTaskToday(t, activePlot.currentDay));
              const upcomingTasks = pendingTasks.filter((t) => !isTaskToday(t, activePlot.currentDay));
              const completedTodayTasks = completedTasks.filter((t) => {
                if (isHarvestTaskTitle(t.title)) return true;
                const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
                if (t.completedAt && String(t.completedAt).includes(todayStr)) return true;
                const taskAge = t.cropDay !== undefined && t.cropDay !== null ? Number(t.cropDay) : (t.dayOffset !== undefined && t.dayOffset !== null ? Number(t.dayOffset) : null);
                return activePlot.currentDay && taskAge === Number(activePlot.currentDay);
              });
              const plotServices = serviceRequests.filter((s) => (s.rentalId && activePlot.rentalId ? Number(s.rentalId) === Number(activePlot.rentalId) : s.plotCode === activePlot.plotCode));
              const harvest = harvestWorkItems.find((item) => (item.rentalId && activePlot.rentalId ? Number(item.rentalId) === Number(activePlot.rentalId) : item.plotCode === activePlot.plotCode));

              const isNotStarted = activePlot.currentDay === 0;

              const plotProcess = resolveStandardCropProcess(activePlot);
              const activeStage = plotProcess?.stages?.find((s) => s.status === 'IN_PROGRESS') || plotProcess?.stages?.[0];
              const currentStageName = activeStage?.name ? `${activeStage.name} (${activeStage.label || ''})` : (activePlot.stage || 'Sinh trưởng & phát triển');

              return (
                <div className="space-y-4 text-left">
                  {/* Thanh điều hướng quay lại */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPlotModalCode(null)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 hover:text-emerald-800 transition shadow-2xs cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại danh sách thửa đất</span>
                    </button>
                    <span className="text-xs text-stone-500 font-medium">
                      Ca trực hiện trường · Chi tiết thửa đất phụ trách
                    </span>
                  </div>

                  {/* Khung Trang Chi Tiết Thửa Đất */}
                  <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
                    {/* Header Banner Xanh Đậm */}
                    <div className="bg-[#1D3B2C] px-6 py-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="font-heading text-xl sm:text-2xl font-black text-white">
                          {activePlot.plotName?.startsWith('Thửa') ? `${activePlot.plotName} (${activePlot.plotCode})` : `Thửa ${activePlot.plotCode} • ${activePlot.plotName}`}
                        </h2>
                        <p className="text-xs text-emerald-100/90 mt-1">
                          🌱 {activePlot.crop || 'Rau củ VietGAP'} • Khách thuê: {activePlot.customerName || 'Khách hàng'} • {activePlot.contractCode || `#CTR-${activePlot.plotCode}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPlotModalCode(null)}
                        className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Đóng trang chi tiết
                      </button>
                    </div>

                    <div className="p-5 sm:p-7 space-y-5">
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
                              <PackageCheck className="h-3.5 w-3.5" />
                              <span>Báo cáo thu hoạch</span>
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

                        {/* Dòng 3: Nhiệt Độ Thực Địa & Cảnh Báo Khí Tượng/Mưa (BR18) từ Open-Meteo Live API */}
                        {(() => {
                          const liveTemp = modalWeather?.metrics?.temp;
                          const liveSoilMoisture = modalWeather?.metrics?.soilMoisture;

                          return (
                            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1 text-xs">
                              {/* Thẻ 1: Nhiệt độ thực địa từ Open-Meteo */}
                              <div className="p-3 rounded-2xl bg-stone-50/90 border border-stone-200/80 flex items-center gap-3 shrink-0 sm:min-w-[190px]">
                                <span className="text-2xl leading-none">🌡️</span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-stone-500 uppercase font-black tracking-wider">Nhiệt độ</span>
                                    {modalWeather?.isLive3rdParty ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                                        Live API
                                      </span>
                                    ) : modalWeatherLoading ? (
                                      <span className="text-[9px] text-stone-400">Đang tải...</span>
                                    ) : null}
                                  </div>
                                  <div className="flex items-baseline gap-1 mt-0.5">
                                    {liveTemp ? (
                                      <>
                                        <strong className="text-lg font-heading font-black text-stone-900 font-mono">{liveTemp}</strong>
                                        <span className="text-[10px] text-stone-400 font-medium">· Chuẩn 18–32°C</span>
                                      </>
                                    ) : modalWeatherLoading ? (
                                      <span className="text-stone-400 italic">Đang đồng bộ...</span>
                                    ) : (
                                      <span className="text-stone-400 italic">Chưa có kết nối</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Thẻ 2: Khí tượng thực địa từ Open-Meteo */}
                              <div className="flex-1 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-emerald-950">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <span className="text-2xl leading-none shrink-0 mt-0.5">🌤️</span>
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <strong className="font-heading font-bold text-emerald-950 text-xs">
                                        Khí tượng thực địa: Thời tiết ổn định
                                      </strong>
                                      <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 uppercase tracking-wide">
                                        Đủ điều kiện chăm sóc
                                      </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-emerald-800 leading-relaxed">
                                      {liveSoilMoisture ? (
                                        <>Không có mưa bão · Độ ẩm đất ổn định <strong className="font-mono font-bold text-emerald-950">{liveSoilMoisture}</strong> (chuẩn 65–75%). Điều kiện lý tưởng cho các ca chăm sóc theo quy trình VietGAP.</>
                                      ) : (
                                        <>Điều kiện thời tiết ổn định, phù hợp tiến hành chăm sóc theo quy trình VietGAP.</>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
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

                      {/* SUBTAB 1: CÔNG VIỆC (TASKS) - DẠNG BẢNG */}
                      {plotModalTab === 'tasks' && (() => {
                        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
                        const todayLabel = `${todayStr.slice(8, 10)}/${todayStr.slice(5, 7)}`;
                        const isAll = plotTaskFilter === 'ALL';
                        const completedOpen = plotTaskFilter === 'COMPLETED' || showCompletedTasks;
                        const fallbackWorker = user?.fullName || 'Trần Văn Lực (CVLĐ)';

                        const renderTasksTable = (rows, defaultVariant = 'today') => (
                          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse min-w-[740px]">
                              <thead>
                                <tr className="bg-stone-50/90 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                                  <th className="py-3.5 px-4 whitespace-nowrap">Mã CV</th>
                                  <th className="py-3.5 px-4 min-w-[200px]">Tên Công Việc</th>
                                  <th className="py-3.5 px-4 whitespace-nowrap">Hạn / Thời Gian</th>
                                  <th className="py-3.5 px-4 whitespace-nowrap">Ngày Tuổi</th>
                                  <th className="py-3.5 px-4 whitespace-nowrap">Phụ Trách</th>
                                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Trạng Thái</th>
                                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Thao Tác</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100 text-stone-700">
                                {rows.map((task) => {
                                  const variant = task._rowVariant || (task.status === 'COMPLETED' ? 'done' : isTaskToday(task, activePlot.currentDay) ? 'today' : defaultVariant);
                                  const isDone = variant === 'done' || task.status === 'COMPLETED';
                                  const isHarvest = isHarvestTaskTitle(task.title);
                                  const { tag, text: titleText } = splitLeadingTag(task.title);
                                  const accent = getTaskCardAccent(task, variant, activePlot?.currentDay || task.plotCurrentDay);
                                  const dayAge = task.cropDay || task.dayOffset;
                                  const overdueSince = variant === 'today' && task.dueDate && task.dueDate < todayStr ? `Hạn ${formatAgendaDate(task.dueDate)}` : null;
                                  const timeLabel = isDone ? (task.completedAt || '—') : (task.deadline || '08:00');
                                  const dateDisplay = overdueSince || (variant === 'today' ? `Hôm nay (${todayLabel})` : task.dueDate ? formatAgendaDate(task.dueDate) : 'Sắp tới');

                                  return (
                                    <tr key={task.id} className="hover:bg-emerald-50/30 transition-colors">
                                      <td className="py-3.5 px-4 whitespace-nowrap">
                                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-stone-100 text-stone-700">
                                          {task.id}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {tag ? (
                                            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
                                              {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                                            </span>
                                          ) : null}
                                          <button
                                            type="button"
                                            onClick={() => setSelectedTaskDetail(task)}
                                            className="task-detail-trigger font-heading font-bold text-stone-900 hover:text-emerald-800 text-left cursor-pointer focus:outline-none"
                                          >
                                            {titleText || task.title}
                                          </button>
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4 whitespace-nowrap">
                                        <span className="font-mono font-bold text-stone-800 block">{timeLabel}</span>
                                        <span className={`text-[11px] block ${overdueSince ? 'text-rose-700 font-bold' : 'text-stone-500'}`}>
                                          {dateDisplay}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                                        {dayAge ? `Ngày tuổi ${dayAge}` : '—'}
                                      </td>
                                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-700 font-medium">
                                        {task.workerName || fallbackWorker}
                                      </td>
                                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                            isDone
                                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                              : overdueSince || accent.label === 'Quá hạn'
                                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                : task.status === 'IN_PROGRESS'
                                                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                                  : variant === 'today'
                                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    : 'bg-stone-100 text-stone-600 border border-stone-200'
                                          }`}
                                        >
                                          {isDone
                                            ? '● Đã hoàn thành'
                                            : overdueSince || accent.label === 'Quá hạn'
                                              ? '● Quá hạn'
                                              : task.status === 'IN_PROGRESS'
                                                ? '● Đang làm trong ca'
                                                : variant === 'today'
                                                  ? '● Cần làm hôm nay'
                                                  : '● Sắp tới'}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {!isDone && variant === 'today' && (
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={() => handleExecuteTask(task)}
                                              title={isHarvest ? 'Mở màn thu hoạch' : 'Báo cáo xong việc & chụp ảnh minh chứng'}
                                              className="font-bold text-xs gap-1 px-2.5 py-1"
                                            >
                                              {isHarvest ? <Scale className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                                              <span>{isHarvest ? 'Thu hoạch' : 'Xong việc'}</span>
                                            </Button>
                                          )}

                                          {!isDone && variant === 'upcoming' && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleExecuteTask(task)}
                                              title="Thực hiện sớm và báo cáo xong việc"
                                              className="border border-stone-200 text-stone-600 hover:text-emerald-800 font-bold text-xs px-2.5 py-1"
                                            >
                                              Làm sớm
                                            </Button>
                                          )}

                                          {isDone && task.proofPhoto && (
                                            <button
                                              type="button"
                                              onClick={() => window.open(task.proofPhoto, '_blank')}
                                              title="Xem ảnh hoàn thành"
                                              className="p-1 rounded-lg border border-emerald-200 hover:border-emerald-400 bg-emerald-50 transition cursor-pointer"
                                            >
                                              <img
                                                src={task.proofPhoto}
                                                alt="Ảnh hoàn thành"
                                                className="h-6 w-6 rounded object-cover"
                                              />
                                            </button>
                                          )}

                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedTaskDetail(task)}
                                            className="font-bold text-xs gap-1 text-stone-700 px-2.5 py-1"
                                            title="Xem chi tiết nhiệm vụ"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>Chi tiết</span>
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );

                        const emptyLine = (text) => (
                          <p className="rounded-xl border border-dashed border-stone-200 px-3 py-4 text-center text-xs text-stone-500">{text}</p>
                        );

                        const chips = [
                          { id: 'ALL', label: 'Tất cả', count: plotTasks.length },
                          {
                            id: 'TODAY',
                            label: 'Hôm nay',
                            count: todayTasks.length > 0 ? todayTasks.length : (completedTodayTasks.length > 0 ? `${completedTodayTasks.length} đã xong` : 0),
                            emphasize: true
                          },
                          { id: 'UPCOMING', label: 'Sắp tới', count: upcomingTasks.length },
                          { id: 'COMPLETED', label: 'Đã hoàn thành', count: completedTasks.length }
                        ];

                        const activeRowsForAll = [
                          ...todayTasks.map((t) => ({ ...t, _rowVariant: 'today' })),
                          ...upcomingTasks.map((t) => ({ ...t, _rowVariant: 'upcoming' }))
                        ];

                        return (
                          <div className="space-y-4">
                            {/* Bộ lọc dạng segmented control */}
                            <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 sm:inline-flex">
                              {chips.map((chip) => {
                                const active = plotTaskFilter === chip.id;
                                return (
                                  <button
                                    key={chip.id}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setPlotTaskFilter(chip.id)}
                                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${active ? 'bg-white text-emerald-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                  >
                                    <span>{chip.label}</span>
                                    <span className={`min-w-5 rounded-full px-1.5 text-center text-[10px] leading-4 ${chip.emphasize && chip.count > 0 ? 'bg-emerald-600 text-white' : active ? 'bg-stone-100 text-stone-600' : 'bg-stone-200/80 text-stone-500'}`}>
                                      {chip.count}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {isAll && plotTasks.length === 0 ? (
                              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 px-4 py-10 text-center">
                                <ListTodo className="h-8 w-8 text-stone-300" />
                                <p className="text-sm font-bold text-stone-600">Thửa này chưa có công việc nào được giao</p>
                                <p className="text-xs text-stone-500">Lịch chăm sóc từ CGNN sẽ hiển thị tại đây.</p>
                              </div>
                            ) : (
                              <>
                                {/* BẢNG CÔNG VIỆC ĐANG CẦN THỰC HIỆN (ALL) */}
                                {isAll && (
                                  activeRowsForAll.length > 0
                                    ? renderTasksTable(activeRowsForAll)
                                    : emptyLine('Hiện không có công việc nào đang chờ thực hiện.')
                                )}

                                {/* BẢNG HÔM NAY */}
                                {plotTaskFilter === 'TODAY' && (
                                  <div className="space-y-3">
                                    {todayTasks.length > 0
                                      ? renderTasksTable(todayTasks, 'today')
                                      : emptyLine('Chưa có việc mới đến hạn hôm nay tại thửa này.')}
                                    {completedTodayTasks.length > 0 && (
                                      <div className="space-y-2 pt-2">
                                        <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                                          Đã hoàn thành hôm nay ({completedTodayTasks.length})
                                        </h4>
                                        {renderTasksTable(completedTodayTasks, 'done')}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* BẢNG SẮP TỚI */}
                                {plotTaskFilter === 'UPCOMING' && (
                                  upcomingTasks.length > 0
                                    ? renderTasksTable(upcomingTasks, 'upcoming')
                                    : emptyLine('Chưa có việc kế hoạch sắp tới.')
                                )}

                                {/* ĐÃ HOÀN THÀNH - thu gọn mặc định ở chế độ Tất cả */}
                                {(isAll || plotTaskFilter === 'COMPLETED') && (!isAll || completedTasks.length > 0) && (
                                  <section className="space-y-2 pt-1">
                                    {isAll && (
                                      <button
                                        type="button"
                                        aria-expanded={completedOpen}
                                        onClick={() => setShowCompletedTasks((open) => !open)}
                                        className="flex w-full items-center gap-2 border-t border-stone-100 pt-3 text-[11px] font-black uppercase tracking-wider text-stone-500 hover:text-stone-800 cursor-pointer"
                                      >
                                        {completedOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                        <span>Đã hoàn thành ({completedTasks.length})</span>
                                      </button>
                                    )}
                                    {completedOpen && (completedTasks.length === 0
                                      ? emptyLine('Chưa có việc nào hoàn thành tại thửa này.')
                                      : renderTasksTable(completedTasks, 'done'))}
                                  </section>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })()}

                      {/* SUBTAB 2: THỜI TIẾT & KHÍ TƯỢNG (SSoT Open-Meteo Live API - Không mock) */}
                      {plotModalTab === 'iot' && (
                        <div className="space-y-4">
                          {modalWeatherLoading ? (
                            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                              <div>
                                <p className="text-sm font-bold text-stone-800">Đang truy vấn số liệu vi khí hậu từ Open-Meteo API...</p>
                                <p className="text-xs text-stone-500 mt-1">Hệ thống đang kết nối trực tiếp đến trạm thời tiết theo tọa độ GPS nông trại</p>
                              </div>
                            </div>
                          ) : modalWeatherError || !modalWeather?.isLive3rdParty ? (
                            <div className="p-6 text-center bg-rose-50 rounded-2xl border border-rose-200 space-y-3">
                              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                              <div>
                                <p className="text-sm font-bold text-rose-900">Không thể kết nối đến máy chủ Open-Meteo API</p>
                                <p className="text-xs text-rose-700 max-w-md mx-auto mt-1">
                                  Hệ thống tuân thủ nguyên tắc SSoT: Chỉ hiển thị các thông số thời tiết khi nhận được phản hồi trực tiếp từ API thực địa, không sử dụng số liệu mô phỏng/mock.
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadPlotWeather(activePlot, true)}
                                className="mt-2"
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Thử kết nối lại
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                                <div>
                                  <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-700" />
                                    <span>Dữ Liệu Thời Tiết &amp; Khí Tượng Nông Trại (Open-Meteo API)</span>
                                  </h4>
                                  <p className="text-xs text-stone-500">
                                    Trực tiếp từ trạm vệ tinh khí tượng theo tọa độ GPS ({modalWeather.coordinates?.lat?.toFixed(4)}°N, {modalWeather.coordinates?.lon?.toFixed(4)}°E) · Cập nhật lúc {modalWeather.lastUpdated}.
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Open-Meteo Live API
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => loadPlotWeather(activePlot, true)}
                                    title="Làm mới dữ liệu từ API"
                                    className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* 4 Dials thực tế lấy từ Open-Meteo */}
                              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 text-center space-y-1">
                                  <Thermometer className="w-5 h-5 text-amber-600 mx-auto" />
                                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Nhiệt độ không khí</span>
                                  <strong className="text-lg font-heading font-black text-stone-900 block font-mono">{modalWeather.metrics.temp}</strong>
                                  <span className="text-[10px] text-amber-700 font-medium">Cảm biến nhiệt 2m</span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50/40 border border-cyan-200/80 text-center space-y-1">
                                  <Droplets className="w-5 h-5 text-cyan-600 mx-auto" />
                                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Độ ẩm không khí</span>
                                  <strong className="text-lg font-heading font-black text-stone-900 block font-mono">{modalWeather.metrics.airHumidity}</strong>
                                  <span className="text-[10px] text-cyan-700 font-medium">Ẩm độ khí quyển</span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/40 border border-sky-200/80 text-center space-y-1">
                                  <Droplets className="w-5 h-5 text-sky-600 mx-auto" />
                                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Độ ẩm tầng đất mặt</span>
                                  <strong className="text-lg font-heading font-black text-stone-900 block font-mono">{modalWeather.metrics.soilMoisture}</strong>
                                  <span className="text-[10px] text-sky-700 font-medium">{parseFloat(modalWeather.metrics.soilMoisture) >= 80 ? 'Bão hòa ẩm (≥80%)' : 'Ngưỡng an toàn'}</span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50/40 border border-yellow-200/80 text-center space-y-1">
                                  <Sun className="w-5 h-5 text-yellow-600 mx-auto" />
                                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Bức xạ quang học</span>
                                  <strong className="text-lg font-heading font-black text-stone-900 block font-mono">{modalWeather.metrics.light}</strong>
                                  <span className="text-[10px] text-yellow-800 font-medium">Bức xạ mặt trời</span>
                                </div>
                              </div>

                              {/* Các chỉ số khí tượng bổ trợ từ Open-Meteo */}
                              <div className="grid grid-cols-3 gap-2.5 text-xs">
                                <div className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-200 text-center">
                                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Lượng mưa</span>
                                  <strong className="text-stone-900 font-bold font-mono mt-0.5 block">{modalWeather.metrics.precipitation || '0.0 mm'}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-200 text-center">
                                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Tốc độ gió</span>
                                  <strong className="text-stone-900 font-bold font-mono mt-0.5 block">{modalWeather.metrics.windSpeed || '—'}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-200 text-center">
                                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Nhiệt độ mặt đất</span>
                                  <strong className="text-stone-900 font-bold font-mono mt-0.5 block">{modalWeather.metrics.soilTemp || '—'}</strong>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* SUBTAB 3: YÊU CẦU DỊCH VỤ CỦA THỬA ĐẤT (SERVICE REQUESTS) - DẠNG BẢNG */}
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
                            <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                                <thead>
                                  <tr className="bg-stone-50/90 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                                    <th className="py-3.5 px-4 whitespace-nowrap">Mã YC</th>
                                    <th className="py-3.5 px-4 min-w-[160px]">Tên Dịch Vụ</th>
                                    <th className="py-3.5 px-4 whitespace-nowrap">Khách Hàng</th>
                                    <th className="py-3.5 px-4 whitespace-nowrap">Lịch Hẹn</th>
                                    <th className="py-3.5 px-4 whitespace-nowrap">Giá Tiền</th>
                                    <th className="py-3.5 px-4 whitespace-nowrap text-center">Trạng Thái</th>
                                    <th className="py-3.5 px-4 whitespace-nowrap text-right">Thao Tác</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 text-stone-700">
                                  {plotServices.map((req) => {
                                    const isDone = req.status === 'DONE' || req.status === 'COMPLETED';
                                    const isInProg = req.status === 'IN_PROG' || req.status === 'IN_PROGRESS';
                                    return (
                                      <tr key={req.id || req.requestId} className="hover:bg-emerald-50/30 transition-colors">
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-900">
                                            {req.id || `REQ-${req.requestId}`}
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-stone-900">
                                          {req.serviceName}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                          <span className="font-semibold text-stone-800 block">{req.customerName}</span>
                                          {req.customerPhone && (
                                            <span className="text-[11px] text-stone-500 font-mono block mt-0.5">{req.customerPhone}</span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                                          {req.scheduledDate || 'Hôm nay'}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                          <strong className="text-brand-dark block">{Number(req.price || 0).toLocaleString('vi-VN')} đ</strong>
                                          <span className="text-emerald-700 text-[10px] font-medium block">✓ Đã thanh toán</span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                          <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                              isDone
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : isInProg
                                                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}
                                          >
                                            {isDone ? '● Đã hoàn thành' : isInProg ? '● Đang thực hiện' : '● Chờ thực hiện'}
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {!isDone && !isInProg && (
                                              <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleAcceptServiceRequest(req.requestId)}
                                                disabled={isUpdatingService}
                                                className="font-bold text-xs gap-1 px-2.5 py-1"
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Tiếp nhận</span>
                                              </Button>
                                            )}
                                            {!isDone && (
                                              <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleStartCompleteService(req)}
                                                className="font-bold text-xs gap-1 bg-[#07533d] hover:bg-[#053d2d] text-white px-2.5 py-1"
                                              >
                                                <Camera className="w-3.5 h-3.5" />
                                                <span>Báo cáo</span>
                                              </Button>
                                            )}
                                            {isDone && req.proofPhoto && (
                                              <button
                                                type="button"
                                                onClick={() => window.open(req.proofPhoto, '_blank')}
                                                className="p-1 rounded-lg border border-emerald-200 hover:border-emerald-400 bg-emerald-50 transition cursor-pointer"
                                                title="Xem ảnh minh chứng"
                                              >
                                                <img
                                                  src={req.proofPhoto}
                                                  alt="Minh chứng"
                                                  className="w-6 h-6 rounded object-cover"
                                                />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
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
                                <PackageCheck className="w-4 h-4 text-emerald-700" />
                                <span>Kế Hoạch & Báo Cáo Thu Hoạch Thửa {activePlot.plotCode}</span>
                              </h4>
                              <p className="text-xs text-stone-500">Ghi nhận sản lượng thực tế và cập nhật báo cáo thu hoạch.</p>
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
                                <strong className="font-heading font-black text-stone-900 text-sm block">Báo cáo thu hoạch</strong>
                                <p className="text-xs text-stone-500">Ghi nhận khối lượng thực tế, chụp ảnh nông sản và hoàn tất báo cáo thu hoạch.</p>
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
                                <PackageCheck className="w-4 h-4" />
                                <span>Báo Cáo Thu Hoạch</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          </section>
        </div>

      </main>

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
                  <span className="text-emerald-800">Bắt buộc chụp ảnh minh chứng</span>
                </div>
              </div>

              {/* 3. QUY TRÌNH KỸ THUẬT TIÊU CHUẨN VIETGAP (ẩn khi trùng nội dung với ghi chú CGNN ở trên) */}
              {shouldShowExpertNote(selectedTaskDetail.notes, selectedTaskDetail.instructions) && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs border-b border-emerald-200/70 pb-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Hướng Dẫn Thao Tác Chuẩn VietGAP Tại Hiện Trường:</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {selectedTaskDetail.instructions || 'Tuân thủ định mức và kỹ thuật VietGAP, kiểm tra dữ liệu thời tiết trước và sau ca trực.'}
                </p>
              </div>
              )}

              {/* 4. ẢNH MINH CHỨNG (NẾU ĐÃ HOÀN THÀNH) */}
              {isDone && selectedTaskDetail.proofPhoto && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <span className="font-bold text-stone-700 text-xs block">Ảnh minh chứng hoàn thành công việc:</span>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedTaskDetail.proofPhoto}
                      alt="Minh chứng"
                      className="w-24 h-24 object-cover rounded-xl border border-stone-300 cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(selectedTaskDetail.proofPhoto, '_blank')}
                    />
                    <div className="space-y-1 text-xs text-stone-600">
                      <p className="font-bold text-emerald-800">✓ Đã hoàn thành và cập nhật vào nhật ký của khách hàng.</p>
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
                      handleExecuteTask(taskToExec);
                    }}
                    className="text-xs font-bold gap-1.5 bg-[#07533d] hover:bg-[#053d2d] text-white cursor-pointer"
                  >
                    {isHarvest ? <Scale className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    <span>{isHarvest ? 'Mở Màn Thu Hoạch' : 'Báo Cáo Xong Việc & Chụp Ảnh'}</span>
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
        onClose={() => {
          setSelectedTaskToExecute(null);
          setTaskProofPhoto('');
          setTaskProofNote('');
        }}
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

            <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-2 bg-stone-50">
              {taskProofPhoto ? (
                <div className="space-y-2.5">
                  <div className="relative inline-block max-w-full">
                    <img
                      src={taskProofPhoto}
                      alt="Ảnh minh chứng thực tế"
                      className="max-h-56 w-auto mx-auto rounded-xl object-contain shadow-xs border border-stone-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setTaskProofPhoto('')}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer transition-colors"
                      title="Gỡ ảnh để chọn lại"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800">
                      ✓ Đã chọn ảnh minh chứng
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readPhoto(file, setTaskProofPhoto);
                    }}
                    className="mx-auto block max-w-full text-[10px] text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:font-bold file:text-emerald-800 cursor-pointer"
                  />
                </div>
              ) : (
                <>
                  <Camera className="w-7 h-7 text-brand-green mx-auto" />
                  <p className="font-bold text-stone-700">Đính kèm ảnh minh chứng thực tế</p>
                  <p className="text-[10px] text-stone-400">Ảnh này sẽ tự động xuất hiện trên Farm Diary của khách hàng</p>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readPhoto(file, setTaskProofPhoto);
                    }}
                    className="mx-auto block max-w-full text-[10px] text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:font-bold file:text-emerald-800 cursor-pointer"
                  />
                </>
              )}
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTaskToExecute(null);
                  setTaskProofPhoto('');
                  setTaskProofNote('');
                }}
              >
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

          <div className="p-3 rounded-xl border-2 border-dashed border-stone-300 text-center space-y-2 bg-stone-50">
            {newIssuePhoto ? (
              <div className="space-y-1.5">
                <div className="relative inline-block max-w-full">
                  <img
                    src={newIssuePhoto}
                    alt="Ảnh sự cố hiện trường"
                    className="max-h-44 w-auto mx-auto rounded-lg object-contain shadow-xs border border-stone-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setNewIssuePhoto('')}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer transition-colors"
                    title="Gỡ ảnh để chọn lại"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    ✓ Đã chọn ảnh sự cố
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) readPhoto(file, setNewIssuePhoto);
                  }}
                  className="mx-auto block max-w-full text-[10px] text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-1.5 file:font-bold cursor-pointer"
                />
              </div>
            ) : (
              <>
                <Camera className="w-5 h-5 text-stone-400 mx-auto" />
                <p className="font-bold text-stone-600">Đính kèm ảnh chụp lá / hiện trường</p>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) readPhoto(file, setNewIssuePhoto);
                  }}
                  className="mx-auto block max-w-full text-[10px] text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-1.5 file:font-bold cursor-pointer"
                />
              </>
            )}
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

      {/* Modal 3: Chi Tiết Biên Bản Đối Chứng Thu Hoạch (BR20) */}
      <Modal
        isOpen={Boolean(selectedHarvestProofModal)}
        onClose={() => setSelectedHarvestProofModal(null)}
        title="Biên Bản Bàn Giao & Cân Đối Chứng Thu Hoạch (BR20)"
        subtitle={selectedHarvestProofModal ? `${selectedHarvestProofModal.plotCode} • ${selectedHarvestProofModal.plotName}` : ''}
        maxWidth="max-w-xl"
        headerVariant="green"
        zIndex="z-[110]"
      >
        {selectedHarvestProofModal && (() => {
          return (
            <div className="space-y-4 text-left text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* 1. Header Khối lượng & Vụ mùa */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-emerald-800 font-bold block">
                    Mã biên bản: {selectedHarvestProofModal.id}
                  </span>
                  <h4 className="font-heading text-lg font-black text-emerald-950 mt-0.5">
                    {selectedHarvestProofModal.seasonName || `Vụ canh tác: ${selectedHarvestProofModal.crop || 'Nông sản VietGAP'}`}
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    👤 Khách hàng: <strong>{selectedHarvestProofModal.customerName || 'Khách thuê Farmely'}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 block font-bold">Khối lượng cân:</span>
                  <strong className="text-xl font-heading font-black text-emerald-900">
                    {selectedHarvestProofModal.actualWeight || `${selectedHarvestProofModal.yieldAmount || '35.0'} kg`}
                  </strong>
                </div>
              </div>

              {/* 2. Ảnh cân đối chứng thực địa */}
              <div className="space-y-1.5">
                <span className="font-bold text-stone-700 block">Ảnh chụp cân đối chứng thực tế tại vườn (BR20):</span>
                <img
                  src={selectedHarvestProofModal.photoUrl || HARVEST_PHOTO_FALLBACK}
                  alt="Ảnh cân đối chứng"
                  onError={(e) => { e.currentTarget.src = HARVEST_PHOTO_FALLBACK; }}
                  className="w-full max-h-72 object-cover rounded-2xl border border-stone-200 bg-stone-100 shadow-2xs"
                />
              </div>

              {/* 3. Chi tiết nghiệm thu */}
              <div className="grid grid-cols-2 gap-2.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-stone-700">
                <div>
                  <span className="text-[10px] text-stone-400 block font-bold">Chuyên viên cân:</span>
                  <strong className="text-stone-900">{selectedHarvestProofModal.staffName || 'Trần Văn Lực'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-bold">Ngày giờ ghi nhận:</span>
                  <strong className="text-stone-900">{selectedHarvestProofModal.verifiedAt || selectedHarvestProofModal.harvestDate || 'Hôm nay'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-bold">Phương thức nhận (BR21):</span>
                  <strong className="text-stone-900">
                    {/* BR21: thu hoạch luôn diễn ra tại nông trại */}
                    Tự nhận tại nông trại
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-bold">Thửa đất canh tác:</span>
                  <strong className="text-stone-900">{selectedHarvestProofModal.plotCode || '—'}</strong>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedHarvestProofModal(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <div className={`transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        <Footer />
      </div>
    </div>
  );
}
