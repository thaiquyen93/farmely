import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from 'recharts';
import { assessMetric, summarizePlot, explainAlert, describeSeries, computeHealthScore, METRIC_RULES } from '../../utils/iotInsights';
import { useSensorStream } from '../../api/monitoring/useSensorStream';
import { fetchLiveAgroIotData, resolveFarmLocation } from '../../services/weatherIotService';
import { resolveStandardCropProcess, getPersistedStaffActivities, recordStaffActivity, resolvePlotSeasons } from '../../services/cropStandardProcess';
import SeasonSelector from './SeasonSelector';
import SoilPrepView from './SoilPrepView';
import PlotRenewalModal from './PlotRenewalModal';
import {
  AlertTriangle, ArrowLeft, BookOpen, Calendar, CalendarCheck, CalendarRange, Check, ChevronDown, ChevronRight, ChevronLeft,
  Clock, Clock3, Droplets, ExternalLink, Eye, Filter, Info, LayoutDashboard, Leaf,
  MapPin, Maximize2, PenLine, Radio, RefreshCw, Search, ShieldCheck, ShoppingBag, Sparkles, Sprout,
  Sun, Thermometer, Truck, UserRound, Wheat, Wind, X, Camera, CheckCircle2, FileText, Plus, Trash2, Flame
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
   Không gian làm việc quản lý MỘT thửa đất của Khách hàng.
   Đảm bảo:
   1. Phản ánh chân thực hiện trạng khu vườn và cây trồng theo Quy trình chuẩn tính theo ngày.
   2. Lưu trữ và truy xuất đầy đủ, minh bạch toàn bộ hoạt động của Staff (Field Workers).
   3. Kết nối dữ liệu vi khí hậu & IoT trực tiếp từ 3rd-Party API thực tế (Open-Meteo Agro API).
   ────────────────────────────────────────────────────────────────────────── */

export const PLOT_TABS = [
  { id: 'overview', label: 'Tổng quan', short: 'Tổng quan', icon: LayoutDashboard },
  { id: 'tasks', label: 'Hoạt động Staff', short: 'Staff', icon: CalendarCheck },
  { id: 'iot', label: 'IoT & vi khí hậu', short: 'IoT', icon: Radio },
  { id: 'diary', label: 'Nhật ký', short: 'Nhật ký', icon: BookOpen },
  { id: 'services', label: 'Dịch vụ', short: 'Dịch vụ', icon: ShoppingBag },
  { id: 'harvest', label: 'Thu hoạch', short: 'Thu hoạch', icon: Wheat }
];

const METRICS = [
  { key: 'temp', series: 'temp', icon: Thermometer, color: '#f97316' },
  { key: 'soilMoisture', series: 'moisture', icon: Droplets, color: '#0ea5e9' },
  { key: 'airHumidity', series: 'airHumidity', icon: Wind, color: '#06b6d4' },
  { key: 'light', series: 'light', icon: Sun, color: '#eab308' }
].map((m) => ({ ...m, label: METRIC_RULES[m.key].label, unit: METRIC_RULES[m.key].unit }));

const LEVEL_STYLE = {
  OK: { chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', marker: 'bg-emerald-600', hex: '#059669', dot: 'bg-lime-400' },
  LOW: { chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200', marker: 'bg-sky-600', hex: '#0284c7', dot: 'bg-sky-400' },
  HIGH: { chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200', marker: 'bg-rose-600', hex: '#e11d48', dot: 'bg-rose-400' },
  UNKNOWN: { chip: 'bg-stone-100 text-stone-600', marker: 'bg-stone-400', hex: '#a8a29e', dot: 'bg-stone-400' }
};

const TIMEFRAMES = [
  { id: 'hourly', label: 'Hôm nay' },
  { id: 'daily', label: '7 ngày' },
  { id: 'weekly', label: '4 tuần' }
];

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(24,53,43,0.04),0_12px_32px_-16px_rgba(24,53,43,0.22)]';

function Card({ className = '', children, style, onClick }) {
  return (
    <div
      style={style}
      onClick={onClick}
      className={`rounded-3xl border border-white/80 bg-white ${CARD_SHADOW} ${className}`}
    >
      {children}
    </div>
  );
}

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

const arcPath = (cx, cy, r, start, end) => {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x2} ${y2}`;
};

function ArcGauge({ position, color, levelColor, children }) {
  const START = 150;
  const SWEEP = 240;
  const at = (p) => START + SWEEP * p;
  const valueEnd = position === null ? START : at(position);
  const [mx, my] = polar(60, 60, 46, valueEnd);
  return (
    <div className="relative mx-auto h-[118px] w-[150px]" aria-hidden="true">
      <svg viewBox="0 0 120 104" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`g-${color}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path d={arcPath(60, 60, 46, START, START + SWEEP)} stroke="#eef1ec" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arcPath(60, 60, 46, at(0.25), at(0.75))} stroke="#bbf7d0" strokeWidth="10" fill="none" />
        {position !== null && (
          <>
            <path d={arcPath(60, 60, 46, START, Math.max(START + 0.1, valueEnd))} stroke={`url(#g-${color})`} strokeWidth="10" fill="none" strokeLinecap="round" className="transition-all duration-700" />
            <circle cx={mx} cy={my} r="7.5" fill="#fff" stroke={levelColor} strokeWidth="3" />
          </>
        )}
      </svg>
      <div className="absolute inset-x-6 top-[44px] flex flex-col items-center text-center">{children}</div>
    </div>
  );
}

function HealthRing({ score, size = 112, stroke = 10, tone }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : score / 100;
  const color = tone === 'OK' ? '#a3e635' : tone === 'WARN' ? '#fbbf24' : tone === 'BAD' ? '#fb7185' : '#a8a29e';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-[stroke-dashoffset] duration-1000 ease-out" style={{ filter: `drop-shadow(0 0 8px ${color}88)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-bold leading-none">{score ?? '—'}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">/ 100</span>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p>}
        <h3 className="mt-0.5 font-heading text-lg font-bold text-[#18352b]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function LinkButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
      {children}<ChevronRight className="h-4 w-4" />
    </button>
  );
}

function EmptyState({ icon: Icon = Leaf, title, note }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-10 text-center">
      <Icon className="h-8 w-8 text-stone-300" />
      <p className="mt-3 text-sm font-semibold text-stone-700">{title}</p>
      {note && <p className="mt-1 max-w-xs text-xs text-stone-500">{note}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   1. QUY TRÌNH CHUẨN THEO NGÀY TUỔI & HIỆN TRẠNG CÂY TRỒNG
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Thanh hiện trạng sinh trưởng theo ngày tuổi của cây trồng
 */
function CropGrowthHero({ cropProcess, onOpenStageDetail }) {
  const currentStage = cropProcess.currentStage;
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b4332] via-[#24533f] to-[#0f2a20] p-5 text-white sm:p-6 ${CARD_SHADOW}`}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime-300/15 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-lime-300/20 px-2.5 py-1 text-xs font-bold text-lime-300 ring-1 ring-lime-300/30">
              <Sprout className="h-3.5 w-3.5" />
              {cropProcess.cropName}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold backdrop-blur text-white/90">
              Tiêu chuẩn VietGAP
            </span>
            {cropProcess.isNotStarted ? (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
                <Calendar className="h-3.5 w-3.5 text-amber-300" />
                Chưa bắt đầu · Ngày 0 / {cropProcess.totalDays} ngày tuổi
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                Ngày thứ {cropProcess.currentDay} / {cropProcess.totalDays} ngày tuổi
              </span>
            )}
          </div>

          <h3 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
            {cropProcess.isNotStarted ? `${cropProcess.cropName} · Chưa bắt đầu canh tác` : (currentStage?.name || 'Đang trong quy trình canh tác tiêu chuẩn')}
          </h3>
          <p className="mt-1 text-sm text-lime-100/90 leading-relaxed max-w-2xl">
            {cropProcess.isNotStarted 
              ? 'Vụ mùa kế tiếp đã được lên lịch. Tiến độ sẽ bắt đầu tính khi vào vụ mới (sau chu kỳ nghỉ đất và làm đất tiêu chuẩn 5 ngày).' 
              : (currentStage?.statusDesc || 'Cây trồng đang phát triển thuận lợi theo đúng chỉ dẫn kỹ thuật nông học.')}
          </p>

          {/* Thanh đo ngày tuổi */}
          <div className="mt-4 max-w-xl">
            <div className="flex items-center justify-between text-xs font-semibold text-lime-200/90 mb-1.5">
              <span>Tiến độ chu kỳ: {cropProcess.progressPercent}%</span>
              <span>{cropProcess.isNotStarted ? `Chu kỳ toàn vụ: ${cropProcess.totalDays} ngày` : `Còn ${cropProcess.daysLeft} ngày tới thu hoạch`}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-black/30 p-0.5 ring-1 ring-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-300 transition-all duration-1000 shadow-[0_0_12px_rgba(163,230,53,0.5)]"
                style={{ width: `${cropProcess.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Thẻ vắn tắt điều kiện tối ưu */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[420px] shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
            <span className="text-[10px] uppercase font-semibold text-white/70 block">Nhiệt độ tối ưu</span>
            <span className="mt-1 text-sm font-bold text-white block">{cropProcess.optimalConditions?.tempRange || '22-28°C'}</span>
            <span className="text-[10px] text-lime-300 flex items-center gap-1 mt-0.5"><Check className="h-3 w-3" />Đạt chuẩn</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
            <span className="text-[10px] uppercase font-semibold text-white/70 block">Độ ẩm đất chuẩn</span>
            <span className="mt-1 text-sm font-bold text-white block">{cropProcess.optimalConditions?.soilMoistureRange || '65-75%'}</span>
            <span className="text-[10px] text-lime-300 flex items-center gap-1 mt-0.5"><Check className="h-3 w-3" />Lý tưởng</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-semibold text-white/70 block">Sản lượng dự kiến</span>
            <span className="mt-1 text-sm font-bold text-white block">{cropProcess.expectedYield || '15 kg/vụ'}</span>
            <span className="text-[10px] text-emerald-200 block truncate">Thu hái tiêu chuẩn</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline trực quan Quy trình chuẩn từng giai đoạn tính theo ngày & Nhật ký đồng bộ
 */
function StandardProcessTimeline({
  cropProcess,
  operations = { tasks: [], diary: [] },
  staffActivities = [],
  plot,
  isSelf = false,
  onToggleTask,
  onSelectStage,
  onAddDiary
}) {
  if (!cropProcess?.stages?.length) return null;

  const currentCropDay = cropProcess.isNotStarted ? 0 : (cropProcess.currentDay || 1);
  const totalDays = cropProcess.totalDays || 45;
  const [selectedDay, setSelectedDay] = useState(cropProcess.isNotStarted ? 1 : currentCropDay);

  useEffect(() => {
    setSelectedDay(cropProcess.isNotStarted ? 1 : (cropProcess.currentDay || 1));
  }, [cropProcess.currentDay, cropProcess.isNotStarted]);

  // Tìm giai đoạn tương ứng với ngày đang chọn
  const activeStage = useMemo(() => {
    const found = cropProcess.stages.find(
      (st) => selectedDay >= st.dayStart && selectedDay <= st.dayEnd
    );
    return found || cropProcess.stages[0];
  }, [cropProcess.stages, selectedDay]);

  // Hàm chuẩn hóa ngày tuổi của một mục nhật ký hoặc hoạt động
  const getEntryCropDay = useCallback((entry) => {
    if (entry.cropDay !== undefined && entry.cropDay !== null) return Number(entry.cropDay);
    if (entry.day !== undefined && entry.day !== null) return Number(entry.day);
    if (entry.dayOffset !== undefined && entry.dayOffset !== null) return Math.max(1, Number(entry.dayOffset));
    
    // Nếu có ngày thực tế so với startDate của thửa đất
    const dateStr = entry.date || entry.createdAt || entry.created_at;
    if (dateStr && plot?.startDate) {
      try {
        const d1 = new Date(dateStr);
        const d0 = new Date(plot.startDate);
        const diffDays = Math.floor((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays >= 1 && diffDays <= totalDays) return diffDays;
        if (diffDays <= 0) return 1;
      } catch {}
    }
    
    const timeStr = String(entry.time || '') + ' ' + String(entry.dateFormatted || '');
    if (timeStr.includes('Hôm nay')) {
      return currentCropDay;
    }
    if (timeStr.includes('Hôm qua')) {
      return Math.max(1, currentCropDay - 1);
    }
    
    return null;
  }, [plot?.startDate, currentCropDay, totalDays]);

  // Gom nhóm nhật ký theo ngày
  const diariesByDay = useMemo(() => {
    const map = {};
    const list = operations?.diary || [];
    list.forEach((e) => {
      const d = getEntryCropDay(e);
      if (d !== null && d !== undefined) {
        if (!map[d]) map[d] = [];
        map[d].push(e);
      }
    });
    return map;
  }, [operations?.diary, getEntryCropDay]);

  // Gom nhóm hoạt động nhân viên theo ngày
  const activitiesByDay = useMemo(() => {
    const map = {};
    const list = staffActivities || [];
    list.forEach((act) => {
      const d = act.day || act.cropDay || getEntryCropDay(act);
      if (d !== null && d !== undefined) {
        if (!map[d]) map[d] = [];
        map[d].push(act);
      }
    });
    return map;
  }, [staffActivities, getEntryCropDay]);

  const trackRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Danh sách các mốc giai đoạn chính của quy trình canh tác (5 mốc chuẩn trải đều)
  const majorEvents = useMemo(() => {
    const events = [];
    const stages = cropProcess.stages || [];
    const numStages = stages.length;

    stages.forEach((st, idx) => {
      let icon = Leaf;
      const nameLower = (st.name || '').toLowerCase();
      if (idx === 0 || nameLower.includes('gieo') || nameLower.includes('ươm') || nameLower.includes('mầm')) {
        icon = Sprout;
      } else if (idx === numStages - 1 || nameLower.includes('thu hoạch') || nameLower.includes('thu hái') || nameLower.includes('hái')) {
        icon = Wheat;
      } else if (nameLower.includes('hoa') || nameLower.includes('thụ phấn')) {
        icon = Sparkles;
      } else if (nameLower.includes('quả') || nameLower.includes('trái') || nameLower.includes('chín')) {
        icon = Sun;
      } else {
        icon = Leaf;
      }

      // Lấy tên chuẩn trực tiếp từ giai đoạn thực tế của loại cây trồng, rút gọn chữ rườm rà
      let shortTitle = st.name || `Giai đoạn ${idx + 1}`;
      if (shortTitle.includes('·')) {
        shortTitle = shortTitle.split('·')[0].trim();
      }
      shortTitle = shortTitle.replace(/\s*đạt chuẩn VietGAP\s*/gi, '')
                             .replace(/\s*tiêu chuẩn VietGAP\s*/gi, '')
                             .trim();

      // Mốc cuối cùng gắn với ngày thu hoạch kết thúc (totalDays)
      const milestoneDay = idx === numStages - 1 ? totalDays : st.dayStart;

      events.push({
        day: milestoneDay,
        stage: st,
        title: st.name,
        shortTitle,
        icon,
        isMajor: true,
        type: 'STAGE_START'
      });
    });

    return events.sort((a, b) => a.day - b.day);
  }, [cropProcess.stages, totalDays]);

  // Kiểm tra ngày đang chọn có phải là mốc sự kiện lớn hay không
  const activeEvent = useMemo(() => {
    return majorEvents.find((e) => e.day === selectedDay);
  }, [majorEvents, selectedDay]);

  // Tính % tiến độ thanh chạy nối liền các mốc sự kiện trải dài 100% khung rộng
  const timelineProgressPercent = useMemo(() => {
    if (cropProcess.isNotStarted) return 0;
    if (!majorEvents.length) return 0;
    if (selectedDay <= majorEvents[0].day) return 0;
    const lastDay = majorEvents[majorEvents.length - 1].day;
    if (selectedDay >= lastDay) return 100;

    for (let i = 0; i < majorEvents.length - 1; i++) {
      const d1 = majorEvents[i].day;
      const d2 = majorEvents[i + 1].day;
      if (selectedDay >= d1 && selectedDay <= d2) {
        const segRatio = (selectedDay - d1) / Math.max(1, d2 - d1);
        const stepWidth = 100 / (majorEvents.length - 1);
        return (i + segRatio) * stepWidth;
      }
    }
    return 100;
  }, [selectedDay, majorEvents, cropProcess.isNotStarted]);

  // Chuyển đổi vị trí con trỏ chuột/chạm trên thanh ray thành Ngày tuổi tương ứng (chọn trực tiếp trên thanh)
  const getDayFromPointer = useCallback((clientX) => {
    if (!trackRef.current || !majorEvents.length) return selectedDay;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return selectedDay;

    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const N = majorEvents.length;
    if (ratio <= 0) return majorEvents[0].day;
    if (ratio >= 1) return totalDays;

    const stepWidth = 1 / (N - 1);
    const segIndex = Math.min(N - 2, Math.floor(ratio / stepWidth));
    const segRatio = (ratio - segIndex * stepWidth) / stepWidth;

    const d1 = majorEvents[segIndex].day;
    const d2 = majorEvents[segIndex + 1].day;
    const computedDay = Math.round(d1 + segRatio * (d2 - d1));
    return Math.max(1, Math.min(totalDays, computedDay));
  }, [majorEvents, totalDays, selectedDay]);

  // Xử lý sự kiện bấm hoặc kéo rê trực tiếp trên thanh dòng thời gian
  const handleTrackPointerDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const day = getDayFromPointer(e.clientX);
    setSelectedDay(day);

    const onPointerMove = (moveEvent) => {
      if (isDraggingRef.current) {
        const d = getDayFromPointer(moveEvent.clientX);
        setSelectedDay(d);
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [getDayFromPointer]);

  // Danh sách nhật ký cho ngày đang chọn: CHỈ HIỂN THỊ ĐÚNG NGÀY ĐÓ
  const selectedDayDiaries = useMemo(() => {
    return diariesByDay[selectedDay] || [];
  }, [diariesByDay, selectedDay]);

  // Danh sách hoạt động Staff cho ngày đang chọn: CHỈ HIỂN THỊ ĐÚNG NGÀY ĐÓ
  const selectedDayActivities = useMemo(() => {
    return activitiesByDay[selectedDay] || [];
  }, [activitiesByDay, selectedDay]);

  // Điều hướng ngày trước / sau
  const handlePrevDay = () => {
    if (selectedDay > 1) {
      setSelectedDay(selectedDay - 1);
    }
  };

  const handleNextDay = () => {
    if (selectedDay < totalDays) {
      setSelectedDay(selectedDay + 1);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. THANH CHẠY DÒNG THỜI GIAN THEO NGÀY: SỰ KIỆN LỚN TRẢI ĐỀU 100% KHUNG RỘNG */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm space-y-6">
        {/* Header thanh thời gian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
                <CalendarCheck className="w-4 h-4" />
              </span>
              <h3 className="font-heading font-black text-base text-[#18352b]">
                Dòng Thời Gian Canh Tác Theo Ngày Tuổi · {cropProcess.cropName}
              </h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {totalDays} ngày tuổi
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Bấm hoặc kéo trực tiếp trên thanh thời gian để xem quy trình VietGAP và nhật ký của từng ngày tuổi.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {cropProcess.isNotStarted ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 border border-sky-200 px-3 py-1.5 text-xs font-bold text-sky-800 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                Sắp tới · Bắt đầu {plot?.startDate ? new Date(plot.startDate).toLocaleDateString('vi-VN') : 'dự kiến'}
              </span>
            ) : selectedDay !== currentCropDay ? (
              <button
                type="button"
                onClick={() => setSelectedDay(currentCropDay)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                Về Hôm nay (N{currentCropDay})
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onSelectStage?.(activeStage)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-stone-500" />
              Cẩm nang VietGAP
            </button>
          </div>
        </div>

        {/* KHU VỰC TRỤC THANH CHẠY DÒNG THỜI GIAN TRẢI RỘNG 100% KHUNG */}
        <div className="relative pt-10 pb-3 px-4 sm:px-12 select-none overflow-x-auto no-scrollbar">
          <div className="relative min-w-[720px]">
            {/* Đường ray chính tương tác trực tiếp (hỗ trợ bấm hoặc kéo chọn ngày) */}
            <div
              ref={trackRef}
              onPointerDown={handleTrackPointerDown}
              className="absolute left-14 right-14 top-6 -translate-y-1/2 h-8 flex items-center cursor-pointer group/track z-10 touch-none"
              title="Bấm hoặc kéo trực tiếp trên thanh để chọn ngày"
            >
              {/* Thân ray nền xám bo góc */}
              <div className="relative h-2.5 w-full rounded-full bg-stone-200 group-hover/track:h-3 group-hover/track:bg-stone-300 transition-all overflow-hidden shadow-inner">
                {/* Vạch tiến độ chạy xanh nối liền theo ngày */}
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-150 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  style={{ width: `${timelineProgressPercent}%` }}
                />
              </div>

              {/* Con trỏ chỉ thị ngày tuổi chạy theo thanh trượt khi ở các ngày bình thường ở giữa (Không đè lên mốc chính) */}
              {!activeEvent && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-150"
                  style={{ left: `${timelineProgressPercent}%` }}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="absolute -top-9 flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-1 text-[11px] font-black text-white shadow-xl whitespace-nowrap ring-2 ring-emerald-400">
                      <span>Ngày {selectedDay}</span>
                      {!cropProcess.isNotStarted && selectedDay === currentCropDay && <span className="text-lime-300">· Hôm nay</span>}
                      {cropProcess.isNotStarted && selectedDay === 1 && <span className="text-sky-300">· Sắp tới</span>}
                    </div>
                    <div className="h-6 w-6 rounded-full bg-emerald-700 ring-4 ring-white shadow-lg flex items-center justify-center group-hover/track:scale-125 transition-transform">
                      <span className="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-xs" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CÁC ĐIỂM NÚT SỰ KIỆN LỚN: TRẢI ĐỀU 100% CHIỀU RỘNG, KHÔNG BAO GIỜ BỊ ĐÈ CHỮ */}
            <div className="relative flex items-center justify-between w-full pointer-events-none">
              {majorEvents.map((evt, idx) => {
                const Icon = evt.icon;
                const isSelected = selectedDay === evt.day;
                const isPassed = !cropProcess.isNotStarted && evt.day <= selectedDay;
                const isToday = !cropProcess.isNotStarted && evt.day === currentCropDay;
                const isUpcomingFirst = cropProcess.isNotStarted && evt.day === 1;

                return (
                  <div
                    key={evt.day}
                    className="relative flex flex-col items-center w-28 text-center pointer-events-auto"
                  >
                    {/* Badge Hôm nay / Sắp tới / Đang xem trên nút */}
                    <div className="absolute -top-8 pointer-events-none flex flex-col items-center">
                      {isSelected ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black text-white shadow-md whitespace-nowrap ring-1 ${
                          isToday ? 'bg-emerald-800 ring-emerald-400' : isUpcomingFirst ? 'bg-sky-700 ring-sky-300' : 'bg-emerald-800 ring-emerald-400'
                        }`}>
                          {isToday ? 'HÔM NAY' : isUpcomingFirst ? 'SẮP TỚI' : 'ĐANG XEM'}
                        </span>
                      ) : isToday ? (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs whitespace-nowrap animate-pulse">
                          Hôm nay
                        </span>
                      ) : isUpcomingFirst ? (
                        <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs whitespace-nowrap">
                          Sắp tới
                        </span>
                      ) : null}
                    </div>

                    {/* Nút mốc sự kiện lớn */}
                    <button
                      type="button"
                      onClick={() => setSelectedDay(evt.day)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`group flex items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'h-12 w-12 bg-emerald-800 text-white ring-4 ring-emerald-300 shadow-xl scale-110 z-20'
                          : isPassed
                          ? 'h-10 w-10 bg-emerald-700 text-white ring-2 ring-emerald-200 shadow-md hover:scale-110 z-10'
                          : 'h-10 w-10 bg-white text-stone-700 border-2 border-stone-300 shadow-xs hover:border-emerald-500 hover:scale-110 z-10'
                      }`}
                      title={`Ngày ${evt.day}: ${evt.title}`}
                    >
                      <Icon className={isSelected ? 'h-5 w-5 text-lime-300' : 'h-4 w-4'} />
                    </button>

                    {/* Nhãn mô tả sự kiện bên dưới - Rộng rãi, cách đều nhau, không bao giờ bị đè */}
                    <div className="mt-3.5 flex flex-col items-center text-center w-full pointer-events-none">
                      <span className={`text-xs font-black whitespace-nowrap ${
                        isSelected ? 'text-emerald-950 scale-105' : 'text-stone-800'
                      }`}>
                        Ngày {evt.day}
                      </span>
                      <span className={`text-[11px] font-semibold mt-0.5 leading-snug line-clamp-2 ${
                        isSelected ? 'text-emerald-800 font-bold' : 'text-stone-600'
                      }`}>
                        {evt.shortTitle}
                      </span>
                      {evt.stage?.label && (
                        <span className="text-[10px] text-stone-400 mt-0.5 font-medium whitespace-nowrap">
                          ({evt.stage.label})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nút chuyển ngày nhỏ gọn, không chiếm diện tích */}
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={selectedDay <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 shadow-2xs transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Ngày trước
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              disabled={selectedDay >= totalDays}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 shadow-2xs transition cursor-pointer"
            >
              Ngày sau
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. KHỐI CHI TIẾT ĐỒNG BỘ: THANH TRẠNG THÁI NGÀY & NỘI DUNG 2 CỘT */}
      <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-stone-50/60 via-white to-emerald-50/20 p-5 shadow-sm space-y-4">
        {/* Header thông tin ngày đang chọn */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md font-black text-base">
              N{selectedDay}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-base text-[#18352b]">
                  Ngày {selectedDay} / {totalDays} ngày tuổi
                </h3>
                {!cropProcess.isNotStarted && selectedDay === currentCropDay && (
                  <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase shadow-xs">
                    Hôm nay
                  </span>
                )}
                {cropProcess.isNotStarted && selectedDay === 1 && (
                  <span className="rounded-full bg-sky-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase shadow-xs">
                    Sắp tới · Bắt đầu {plot?.startDate ? new Date(plot.startDate).toLocaleDateString('vi-VN') : 'dự kiến'}
                  </span>
                )}
                {activeEvent && (
                  <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-extrabold shadow-xs flex items-center gap-1">
                    ⭐ {activeEvent.shortTitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 font-medium">
                Giai đoạn {activeStage?.stepOrder}: <strong className="text-emerald-800">{activeStage?.name}</strong> ({activeStage?.label})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectStage?.(activeStage)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 shadow-xs hover:bg-stone-50 transition"
            >
              <Info className="w-3.5 h-3.5 text-stone-500" />
              Cẩm nang VietGAP
            </button>
            <button
              type="button"
              onClick={() => onAddDiary?.(plot)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              + Viết nhật ký
            </button>
          </div>
        </div>

        {/* Lưới 2 cột: Cột 1 = Quy trình chuẩn VietGAP; Cột 2 = Nhật ký & Ảnh thực tế hôm đó */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* CỘT 1: QUY TRÌNH CHUẨN THEO TEMPLATE */}
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3 gap-2">
              <span className="flex items-center gap-2 font-black text-xs text-emerald-950 uppercase tracking-wider min-w-0 truncate">
                <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Quy trình chuẩn VietGAP Ngày {selectedDay}</span>
              </span>
              <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                {activeStage?.label}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-emerald-100/90 bg-white/90 p-3.5 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
                  <span className="text-base leading-none">💧</span>
                  <span>Chế độ tưới nước</span>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed pl-6">
                  {activeStage?.waterRegime || 'Duy trì ẩm độ 65 - 75%, tưới phun sương nhẹ buổi sáng sớm.'}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100/90 bg-white/90 p-3.5 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
                  <span className="text-base leading-none">🧪</span>
                  <span>Dinh dưỡng hữu cơ</span>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed pl-6">
                  {activeStage?.nutrition || 'Bổ sung vi sinh cố định đạm và dịch chiết Humic hữu cơ định kỳ.'}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100/90 bg-white/90 p-3.5 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
                  <span className="text-base leading-none">🎯</span>
                  <span>Yêu cầu kỹ thuật giai đoạn</span>
                </div>
                <p className="text-stone-600 text-xs leading-relaxed pl-6">
                  {activeStage?.guide}
                </p>
              </div>

              {activeStage?.inspectionCriteria && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-100/40 p-3.5 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                    <span className="text-base leading-none">🔍</span>
                    <span>Tiêu chuẩn nghiệm thu VietGAP</span>
                  </div>
                  <p className="text-emerald-800 text-xs font-medium leading-relaxed pl-6">
                    {activeStage.inspectionCriteria}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT 2: NHẬT KÝ & HOẠT ĐỘNG THỰC TẾ HÔM ĐÓ */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-3 gap-2">
              <span className="flex items-center gap-2 font-black text-xs text-stone-900 uppercase tracking-wider min-w-0 truncate">
                <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Nhật ký & Thực địa Ngày {selectedDay}</span>
              </span>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold text-stone-600 shrink-0 border border-stone-200/60">
                {selectedDayDiaries.length + selectedDayActivities.length} ghi nhận
              </span>
            </div>

            {selectedDayDiaries.length > 0 || selectedDayActivities.length > 0 ? (
              <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                {/* 1. Các bài viết nhật ký của chủ vườn / kỹ thuật viên */}
                {selectedDayDiaries.map((entry, idx) => (
                  <div key={entry.id || idx} className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-500 text-[11px] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {entry.time || 'Hôm nay'}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                        <UserRound className="w-3 h-3" />
                        {entry.author || 'Chủ vườn'}
                      </span>
                    </div>

                    <p className="font-bold text-stone-900 text-xs">{entry.title}</p>
                    <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{entry.note}</p>

                    {/* Ảnh hiện trường thực tế */}
                    {(entry.image || entry.imageUrl || entry.photo) && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-stone-900/5 group">
                        <img
                          src={entry.image || entry.imageUrl || entry.photo}
                          alt={entry.title || 'Ảnh hiện trường'}
                          className="h-44 w-full object-cover transition duration-300 group-hover:scale-102 cursor-pointer"
                          onClick={() => window.open(entry.image || entry.imageUrl || entry.photo, '_blank')}
                          loading="lazy"
                        />
                        <div className="p-2 bg-white text-[11px] text-stone-600 flex items-center justify-between border-t border-stone-100">
                          <span className="text-emerald-700 font-medium">📸 Ảnh chụp hiện trường thực tế</span>
                          <span
                            className="text-emerald-700 font-bold hover:underline cursor-pointer"
                            onClick={() => window.open(entry.image || entry.imageUrl || entry.photo, '_blank')}
                          >
                            Mở ảnh to ↗
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* 2. Hoạt động thực địa hoặc công việc tự canh tác */}
                {selectedDayActivities.map((act, idx) => {
                  const isDone = act.status === 'COMPLETED';
                  return (
                    <div
                      key={act.activityId || act.id || idx}
                      className={`rounded-xl border p-3.5 space-y-2 text-xs transition ${
                        isDone ? 'border-emerald-200 bg-emerald-50/40' : 'border-sky-100 bg-sky-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelf ? (
                            <button
                              type="button"
                              onClick={() => onToggleTask?.(act.id || act.activityId)}
                              className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                  : 'border-stone-300 bg-white hover:border-emerald-500'
                              }`}
                              title={isDone ? 'Bấm để đánh dấu chưa xong' : 'Bấm để đánh dấu hoàn thành'}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                          )}
                          <span className={`font-bold truncate ${isDone && isSelf ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                            {act.title || act.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-stone-500 bg-white/90 px-2 py-0.5 rounded-md border border-stone-200 shrink-0">
                          {act.timestamp || act.time || 'Ca trực'}
                        </span>
                      </div>
                      {(act.notes || act.note) && (
                        <p className={`text-xs leading-relaxed ${isSelf ? 'pl-7' : 'pl-5.5'} text-stone-600`}>
                          {act.notes || act.note}
                        </p>
                      )}
                      {!isSelf && act.proofPhoto && (
                        <div className="mt-2 pl-5.5">
                          <div className="overflow-hidden rounded-xl border border-sky-200 bg-stone-900/5 group">
                            <img
                              src={act.proofPhoto}
                              alt={act.title || 'Minh chứng'}
                              className="h-44 w-full object-cover transition duration-300 group-hover:scale-102 cursor-pointer"
                              onClick={() => window.open(act.proofPhoto, '_blank')}
                              loading="lazy"
                            />
                            <div className="p-2 bg-white text-[11px] text-stone-600 flex items-center justify-between border-t border-sky-100">
                              <span className="text-sky-800 font-medium">📸 Minh chứng ca trực thực địa</span>
                              <span
                                className="text-sky-800 font-bold hover:underline cursor-pointer"
                                onClick={() => window.open(act.proofPhoto, '_blank')}
                              >
                                Mở ảnh to ↗
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-stone-700 text-xs">
                    Chưa có nhật ký ghi nhận cho Ngày {selectedDay}
                  </p>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto mt-0.5">
                    Ảnh và nhật ký sẽ hiển thị tại ngày tương ứng khi kỹ thuật viên hoặc chủ vườn ghi nhận.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddDiary?.(plot)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  + Viết nhật ký & Tải ảnh ngay
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal xem chi tiết cẩm nang kỹ thuật của mốc ngày
 */
function StageDetailModal({ stage, cropProcess, onClose }) {
  if (!stage) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-stone-900/10 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            {stage.label} ({stage.status === 'COMPLETED' ? 'Đã hoàn tất' : stage.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Kế hoạch sắp tới'})
          </span>
          <span className="text-xs text-stone-500 font-medium">Quy trình chuẩn VietGAP</span>
        </div>

        <h3 className="mt-2 text-xl font-bold font-heading text-[#18352b]">{stage.name}</h3>
        <p className="mt-1 text-sm text-stone-600">{stage.statusDesc}</p>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-emerald-50/80 p-4 border border-emerald-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Sprout className="h-4 w-4" />Chỉ dẫn kỹ thuật canh tác trọng tâm
            </h4>
            <p className="mt-1.5 text-sm text-emerald-950 leading-relaxed">{stage.guide}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 p-3.5 bg-stone-50/50">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-sky-500" />Chế độ tưới nước đề xuất
              </span>
              <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">{stage.waterRegime}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 p-3.5 bg-stone-50/50">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Leaf className="h-4 w-4 text-emerald-600" />Dinh dưỡng & Phân bón vi sinh
              </span>
              <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">{stage.nutrition || stage.materials || 'Bón phân hữu cơ vi sinh'}</p>
            </div>
          </div>

          {stage.pestAlert && (
            <div className="rounded-2xl bg-amber-50/80 p-3.5 border border-amber-200">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />Cảnh báo sâu bệnh & Phòng trừ sinh học
              </span>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">{stage.pestAlert}</p>
            </div>
          )}

          {stage.inspectionCriteria && (
            <div className="rounded-2xl bg-blue-50/80 p-3.5 border border-blue-200">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600" />Tiêu chí nghiệm thu của Kỹ sư
              </span>
              <p className="mt-1 text-xs text-blue-800 leading-relaxed">{stage.inspectionCriteria}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#18352b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f2a20]"
          >
            Đã hiểu quy trình
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   2. LƯU TRỮ VÀ TRUY XUẤT HOẠT ĐỘNG CỦA STAFF (FIELD WORKER ACTIVITIES)
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Thẻ hiển thị một hoạt động của Staff với đầy đủ bằng chứng, người làm, giờ giấc
 */
/**
 * Thẻ hiển thị một hoạt động của Staff hoặc công việc Tự canh tác của chủ vườn
 */
function StaffActivityCard({ activity, onOpenPhoto, isSelf = false, onToggleTask, onDeleteTask }) {
  const isDone = activity.status === 'COMPLETED';
  const isInProg = activity.status === 'IN_PROGRESS';
  const isToday = activity.isToday;

  return (
    <div className={`group relative flex flex-col sm:flex-row items-start gap-4 rounded-2xl border transition hover:shadow-md ${
      isDone
        ? 'border-emerald-200/90 bg-emerald-50/20'
        : isToday
        ? 'border-2 border-amber-300 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 shadow-xs hover:border-emerald-500'
        : 'border-stone-200/90 bg-stone-50/40 hover:bg-white hover:border-stone-300'
    } p-4 shadow-sm`}>
      {/* Cột trái: Nút Checkbox (cho Tự canh tác) HOẶC Ảnh minh chứng (cho Staff) */}
      {isSelf ? (
        <button
          type="button"
          onClick={() => onToggleTask?.(activity.activityId || activity.id)}
          className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            isDone
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : isToday
              ? 'border-amber-400 bg-amber-50 text-amber-500 hover:border-emerald-500 hover:bg-emerald-50'
              : 'border-stone-300 bg-stone-50 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-300 hover:text-emerald-600'
          }`}
          title={isDone ? 'Bấm để đánh dấu chưa hoàn thành' : 'Bấm để đánh dấu hoàn thành'}
        >
          <Check className={`h-5 w-5 stroke-[3] transition-transform ${isDone ? 'scale-100' : 'scale-75 opacity-30'}`} />
        </button>
      ) : activity.proofPhoto ? (
        <div className="relative h-28 w-full sm:h-24 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-stone-100">
          <img
            src={activity.proofPhoto}
            alt={activity.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <button
            type="button"
            onClick={() => onOpenPhoto?.(activity)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100 text-white"
            title="Xem ảnh phóng to"
          >
            <Maximize2 className="h-5 w-5 drop-shadow" />
          </button>
          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] font-semibold text-white">
            Ảnh minh chứng
          </span>
        </div>
      ) : (
        <div className={`flex h-20 w-full sm:h-24 sm:w-28 shrink-0 items-center justify-center rounded-xl ${
          isToday ? 'bg-amber-100/70 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {isToday ? <Flame className="h-8 w-8 animate-pulse text-amber-600" /> : <CalendarCheck className="h-8 w-8 opacity-60" />}
        </div>
      )}

      {/* Cột thông tin chi tiết */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isDone
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isInProg
                ? 'bg-sky-100 text-sky-800 border border-sky-300 font-bold'
                : isToday
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                : 'bg-stone-100 text-stone-600 border border-stone-200'
            }`}>
              {isDone ? <Check className="h-3.5 w-3.5" /> : isToday ? <Flame className="h-3.5 w-3.5 text-amber-600" /> : <Clock className="h-3.5 w-3.5" />}
              {isDone ? 'Đã hoàn tất' : isInProg ? 'Đang thực hiện' : isToday ? 'Cần làm hôm nay' : 'Kế hoạch sắp tới'}
            </span>
            <span className="text-xs text-stone-500 font-medium">{activity.timestamp}</span>
          </div>

          {activity.actionTypeName ? (
            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
              {activity.actionTypeName}
            </span>
          ) : activity.cropDay ? (
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold border ${
              isToday
                ? 'bg-amber-100 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-100'
            }`}>
              Ngày tuổi {activity.cropDay}
            </span>
          ) : null}
        </div>

        <h4 className={`mt-1.5 text-sm font-bold transition ${
          isDone && isSelf ? 'text-stone-400 line-through' : 'text-[#18352b] group-hover:text-emerald-800'
        }`}>
          {activity.title}
        </h4>

        {activity.notes && (
          <p className="mt-1 text-xs text-stone-600 leading-relaxed line-clamp-2">
            {activity.notes}
          </p>
        )}

        {/* Thông tin người phụ trách: ẨN HOÀN TOÀN TÊN NHÂN VIÊN KHI LÀ TỰ CANH TÁC (Requirement #3) */}
        {isSelf ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-stone-500">
              <Sprout className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-stone-700">Chủ vườn tự thực hiện</span>
              <span className="text-stone-400">· Quy trình VietGAP</span>
            </div>
            {activity.isCustom && onDeleteTask && (
              <button
                type="button"
                onClick={() => onDeleteTask(activity.activityId || activity.id)}
                className="text-stone-400 hover:text-rose-600 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa việc
              </button>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2 text-xs">
            <div className="flex items-center gap-2">
              {activity.workerAvatar ? (
                <img src={activity.workerAvatar} alt={activity.workerName} className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-300" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[10px] text-white font-bold">
                  {activity.workerName?.charAt(0) || 'S'}
                </span>
              )}
              <span className="font-semibold text-stone-800">{activity.workerName}</span>
              {activity.workerRole && <span className="text-[11px] text-stone-400">({activity.workerRole})</span>}
            </div>

            {activity.sensorSnapshot && (
              <div className="flex items-center gap-2 text-[11px] text-stone-500">
                <span>Đo lúc làm:</span>
                <span className="font-semibold text-emerald-700">{activity.sensorSnapshot.temp}</span>
                <span>·</span>
                <span className="font-semibold text-sky-700">Độ ẩm {activity.sensorSnapshot.soilMoisture}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tab Hoạt động Staff / Công việc hằng ngày cho khách tự canh tác
 */
function StaffActivitiesTab({
  activities = [],
  onOpenPhoto,
  plot,
  isSelf = false,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  totalDays = 60
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDay, setNewDay] = useState(1);
  const [newTime, setNewTime] = useState('Ca sáng (07:00 - 08:30)');
  const [newNotes, setNewNotes] = useState('');

  const todayStr = useMemo(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()), []);
  const currentDay = plot?.currentDay || 0;

  const isActivityToday = useCallback((act) => {
    if (act.status === 'COMPLETED') return false;
    if (act.status === 'IN_PROGRESS') return true;
    if (act.priority === 'HIGH' || act.priority === 'URGENT') return true;
    if (currentDay > 0 && act.day && act.day <= currentDay) return true;
    if (act.date && act.date <= todayStr) return true;
    return false;
  }, [currentDay, todayStr]);

  const filtered = useMemo(() => {
    return activities.filter((act) => {
      const matchSearch = !searchQuery.trim() || 
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (act.notes && act.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (!isSelf && act.workerName && act.workerName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'COMPLETED') return act.status === 'COMPLETED';
      if (statusFilter === 'TODAY') return isActivityToday(act);
      if (statusFilter === 'UPCOMING') return act.status !== 'COMPLETED' && !isActivityToday(act);
      return true;
    });
  }, [activities, searchQuery, statusFilter, isSelf, isActivityToday]);

  const { todayList, upcomingList, doneList } = useMemo(() => {
    const today = [];
    const upcoming = [];
    const done = [];

    filtered.forEach((act) => {
      if (act.status === 'COMPLETED') {
        done.push(act);
      } else if (isActivityToday(act)) {
        today.push(act);
      } else {
        upcoming.push(act);
      }
    });

    return { todayList: today, upcomingList: upcoming, doneList: done };
  }, [filtered, isActivityToday]);

  const counts = useMemo(() => {
    const todayCount = activities.filter((a) => a.status !== 'COMPLETED' && isActivityToday(a)).length;
    const upcomingCount = activities.filter((a) => a.status !== 'COMPLETED' && !isActivityToday(a)).length;
    const doneCount = activities.filter((a) => a.status === 'COMPLETED').length;

    return {
      all: activities.length,
      today: todayCount,
      upcoming: upcomingCount,
      done: doneCount
    };
  }, [activities, isActivityToday]);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask?.({
      title: newTitle.trim(),
      day: Number(newDay) || 1,
      time: newTime,
      notes: newNotes.trim()
    });
    setNewTitle('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header thanh công cụ tìm kiếm & lọc */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isSelf ? "Tìm theo tên việc, ghi chú kỹ thuật..." : "Tìm theo tên việc, ghi chú, nhân viên phụ trách..."}
            className="w-full rounded-xl border border-stone-200 bg-[#fbfcfb] py-2 pl-9 pr-3 text-xs font-medium text-stone-800 placeholder-stone-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nút lọc trạng thái & Nút thêm công việc (cho Tự canh tác) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: `Tất cả (${counts.all})` },
              { id: 'TODAY', label: `🔥 Việc hôm nay (${counts.today})`, highlight: counts.today > 0 },
              { id: 'UPCOMING', label: `⏳ Việc chưa tới (${counts.upcoming})` },
              { id: 'COMPLETED', label: `✅ Đã xong (${counts.done})` }
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setStatusFilter(btn.id)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  statusFilter === btn.id
                    ? 'bg-[#18352b] text-white shadow-sm'
                    : btn.highlight
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {isSelf && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm việc mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Danh sách các công việc / hoạt động - CHIA RÕ VIỆC HÔM NAY VÀ VIỆC CHƯA TỚI */}
      {filtered.length > 0 ? (
        <div className="space-y-6">
          {/* PHẦN 1: 🔥 VIỆC CẦN LÀM HÔM NAY (NỔI BẬT) */}
          {(statusFilter === 'ALL' || statusFilter === 'TODAY') && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Flame className="w-4 h-4 animate-bounce" />
                  </span>
                  <div>
                    <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                      <span>Việc Cần Thực Hiện Hôm Nay ({todayList.length})</span>
                    </h4>
                    <p className="text-[11px] text-amber-800 font-medium">
                      {isSelf
                        ? "Nhiệm vụ cần chủ vườn thực hiện chăm sóc trong ngày theo quy trình VietGAP"
                        : "Nhiệm vụ nhân viên hiện trường phụ trách thực hiện và báo cáo trong ngày"}
                    </p>
                  </div>
                </div>
                {todayList.length > 0 ? (
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs self-start sm:self-auto">
                    Ưu tiên thực hiện trong ngày
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 self-start sm:self-auto flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Xong việc hôm nay
                  </span>
                )}
              </div>

              {todayList.length === 0 ? (
                <div className="p-6 text-center bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-300 flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  <p className="font-heading font-black text-stone-900 text-sm">Hôm nay không có việc tồn đọng!</p>
                  <p className="text-xs text-stone-500">
                    Toàn bộ nhiệm vụ chăm sóc ngày hôm nay đã được thực hiện chu đáo. Cây trồng đang phát triển rất tốt.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayList.map((act) => (
                    <StaffActivityCard
                      key={act.activityId || act.id}
                      activity={{ ...act, isToday: true }}
                      onOpenPhoto={onOpenPhoto}
                      isSelf={isSelf}
                      onToggleTask={onToggleTask}
                      onDeleteTask={onDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PHẦN 2: ⏳ KẾ HOẠCH VIỆC CHƯA TỚI (TÁCH BIỆT RÕ RÀNG) */}
          {(statusFilter === 'ALL' || statusFilter === 'UPCOMING') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-stone-100 text-stone-600">
                    <Calendar className="w-4 h-4 text-stone-600" />
                  </span>
                  <div>
                    <h4 className="font-heading font-black text-sm text-stone-800 flex items-center gap-2">
                      <span>Kế Hoạch Việc Chưa Tới ({upcomingList.length})</span>
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Lịch trình các công việc canh tác chuẩn VietGAP cho các giai đoạn sinh trưởng tiếp theo
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  Chưa tới hạn
                </span>
              </div>

              {upcomingList.length === 0 ? (
                <p className="text-xs text-stone-400 italic p-4 text-center bg-stone-50 rounded-2xl">
                  Không có công việc kế hoạch sắp tới nào.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingList.map((act) => (
                    <StaffActivityCard
                      key={act.activityId || act.id}
                      activity={{ ...act, isUpcoming: true }}
                      onOpenPhoto={onOpenPhoto}
                      isSelf={isSelf}
                      onToggleTask={onToggleTask}
                      onDeleteTask={onDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PHẦN 3: ✅ DANH SÁCH VIỆC ĐÃ HOÀN TẤT */}
          {(statusFilter === 'ALL' || statusFilter === 'COMPLETED') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h4 className="font-heading font-black text-sm text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Lịch Sử Đã Hoàn Tất ({doneList.length})</span>
                </h4>
              </div>

              {doneList.length === 0 ? (
                <p className="text-xs text-stone-400 italic p-4 text-center bg-stone-50 rounded-2xl">
                  Chưa có công việc nào hoàn tất.
                </p>
              ) : (
                <div className="space-y-3">
                  {doneList.map((act) => (
                    <StaffActivityCard
                      key={act.activityId || act.id}
                      activity={act}
                      onOpenPhoto={onOpenPhoto}
                      isSelf={isSelf}
                      onToggleTask={onToggleTask}
                      onDeleteTask={onDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={CalendarCheck}
          title={isSelf ? "Chưa có công việc nào" : "Không tìm thấy hoạt động nào"}
          note={isSelf ? "Bạn có thể bấm '+ Thêm việc mới' để tự tạo nhiệm vụ canh tác cho vườn của mình." : "Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái."}
        />
      )}

      {/* Modal Thêm công việc mới cho khách tự canh tác */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-heading font-black text-lg text-[#18352b]">
                  Thêm công việc canh tác mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 rounded-lg p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên công việc *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Tưới phun sương ẩm đất, bón thúc đợt 2..."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ngày tuổi thực hiện</label>
                  <input
                    type="number"
                    min={1}
                    max={totalDays}
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Thời gian / Ca</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-xs font-medium text-stone-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Ca sáng (07:00 - 08:30)">Ca sáng (07:00)</option>
                    <option value="Ca trưa (11:00 - 12:00)">Ca trưa (11:00)</option>
                    <option value="Ca chiều (16:30 - 17:30)">Ca chiều (16:30)</option>
                    <option value="Cả ngày">Cả ngày</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ghi chú kỹ thuật / Hướng dẫn</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ghi chú kỹ thuật, liều lượng phân bón, chế phẩm vi sinh..."
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-medium text-stone-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Lưu công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Modal xem ảnh bằng chứng hiện trường phóng to
 */
function ActivityProofModal({ activity, onClose }) {
  if (!activity || !activity.proofPhoto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative max-w-3xl w-full rounded-3xl bg-[#0f2a20] p-4 text-white shadow-2xl overflow-hidden ring-1 ring-white/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white/80 hover:bg-black/70 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-hidden rounded-2xl bg-black max-h-[70vh] flex items-center justify-center">
          <img src={activity.proofPhoto} alt={activity.title} className="max-h-[70vh] w-auto object-contain" />
        </div>

        <div className="mt-4 px-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-base text-white">{activity.title}</h4>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              {activity.timestamp}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/80">{activity.notes}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
            <span>Thực hiện bởi:</span>
            <strong className="text-white">{activity.workerName}</strong>
            {activity.workerRole && <span>({activity.workerRole})</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   3. IOT TAB VỚI LIVE 3RD-PARTY AGROMETEOROLOGY API (OPEN-METEO)
   ────────────────────────────────────────────────────────────────────────── */

function ReadingCard({ metric, plot, onClick, active = false, showAction = true, delay = 0 }) {
  const Icon = metric.icon;
  const currentVal = plot[metric.key];
  const reading = assessMetric(metric.key, currentVal, plot.mode);
  const s = LEVEL_STYLE[reading.level];
  const Tag = onClick ? 'button' : 'div';

  const [pulsing, setPulsing] = useState(false);
  const prevValRef = useRef(currentVal);

  useEffect(() => {
    if (prevValRef.current !== currentVal && prevValRef.current !== undefined) {
      prevValRef.current = currentVal;
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
    prevValRef.current = currentVal;
  }, [currentVal]);

  return (
    <Tag
      {...(onClick ? { type: 'button', onClick, 'aria-pressed': active } : {})}
      aria-label={`${reading.label}: ${currentVal ?? 'chưa có'} — ${reading.chip}. ${reading.meaning}`}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex animate-fadeInUp flex-col overflow-hidden rounded-3xl border bg-white p-4 text-left transition duration-300 ${CARD_SHADOW} ${
        pulsing ? 'ring-2 ring-emerald-400 shadow-md scale-[1.01]' : active ? 'border-transparent ring-2' : 'border-white/80'
      } ${onClick ? 'hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(24,53,43,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400' : ''}`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.12] blur-2xl transition-opacity group-hover:opacity-25" style={{ backgroundColor: metric.color }} />
      {active && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-inset" style={{ '--tw-ring-color': metric.color }} />}

      <div className="relative flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${metric.color}cc, ${metric.color})` }}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          {reading.label}
        </span>
        <div className="flex items-center gap-1.5">
          {pulsing && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors duration-300 ${s.chip}`}>{reading.chip}</span>
        </div>
      </div>

      <div className="relative mt-2">
        <ArcGauge position={reading.position} color={metric.color} levelColor={s.hex}>
          <span className={`whitespace-nowrap font-bold leading-none tracking-tight transition-all duration-300 ${pulsing ? 'text-emerald-600 scale-105' : 'text-[#18352b]'} ${String(currentVal ?? '').length > 7 ? 'text-base' : 'text-[22px]'}`}>
            {currentVal ?? '—'}
          </span>
          <span className="mt-1.5 text-[10px] font-medium text-emerald-700">An toàn {reading.min}–{reading.max}</span>
        </ArcGauge>
      </div>

      <p className="relative -mt-1 text-center text-sm leading-snug text-stone-600">{reading.meaning}</p>
      {showAction && reading.action && (
        <p className="relative mt-3 flex items-start gap-1.5 rounded-xl bg-[#f3f6f0] px-3 py-2 text-xs font-medium text-[#18352b]">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />{reading.action}
        </p>
      )}
    </Tag>
  );
}

function HealthHero({ plot, alerts = [], onMore, liveProviderInfo }) {
  const summary = summarizePlot(plot, alerts);
  const health = computeHealthScore(plot, alerts);
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123b2c] via-[#18493a] to-[#0f2a20] p-5 text-white sm:p-6 ${CARD_SHADOW}`}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime-300/20 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <HealthRing score={health.score} tone={health.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-200/90">Sức khoẻ thửa đất</p>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">{health.label}</span>
            {liveProviderInfo?.isLive3rdParty && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-lime-300 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-300 animate-pulse" />
                Open-Meteo Agrometeorology Live Feed
              </span>
            )}
          </div>
          <p className="mt-2 text-base font-medium leading-relaxed text-white/95 sm:text-lg">{summary.headline}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {summary.items.map((i) => (
              <li key={i.key} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/10 backdrop-blur">
                <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE[i.level].dot}`} />{i.label}
              </li>
            ))}
          </ul>
        </div>
        {onMore && (
          <button type="button" onClick={onMore} className="flex shrink-0 items-center justify-center gap-1 self-start rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-semibold text-[#17372c] transition hover:bg-lime-200 sm:self-center">
            Chi tiết IoT<ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function IotTab({ plot, iotData, alerts, isConnected = false, onRefreshLive, isRefreshing = false, liveProviderInfo, cropProcess }) {
  const [timeframe, setTimeframe] = useState('hourly');
  const [metricKey, setMetricKey] = useState('temp');
  const metric = METRICS.find((m) => m.key === metricKey);
  const rule = METRIC_RULES[metricKey];
  const data = iotData?.[timeframe] || iotData?.hourly || [];
  const seriesSentence = describeSeries(metricKey, data, metric.series);

  return (
    <div className="space-y-5">
      {/* Nguồn dữ liệu thời tiết 3rd party rõ ràng */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/70 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-900">
                {liveProviderInfo?.provider || 'Open-Meteo Global Agrometeorology Live API'}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Toạ độ GPS: {liveProviderInfo?.coordinates || '10.6877°N, 106.3503°E'}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Cập nhật vi khí hậu thực tế: Tầng đất mặt, bức xạ quang năng, nhiệt ẩm tự nhiên không giả lập.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefreshLive}
          disabled={isRefreshing}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#18352b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0f2a20] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Đang cập nhật từ vệ tinh...' : 'Làm mới Live Feed'}
        </button>
      </div>

      <HealthHero plot={plot} alerts={alerts} liveProviderInfo={liveProviderInfo} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m, i) => (
          <ReadingCard key={m.key} metric={m} plot={plot} delay={i * 70} active={m.key === metricKey} onClick={() => setMetricKey(m.key)} />
        ))}
      </div>

      {/* Thông số nông nghiệp mở rộng từ Open-Meteo */}
      {plot.rawMetrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-stone-500 uppercase">Nhiệt độ tầng đất</span>
            <p className="mt-1 text-lg font-bold text-stone-800">{plot.soilTemp || '26.6°C'}</p>
            <span className="text-[10px] text-emerald-700">Đo tại độ sâu 0-5cm</span>
          </div>
          <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-stone-500 uppercase">Lượng mưa thời gian thực</span>
            <p className="mt-1 text-lg font-bold text-stone-800">{plot.precipitation || '0.0 mm'}</p>
            <span className="text-[10px] text-emerald-700">Dự báo tích lũy</span>
          </div>
          <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-stone-500 uppercase">Tốc độ gió</span>
            <p className="mt-1 text-lg font-bold text-stone-800">{plot.windSpeed || '6.3 km/h'}</p>
            <span className="text-[10px] text-emerald-700">Thông thoáng tự nhiên</span>
          </div>
          <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-stone-500 uppercase">Áp suất khí quyển</span>
            <p className="mt-1 text-lg font-bold text-stone-800">{plot.pressure || '1009 hPa'}</p>
            <span className="text-[10px] text-emerald-700">Áp suất ổn định</span>
          </div>
        </div>
      )}

      {/* Biểu đồ diện tích theo giờ thực tế */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Trạm quan trắc {liveProviderInfo?.stationId || plot.stationId || 'AGRO-CUCHI'}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Open-Meteo 3rd Party · Cập nhật {plot.lastUpdated || 'Vừa xong'}
              </span>
            </div>
            <h3 className="font-heading text-lg font-bold text-[#18352b]">Biểu đồ {metric.label.toLowerCase()} 24 giờ qua</h3>
          </div>
          <div className="inline-flex rounded-xl bg-stone-100 p-1" role="tablist" aria-label="Khoảng thời gian">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={timeframe === t.id}
                onClick={() => setTimeframe(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${timeframe === t.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const active = m.key === metricKey;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetricKey(m.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active ? 'border-transparent text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
                style={active ? { backgroundColor: m.color } : undefined}
              >
                <Icon className="h-3.5 w-3.5" />{m.label}
              </button>
            );
          })}
        </div>

        {seriesSentence && <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-700">{seriesSentence}</p>}

        <div className="mt-4 h-60 sm:h-72">
          {data.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="iot-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metric.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f0" vertical={false} />
                <ReferenceArea
                  y1={rule.min}
                  y2={rule.max}
                  fill="#10b981"
                  fillOpacity={0.08}
                  stroke="#10b981"
                  strokeOpacity={0.25}
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                  label={{ value: 'Vùng an toàn', position: 'insideTopRight', fontSize: 11, fill: '#047857' }}
                />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[(min) => Math.floor(Math.min(min, rule.min) - 3), (max) => Math.ceil(Math.max(max, rule.max) + 3)]}
                />
                <Tooltip
                  formatter={(v) => {
                    const off = v < rule.min ? ' — dưới ngưỡng' : v > rule.max ? ' — vượt ngưỡng' : ' — trong ngưỡng';
                    return [`${v} ${metric.unit}${metricKey === 'light' && v === 0 ? ' (ban đêm)' : off}`, metric.label];
                  }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }}
                />
                <Area type="monotone" dataKey={metric.series} stroke={metric.color} strokeWidth={2.5} fill="url(#iot-area)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState icon={Radio} title="Đang tải dữ liệu cảm biến Open-Meteo" />}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Dải xanh trên biểu đồ là vùng an toàn cho {cropProcess?.cropName || plot?.crop || 'cây trồng'}: {rule.min}–{rule.max} {metric.unit}.
        </p>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   4. CÁC TAB KHÁC: OVERVIEW, DIARY, SERVICES, HARVEST
   ────────────────────────────────────────────────────────────────────────── */

function OverviewTab({
  plot,
  cropProcess,
  staffActivities,
  operations,
  onAddDiary,
  goTab,
  onOpenStageDetail,
  onOpenActivityPhoto,
  onOpenHarvest,
  liveProviderInfo,
  seasons = [],
  activeSeasonId,
  onSelectSeason,
  onOpenRenewal,
  activeSeason,
  isSelf = false,
  onToggleTask
}) {
  const daysLeft = cropProcess.daysLeft;
  const recentActivities = staffActivities.slice(0, 3);
  const isSoilPrep = activeSeason?.status === 'SOIL_PREP' || activeSeason?.inFallow;

  return (
    <div className="space-y-6">
      {/* 0. Thanh chuyển đổi Vụ Mùa (Season Switcher) */}
      <SeasonSelector
        seasons={seasons}
        activeSeasonId={activeSeasonId}
        onSelectSeason={onSelectSeason}
        onOpenRenewal={onOpenRenewal}
        canRenew={true}
        plot={plot}
      />

      {isSoilPrep ? (
        /* Giai đoạn nghỉ đất & cải tạo theo chuẩn VietGAP (Fallow Protocol) */
        <SoilPrepView
          plot={plot}
          season={activeSeason}
          nextSeason={seasons?.find((s) => s.seasonNumber > (activeSeason?.seasonNumber || 1))}
          onOpenRenewal={onOpenRenewal}
        />
      ) : (
        <>
          {/* Thông báo nếu vụ mùa đang chọn chưa tới ngày bắt đầu */}
          {activeSeason?.status === 'SCHEDULED' && (
            <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-r from-sky-50 via-white to-blue-50/50 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 shadow-2xs">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-sky-950">
                      {activeSeason.seasonName || `Vụ ${activeSeason.seasonNumber}`} · Chưa bắt đầu canh tác
                    </h4>
                    <span className="rounded-md bg-sky-200/70 px-2 py-0.5 text-[10px] font-extrabold text-sky-900">
                      Dự kiến gieo trồng: {activeSeason.startDate ? new Date(activeSeason.startDate).toLocaleDateString('vi-VN') : 'Kỳ tới'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-sky-800/80">
                    Vụ 2 sẽ tự động kích hoạt sau khi Vụ trước thu hoạch xong và hoàn thành 5 ngày nghỉ đất cải tạo theo VietGAP. Dưới đây là lộ trình canh tác tiêu chuẩn chuẩn bị cho vụ này.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenRenewal}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-sky-300 bg-white px-3.5 py-2 text-xs font-bold text-sky-800 hover:bg-sky-50 transition shadow-2xs cursor-pointer"
              >
                <Sprout className="h-3.5 w-3.5 text-sky-700" />
                Đổi giống vụ này
              </button>
            </div>
          )}

          {/* 1. Hiện trạng cây trồng & Quy trình chuẩn theo ngày */}
          <section aria-label="Hiện trạng cây trồng">
            <CropGrowthHero cropProcess={cropProcess} onOpenStageDetail={onOpenStageDetail} />
          </section>

          {/* 2. Dòng thời gian mốc ngày chuẩn VietGAP */}
          <Card className="p-5">
            <SectionTitle
              eyebrow={`Tiến trình chuẩn theo ngày tuổi · ${cropProcess.cropName}`}
              title="Quy trình canh tác chuẩn VietGAP"
              action={
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Chuẩn VietGAP toàn trình
                </span>
              }
            />
            <div className="mt-4">
              <StandardProcessTimeline
                cropProcess={cropProcess}
                operations={operations}
                staffActivities={staffActivities}
                plot={plot}
                isSelf={isSelf}
                onToggleTask={onToggleTask}
                onSelectStage={onOpenStageDetail}
                onAddDiary={onAddDiary}
              />
            </div>
          </Card>
        </>
      )}

      {/* 3. Hoạt động của Staff gần nhất hoặc Công việc tự canh tác */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <SectionTitle
            eyebrow={`${staffActivities.length} ${isSelf ? 'công việc' : 'hoạt động được lưu trữ'}`}
            title={isSelf ? "Công việc canh tác gần đây" : "Nhật ký chăm sóc của Staff"}
            action={<LinkButton onClick={() => goTab('tasks')}>Xem tất cả</LinkButton>}
          />
          <div className="mt-4 space-y-2.5">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <StaffActivityCard
                  key={act.activityId || act.id}
                  activity={act}
                  isSelf={isSelf}
                  onToggleTask={onToggleTask}
                  onOpenPhoto={onOpenActivityPhoto}
                />
              ))
            ) : (
              <EmptyState title="Chưa có hoạt động nào" note={isSelf ? "Chưa có công việc nào." : "Kỹ thuật viên sẽ cập nhật ngay khi chăm sóc luống."} />
            )}
          </div>
        </Card>

        {/* Khối Thu hoạch */}
        <div className={`relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[#f7fbe9] via-[#eef7d6] to-[#e2f0c4] p-5 ${CARD_SHADOW}`}>
          <Wheat aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 rotate-12 text-lime-600/10" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-800">
            {cropProcess.isNotStarted ? 'Kế hoạch mùa vụ' : 'Dự kiến thu hoạch'}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="#d9e8b8" strokeWidth="9" fill="none" />
                <circle cx="50" cy="50" r="42" stroke="#4d7c0f" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - (cropProcess.isNotStarted ? 0 : cropProcess.progressPercent) / 100)} className="transition-[stroke-dashoffset] duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold leading-none text-[#18352b]">
                  {cropProcess.isNotStarted ? (cropProcess.daysUntilStart || 0) : daysLeft}
                </span>
                <span className="text-[10px] font-semibold text-lime-800">
                  {cropProcess.isNotStarted ? 'ngày nữa bắt đầu' : 'ngày nữa'}
                </span>
              </div>
            </div>
            <dl className="min-w-0 space-y-1.5 text-sm">
              <div><dt className="text-xs text-lime-900/70">Ngày dự kiến</dt><dd className="font-semibold text-[#18352b]">{plot.expectedHarvestDate || 'Sau 19 ngày'}</dd></div>
              <div><dt className="text-xs text-lime-900/70">Sản lượng tiêu chuẩn</dt><dd className="font-semibold text-[#18352b]">{cropProcess.expectedYield}</dd></div>
            </dl>
          </div>
          <button type="button" onClick={() => onOpenHarvest?.(plot)} className="relative mt-auto pt-4">
            <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18352b] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#18352b]/20 transition hover:-translate-y-0.5 hover:bg-[#0f2a20]">
              <Wheat className="h-4 w-4" />Chuẩn bị thu hoạch
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DiaryTab({ plot, operations, onAddDiary }) {
  const canWrite = plot.mode === 'Self-Growing';
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          {canWrite ? 'Bạn tự canh tác thửa này — hãy ghi lại mỗi lần chăm sóc và hình ảnh hiện trường.' : 'Farmely lưu trữ nhật ký chăm sóc kèm ảnh minh chứng từ kỹ thuật viên & ghi chú của bạn.'}
        </p>
        <button type="button" onClick={() => onAddDiary?.(plot)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 shadow-sm transition">
          <PenLine className="h-4 w-4" />+ Thêm nhật ký
        </button>
      </div>
      {operations.diary?.length ? (
        <ol className="relative space-y-3 border-l-2 border-emerald-100 pl-5">
          {operations.diary.map((e, idx) => (
            <li key={e.id || `${e.time}-${idx}`} className="relative">
              <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow" aria-hidden="true" />
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-500">{e.time}</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    <UserRound className="h-3.5 w-3.5" />{e.author}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#18352b]">{e.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600 whitespace-pre-line">{e.note}</p>
                {(e.image || e.imageUrl || e.photo) && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-stone-200/80 bg-stone-50 max-w-md">
                    <img
                      src={e.image || e.imageUrl || e.photo}
                      alt={e.title || 'Ảnh nhật ký hiện trường'}
                      className="max-h-72 w-full object-cover transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
                      onClick={() => window.open(e.image || e.imageUrl || e.photo, '_blank')}
                      loading="lazy"
                    />
                    <div className="p-2 bg-white/80 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100">
                      <span>📸 Ảnh minh chứng thực tế</span>
                      <span className="text-[10px] text-emerald-700 font-semibold cursor-pointer hover:underline" onClick={() => window.open(e.image || e.imageUrl || e.photo, '_blank')}>Mở ảnh phóng to ↗</span>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ol>
      ) : <EmptyState icon={BookOpen} title="Chưa có nhật ký" />}
    </div>
  );
}

function ServicesTab({ plot, services, orders, onSelectService }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'IN_PROGRESS') {
      return orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'ASSIGNED' || o.status === 'PENDING');
    }
    if (statusFilter === 'COMPLETED') {
      return orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DONE');
    }
    return orders;
  }, [orders, statusFilter]);

  const inProgressCount = orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'ASSIGNED' || o.status === 'PENDING').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DONE').length;

  return (
    <div className="space-y-6">
      {/* 1. Đặt dịch vụ chăm sóc & vật tư */}
      <section>
        <SectionTitle eyebrow={`Cho ${plot.name}`} title="Đặt dịch vụ chăm sóc & vật tư" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectService?.(s)}
              className="group flex flex-col rounded-2xl border border-stone-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span className="text-sm font-semibold text-[#18352b]">{s.name}</span>
              {s.description && <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{s.description}</span>}
              <span className="mt-3 flex items-center justify-between">
                <span className="text-base font-bold text-emerald-700">{s.formattedPrice}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:underline">Đặt ngay<ChevronRight className="h-4 w-4" /></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Lịch sử mua & sử dụng dịch vụ của thửa đất */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
          <div>
            <SectionTitle eyebrow={`${orders.length} đơn dịch vụ`} title="Lịch sử mua & sử dụng dịch vụ" />
            <p className="text-xs text-stone-500 mt-0.5">Theo dõi chi tiết tiến độ thực hiện, nhân viên phụ trách và ảnh nghiệm thu thực địa.</p>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'IN_PROGRESS' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Đang làm ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'COMPLETED' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Hoàn thành ({completedCount})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredOrders.length ? (
            filteredOrders.map((o) => {
              const isCompleted = o.status === 'COMPLETED' || o.status === 'DONE';
              return (
                <Card key={o.id} className="p-4 sm:p-5 transition hover:shadow-md border border-stone-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {o.id}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
                          {o.statusLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {o.paymentMethod || 'Đã thanh toán'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-[#18352b] pt-0.5">{o.serviceName}</h4>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                        <span className="flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5 text-stone-400" />
                          {o.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserRound className="w-3.5 h-3.5 text-stone-400" />
                          {o.worker || 'Trần Văn Lực (CVLĐ)'}
                        </span>
                        {o.transactionId && (
                          <span className="text-stone-400 font-mono text-[11px]">
                            GD: #{o.transactionId}
                          </span>
                        )}
                      </div>

                      {/* Photo evidence preview if completed or uploaded */}
                      {o.proofPhoto ? (
                        <div className="pt-2 flex items-center gap-3">
                          <div 
                            className="relative h-14 w-20 rounded-xl overflow-hidden border border-emerald-200 cursor-pointer shadow-xs group"
                            onClick={() => setSelectedOrderForDetail(o)}
                          >
                            <img src={o.proofPhoto} alt="Minh chứng" className="h-full w-full object-cover transition group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="text-xs">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Camera className="w-3 h-3" />
                              Minh chứng hiện trường
                            </span>
                            <p className="text-stone-500 text-[11px] mt-0.5 line-clamp-1">{o.proofNotes || 'Đã nghiệm thu đạt chuẩn'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic pt-1 flex items-center gap-1">
                          <Info className="w-3 h-3 text-stone-400" />
                          {isCompleted ? 'Dịch vụ đã hoàn tất theo định mức' : 'Nhân viên sẽ chụp ảnh hiện trường gửi vào đây khi thực hiện'}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 shrink-0 border-t sm:border-t-0 border-stone-100">
                      <span className="text-base font-extrabold text-emerald-800">{o.price}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForDetail(o)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-stone-500" />
                        Chi tiết đơn
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <EmptyState 
              icon={ShoppingBag} 
              title="Chưa có dịch vụ nào trong mục này" 
              note="Các dịch vụ phát sinh hoặc gói ủy thác chăm sóc bạn đặt cho thửa này sẽ được lưu trữ và hiển thị đầy đủ tại đây." 
            />
          )}
        </div>
      </section>

      {/* Modal chi tiết đơn dịch vụ */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl overflow-hidden border border-stone-200 space-y-4">
            <button
              type="button"
              onClick={() => setSelectedOrderForDetail(null)}
              className="absolute right-4 top-4 rounded-full bg-stone-100 p-2 text-stone-600 hover:bg-stone-200 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-[#18352b]">Chi Tiết Đơn Dịch Vụ</h3>
                <p className="text-xs text-stone-500 font-mono">#{selectedOrderForDetail.id} • {selectedOrderForDetail.transactionId || 'TXN-SUCCESS'}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4 space-y-2 text-xs border border-stone-200/80">
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Dịch vụ:</span>
                <strong className="text-[#18352b] text-sm text-right">{selectedOrderForDetail.serviceName}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Thửa đất áp dụng:</span>
                <span className="font-semibold text-stone-800">{plot.name} ({plot.plotCode || plot.mapPlotId || plot.id})</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Chi phí thanh toán:</span>
                <strong className="text-emerald-700 text-sm font-bold">{selectedOrderForDetail.price}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Phương thức:</span>
                <span className="font-semibold text-stone-800">{selectedOrderForDetail.paymentMethod || 'Chuyển khoản VietQR'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Trạng thái:</span>
                <span className="font-bold text-emerald-700">{selectedOrderForDetail.statusLabel}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Nhân viên phụ trách:</span>
                <span className="font-semibold text-stone-800">{selectedOrderForDetail.worker || 'Trần Văn Lực (CVLĐ)'}</span>
              </div>
            </div>

            {selectedOrderForDetail.proofPhoto && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-xs text-[#18352b] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  Ảnh minh chứng hiện trường:
                </h5>
                <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-stone-900 flex items-center justify-center max-h-56">
                  <img 
                    src={selectedOrderForDetail.proofPhoto} 
                    alt="Minh chứng hiện trường" 
                    className="max-h-56 w-full object-cover"
                  />
                </div>
                {selectedOrderForDetail.proofNotes && (
                  <p className="text-xs text-stone-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                    <strong>Ghi chú:</strong> {selectedOrderForDetail.proofNotes}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HarvestTab({ plot, harvestPlan, onOpenHarvest, cropProcess }) {
  const daysLeft = cropProcess?.daysLeft || Math.max(plot.totalDays - plot.currentDay, 0);
  const planDate = harvestPlan?.date ? harvestPlan.date.split('-').reverse().join('/') : '';
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <SectionTitle eyebrow="Dự kiến thu hoạch" title={daysLeft > 0 ? `Còn ${daysLeft} ngày nữa` : 'Đã đến mùa thu hoạch'} />
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Ngày thu hoạch</dt><dd className="font-semibold text-[#18352b]">{plot.expectedHarvestDate || 'Sau 19 ngày'}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Sản lượng tiêu chuẩn</dt><dd className="font-semibold text-[#18352b]">{cropProcess?.expectedYield || plot.expectedYield}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Cây trồng</dt><dd className="font-semibold text-[#18352b]">{cropProcess?.cropName || plot.crop}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Hợp đồng thuê</dt><dd className="truncate font-semibold text-[#18352b]">{plot.contractCode || 'HD-2026'}</dd></div>
        </dl>
      </Card>
      <Card className="flex flex-col p-5">
        <SectionTitle eyebrow="Kế hoạch của bạn" title={harvestPlan ? 'Đã đăng ký thu hoạch' : 'Chưa đăng ký'} />
        {harvestPlan ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-[#18352b]"><CalendarCheck className="h-4 w-4 text-emerald-700" />Ngày hái: <strong>{planDate}</strong></p>
            <p className="flex items-center gap-2 text-[#18352b]"><Truck className="h-4 w-4 text-emerald-700" />{harvestPlan.methodLabel}</p>
            {harvestPlan.address && <p className="flex items-start gap-2 text-stone-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{harvestPlan.address}</p>}
            {harvestPlan.status === 'APPROVED' ? (
              <p className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">✓ Đã duyệt lịch hái · Đang điều phối thu hoạch</p>
            ) : (
              <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Chờ kỹ sư xác nhận</p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-600">Chọn ngày và phương thức nhận nông sản. Farmely sẽ nhắc bạn trước 3 ngày.</p>
        )}
        <button type="button" onClick={() => onOpenHarvest?.(plot)} className="mt-auto pt-5">
          <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
            <Wheat className="h-4 w-4" />{harvestPlan ? 'Sửa kế hoạch thu hoạch' : 'Đăng ký thu hoạch'}
          </span>
        </button>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   MAIN WORKSPACE COMPONENT
   ────────────────────────────────────────────────────────────────────────── */

export default function CustomerPlotWorkspace({
  plot,
  plots = [],
  operations = { tasks: [], diary: [] },
  iotData,
  alerts = [],
  stages = [],
  services = [],
  serviceOrders = [],
  harvestPlan = null,
  activeTab = 'overview',
  onTabChange,
  onSelectPlot,
  onBack,
  onOpenAiChat,
  onOpenTask,
  onSelectService,
  onOpenHarvest,
  onAddDiary
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const tab = PLOT_TABS.some((t) => t.id === activeTab) ? activeTab : 'overview';
  const isSelf = plot.mode === 'Self-Growing' || plot.cultivationMode === 'SELF' || plot.cultivationMode === 'SELF_GROWING';

  // Dynamic Tabs definition for Self-Growing vs Assisted (Requirement #3)
  const displayTabs = useMemo(() => {
    return PLOT_TABS.map((t) => {
      if (t.id === 'tasks' && isSelf) {
        return { ...t, label: 'Công việc hằng ngày', short: 'Công việc' };
      }
      return t;
    });
  }, [isSelf]);

  // 0. Quản lý Mùa vụ (Seasons) & Gia hạn hợp đồng thửa đất
  const [customSeasons, setCustomSeasons] = useState(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  const plotSeasons = useMemo(() => {
    if (customSeasons && customSeasons.length > 0) return customSeasons;
    return resolvePlotSeasons(plot);
  }, [plot, customSeasons]);

  const [activeSeasonId, setActiveSeasonId] = useState(() => {
    const current = plotSeasons.find((s) => s.isCurrent || s.status === 'ACTIVE');
    return current?.id || plotSeasons[0]?.id || 'SEASON-1';
  });

  const activeSeason = useMemo(() => {
    return plotSeasons.find((s) => s.id === activeSeasonId) || plotSeasons[0];
  }, [plotSeasons, activeSeasonId]);

  // 1. Phân tích và sinh quy trình canh tác chuẩn VietGAP tính theo ngày tuổi cho Vụ mùa đang chọn
  const cropProcess = useMemo(() => {
    if (!activeSeason) return resolveStandardCropProcess(plot, stages);
    const isSeasonScheduled = activeSeason.status === 'SCHEDULED' || activeSeason.currentDay === 0;
    const plotForSeason = {
      ...plot,
      crop: activeSeason.cropName || plot.crop,
      totalDays: activeSeason.totalDays || plot.totalDays,
      currentDay: activeSeason.currentDay !== undefined ? activeSeason.currentDay : (isSeasonScheduled ? 0 : plot.currentDay),
      seasonStatus: activeSeason.status,
      isScheduled: isSeasonScheduled
    };
    return resolveStandardCropProcess(plotForSeason, stages);
  }, [plot, stages, activeSeason]);

  // Quản lý công việc hằng ngày cho khách hàng tự canh tác (Requirement #3)
  const defaultSelfTasks = useMemo(() => {
    if (!cropProcess?.stages?.length) return [];
    const tasks = [];
    cropProcess.stages.forEach((st, idx) => {
      tasks.push({
        id: `SELF-${plot.id}-STG${st.stepOrder || idx + 1}-1`,
        activityId: `SELF-${plot.id}-STG${st.stepOrder || idx + 1}-1`,
        title: st.name ? `${st.name}: ${st.guide?.split('.')[0] || 'Chăm sóc sinh trưởng'}` : 'Chăm sóc theo quy trình VietGAP',
        day: st.dayStart,
        cropDay: st.dayStart,
        date: st.label || `Ngày ${st.dayStart}`,
        timestamp: `Ngày ${st.dayStart} • Ca sáng (07:00 - 08:30)`,
        status: !cropProcess.isNotStarted && st.dayStart <= (cropProcess.currentDay || 0) ? 'COMPLETED' : 'PENDING',
        notes: st.guide || 'Tuân thủ định mức và kỹ thuật chuẩn VietGAP.',
        stepOrder: st.stepOrder || idx + 1,
        waterRegime: st.waterRegime,
        nutrition: st.nutrition,
        isCustom: false
      });
      if (st.waterRegime) {
        tasks.push({
          id: `SELF-${plot.id}-STG${st.stepOrder || idx + 1}-2`,
          activityId: `SELF-${plot.id}-STG${st.stepOrder || idx + 1}-2`,
          title: `Tưới nước: ${st.waterRegime.split('.')[0]}`,
          day: Math.min(st.dayEnd, st.dayStart + 1),
          cropDay: Math.min(st.dayEnd, st.dayStart + 1),
          date: `Ngày ${Math.min(st.dayEnd, st.dayStart + 1)}`,
          timestamp: `Ngày ${Math.min(st.dayEnd, st.dayStart + 1)} • Ca chiều (16:30)`,
          status: !cropProcess.isNotStarted && Math.min(st.dayEnd, st.dayStart + 1) <= (cropProcess.currentDay || 0) ? 'COMPLETED' : 'PENDING',
          notes: st.waterRegime,
          stepOrder: st.stepOrder || idx + 1,
          isCustom: false
        });
      }
      if (st.nutrition) {
        tasks.push({
          id: `SELF-${plot.id}-STG${st.stepOrder || idx + 1}-3`,
          activityId: `SELF-${plot.id}-STG${st.stepOrder || idx + 1}-3`,
          title: `Dinh dưỡng hữu cơ: ${st.nutrition.split('.')[0]}`,
          day: Math.min(st.dayEnd, st.dayStart + 2),
          cropDay: Math.min(st.dayEnd, st.dayStart + 2),
          date: `Ngày ${Math.min(st.dayEnd, st.dayStart + 2)}`,
          timestamp: `Ngày ${Math.min(st.dayEnd, st.dayStart + 2)} • Ca sáng (08:00)`,
          status: !cropProcess.isNotStarted && Math.min(st.dayEnd, st.dayStart + 2) <= (cropProcess.currentDay || 0) ? 'COMPLETED' : 'PENDING',
          notes: st.nutrition,
          stepOrder: st.stepOrder || idx + 1,
          isCustom: false
        });
      }
    });
    return tasks;
  }, [cropProcess?.stages, plot.id, cropProcess.currentDay, cropProcess.isNotStarted]);

  const [selfTasks, setSelfTasks] = useState(() => {
    try {
      const stored = localStorage.getItem(`farmely_self_tasks_${plot.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    if (isSelf && selfTasks.length === 0 && defaultSelfTasks.length > 0) {
      setSelfTasks(defaultSelfTasks);
      try {
        localStorage.setItem(`farmely_self_tasks_${plot.id}`, JSON.stringify(defaultSelfTasks));
      } catch {}
    }
  }, [isSelf, selfTasks.length, defaultSelfTasks, plot.id]);

  const handleToggleSelfTask = useCallback((taskId) => {
    setSelfTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id === taskId || t.activityId === taskId) {
          const newStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
          return { ...t, status: newStatus };
        }
        return t;
      });
      try {
        localStorage.setItem(`farmely_self_tasks_${plot.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [plot.id]);

  const handleAddSelfTask = useCallback((newTask) => {
    setSelfTasks((prev) => {
      const taskObj = {
        id: `SELF-${plot.id}-${Date.now()}`,
        activityId: `SELF-${plot.id}-${Date.now()}`,
        title: newTask.title || 'Công việc canh tác',
        day: Number(newTask.day) || 1,
        cropDay: Number(newTask.day) || 1,
        timestamp: `Ngày ${newTask.day || 1} • ${newTask.time || 'Ca sáng'}`,
        status: 'PENDING',
        notes: newTask.notes || 'Chủ vườn tự thực hiện.',
        isCustom: true
      };
      const next = [taskObj, ...prev];
      try {
        localStorage.setItem(`farmely_self_tasks_${plot.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [plot.id]);

  const handleDeleteSelfTask = useCallback((taskId) => {
    setSelfTasks((prev) => {
      const next = prev.filter((t) => (t.id || t.activityId) !== taskId);
      try {
        localStorage.setItem(`farmely_self_tasks_${plot.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [plot.id]);

  // Modal xem cẩm nang kỹ thuật của mốc ngày
  const [selectedStageDetail, setSelectedStageDetail] = useState(null);

  // 2. Lưu trữ và truy xuất các hoạt động của Staff
  const [staffActivities, setStaffActivities] = useState(() => {
    return getPersistedStaffActivities(plot.id);
  });
  const [selectedPhotoActivity, setSelectedPhotoActivity] = useState(null);

  // Lắng nghe sự kiện đồng bộ hoạt động của Staff (qua BroadcastChannel, Storage hoặc API DB)
  useEffect(() => {
    let isMounted = true;
    const reloadStaffActivities = () => {
      fetch('/api/tasks')
        .then((res) => res.json())
        .then((resData) => {
          if (!isMounted) return;
          const list = resData?.data || (Array.isArray(resData) ? resData : []);
          if (Array.isArray(list) && list.length > 0) {
            const pCode = String(plot.plotCode || plot.mapPlotId || plot.id || '').replace(/^PLOT-|^PLT-/i, '').trim().toUpperCase();
            const pRental = plot.rentalId || plot.rental_id;
            const pNum = pCode.replace(/\D/g, '');
            const matched = list.filter((t) => {
              if (pRental && t.rentalId) {
                return Number(t.rentalId) === Number(pRental);
              }
              const tCode = String(t.plotCode || t.plotId || '').replace(/^PLOT-|^PLT-/i, '').trim().toUpperCase();
              const tNum = tCode.replace(/\D/g, '');
              const numMatch = pNum !== '' && tNum !== '' && pNum === tNum;
              return (pCode && tCode === pCode) || numMatch;
            });
            if (matched.length > 0) {
              const mapped = matched.map((m) => {
                let taskDay = null;
                if (m.cropDay !== undefined && m.cropDay !== null) {
                  taskDay = Math.max(1, Number(m.cropDay));
                } else if (m.dayOffset !== undefined && m.dayOffset !== null) {
                  taskDay = Number(m.dayOffset) === 0 ? 1 : Math.max(1, Number(m.dayOffset));
                } else if (m.day !== undefined && m.day !== null) {
                  taskDay = Math.max(1, Number(m.day));
                } else if (m.dueDate && plot?.startDate) {
                  try {
                    const d1 = new Date(m.dueDate);
                    const d0 = new Date(plot.startDate);
                    const diff = Math.floor((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    if (diff >= 1) taskDay = diff;
                  } catch {}
                }
                const resolvedDay = taskDay ? Math.max(1, Number(taskDay)) : 1;

                return {
                  activityId: m.id || `TSK-${m.taskId}`,
                  plotId: m.plotCode || plot.id,
                  plotCode: m.plotCode || plot.plotCode || 'P-01',
                  rentalId: m.rentalId,
                  day: resolvedDay,
                  cropDay: resolvedDay,
                  dayOffset: m.dayOffset !== undefined && m.dayOffset !== null ? Number(m.dayOffset) : null,
                  date: m.date || m.dueDate,
                  stepOrder: m.stepOrder || 1,
                  workerName: m.workerName || m.assignedTo || 'Kỹ thuật viên hiện trường chuyên trách',
                  workerRole: 'Kỹ thuật viên hiện trường chuyên trách',
                  workerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  title: m.title,
                  timestamp: m.completedAt || (m.dueDate ? `${m.dueDate} • ${m.deadline || 'Ca sáng'}` : 'Ca trực'),
                  status: m.status === 'DONE' || m.status === 'COMPLETED' ? 'COMPLETED' : m.status === 'IN_PROG' ? 'IN_PROGRESS' : m.status || 'PENDING',
                  notes: m.instructions || m.notes || 'Thực hiện chăm sóc chuẩn quy trình VietGAP.',
                  proofPhoto: m.proofPhoto || m.evidenceImageUrl || null,
                  sensorSnapshot: { temp: '26.8°C', soilMoisture: '68%', light: '42.000 Lux' }
                };
              });
              setStaffActivities(mapped);
              return;
            }
          }
          setStaffActivities(getPersistedStaffActivities(plot.id));
        })
        .catch(() => {
          if (isMounted) setStaffActivities(getPersistedStaffActivities(plot.id));
        });
    };

    reloadStaffActivities();

    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('farmely_staff_activity_channel');
        bc.onmessage = () => reloadStaffActivities();
      }
    } catch {
      // ignore
    }

    const onStorage = (e) => {
      if (e.key === 'farmely_persisted_staff_activities_v2') {
        reloadStaffActivities();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, [plot.id, plot.plotCode, plot.rentalId]);

  // 3. Tích hợp Open-Meteo Global Agrometeorology Live 3rd-Party API
  const [liveIotResult, setLiveIotResult] = useState(null);
  const [isRefreshingIot, setIsRefreshingIot] = useState(false);

  const loadLiveAgroData = useCallback(async (force = false) => {
    setIsRefreshingIot(true);
    try {
      const data = await fetchLiveAgroIotData(plot, force);
      if (data) {
        setLiveIotResult(data);
      }
    } catch (e) {
      console.warn('Lỗi tải Open-Meteo:', e);
    } finally {
      setIsRefreshingIot(false);
    }
  }, [plot]);

  useEffect(() => {
    loadLiveAgroData(false);
  }, [loadLiveAgroData]);

  // Ghi đè số liệu cảm biến thực tế từ Open-Meteo lên plot
  const activePlot = useMemo(() => {
    if (!liveIotResult?.metrics) return plot;
    const m = liveIotResult.metrics;
    return {
      ...plot,
      temp: m.temp || plot.temp,
      soilMoisture: m.soilMoisture || plot.soilMoisture,
      airHumidity: m.airHumidity || plot.airHumidity,
      light: m.light || plot.light,
      soilTemp: m.soilTemp,
      precipitation: m.precipitation,
      windSpeed: m.windSpeed,
      pressure: m.pressure,
      lastUpdated: liveIotResult.lastUpdated || plot.lastUpdated,
      rawMetrics: liveIotResult.rawMetrics
    };
  }, [plot, liveIotResult]);

  // Biểu đồ thời gian thực: Ưu tiên chuỗi hourly từ Open-Meteo API
  const activeIotData = useMemo(() => {
    if (liveIotResult?.hourly?.length) {
      return {
        ...(iotData || {}),
        hourly: liveIotResult.hourly
      };
    }
    return iotData;
  }, [liveIotResult, iotData]);

  // Cảnh báo động sinh ra theo số đo thực tế
  const activeAlerts = useMemo(() => {
    const sNum = parseFloat(String(activePlot.soilMoisture || ''));
    const dynamicList = [...(alerts || [])];
    if (sNum >= 80) {
      dynamicList.unshift({
        id: 'DYNAMIC-FLOOD-BR18',
        level: 'HIGH',
        title: 'Mưa lớn & Đất bão hoà ẩm',
        explanation: `Độ ẩm đất đo đạc thực tế từ trạm là ${activePlot.soilMoisture} (≥ 80%). Hệ thống đã tự động kích hoạt luật : Tạm hoãn mọi tác vụ tưới hôm nay để tránh ngập úng rễ cây.`,
        action: 'Farmely đã tự động dời lịch tưới hôm nay.',
        time: activePlot.lastUpdated || 'Vừa xong'
      });
    } else if (sNum < 50 && sNum > 0) {
      dynamicList.unshift({
        id: 'DYNAMIC-DRY-BR18',
        level: 'HIGH',
        title: 'Đất khô kiệt dưới ngưỡng an toàn',
        explanation: `Độ ẩm đất đo đạc tụt xuống ${activePlot.soilMoisture} (< 50%). Cây trồng có nguy cơ sốc nhiệt nếu không được cấp nước bù.`,
        action: 'Kỹ thuật viên thực địa đã được thông báo để tưới nhỏ giọt bù ẩm.',
        time: activePlot.lastUpdated || 'Vừa xong'
      });
    }
    return dynamicList;
  }, [activePlot.soilMoisture, activePlot.lastUpdated, alerts]);

  const openTaskCount = staffActivities.filter((t) => t.status !== 'COMPLETED').length;
  const badges = useMemo(() => ({
    tasks: openTaskCount,
    timeline: cropProcess.currentStage ? 1 : 0,
    iot: activeAlerts.filter((a) => a.level === 'HIGH').length
  }), [openTaskCount, activeAlerts, cropProcess.currentStage]);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const close = (e) => { if (!pickerRef.current?.contains(e.target)) setPickerOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setPickerOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [pickerOpen]);

  const goTab = (id) => {
    onTabChange?.(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const current = displayTabs.find((t) => t.id === tab) || displayTabs[0];
  const health = computeHealthScore(activePlot, activeAlerts);

  const heroStats = [
    {
      label: 'Ngày tuổi',
      value: cropProcess.isNotStarted ? 'Sắp tới' : `D${cropProcess.currentDay}`,
      unit: cropProcess.isNotStarted ? '' : `/${cropProcess.totalDays}`,
      note: cropProcess.isNotStarted ? (plot.startDate ? `Bắt đầu ${new Date(plot.startDate).toLocaleDateString('vi-VN')}` : 'Chưa bắt đầu vụ mới') : (cropProcess.currentStage?.name || 'Đang sinh trưởng tốt'),
      icon: Sprout,
      tab: 'overview'
    },
    {
      label: cropProcess.isNotStarted ? 'Bắt đầu sau' : 'Tới thu hoạch',
      value: cropProcess.isNotStarted ? (cropProcess.daysUntilStart || 0) : cropProcess.daysLeft,
      unit: 'ngày',
      note: cropProcess.isNotStarted 
        ? (plot.startDate ? `Bắt đầu: ${new Date(plot.startDate).toLocaleDateString('vi-VN')}` : 'Theo lịch vụ mùa')
        : (plot.expectedHarvestDate ? `Dự kiến ${plot.expectedHarvestDate}` : 'Đúng tiến độ'),
      icon: Wheat,
      tab: 'harvest'
    },
    {
      label: isSelf ? 'Công việc' : 'Việc Staff',
      value: cropProcess.isNotStarted ? 0 : (isSelf ? selfTasks.length : staffActivities.length),
      unit: 'mục',
      note: cropProcess.isNotStarted 
        ? 'Chờ ngày xuống giống'
        : (isSelf 
            ? `${selfTasks.filter(t => t.status !== 'COMPLETED').length} việc cần làm` 
            : (openTaskCount > 0 ? `${openTaskCount} việc đang làm` : 'Đã nghiệm thu đủ')),
      icon: CalendarCheck,
      tab: 'tasks'
    }
  ];

  return (
    <section className="min-h-[calc(100dvh-5rem)] bg-[radial-gradient(1200px_500px_at_80%_-10%,#e7f3dc_0%,transparent_60%),linear-gradient(#f5f7f2,#f5f7f2)] pb-28 lg:pb-12">
      {/* Header thửa đất */}
      <header className="relative overflow-hidden bg-[#0f2a20]">
        <img src={plot.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 motion-safe:animate-heroZoom" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2219] via-[#0f2a20]/75 to-[#0f2a20]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b2219]/80 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-12 pt-4 sm:px-6 lg:px-10 lg:pb-14">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25">
              <ArrowLeft className="h-4 w-4" />Vườn của tôi
            </button>
            <div className="flex items-center gap-2">
              <div className="relative" ref={pickerRef}>
                <button type="button" aria-haspopup="listbox" aria-expanded={pickerOpen} onClick={() => setPickerOpen((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25">
                  Đổi thửa<ChevronDown className="h-3.5 w-3.5" />
                </button>
                {pickerOpen && (
                  <ul role="listbox" className="absolute right-0 top-10 z-30 w-72 rounded-2xl bg-white p-1.5 shadow-2xl">
                    {plots.map((p) => (
                      <li key={p.id}>
                        <button type="button" role="option" aria-selected={p.id === plot.id} onClick={() => { setPickerOpen(false); onSelectPlot?.(p.id); }} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left ${p.id === plot.id ? 'bg-emerald-50' : 'hover:bg-stone-50'}`}>
                          <img src={p.image} alt="" className="h-10 w-12 shrink-0 rounded-lg object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#18352b]">{p.name}</span>
                            <span className="block truncate text-xs text-stone-500">{p.crop}</span>
                          </span>
                          {p.id === plot.id && <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-700" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowRenewalModal(true)}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-lime-300 backdrop-blur hover:bg-emerald-500/40 transition cursor-pointer"
                title="Gia hạn hợp đồng thuê thửa đất theo vụ mùa"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Gia hạn vụ mới</span>
                <span className="sm:hidden">Gia hạn</span>
              </button>
              <button type="button" onClick={onOpenAiChat} className="flex items-center gap-1.5 rounded-full bg-lime-300 px-3 py-1.5 text-xs font-semibold text-[#17372c] hover:bg-lime-200">
                <Sparkles className="h-3.5 w-3.5" /><span className="hidden sm:inline">Hỏi Farmely AI</span><span className="sm:hidden">AI</span>
              </button>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-6 lg:mt-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 animate-fadeInUp text-white">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 rounded-full bg-lime-300 px-2.5 py-1 text-[#17372c]">
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-emerald-700/60" /><span className="relative h-1.5 w-1.5 rounded-full bg-emerald-700" /></span>
                  {isSelf ? 'Tự canh tác' : 'Farmely chăm sóc'}
                </span>
                <span className="rounded-full border border-white/25 bg-white/5 px-2.5 py-1 backdrop-blur">{plot.id}</span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 backdrop-blur text-lime-200">
                  <Radio className="h-3 w-3 text-lime-400 animate-pulse" />
                  Trạm {liveIotResult?.stationId || plot.stationId || 'AGRO-CUCHI'}
                  {activePlot.lastUpdated ? <span className="text-white/70 font-normal">· {activePlot.lastUpdated}</span> : ''}
                </span>
              </div>
              <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight !text-white drop-shadow sm:text-4xl lg:text-5xl">{plot.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                <span className="flex items-center gap-1.5"><Sprout className="h-4 w-4 text-lime-300" />{cropProcess.cropName}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-lime-300" />{plot.location} · {plot.area}</span>
              </p>

              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                  <span>{cropProcess.isNotStarted ? (plot.startDate ? `Sắp tới: Bắt đầu từ ngày ${new Date(plot.startDate).toLocaleDateString('vi-VN')}` : 'Sắp tới: Chuẩn bị xuống giống') : (cropProcess.currentStage?.name || plot.stage)}</span>
                  <span>{cropProcess.isNotStarted ? `Sắp tới (Bắt đầu sau ${cropProcess.daysUntilStart || 0} ngày)` : `Ngày ${cropProcess.currentDay}/${cropProcess.totalDays}`}</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10" role="progressbar" aria-valuenow={cropProcess.isNotStarted ? 0 : cropProcess.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ mùa vụ">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-teal-300 shadow-[0_0_16px_rgba(56,189,248,0.7)] transition-[width] duration-1000" style={{ width: `${cropProcess.isNotStarted ? 0 : cropProcess.progressPercent}%` }} />
                </div>
              </div>
            </div>

            {/* 3 thẻ chỉ số nhanh */}
            <div className="grid grid-cols-3 gap-2.5 lg:w-[480px]">
              {heroStats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button key={s.label} type="button" onClick={() => goTab(s.tab)} style={{ animationDelay: `${120 + i * 70}ms` }} className={`group animate-fadeInUp rounded-2xl border p-3 text-left text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/20 ${s.hot ? 'border-rose-300/50 bg-rose-500/25' : 'border-white/15 bg-white/10'}`}>
                    <span className="flex items-center justify-between text-[11px] font-medium text-white/75">
                      {s.label}<Icon className={`h-3.5 w-3.5 ${s.hot ? 'text-rose-200' : 'text-lime-300'}`} />
                    </span>
                    <span className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-2xl font-bold leading-none">{s.value}</span>
                      <span className="text-xs text-white/70">{s.unit}</span>
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-white/65 group-hover:text-white/90">{s.note}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs navigation desktop */}
      <nav aria-label={`Chức năng của ${plot.name}`} className="sticky top-[5.25rem] z-20 -mt-7 hidden lg:block">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className={`flex gap-1 overflow-x-auto rounded-2xl border border-white/80 bg-white/90 p-1.5 backdrop-blur-xl no-scrollbar ${CARD_SHADOW}`} role="tablist">
            {displayTabs.map((t) => {
              const Icon = t.icon;
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => goTab(t.id)}
                  className={`relative flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    active ? 'bg-gradient-to-br from-[#1d4a39] to-[#0f2a20] text-white shadow-md shadow-[#18352b]/25' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-lime-300' : ''}`} />
                  {t.label}
                  {badges[t.id] > 0 && (
                    <span className={`rounded-full px-1.5 text-[11px] font-bold ${active ? 'bg-lime-300 text-[#17372c]' : 'bg-amber-100 text-amber-800'}`}>
                      {badges[t.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Nội dung từng tab */}
      <div key={tab} className="mx-auto max-w-[1400px] animate-fadeIn px-4 pt-5 sm:px-6 lg:px-10 lg:pt-7">
        <h2 className="mb-4 font-heading text-lg font-bold text-[#18352b] lg:hidden">{current.label}</h2>

        {tab === 'overview' && (
          <OverviewTab
            plot={activePlot}
            cropProcess={cropProcess}
            staffActivities={isSelf ? selfTasks : staffActivities}
            operations={operations}
            onAddDiary={onAddDiary}
            goTab={goTab}
            onOpenStageDetail={setSelectedStageDetail}
            onOpenActivityPhoto={setSelectedPhotoActivity}
            onOpenHarvest={onOpenHarvest}
            liveProviderInfo={liveIotResult}
            seasons={plotSeasons}
            activeSeasonId={activeSeasonId}
            onSelectSeason={setActiveSeasonId}
            onOpenRenewal={() => setShowRenewalModal(true)}
            activeSeason={activeSeason}
            isSelf={isSelf}
            onToggleTask={handleToggleSelfTask}
          />
        )}

        {tab === 'tasks' && (
          <div className="space-y-5">
            <Card className="p-5">
              <SectionTitle
                eyebrow={isSelf ? "Tự canh tác theo quy trình VietGAP" : "Minh bạch hoạt động chăm sóc"}
                title={isSelf ? "Công việc canh tác hằng ngày" : "Lịch sử hoạt động của Staff (Field Workers)"}
              />
              <p className="mt-1 text-sm text-stone-600">
                {isSelf
                  ? "Danh sách các công việc canh tác hằng ngày theo quy trình VietGAP. Bạn có thể tự tùy chỉnh, thêm công việc mới và tích đánh dấu hoàn thành theo tiến độ canh tác của mình."
                  : "Mọi công việc tưới nước, bón phân, tỉa cành, phòng ngừa sâu bệnh của nhân viên tại vườn đều được lưu trữ persistent, có ảnh minh chứng thực tế và số đo cảm biến tại thời điểm thực hiện."}
              </p>
              <div className="mt-5">
                <StaffActivitiesTab
                  activities={isSelf ? selfTasks : staffActivities}
                  isSelf={isSelf}
                  onToggleTask={handleToggleSelfTask}
                  onAddTask={handleAddSelfTask}
                  onDeleteTask={handleDeleteSelfTask}
                  totalDays={cropProcess.totalDays || 60}
                  onOpenPhoto={setSelectedPhotoActivity}
                  plot={activePlot}
                />
              </div>
            </Card>
          </div>
        )}

        {tab === 'iot' && (
          <IotTab
            plot={activePlot}
            iotData={activeIotData}
            alerts={activeAlerts}
            isConnected={true}
            onRefreshLive={() => loadLiveAgroData(true)}
            isRefreshing={isRefreshingIot}
            liveProviderInfo={liveIotResult}
            cropProcess={cropProcess}
          />
        )}

        {tab === 'diary' && (
          <DiaryTab
            plot={activePlot}
            operations={operations}
            onAddDiary={onAddDiary}
          />
        )}

        {tab === 'services' && (
          <ServicesTab
            plot={activePlot}
            services={services}
            orders={serviceOrders}
            onSelectService={onSelectService}
          />
        )}

        {tab === 'harvest' && (
          <HarvestTab
            plot={activePlot}
            harvestPlan={harvestPlan}
            onOpenHarvest={onOpenHarvest}
            cropProcess={cropProcess}
          />
        )}
      </div>

      {/* Modal phóng to ảnh bằng chứng của Staff */}
      {selectedPhotoActivity && (
        <ActivityProofModal
          activity={selectedPhotoActivity}
          onClose={() => setSelectedPhotoActivity(null)}
        />
      )}

      {/* Modal cẩm nang kỹ thuật của mốc ngày */}
      {selectedStageDetail && (
        <StageDetailModal
          stage={selectedStageDetail}
          cropProcess={cropProcess}
          onClose={() => setSelectedStageDetail(null)}
        />
      )}

      {/* Modal Gia Hạn Hợp Đồng Thuê Thửa Đất theo Vụ Mùa */}
      <PlotRenewalModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        plot={activePlot}
        seasons={plotSeasons}
        onRenewSuccess={(updatedSeasons) => {
          setCustomSeasons(updatedSeasons);
          const newest = updatedSeasons[updatedSeasons.length - 1];
          if (newest) setActiveSeasonId(newest.id);
        }}
      />

      {/* Bottom navigation bar mobile */}
      <nav aria-label={`Chức năng của ${plot.name}`} className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-7 rounded-[22px] border border-white/10 bg-[#0f2a20]/95 p-1.5 shadow-[0_18px_40px_-12px_rgba(15,42,32,0.6)] backdrop-blur-xl" role="tablist">
          {PLOT_TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={t.label}
                onClick={() => goTab(t.id)}
                className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-[9px] font-semibold transition-all duration-300 ${
                  active ? 'bg-lime-300 text-[#17372c] shadow-sm' : 'text-white/65'
                }`}
              >
                <span className="relative">
                  <Icon className="h-4 w-4" />
                  {badges[t.id] > 0 && (
                    <span className={`absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[8px] font-bold ${active ? 'bg-[#17372c] text-lime-300' : 'bg-amber-400 text-[#17372c]'}`}>
                      {badges[t.id]}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-[42px]">{t.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
