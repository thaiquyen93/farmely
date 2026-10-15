import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea } from 'recharts';
import { assessMetric, summarizePlot, explainAlert, describeSeries, computeHealthScore, METRIC_RULES } from '../../utils/iotInsights';
import { useSensorStream } from '../../api/monitoring/useSensorStream';
import {
  AlertTriangle, ArrowLeft, BookOpen, CalendarCheck, Check, ChevronDown, ChevronRight, CircleDot,
  Clock3, Droplets, LayoutDashboard, Leaf, MapPin, PenLine, Radio, ShoppingBag, Sparkles, Sprout,
  Sun, Thermometer, Truck, UserRound, Wheat, Wind
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
   Không gian làm việc của MỘT thửa đất.
   Mọi tab (Công việc, IoT, Nhật ký, Dịch vụ, Thu hoạch) chỉ hiện dữ liệu của
   đúng thửa đang mở — người dùng không bao giờ bị đẩy sang trang gộp tất cả thửa.
   ────────────────────────────────────────────────────────────────────────── */

export const PLOT_TABS = [
  { id: 'overview', label: 'Tổng quan', short: 'Tổng quan', icon: LayoutDashboard },
  { id: 'tasks', label: 'Công việc', short: 'Việc', icon: CalendarCheck },
  { id: 'iot', label: 'IoT & môi trường', short: 'IoT', icon: Radio },
  { id: 'diary', label: 'Nhật ký', short: 'Nhật ký', icon: BookOpen },
  { id: 'services', label: 'Dịch vụ', short: 'Dịch vụ', icon: ShoppingBag },
  { id: 'harvest', label: 'Thu hoạch', short: 'Thu hoạch', icon: Wheat }
];

// Ngưỡng / đơn vị / câu giải thích nằm trong utils/iotInsights — ở đây chỉ là phần hiển thị
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

const ALERT_TONE = {
  HIGH: { label: 'Cao', box: 'border-rose-200 bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500' },
  MEDIUM: { label: 'Trung bình', box: 'border-amber-200 bg-amber-50', text: 'text-amber-900', dot: 'bg-amber-500' },
  LOW: { label: 'Thấp', box: 'border-sky-200 bg-sky-50', text: 'text-sky-900', dot: 'bg-sky-500' }
};

const TASK_STATUS = {
  IN_PROGRESS: { label: 'Đang làm', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  PENDING: { label: 'Sắp tới', chip: 'bg-stone-100 text-stone-700', dot: 'bg-stone-400' },
  COMPLETED: { label: 'Đã xong', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' }
};

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(24,53,43,0.04),0_12px_32px_-16px_rgba(24,53,43,0.22)]';

function Card({ className = '', children, style }) {
  return <div style={style} className={`rounded-3xl border border-white/80 bg-white ${CARD_SHADOW} ${className}`}>{children}</div>;
}

/* ─────────────────────────── Đồ hoạ SVG ─────────────────────────── */

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const arcPath = (cx, cy, r, start, end) => {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x2} ${y2}`;
};

/**
 * Đồng hồ cung 240°: phần xanh nhạt ở giữa = vùng an toàn, cung màu = giá trị hiện tại.
 * position (0..1) đến từ assessMetric — vùng an toàn luôn nằm ở 0.25..0.75.
 */
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

/** Vòng điểm sức khoẻ 0–100 */
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

/* ─────────────────────────────── Tabs ─────────────────────────────── */

function TaskRow({ task, onOpen }) {
  const s = TASK_STATUS[task.status] || TASK_STATUS.PENDING;
  const done = task.status === 'COMPLETED';
  return (
    <button type="button" onClick={() => onOpen?.(task)} className="group flex w-full items-center gap-3 rounded-2xl bg-[#f6f8f3] p-3 text-left ring-1 ring-transparent transition hover:bg-white hover:shadow-md hover:ring-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${done ? 'bg-emerald-100 text-emerald-700' : task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-white text-stone-500 ring-1 ring-stone-200'}`} aria-hidden="true">
        {done ? <Check className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${done ? 'text-stone-400 line-through' : 'text-[#18352b]'}`}>{task.title}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-stone-500"><Clock3 className="h-3.5 w-3.5" />{task.time} · {task.owner}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.chip}`}>{s.label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-emerald-600" />
    </button>
  );
}

function SeasonTimeline({ stages = [] }) {
  if (!stages.length) return null;
  return (
    <ol className="relative space-y-4 pl-6 sm:flex sm:space-y-0 sm:pl-0">
      {stages.map((st, i) => {
        const done = st.status === 'COMPLETED';
        const current = st.status === 'IN_PROGRESS';
        return (
          <li key={st.stage} className="relative sm:flex-1 sm:pr-4" aria-current={current ? 'step' : undefined}>
            {i < stages.length - 1 && (
              <span aria-hidden="true" className={`absolute -left-[17px] top-6 h-[calc(100%-8px)] w-0.5 sm:left-6 sm:top-[11px] sm:h-0.5 sm:w-[calc(100%-24px)] ${done ? 'bg-emerald-500' : 'bg-stone-200'}`} />
            )}
            <span className={`absolute -left-6 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 sm:relative sm:left-0 sm:top-0 ${done ? 'border-emerald-600 bg-emerald-600 text-white' : current ? 'border-emerald-600 bg-white text-emerald-700 ring-4 ring-emerald-100' : 'border-stone-200 bg-white text-stone-400'}`}>
              {current && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />}
              {done ? <Check className="relative h-3.5 w-3.5" /> : <CircleDot className="relative h-3.5 w-3.5" />}
            </span>
            <p className={`text-sm font-semibold sm:mt-2 ${current ? 'text-emerald-800' : done ? 'text-[#18352b]' : 'text-stone-500'}`}>{st.stage}</p>
            <p className="text-xs text-stone-500">{st.date}</p>
            {current && <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900 sm:mr-2">{st.guide}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** Thẻ 1 chỉ số: đồng hồ cung + giá trị · trong/vượt ngưỡng · nghĩa là gì · cần làm gì */
function ReadingCard({ metric, plot, onClick, active = false, showAction = true, delay = 0 }) {
  const Icon = metric.icon;
  const reading = assessMetric(metric.key, plot[metric.key], plot.mode);
  const s = LEVEL_STYLE[reading.level];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button', onClick, 'aria-pressed': active } : {})}
      aria-label={`${reading.label}: ${plot[metric.key] ?? 'chưa có'} — ${reading.chip}. ${reading.meaning}`}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex animate-fadeInUp flex-col overflow-hidden rounded-3xl border bg-white p-4 text-left transition duration-300 ${CARD_SHADOW} ${
        active ? 'border-transparent ring-2' : 'border-white/80'
      } ${onClick ? 'hover:-translate-y-1 hover:shadow-[0_20px_40px_-18px_rgba(24,53,43,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400' : ''}`}
    >
      {/* Quầng màu theo chỉ số ở góc thẻ */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.12] blur-2xl transition-opacity group-hover:opacity-25" style={{ backgroundColor: metric.color }} />
      {active && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-inset" style={{ '--tw-ring-color': metric.color }} />}

      <div className="relative flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${metric.color}cc, ${metric.color})` }}><Icon className="h-[18px] w-[18px]" /></span>
          {reading.label}
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.chip}`}>{reading.chip}</span>
      </div>

      <div className="relative mt-2">
        <ArcGauge position={reading.position} color={metric.color} levelColor={s.hex}>
          <span className={`whitespace-nowrap font-bold leading-none tracking-tight text-[#18352b] ${String(plot[metric.key] ?? '').length > 7 ? 'text-base' : 'text-[22px]'}`}>{plot[metric.key] ?? '—'}</span>
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

/**
 * Thẻ "sức khoẻ" chính: vòng điểm 0–100 + 1 câu tóm tắt + 4 chấm trạng thái chỉ số.
 * Nền xanh đậm có hoạ tiết để làm điểm nhấn của trang.
 */
function HealthHero({ plot, alerts = [], onMore }) {
  const summary = summarizePlot(plot, alerts);
  const health = computeHealthScore(plot, alerts);
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123b2c] via-[#18493a] to-[#0f2a20] p-5 text-white sm:p-6 ${CARD_SHADOW}`}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime-300/20 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]">
        <defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#fff" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <HealthRing score={health.score} tone={health.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-200/90">Sức khoẻ thửa đất</p>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">{health.label}</span>
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

/** Cảnh báo đã được "dịch": chuyện gì xảy ra · ảnh hưởng gì · ai làm gì */
const ALERT_ACCENT = { HIGH: '#e11d48', MEDIUM: '#f59e0b', LOW: '#0284c7' };

function AlertCard({ alert, mode, compact = false, onMore }) {
  const t = ALERT_TONE[alert.level] || ALERT_TONE.MEDIUM;
  const accent = ALERT_ACCENT[alert.level] || ALERT_ACCENT.MEDIUM;
  const e = explainAlert(alert, mode);
  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-white p-4 pl-5 sm:p-5 sm:pl-6 ${CARD_SHADOW}`} style={{ borderColor: `${accent}33` }} role="status">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: accent }} />
      <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-10 blur-2xl" style={{ backgroundColor: accent }} />
      <div className="relative flex items-start gap-3 sm:gap-4">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: accent }}>
          {alert.level === 'HIGH' && <span className="absolute inset-0 animate-ping rounded-2xl opacity-30" style={{ backgroundColor: accent }} />}
          <AlertTriangle className="relative h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-base font-semibold text-[#18352b]">{e.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.box} ${t.text} border`}>{e.levelText}</span>
          </div>
          <p className="mt-1 text-sm text-stone-600">{e.explanation}</p>
          <p className="mt-3 inline-flex items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 ring-1 ring-emerald-100">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{e.action}
          </p>
          {!compact && <p className="mt-2 text-xs text-stone-500">Số đo: {e.detail} · {e.time}</p>}
        </div>
        {onMore && (
          <button type="button" onClick={onMore} className="hidden shrink-0 items-center gap-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-[#18352b] transition hover:bg-stone-50 sm:flex">
            Xem IoT<ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ plot, operations, iotData, alerts, stages, harvestPlan, goTab, onOpenTask, onOpenHarvest }) {
  const openTasks = operations.tasks.filter((t) => t.status !== 'COMPLETED');
  const topAlert = alerts.find((a) => a.level === 'HIGH');
  const daysLeft = Math.max(plot.totalDays - plot.currentDay, 0);

  const seasonPct = Math.min(100, Math.round((plot.currentDay / Math.max(plot.totalDays, 1)) * 100));

  return (
    <div className="space-y-5">
      <HealthHero plot={plot} alerts={alerts} onMore={() => goTab('iot')} />
      {topAlert && <AlertCard alert={topAlert} mode={plot.mode} compact onMore={() => goTab('iot')} />}

      <section aria-label="Chỉ số môi trường">
        <div className="mb-3 flex items-end justify-between">
          <h3 className="font-heading text-lg font-bold text-[#18352b]">Môi trường quanh cây</h3>
          <LinkButton onClick={() => goTab('iot')}>Xem biểu đồ</LinkButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((m, i) => (
            <ReadingCard key={m.key} metric={m} plot={plot} delay={i * 70} onClick={() => goTab('iot')} />
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <SectionTitle eyebrow={`${openTasks.length} việc còn lại`} title="Việc sắp tới" action={<LinkButton onClick={() => goTab('tasks')}>Tất cả</LinkButton>} />
          <div className="mt-4 space-y-2">
            {openTasks.length ? openTasks.slice(0, 3).map((t) => <TaskRow key={t.id} task={t} onOpen={onOpenTask} />)
              : <EmptyState icon={Check} title="Không còn việc nào" note="Mọi công việc của thửa này đã hoàn thành." />}
          </div>
        </Card>

        {/* Đếm ngược thu hoạch — nền sáng ấm để tách khỏi khối xanh phía trên */}
        <div className={`relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[#f7fbe9] via-[#eef7d6] to-[#e2f0c4] p-5 ${CARD_SHADOW}`}>
          <Wheat aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 rotate-12 text-lime-600/10" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-800">Vụ mùa</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="#d9e8b8" strokeWidth="9" fill="none" />
                <circle cx="50" cy="50" r="42" stroke="#4d7c0f" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - seasonPct / 100)} className="transition-[stroke-dashoffset] duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold leading-none text-[#18352b]">{daysLeft}</span>
                <span className="text-[10px] font-semibold text-lime-800">ngày nữa</span>
              </div>
            </div>
            <dl className="min-w-0 space-y-1.5 text-sm">
              <div><dt className="text-xs text-lime-900/70">Ngày thu hoạch dự kiến</dt><dd className="font-semibold text-[#18352b]">{plot.expectedHarvestDate}</dd></div>
              <div><dt className="text-xs text-lime-900/70">Sản lượng ước tính</dt><dd className="font-semibold text-[#18352b]">{plot.expectedYield}</dd></div>
            </dl>
          </div>
          {harvestPlan && (
            <p className="relative mt-4 flex items-center gap-1.5 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-800 backdrop-blur">
              <Check className="h-4 w-4" />Đã đăng ký thu hoạch · Chờ kỹ sư xác nhận
            </p>
          )}
          <button type="button" onClick={() => onOpenHarvest?.(plot)} className="relative mt-auto pt-4">
            <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#18352b] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#18352b]/20 transition hover:-translate-y-0.5 hover:bg-[#0f2a20]">
              <Wheat className="h-4 w-4" />{harvestPlan ? 'Xem / sửa kế hoạch' : 'Chuẩn bị thu hoạch'}
            </span>
          </button>
        </div>
      </div>

      <Card className="p-5">
        <SectionTitle eyebrow={`Giai đoạn hiện tại · ${plot.stage}`} title="Tiến trình mùa vụ" />
        <div className="mt-5"><SeasonTimeline stages={stages} /></div>
      </Card>

      <Card className="p-5">
        <SectionTitle eyebrow="Hoạt động gần đây" title="Nhật ký mới nhất" action={<LinkButton onClick={() => goTab('diary')}>Xem nhật ký</LinkButton>} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {operations.diary.length ? operations.diary.slice(0, 2).map((e, i) => (
            <div key={`${e.time}-${e.title}`} className="flex gap-3 rounded-2xl bg-[#f6f8f3] p-4 ring-1 ring-stone-100">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${i === 0 ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 ring-1 ring-emerald-100'}`}>
                {i === 0 ? <Leaf className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-stone-500">{e.time} · {e.author}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#18352b]">{e.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-stone-600">{e.note}</p>
              </div>
            </div>
          )) : <EmptyState title="Chưa có nhật ký" />}
        </div>
      </Card>
    </div>
  );
}

function TasksTab({ operations, onOpenTask }) {
  const groups = ['IN_PROGRESS', 'PENDING', 'COMPLETED']
    .map((s) => ({ status: s, items: operations.tasks.filter((t) => t.status === s) }))
    .filter((g) => g.items.length);
  if (!groups.length) return <EmptyState icon={CalendarCheck} title="Chưa có công việc" note="Lịch chăm sóc sẽ hiện ở đây khi kỹ sư lên kế hoạch." />;
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.status}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#18352b]">
            <span className={`h-2 w-2 rounded-full ${TASK_STATUS[g.status].dot}`} />{TASK_STATUS[g.status].label}
            <span className="text-stone-400">({g.items.length})</span>
          </h3>
          <div className="space-y-2">{g.items.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpenTask} />)}</div>
        </section>
      ))}
    </div>
  );
}

function IotTab({ plot, iotData, alerts, isConnected = false }) {
  const [timeframe, setTimeframe] = useState('hourly');
  const [metricKey, setMetricKey] = useState('temp');
  const metric = METRICS.find((m) => m.key === metricKey);
  const rule = METRIC_RULES[metricKey];
  const data = iotData?.[timeframe] || [];
  const seriesSentence = describeSeries(metricKey, data, metric.series);

  return (
    <div className="space-y-5">
      <HealthHero plot={plot} alerts={alerts} />

      {alerts.length > 0 && (
        <section className="space-y-3" aria-label="Cảnh báo">
          {alerts.map((a) => <AlertCard key={a.title} alert={a} mode={plot.mode} />)}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m, i) => <ReadingCard key={m.key} metric={m} plot={plot} delay={i * 70} active={m.key === metricKey} onClick={() => setMetricKey(m.key)} />)}
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Trạm {plot.stationId}</p>
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                  Trực tiếp (SSE) {plot.lastUpdated ? `· ${plot.lastUpdated}` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-400"></span>
                  Đồng bộ tự động {plot.lastUpdated ? `· ${plot.lastUpdated}` : ''}
                </span>
              )}
            </div>
            <h3 className="font-heading text-lg font-bold text-[#18352b]">Biểu đồ {metric.label.toLowerCase()}</h3>
          </div>
          <div className="inline-flex rounded-xl bg-stone-100 p-1" role="tablist" aria-label="Khoảng thời gian">
            {TIMEFRAMES.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={timeframe === t.id} onClick={() => setTimeframe(t.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${timeframe === t.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Chỉ số">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const active = m.key === metricKey;
            return (
              <button key={m.key} type="button" role="tab" aria-selected={active} onClick={() => setMetricKey(m.key)} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-transparent text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'}`} style={active ? { backgroundColor: m.color } : undefined}>
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
                {/* Dải xanh = vùng an toàn, để khách nhìn là biết lúc nào vượt ngưỡng */}
                <ReferenceArea y1={rule.min} y2={rule.max} fill="#10b981" fillOpacity={0.08} stroke="#10b981" strokeOpacity={0.25} strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: 'Vùng an toàn', position: 'insideTopRight', fontSize: 11, fill: '#047857' }} />
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
          ) : <EmptyState icon={Radio} title="Chưa có dữ liệu cảm biến" />}
        </div>
        <p className="mt-2 text-xs text-stone-500">Dải xanh trên biểu đồ là vùng an toàn cho cây: {rule.min}–{rule.max} {metric.unit}.</p>
      </Card>
    </div>
  );
}

function DiaryTab({ plot, operations, onAddDiary }) {
  const canWrite = plot.mode === 'Self-Growing';
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          {canWrite ? 'Bạn tự canh tác thửa này — hãy ghi lại mỗi lần chăm sóc.' : 'Farmely ghi nhật ký cho thửa này, kèm ảnh minh chứng từ người làm vườn.'}
        </p>
        {canWrite && (
          <button type="button" onClick={() => onAddDiary?.(plot)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            <PenLine className="h-4 w-4" />Thêm nhật ký
          </button>
        )}
      </div>
      {operations.diary.length ? (
        <ol className="relative space-y-3 border-l-2 border-emerald-100 pl-5">
          {operations.diary.map((e) => (
            <li key={`${e.time}-${e.title}`} className="relative">
              <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow" aria-hidden="true" />
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-500">{e.time}</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800"><UserRound className="h-3.5 w-3.5" />{e.author}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#18352b]">{e.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{e.note}</p>
              </Card>
            </li>
          ))}
        </ol>
      ) : <EmptyState icon={BookOpen} title="Chưa có nhật ký" />}
    </div>
  );
}

function ServicesTab({ plot, services, orders, onSelectService }) {
  return (
    <div className="space-y-5">
      <section>
        <SectionTitle eyebrow={`Cho ${plot.name}`} title="Đặt dịch vụ" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <button key={s.id} type="button" onClick={() => onSelectService?.(s)} className="group flex flex-col rounded-2xl border border-stone-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
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
      <section>
        <SectionTitle eyebrow={`${orders.length} đơn`} title="Dịch vụ đã đặt cho thửa này" />
        <div className="mt-3 space-y-2">
          {orders.length ? orders.map((o) => (
            <Card key={o.id} className="flex items-center gap-3 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ShoppingBag className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#18352b]">{o.serviceName}</p>
                <p className="truncate text-xs text-stone-500">{o.date} · {o.worker}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-[#18352b]">{o.price}</p>
                <p className="text-xs text-amber-700">{o.statusLabel}</p>
              </div>
            </Card>
          )) : <EmptyState icon={ShoppingBag} title="Chưa đặt dịch vụ nào" note="Các dịch vụ bạn đặt cho thửa này sẽ hiện ở đây." />}
        </div>
      </section>
    </div>
  );
}

function HarvestTab({ plot, harvestPlan, onOpenHarvest }) {
  const daysLeft = Math.max(plot.totalDays - plot.currentDay, 0);
  const planDate = harvestPlan?.date ? harvestPlan.date.split('-').reverse().join('/') : '';
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <SectionTitle eyebrow="Dự kiến" title={daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã đến vụ'} />
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Ngày thu hoạch</dt><dd className="font-semibold text-[#18352b]">{plot.expectedHarvestDate}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Sản lượng</dt><dd className="font-semibold text-[#18352b]">{plot.expectedYield}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Cây trồng</dt><dd className="font-semibold text-[#18352b]">{plot.crop}</dd></div>
          <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">Hợp đồng</dt><dd className="truncate font-semibold text-[#18352b]">{plot.contractCode}</dd></div>
        </dl>
      </Card>
      <Card className="flex flex-col p-5">
        <SectionTitle eyebrow="Kế hoạch của bạn" title={harvestPlan ? 'Đã đăng ký thu hoạch' : 'Chưa đăng ký'} />
        {harvestPlan ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-[#18352b]"><CalendarCheck className="h-4 w-4 text-emerald-700" />Ngày hái: <strong>{planDate}</strong></p>
            <p className="flex items-center gap-2 text-[#18352b]"><Truck className="h-4 w-4 text-emerald-700" />{harvestPlan.methodLabel}</p>
            {harvestPlan.address && <p className="flex items-start gap-2 text-stone-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{harvestPlan.address}</p>}
            <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Chờ kỹ sư xác nhận</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-600">Chọn ngày và cách nhận nông sản. Farmely sẽ nhắc bạn trước 3 ngày.</p>
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

/* ─────────────────────────────── Khung ─────────────────────────────── */

export default function CustomerPlotWorkspace({
  plot, plots, operations, iotData, alerts = [], stages = [], services = [], serviceOrders = [],
  harvestPlan = null, activeTab = 'overview', onTabChange, onSelectPlot, onBack, onOpenAiChat,
  onOpenTask, onSelectService, onOpenHarvest, onAddDiary
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const tab = PLOT_TABS.some((t) => t.id === activeTab) ? activeTab : 'overview';
  const isSelf = plot.mode === 'Self-Growing';

  // Lấy ID số của thửa đất để kết nối vào telemetry stream của trạm cảm biến
  const numericPlotId = useMemo(() => {
    if (!plot) return 1;
    if (plot.plotId) return Number(plot.plotId);
    if (plot.mapPlotId) {
      const m = String(plot.mapPlotId).match(/\d+/);
      if (m) return Number(m[0]);
    }
    const m = String(plot.id || '').match(/\d+/);
    return m ? Number(m[0]) : 1;
  }, [plot]);

  // Luồng dữ liệu cảm biến thời gian thực Server-Sent Events (SSE) liên tục từ monitoring-service
  const { latest, history, isConnected } = useSensorStream(numericPlotId, 24);

  // Ghi đè số liệu cảm biến mới nhất lên plot nếu trạm IoT phát tín hiệu
  const activePlot = useMemo(() => {
    if (!latest) return plot;
    const tempNum = typeof latest.temperature === 'number' ? latest.temperature.toFixed(1) : null;
    const soilNum = typeof latest.soilHumidity === 'number' ? Math.round(latest.soilHumidity) : null;
    const airNum = typeof latest.airHumidity === 'number' ? Math.round(latest.airHumidity) : null;

    const recDate = latest.recordedAt ? new Date(latest.recordedAt) : new Date();
    const hour = !isNaN(recDate.getTime()) ? recDate.getHours() + recDate.getMinutes() / 60 : 12;
    const diff = Math.abs(hour - 12);
    const lightVal = hour >= 6 && hour <= 18 ? Math.round(Math.max(0, 1 - (diff / 6) ** 2) * 50) : 0;
    const lastUpdated = !isNaN(recDate.getTime())
      ? recDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : null;

    return {
      ...plot,
      temp: tempNum !== null ? `${tempNum}°C` : plot.temp,
      soilMoisture: soilNum !== null ? `${soilNum}%` : plot.soilMoisture,
      airHumidity: airNum !== null ? `${airNum}%` : plot.airHumidity,
      light: lightVal > 0 ? `${lightVal}.000 Lux` : '0 Lux',
      lastUpdated
    };
  }, [plot, latest]);

  // Cập nhật mảng lịch sử vẽ biểu đồ thời gian thực từ trạm cảm biến
  const activeIotData = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return iotData;

    // Phân bố đều ~16 điểm biểu diễn biểu đồ gọn gàng và không rối mắt
    const targetPoints = 16;
    let sampled = [];
    if (history.length <= targetPoints) {
      sampled = history;
    } else {
      const step = (history.length - 1) / (targetPoints - 1);
      for (let i = 0; i < targetPoints; i++) {
        sampled.push(history[Math.round(i * step)]);
      }
    }

    const hourlyFromLive = sampled.map((item) => {
      const d = new Date(item.recordedAt);
      const timeStr = !isNaN(d.getTime())
        ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';
      const hour = !isNaN(d.getTime()) ? d.getHours() + d.getMinutes() / 60 : 12;
      const diff = Math.abs(hour - 12);
      const lightVal = hour >= 6 && hour <= 18 ? Math.round(Math.max(0, 1 - (diff / 6) ** 2) * 50) : 0;
      return {
        time: timeStr,
        temp: Number(Number(item.temperature).toFixed(1)),
        moisture: Math.round(Number(item.soilHumidity)),
        airHumidity: Math.round(Number(item.airHumidity)),
        light: lightVal
      };
    });

    return {
      ...(iotData || {}),
      hourly: hourlyFromLive.length > 0 ? hourlyFromLive : (iotData?.hourly || [])
    };
  }, [history, iotData]);

  const openTaskCount = operations.tasks.filter((t) => t.status !== 'COMPLETED').length;
  const badges = useMemo(() => ({ tasks: openTaskCount, iot: alerts.filter((a) => a.level === 'HIGH').length }), [openTaskCount, alerts]);

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

  const current = PLOT_TABS.find((t) => t.id === tab);
  const health = computeHealthScore(activePlot, alerts);
  const daysLeft = Math.max(plot.totalDays - plot.currentDay, 0);
  const heroStats = [
    { label: 'Sức khoẻ', value: health.score ?? '—', unit: '/100', note: health.label, icon: Leaf, tab: 'iot' },
    { label: 'Tới thu hoạch', value: daysLeft, unit: 'ngày', note: plot.expectedHarvestDate, icon: Wheat, tab: 'harvest' },
    { label: 'Việc chưa xong', value: openTaskCount, unit: 'việc', note: openTaskCount ? 'Xem lịch' : 'Đã xong hết', icon: CalendarCheck, tab: 'tasks' },
    { label: 'Cảnh báo', value: alerts.length, unit: 'mục', note: badges.iot ? `${badges.iot} cần xử lý sớm` : 'Không có gì gấp', icon: AlertTriangle, tab: 'iot', hot: badges.iot > 0 }
  ];

  return (
    <section className="min-h-[calc(100dvh-5rem)] bg-[radial-gradient(1200px_500px_at_80%_-10%,#e7f3dc_0%,transparent_60%),linear-gradient(#f5f7f2,#f5f7f2)] pb-28 lg:pb-12">
      {/* Header thửa: ảnh toàn khung + lớp phủ chuyển màu + thẻ chỉ số kính mờ */}
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
                <span className="rounded-full border border-white/25 bg-white/5 px-2.5 py-1 backdrop-blur">Trạm {plot.stationId}</span>
              </div>
              <h1 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight !text-white drop-shadow sm:text-4xl lg:text-5xl">{plot.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                <span className="flex items-center gap-1.5"><Sprout className="h-4 w-4 text-lime-300" />{plot.crop}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-lime-300" />{plot.location} · {plot.area}</span>
              </p>

              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                  <span>{plot.stage}</span><span>Ngày {plot.currentDay}/{plot.totalDays}</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10" role="progressbar" aria-valuenow={plot.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ mùa vụ">
                  <div className="h-full rounded-full bg-gradient-to-r from-lime-300 to-emerald-300 shadow-[0_0_16px_rgba(190,242,100,0.7)] transition-[width] duration-1000" style={{ width: `${plot.progressPercent}%` }} />
                </div>
              </div>
            </div>

            {/* 4 thẻ số liệu kính mờ — bấm để mở đúng tab */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-[560px]">
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

      {/* Tab của thửa — desktop: thanh "viên thuốc" nổi, đè lên mép ảnh và dính khi cuộn */}
      <nav aria-label={`Chức năng của ${plot.name}`} className="sticky top-[5.25rem] z-20 -mt-7 hidden lg:block">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className={`flex gap-1 overflow-x-auto rounded-2xl border border-white/80 bg-white/90 p-1.5 backdrop-blur-xl no-scrollbar ${CARD_SHADOW}`} role="tablist">
            {PLOT_TABS.map((t) => {
              const Icon = t.icon;
              const active = t.id === tab;
              return (
                <button key={t.id} type="button" role="tab" aria-selected={active} onClick={() => goTab(t.id)} className={`relative flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${active ? 'bg-gradient-to-br from-[#1d4a39] to-[#0f2a20] text-white shadow-md shadow-[#18352b]/25' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}>
                  <Icon className={`h-4 w-4 ${active ? 'text-lime-300' : ''}`} />{t.label}
                  {badges[t.id] > 0 && <span className={`rounded-full px-1.5 text-[11px] font-bold ${active ? 'bg-lime-300 text-[#17372c]' : 'bg-amber-100 text-amber-800'}`}>{badges[t.id]}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Nội dung tab — key theo tab để mỗi lần chuyển tab có hiệu ứng vào */}
      <div key={tab} className="mx-auto max-w-[1400px] animate-fadeIn px-4 pt-5 sm:px-6 lg:px-10 lg:pt-7">
        <h2 className="mb-4 font-heading text-lg font-bold text-[#18352b] lg:hidden">{current.label}</h2>
        {tab === 'overview' && <OverviewTab plot={activePlot} operations={operations} iotData={activeIotData} alerts={alerts} stages={stages} harvestPlan={harvestPlan} goTab={goTab} onOpenTask={onOpenTask} onOpenHarvest={onOpenHarvest} />}
        {tab === 'tasks' && <TasksTab operations={operations} onOpenTask={onOpenTask} />}
        {tab === 'iot' && <IotTab plot={activePlot} iotData={activeIotData} alerts={alerts} isConnected={isConnected} />}
        {tab === 'diary' && <DiaryTab plot={activePlot} operations={operations} onAddDiary={onAddDiary} />}
        {tab === 'services' && <ServicesTab plot={activePlot} services={services} orders={serviceOrders} onSelectService={onSelectService} />}
        {tab === 'harvest' && <HarvestTab plot={activePlot} harvestPlan={harvestPlan} onOpenHarvest={onOpenHarvest} />}
      </div>

      {/* Tab của thửa — mobile: thanh dưới đáy */}
      <nav aria-label={`Chức năng của ${plot.name}`} className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-6 rounded-[22px] border border-white/10 bg-[#0f2a20]/95 p-1.5 shadow-[0_18px_40px_-12px_rgba(15,42,32,0.6)] backdrop-blur-xl" role="tablist">
          {PLOT_TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={active} aria-label={t.label} onClick={() => goTab(t.id)} className={`relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-[10px] font-semibold transition-all duration-300 ${active ? 'bg-lime-300 text-[#17372c] shadow-[0_6px_16px_-4px_rgba(190,242,100,0.6)]' : 'text-white/65'}`}>
                <span className="relative">
                  <Icon className="h-[18px] w-[18px]" />
                  {badges[t.id] > 0 && <span className={`absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${active ? 'bg-[#17372c] text-lime-300' : 'bg-amber-400 text-[#17372c]'}`}>{badges[t.id]}</span>}
                </span>
                <span className="truncate">{t.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
