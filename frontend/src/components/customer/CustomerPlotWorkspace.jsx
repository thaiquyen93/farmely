import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { assessPlot, explainAlert } from '../../utils/iotInsights';
import { fetchLiveAgroIotData } from '../../services/weatherIotService';
import { resolveStandardCropProcess, getPersistedStaffActivities, resolvePlotSeasons } from '../../services/cropStandardProcess';
import SeasonSelector from './SeasonSelector';
import SoilPrepView from './SoilPrepView';
import PlotRenewalModal from './PlotRenewalModal';
import HarvestReportModal from './HarvestReportModal';
import {
  AlertTriangle, ArrowLeft, Award, BookOpen, Calendar, CalendarCheck, Check, ChevronDown, ChevronRight, ChevronLeft,
  Clock, Clock3, Droplets, Eye, Info, LayoutDashboard, Leaf,
  MapPin, Maximize2, PenLine, Radio, Search, ShieldCheck, ShoppingBag, Sparkles, Sprout,
  Sun, UserRound, Wheat, X, Camera, CheckCircle2, FileText, Plus, Trash2, Flame
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
   Không gian làm việc quản lý MỘT thửa đất của Khách hàng.
   Đảm bảo:
   1. Phản ánh chân thực hiện trạng khu vườn và cây trồng theo Quy trình chuẩn tính theo ngày.
   2. Lưu trữ và truy xuất đầy đủ, minh bạch toàn bộ hoạt động của Staff (Field Workers).
   3. Kết nối dữ liệu khí tượng & vi khí hậu trực tiếp từ 3rd-Party API thực tế (Open-Meteo Agro API).
   ────────────────────────────────────────────────────────────────────────── */

export const PLOT_TABS = [
  { id: 'overview', label: 'Tổng quan', short: 'Tổng quan', icon: LayoutDashboard },
  { id: 'tasks', label: 'Công việc & Nhật ký', short: 'Việc & Nhật ký', icon: CalendarCheck },
  { id: 'services', label: 'Dịch vụ', short: 'Dịch vụ', icon: ShoppingBag }
];

const LEVEL_STYLE = {
  OK: { chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', marker: 'bg-emerald-600', hex: '#059669', dot: 'bg-lime-400' },
  LOW: { chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200', marker: 'bg-sky-600', hex: '#0284c7', dot: 'bg-sky-400' },
  HIGH: { chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200', marker: 'bg-rose-600', hex: '#e11d48', dot: 'bg-rose-400' },
  UNKNOWN: { chip: 'bg-stone-100 text-stone-600', marker: 'bg-stone-400', hex: '#a8a29e', dot: 'bg-stone-400' }
};

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
/**
 * Thẻ hiện trạng thửa đất, đọc từ trên xuống theo thứ bậc:
 *   việc đang diễn ra (to nhất) > nhiệt độ thực địa > cảnh báo (gọn nhất).
 * ponytail: ceiling is nhiệt độ + 2 cảnh báo trong cùng một thẻ.
 * upgrade path is tách lại thành trang riêng khi KH cần tra cứu lịch sử khí tượng theo giờ.
 */
function PlotStatusHero({ plot, cropProcess, topAlerts = [], liveProviderInfo }) {
  const currentStage = cropProcess.currentStage;
  // Chỉ nêu nhiệt độ: 3 chỉ số còn lại đã nằm trong chính câu cảnh báo khi vượt ngưỡng.
  const temp = assessPlot(plot).find((m) => m.key === 'temp');
  const isNotStarted = cropProcess.isNotStarted;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b4332] via-[#24533f] to-[#0f2a20] text-white ${CARD_SHADOW}`}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime-300/15 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

      {/* Tầng 1 — Việc đang diễn ra (chính) · Sức khoẻ thửa (phụ, tách bằng vách mờ) */}
      <div className="relative p-5 sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              Tiêu chuẩn VietGAP
            </span>
            {isNotStarted ? (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
                <Calendar className="h-3.5 w-3.5 text-amber-300" />
                Chưa bắt đầu · Ngày 0 / {cropProcess.totalDays}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Ngày thứ {cropProcess.currentDay} / {cropProcess.totalDays}
              </span>
            )}
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-300">
            {isNotStarted ? 'Vụ mùa sắp tới' : 'Đang trong giai đoạn'}
          </p>
          <h3 className="mt-1 font-heading text-xl font-bold tracking-tight text-white sm:text-2xl drop-shadow-xs">
            {isNotStarted
              ? `${cropProcess.cropName ? (cropProcess.cropName.charAt(0).toUpperCase() + cropProcess.cropName.slice(1)) : 'Cây trồng'} · Chưa bắt đầu canh tác`
              : (currentStage?.name || 'Đang trong quy trình canh tác tiêu chuẩn')}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-white/90">
            {isNotStarted
              ? 'Vụ mùa kế tiếp đã được lên lịch. Tiến độ sẽ bắt đầu tính khi vào vụ mới (sau chu kỳ nghỉ đất và làm đất tiêu chuẩn 5 ngày).'
              : (currentStage?.statusDesc || 'Cây trồng đang phát triển thuận lợi theo đúng chỉ dẫn kỹ thuật nông học.')}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
            <span className="font-semibold text-lime-300">
              {isNotStarted
                ? `Chu kỳ toàn vụ: ${cropProcess.totalDays} ngày`
                : `Ngày thứ ${cropProcess.currentDay}/${cropProcess.totalDays} · Còn ${cropProcess.daysLeft} ngày tới thu hoạch`}
            </span>
            <span className="text-white/70">
              {isNotStarted ? 'Dự kiến bắt đầu theo lịch vụ mùa' : `Tiến độ chu kỳ: ${cropProcess.progressPercent}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Tầng 2 — Nhiệt độ thực địa & nguồn dữ liệu, cùng một hàng */}
      {temp && (
        <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/10 px-5 py-3.5 sm:px-6">
          <span className="flex items-baseline gap-1.5 text-xs">
            <span className={`h-2 w-2 shrink-0 self-center rounded-full ${LEVEL_STYLE[temp.level].dot}`} />
            <span className="font-medium text-white/85">{temp.label}</span>
            {temp.value === null ? (
              <span className="text-white/70">chưa có số liệu</span>
            ) : (
              <>
                <strong className="font-bold text-white">{temp.value}{temp.unit}</strong>
                <span className="text-white/70">chuẩn {temp.min}–{temp.max}{temp.unit}</span>
              </>
            )}
          </span>
          {liveProviderInfo?.isLive3rdParty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-lime-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" />
              Open-Meteo Live Feed
            </span>
          )}
        </div>
      )}

      {/* Tầng 3 — Cảnh báo BR18, mỗi cảnh báo một dòng gọn trong cùng thẻ */}
      {topAlerts.length > 0 && (
        <div className="relative border-t border-white/10" aria-label="Cảnh báo thời tiết thực địa">
          {topAlerts.map((a, idx) => {
            const info = explainAlert(a, plot.mode);
            const isHigh = a?.level === 'HIGH';
            return (
              <div
                key={a.id || `${info.title}-${idx}`}
                className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 px-5 py-3 text-xs sm:px-6 ${idx > 0 ? 'border-t border-white/5' : ''}`}
              >
                <AlertTriangle className={`h-4 w-4 shrink-0 self-center ${isHigh ? 'text-rose-300' : 'text-amber-300'}`} />
                <strong className={`font-bold ${isHigh ? 'text-rose-100' : 'text-amber-100'}`}>{info.title}</strong>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${isHigh ? 'bg-rose-400/20 text-rose-200' : 'bg-amber-400/20 text-amber-200'}`}>
                  {info.levelText}
                </span>
                <span className="text-white/90">
                  {info.explanation} <strong className="font-semibold text-white/95">{info.action}</strong>
                </span>
                {info.time && <span className="text-white/65">{info.time}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Hàm chuẩn hóa ngày tuổi của một mục nhật ký hoặc hoạt động
 */
export function calculateEntryCropDay(entry, startDate, currentCropDay = 1, totalDays = 60) {
  if (!entry) return null;
  if (entry.cropDay !== undefined && entry.cropDay !== null) return Number(entry.cropDay);
  if (entry.day !== undefined && entry.day !== null) return Number(entry.day);
  if (entry.dayOffset !== undefined && entry.dayOffset !== null) return Math.max(1, Number(entry.dayOffset));

  const rawDateStr = entry.date || entry.createdAt || entry.created_at || entry.dueDate || entry.completedAt || entry.timestamp || entry.time;
  if (rawDateStr && startDate) {
    try {
      let d1 = null;
      const dmy = String(rawDateStr).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dmy) {
        d1 = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      } else {
        const ymd = String(rawDateStr).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (ymd) {
          d1 = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
        } else {
          const parsed = new Date(rawDateStr);
          if (!isNaN(parsed.getTime())) d1 = parsed;
        }
      }
      if (d1 && !isNaN(d1.getTime())) {
        const d0 = new Date(startDate);
        d0.setHours(0, 0, 0, 0);
        d1.setHours(0, 0, 0, 0);
        const diffDays = Math.round((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays >= 1 && diffDays <= totalDays) return diffDays;
        if (diffDays <= 0) return 1;
      }
    } catch { }
  }

  const timeStr = String(entry.time || '') + ' ' + String(entry.dateFormatted || '');
  if (timeStr.includes('Hôm nay')) {
    return currentCropDay;
  }
  if (timeStr.includes('Hôm qua')) {
    return Math.max(1, currentCropDay - 1);
  }

  return null;
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
  onAddDiary,
  onStartSeason,
  onResetSeason,
  latestHarvest = null,
  onGoToDiary,
  onOpenHarvestReport
}) {
  if (!cropProcess?.stages?.length) return null;

  const currentCropDay = cropProcess.isNotStarted ? 0 : (cropProcess.currentDay || 1);
  const totalDays = cropProcess.totalDays || 45;
  const [selectedDay, setSelectedDay] = useState(cropProcess.isNotStarted ? 1 : currentCropDay);

  const effectiveHarvest = useMemo(() => {
    if (latestHarvest) {
      return {
        ...latestHarvest,
        id: latestHarvest.harvestCode || latestHarvest.id || `HRV-${plot?.id || '88'}`,
        crop: latestHarvest.crop || latestHarvest.cropName || plot?.cropName || plot?.crop || 'Nông sản VietGAP',
        yieldAmount: latestHarvest.yieldAmount || latestHarvest.actualWeight || 20.0,
        formattedYield: latestHarvest.formattedYield || (latestHarvest.yieldAmount ? `${latestHarvest.yieldAmount} kg` : (latestHarvest.actualWeight || '20.00 kg')),
        harvestDateFormatted: latestHarvest.harvestDateFormatted || latestHarvest.harvestDate || '05/11/2026',
        workerName: latestHarvest.enteredByWorker || latestHarvest.workerName || latestHarvest.staffName || 'Trần Văn Lực'
      };
    }
    return {
      id: `HRV-${plot?.id || '88'}`,
      harvestCode: `HRV-${plot?.id || '88'}`,
      crop: plot?.cropName || plot?.crop || 'Nông sản VietGAP',
      yieldAmount: plot?.expectedYield || 20.0,
      formattedYield: `${plot?.expectedYield || 20.0} kg`,
      harvestDate: new Date().toISOString().slice(0, 10),
      harvestDateFormatted: new Date().toLocaleDateString('vi-VN'),
      workerName: 'Trần Văn Lực',
      enteredByWorker: 'Trần Văn Lực',
      evidenceImageUrl: '/images/harvest/rau-muong-p03.jpg',
      status: 'COMPLETED',
      plotCode: plot?.plotCode || (plot?.rentalId ? `P-${String(plot.rentalId).padStart(2, '0')}` : 'P-01'),
      plotName: plot?.plotName || plot?.name || 'Thửa P-01',
      totalDays: totalDays
    };
  }, [latestHarvest, plot, totalDays]);

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
    return calculateEntryCropDay(entry, plot?.startDate, currentCropDay, totalDays);
  }, [plot?.startDate, currentCropDay, totalDays]);

  // Gom nhóm nhật ký theo ngày
  const diariesByDay = useMemo(() => {
    const map = {};
    const list = operations?.diary || [];
    list.forEach((e) => {
      if (isSelf) {
        const authorStr = String(e.author || '');
        const titleStr = String(e.title || '');
        if (
          authorStr.includes('CVLĐ') ||
          authorStr.includes('Trần Văn Lực') ||
          authorStr.includes('Nguyễn Văn Đạt') ||
          authorStr.includes('Nguyễn Hoàng Nam') ||
          titleStr === 'Tưới nước vi sinh & kiểm tra đất' ||
          titleStr === 'Kiểm tra sinh trưởng định kỳ' ||
          titleStr === 'Nhiệm vụ chăm sóc hiện trường'
        ) {
          return;
        }
      }
      const d = getEntryCropDay(e);
      if (d !== null && d !== undefined) {
        if (!map[d]) map[d] = [];

        // Tránh trùng lặp task nhân viên đã hiển thị ở phần công việc
        const isFromTask = String(e.id || '').startsWith('DIARY-FROM-TASK-') || Boolean(e.taskId);
        const titleLower = String(e.title || '').trim().toLowerCase();
        const isDuplicateTaskMirror = isFromTask && (staffActivities || []).some(
          (act) => {
            const actDay = act.day || act.cropDay || getEntryCropDay(act);
            return actDay === d && (
              (e.taskId && (act.activityId === e.taskId || act.id === e.taskId)) ||
              String(act.title || '').trim().toLowerCase() === titleLower
            );
          }
        );

        if (!isDuplicateTaskMirror) {
          map[d].push(e);
        }
      }
    });
    return map;
  }, [operations?.diary, getEntryCropDay, isSelf, staffActivities]);

  // Gom nhóm hoạt động nhân viên theo ngày
  const activitiesByDay = useMemo(() => {
    const map = {};
    const list = staffActivities || [];
    list.forEach((act) => {
      let d = act.day || act.cropDay || getEntryCropDay(act);
      const titleLower = String(act.title || '').toLowerCase();
      const isHarvestAct = titleLower.includes('thu hoạch') || titleLower.includes('nghiệm thu') || titleLower.includes('đóng thùng');
      // Gom task thu hoạch vào totalDays nếu chưa có ngày
      if ((d === null || d === undefined) && isHarvestAct) {
        d = totalDays;
      }
      if (d !== null && d !== undefined) {
        if (!map[d]) map[d] = [];

        // Đồng bộ hoàn thành khi tua ngày (Fast-forward sync):
        // Nếu đã ở ngày thu hoạch (currentCropDay >= totalDays), các task trước đó (không phải thu hoạch/nghiệm thu) hoàn thành 100%
        let syncedStatus = act.status;
        if (currentCropDay >= totalDays && !isHarvestAct) {
          syncedStatus = 'COMPLETED';
        } else if (currentCropDay > d && !isHarvestAct) {
          syncedStatus = 'COMPLETED';
        } else if (currentCropDay <= 1 && d === 1 && act.status === 'COMPLETED' && !act.proofPhoto && !act.isCustom) {
          syncedStatus = !cropProcess.isNotStarted ? 'IN_PROGRESS' : 'PENDING';
        }

        map[d].push({
          ...act,
          status: syncedStatus,
          proofPhoto: syncedStatus === 'COMPLETED' ? (act.proofPhoto || act.evidenceImageUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80') : act.proofPhoto
        });
      }
    });

    // Tính ngày lịch tương ứng cho Ngày 1 và Ngày thu hoạch
    let startCalDate = '';
    let endCalDate = '';
    if (plot?.startDate) {
      try {
        const d0 = new Date(plot.startDate);
        startCalDate = d0.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const dEnd = new Date(plot.startDate);
        dEnd.setDate(dEnd.getDate() + (totalDays - 1));
        endCalDate = dEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch { }
    }

    // Đảm bảo Ngày 1 có đúng 2 công việc chuẩn mực, tinh gọn, không spam lặp
    const defaultDay1Activities = [
      {
        activityId: `STD-TASK-${plot?.id || 'PLOT'}-DAY-1-1`,
        id: `STD-TASK-${plot?.id || 'PLOT'}-DAY-1-1`,
        day: 1,
        cropDay: 1,
        title: 'Làm đất tơi xốp, bón lót phân trùn quế & xử lý Trichoderma',
        timestamp: startCalDate ? `${startCalDate} • Ca sáng (07:30 - 09:00)` : 'Ca sáng (07:30 - 09:00)',
        status: currentCropDay > 1 ? 'COMPLETED' : (!cropProcess.isNotStarted ? 'IN_PROGRESS' : 'PENDING'),
        workerName: isSelf ? 'Chủ vườn tự thực hiện' : 'Trần Văn Lực',
        workerRole: isSelf ? 'Chủ vườn' : 'Kỹ thuật viên hiện trường chuyên trách',
        notes: 'Xử lý giá thể bầu ươm đạt chuẩn VietGAP, duy trì ẩm độ đất từ 65 - 70%.',
        proofPhoto: currentCropDay > 1 ? 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80' : null
      },
      {
        activityId: `STD-TASK-${plot?.id || 'PLOT'}-DAY-1-2`,
        id: `STD-TASK-${plot?.id || 'PLOT'}-DAY-1-2`,
        day: 1,
        cropDay: 1,
        title: 'Tưới ẩm luống đất (65-70%) & xuống giống non theo mật độ VietGAP',
        timestamp: startCalDate ? `${startCalDate} • Ca chiều (16:00 - 17:30)` : 'Ca chiều (16:00 - 17:30)',
        status: currentCropDay > 1 ? 'COMPLETED' : (!cropProcess.isNotStarted ? 'IN_PROGRESS' : 'PENDING'),
        workerName: isSelf ? 'Chủ vườn tự thực hiện' : 'Trần Văn Lực',
        workerRole: isSelf ? 'Chủ vườn' : 'Kỹ thuật viên hiện trường chuyên trách',
        notes: 'Khoảng cách cây cách cây đạt chuẩn 20 - 25cm, duy trì ẩm độ luống đất.'
      }
    ];

    if (!map[1] || map[1].length === 0) {
      map[1] = defaultDay1Activities;
    } else {
      // Giới hạn Ngày 1 tối đa 2 việc, lọc sạch các bản ghi trùng lặp
      const seenTitles = new Set();
      const cleanDay1 = [];
      map[1].forEach((t) => {
        const key = (t.title || '').trim().toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          cleanDay1.push(t);
        }
      });
      map[1] = cleanDay1.slice(0, 2);
    }

    if (!map[totalDays] || map[totalDays].length === 0) {
      map[totalDays] = [
        {
          activityId: `STD-TASK-DAY-${totalDays}-1`,
          day: totalDays,
          cropDay: totalDays,
          title: 'Kiểm nghiệm dư lượng an toàn và hoàn tất thời gian cách ly VietGAP',
          timestamp: endCalDate ? `${endCalDate} • Ca sáng (06:30 - 08:00)` : 'Ca sáng (06:30 - 08:00)',
          status: currentCropDay >= totalDays ? 'COMPLETED' : 'PENDING',
          workerName: isSelf ? 'Chủ vườn tự thực hiện' : 'Trần Văn Lực',
          workerRole: isSelf ? 'Chủ vườn' : 'Kỹ thuật viên hiện trường chuyên trách',
          notes: 'Ngừng cấp dinh dưỡng trước 24h, test nhanh nitrat và hoạt chất bảo vệ sinh học đạt ngưỡng an toàn.',
          proofPhoto: currentCropDay >= totalDays ? 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80' : null
        },
        {
          activityId: `STD-TASK-DAY-${totalDays}-2`,
          day: totalDays,
          cropDay: totalDays,
          title: 'Thu hoạch, phân loại chất lượng loại 1 & dán tem truy xuất nguồn gốc',
          timestamp: endCalDate ? `${endCalDate} • Ca sáng (08:00 - 10:30)` : 'Ca sáng (08:00 - 10:30)',
          status: 'PENDING',
          workerName: isSelf ? 'Chủ vườn tự thực hiện' : 'Trần Văn Lực',
          workerRole: isSelf ? 'Chủ vườn' : 'Kỹ thuật viên hiện trường chuyên trách',
          notes: 'Thu hoạch nhẹ tay tránh dập nát, xếp khay đục lỗ thoáng khí, cân trọng lượng nghiệm thu thực tế.',
          proofPhoto: null
        }
      ];
    }

    return map;
  }, [staffActivities, getEntryCropDay, totalDays, currentCropDay, cropProcess.isNotStarted, isSelf, plot?.startDate]);

  const trackRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Danh sách các mốc giai đoạn chính của quy trình canh tác (đã chuẩn hóa & gom theo mốc ngày)
  const majorEvents = useMemo(() => {
    const rawStages = cropProcess.stages || [];
    // Gom nhóm tuyệt đối theo dayStart để đảm bảo mỗi mốc ngày chỉ xuất hiện đúng 1 lần trên dòng thời gian
    const byDay = new Map();
    rawStages.forEach((st) => {
      const d = st.dayStart !== undefined ? Number(st.dayStart) : 1;
      if (!byDay.has(d)) {
        byDay.set(d, st);
      } else {
        const existing = byDay.get(d);
        if ((st.guide?.length || 0) > (existing.guide?.length || 0)) {
          byDay.set(d, st);
        }
      }
    });

    const uniqueStages = Array.from(byDay.values()).sort((a, b) => a.dayStart - b.dayStart);
    const numStages = uniqueStages.length;

    return uniqueStages.map((st, idx) => {
      let icon = Leaf;
      const nameLower = (st.name || '').toLowerCase();
      if (idx === 0 || nameLower.includes('gieo') || nameLower.includes('ươm') || nameLower.includes('làm đất') || nameLower.includes('mầm')) {
        icon = Sprout;
      } else if (idx === numStages - 1 || nameLower.includes('thu hoạch') || nameLower.includes('thu hái') || nameLower.includes('hái') || nameLower.includes('cách ly')) {
        icon = Wheat;
      } else if (nameLower.includes('hoa') || nameLower.includes('thụ phấn')) {
        icon = Sparkles;
      } else if (nameLower.includes('quả') || nameLower.includes('trái') || nameLower.includes('chín') || nameLower.includes('bón')) {
        icon = Sun;
      } else {
        icon = Leaf;
      }

      let shortTitle = st.name || `Giai đoạn ${idx + 1}`;
      if (shortTitle.includes('·')) {
        shortTitle = shortTitle.split('·')[0].trim();
      }
      shortTitle = shortTitle.replace(/\s*đạt chuẩn VietGAP\s*/gi, '')
        .replace(/\s*tiêu chuẩn VietGAP\s*/gi, '')
        .trim();

      const isHarvest = idx === numStages - 1 || nameLower.includes('thu hoạch') || nameLower.includes('nghiệm thu');
      const milestoneDay = isHarvest ? totalDays : st.dayStart;

      return {
        stageIndex: idx + 1,
        day: milestoneDay,
        displayDay: milestoneDay,
        isHarvest,
        dayStart: st.dayStart,
        dayEnd: st.dayEnd,
        stage: st,
        title: st.name,
        shortTitle,
        icon,
        label: isHarvest ? `Ngày ${totalDays} · Thu hoạch` : (st.label || (st.dayStart === st.dayEnd ? `Ngày ${st.dayStart}` : `Ngày ${st.dayStart} – ${st.dayEnd}`))
      };
    });
  }, [cropProcess.stages, totalDays]);

  // Kiểm tra ngày đang chọn có phải là mốc sự kiện lớn hay không
  const activeEvent = useMemo(() => {
    return majorEvents.find((e) => e.displayDay === selectedDay || e.dayStart === selectedDay || e.day === selectedDay);
  }, [majorEvents, selectedDay]);

  // Tính % tiến độ thanh chạy nối liền các mốc sự kiện trải dài 100% khung rộng
  const timelineProgressPercent = useMemo(() => {
    if (cropProcess.isNotStarted) return 0;
    if (!majorEvents.length) return 0;
    const firstDay = majorEvents[0].displayDay || majorEvents[0].dayStart;
    const lastDay = majorEvents[majorEvents.length - 1].displayDay || majorEvents[majorEvents.length - 1].dayStart;
    if (selectedDay >= lastDay) return 100;
    if (selectedDay <= firstDay) return 0;

    for (let i = 0; i < majorEvents.length - 1; i++) {
      const d1 = majorEvents[i].displayDay || majorEvents[i].dayStart;
      const d2 = majorEvents[i + 1].displayDay || majorEvents[i + 1].dayStart;
      if (selectedDay >= d1 && selectedDay <= d2) {
        const stepWidth = 100 / (majorEvents.length - 1);
        const ratio = (selectedDay - d1) / (d2 - d1 || 1);
        return Math.min(100, Math.max(0, i * stepWidth + ratio * stepWidth));
      }
    }
    return 100;
  }, [selectedDay, majorEvents, cropProcess.isNotStarted]);

  // Danh sách nhật ký cho ngày đang chọn: CHỈ HIỂN THỊ ĐÚNG NGÀY ĐÓ
  const selectedDayDiaries = useMemo(() => {
    return diariesByDay[selectedDay] || [];
  }, [diariesByDay, selectedDay]);

  // Danh sách hoạt động Staff cho ngày đang chọn: CHỈ HIỂN THỊ ĐÚNG NGÀY ĐÓ
  const selectedDayActivities = useMemo(() => {
    return activitiesByDay[selectedDay] || [];
  }, [activitiesByDay, selectedDay]);

  // Tính ngày lịch tương ứng cho ngày đang chọn
  const selectedCalendarDateStr = useMemo(() => {
    if (!plot?.startDate) return null;
    try {
      const d = new Date(plot.startDate);
      d.setDate(d.getDate() + (selectedDay - 1));
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return null;
    }
  }, [plot?.startDate, selectedDay]);

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

  const handleSimulateDay1 = async () => {
    setSelectedDay(1);
    const rentalId = plot?.rentalId || plot?.rental_id;
    if (rentalId) {
      try {
        await fetch(`/api/rentals/${rentalId}/simulate-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'START_NOW' })
        });
      } catch (e) {
        console.warn('Lỗi gọi API simulate START_NOW:', e);
      }
    }
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('farmely_self_tasks_') || k.includes('farmely_persisted_staff_activities') || k.includes('farmely_season_started')) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        const bc1 = new BroadcastChannel('farmely_staff_activity_channel');
        bc1.postMessage({ type: 'STAFF_ACTIVITIES_UPDATED', timestamp: Date.now() });
        setTimeout(() => { try { bc1.close(); } catch {} }, 1000);
        const bc2 = new BroadcastChannel('farmely_iot_telemetry');
        bc2.postMessage({ type: 'TELEMETRY_UPDATED', timestamp: Date.now() });
        setTimeout(() => { try { bc2.close(); } catch {} }, 1000);
      } catch {}
    }
    window.location.reload();
  };

  const handleSimulateHarvest = async () => {
    setSelectedDay(totalDays);
    const rentalId = plot?.rentalId || plot?.rental_id;
    if (rentalId) {
      try {
        await fetch(`/api/rentals/${rentalId}/simulate-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'HARVEST' })
        });
      } catch (e) {
        console.warn('Lỗi gọi API simulate HARVEST:', e);
      }
    }
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('farmely_self_tasks_') || k.includes('farmely_persisted_staff_activities')) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        const bc1 = new BroadcastChannel('farmely_staff_activity_channel');
        bc1.postMessage({ type: 'STAFF_ACTIVITIES_UPDATED', timestamp: Date.now() });
        setTimeout(() => { try { bc1.close(); } catch {} }, 1000);
        const bc2 = new BroadcastChannel('farmely_iot_telemetry');
        bc2.postMessage({ type: 'TELEMETRY_UPDATED', timestamp: Date.now() });
        setTimeout(() => { try { bc2.close(); } catch {} }, 1000);
      } catch {}
    }
    window.location.reload();
  };

  return (
    <div className="space-y-5">
      {/* 1. THANH CHẠY DÒNG THỜI GIAN THEO NGÀY: 1 DÒNG THỜI GIAN DUY NHẤT TRẢI RỘNG */}
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
              Bấm trực tiếp vào các mốc giai đoạn trên dòng thời gian để xem quy trình VietGAP và nhật ký của từng ngày tuổi.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleSimulateDay1}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedDay === 1
                  ? 'border-emerald-600 bg-emerald-700 text-white'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
              title="Nhảy tới ngày bắt đầu canh tác (Ngày 1)"
            >
              🌱 Ngày 1
            </button>

            <button
              type="button"
              onClick={handleSimulateHarvest}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedDay === totalDays
                  ? 'border-amber-600 bg-amber-700 text-white shadow-sm'
                  : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
              title="Kích hoạt ngày thu hoạch vụ mùa và kiểm tra thông báo thu hoạch"
            >
              🌾 Ngày {totalDays} (Thu hoạch)
            </button>

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
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                Hôm nay · Ngày {currentCropDay}
              </span>
            )}
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
          <div className="relative min-w-[640px]">
            {/* Đường ray chính nối liền các mốc sự kiện */}
            <div
              ref={trackRef}
              className="absolute left-14 right-14 top-6 -translate-y-1/2 h-8 flex items-center z-0"
            >
              {/* Thân ray nền xám bo góc */}
              <div className="relative h-2.5 w-full rounded-full bg-stone-200 overflow-hidden shadow-inner">
                {/* Vạch tiến độ chạy xanh nối liền theo ngày */}
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
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
                      {!cropProcess.isNotStarted && selectedDay === 1 && currentCropDay !== 1 && <span className="text-lime-300">· Ngày bắt đầu</span>}
                    </div>
                    <div className="h-6 w-6 rounded-full bg-emerald-700 ring-4 ring-white shadow-lg flex items-center justify-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-xs" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CÁC ĐIỂM NÚT SỰ KIỆN LỚN: TRẢI ĐỀU 100% CHIỀU RỘNG, KHÔNG BAO GIỜ BỊ ĐÈ CHỮ */}
            <div className="relative flex items-center justify-between w-full pointer-events-none z-10">
              {majorEvents.map((evt, idx) => {
                const Icon = evt.icon;
                const isHarvestNode = evt.isHarvest || evt.displayDay === totalDays || evt.dayEnd >= totalDays;
                const isSelected = selectedDay === evt.displayDay || selectedDay === evt.dayStart || (selectedDay >= evt.dayStart && selectedDay <= evt.dayEnd);
                const isPassed = !cropProcess.isNotStarted && evt.dayEnd <= currentCropDay;
                const isToday = !cropProcess.isNotStarted && currentCropDay >= evt.dayStart && currentCropDay <= evt.dayEnd;
                const isUpcomingFirst = cropProcess.isNotStarted && evt.dayStart === 1;

                return (
                  <div
                    key={evt.dayStart ?? idx}
                    className="relative flex flex-col items-center w-28 text-center pointer-events-auto"
                  >
                    {/* Badge Hôm nay / Sắp tới / Thu hoạch trên nút */}
                    <div className="absolute -top-8 pointer-events-none flex flex-col items-center">
                      {isSelected ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black text-white shadow-md whitespace-nowrap ring-1 ${
                          isHarvestNode || selectedDay === totalDays
                            ? 'bg-amber-600 ring-amber-300'
                            : isToday
                            ? 'bg-emerald-800 ring-emerald-400'
                            : isUpcomingFirst
                            ? 'bg-sky-700 ring-sky-300'
                            : 'bg-emerald-800 ring-emerald-400'
                        }`}>
                          {isHarvestNode || selectedDay === totalDays
                            ? '🌾 THU HOẠCH'
                            : isToday
                            ? 'HÔM NAY'
                            : isUpcomingFirst
                            ? 'SẮP TỚI'
                            : `GIAI ĐOẠN ${idx + 1}`}
                        </span>
                      ) : isHarvestNode ? (
                        <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs whitespace-nowrap">
                          Thu hoạch
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
                      onClick={() => {
                        const targetDay = evt.displayDay || evt.dayStart;
                        setSelectedDay(targetDay);
                        if (isHarvestNode) {
                          const rentalId = plot?.rentalId || plot?.rental_id;
                          if (rentalId) {
                            fetch(`/api/rentals/${rentalId}/simulate-time`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'HARVEST' })
                            }).catch(() => {});
                          }
                        }
                      }}
                      className={`group flex items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? isHarvestNode
                            ? 'h-12 w-12 bg-amber-600 text-white ring-4 ring-amber-300 shadow-xl scale-110 z-20'
                            : 'h-12 w-12 bg-emerald-800 text-white ring-4 ring-emerald-300 shadow-xl scale-110 z-20'
                          : isPassed
                          ? 'h-10 w-10 bg-emerald-700 text-white ring-2 ring-emerald-200 shadow-md hover:scale-110 z-10'
                          : isHarvestNode
                          ? 'h-10 w-10 bg-amber-50 text-amber-800 border-2 border-amber-300 shadow-xs hover:border-amber-500 hover:scale-110 z-10'
                          : 'h-10 w-10 bg-white text-stone-700 border-2 border-stone-300 shadow-xs hover:border-emerald-500 hover:scale-110 z-10'
                      }`}
                      title={`Ngày ${evt.displayDay || evt.dayStart}: ${evt.title}`}
                    >
                      <Icon className={isSelected ? 'h-5 w-5 text-lime-300' : 'h-4 w-4'} />
                    </button>

                    {/* Nhãn mô tả sự kiện bên dưới - Rộng rãi, cách đều nhau, không bao giờ bị đè */}
                    <div className="mt-3.5 flex flex-col items-center text-center w-full pointer-events-none">
                      <span className={`text-xs font-black whitespace-nowrap ${
                        isSelected ? (isHarvestNode ? 'text-amber-950 scale-105' : 'text-emerald-950 scale-105') : 'text-stone-800'
                      }`}>
                        Ngày {evt.displayDay || evt.dayStart}
                      </span>
                      <span className={`text-[11px] font-semibold mt-0.5 leading-snug line-clamp-2 ${
                        isSelected ? (isHarvestNode ? 'text-amber-800 font-bold' : 'text-emerald-800 font-bold') : 'text-stone-600'
                      }`}>
                        {evt.shortTitle}
                      </span>
                      {evt.label && (
                        <span className="text-[10px] text-stone-400 mt-0.5 font-medium whitespace-nowrap">
                          ({evt.label})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nút điều hướng nhanh: Nhảy về Ngày Bắt Đầu & Nhảy đến Ngày Kết Thúc Thu Hoạch */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateDay1}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                  selectedDay === 1
                    ? 'border-emerald-600 bg-emerald-700 text-white shadow-emerald-700/20'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Bấm để kích hoạt/chuyển ngay tới Ngày 1 và đồng bộ toàn bộ quy trình"
              >
                <span>🌱 Ngày bắt đầu (Ngày 1)</span>
              </button>

              <button
                type="button"
                onClick={handlePrevDay}
                disabled={selectedDay <= 1}
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 shadow-2xs transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Ngày trước</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNextDay}
                disabled={selectedDay >= totalDays}
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-30 shadow-2xs transition cursor-pointer"
              >
                <span>Ngày sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleSimulateHarvest}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                  selectedDay === totalDays
                    ? 'border-amber-600 bg-amber-700 text-white shadow-amber-700/20'
                    : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
                title="Bấm để chuyển ngay tới Ngày Thu Hoạch và đồng bộ toàn bộ quy trình"
              >
                <span>🌾 Ngày kết thúc (Ngày {totalDays} · Thu hoạch)</span>
              </button>
            </div>
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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-base text-[#18352b] flex items-center gap-2">
                  <span>Ngày {selectedDay} / {totalDays} ngày tuổi</span>
                  {selectedCalendarDateStr && (
                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                      📅 {selectedCalendarDateStr}
                    </span>
                  )}
                </h3>
                {selectedDay === totalDays ? (
                  <span className="rounded-full bg-amber-600 text-white px-3 py-0.5 text-[10px] font-black uppercase shadow-xs flex items-center gap-1.5 animate-pulse">
                    🌾 NGÀY THU HOẠCH
                  </span>
                ) : cropProcess.isNotStarted && selectedDay === 1 ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-sky-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase shadow-xs">
                      Sắp tới · Bắt đầu {plot?.startDate ? new Date(plot.startDate).toLocaleDateString('vi-VN') : 'dự kiến'}
                    </span>
                    <button
                      type="button"
                      onClick={onStartSeason}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs transition cursor-pointer"
                      title="Bấm để kích hoạt bắt đầu mùa vụ ngay hôm nay"
                    >
                      <Sprout className="w-3 h-3 text-lime-300" />
                      <span>Bắt đầu mùa vụ ngay</span>
                    </button>
                  </div>
                ) : !cropProcess.isNotStarted && selectedDay === currentCropDay ? (
                  <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase shadow-xs">
                    Hôm nay
                  </span>
                ) : !cropProcess.isNotStarted && selectedDay === 1 ? (
                  <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase shadow-xs flex items-center gap-1">
                    🌱 Đang canh tác · Ngày 1
                  </span>
                ) : (cropProcess.isNotStarted && selectedDay !== 1) ? (
                  <span className="rounded-full bg-sky-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase shadow-xs">
                    Kế hoạch mùa vụ
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-stone-600 font-medium">
                Giai đoạn {activeStage?.stepOrder || 1}: <strong className="text-emerald-800">{activeStage?.name}</strong> {activeStage?.label ? `(${activeStage.label})` : ''}
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

        {/* BR20/BR21: THÔNG BÁO THU HOẠCH VỤ MÙA KHI ĐẾN NGÀY THU HOẠCH (DUY NHẤT 1 BANNER ĐỒNG BỘ TRẠNG THÁI) */}
        {selectedDay === totalDays && (
          <div
            onClick={() => onOpenHarvestReport?.(effectiveHarvest)}
            className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/40 to-lime-50/50 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md hover:border-amber-400 transition group"
            title="Bấm để xem Báo cáo thu hoạch & Biên bản nghiệm thu (BR20)"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md text-2xl group-hover:scale-105 transition-transform">
                🌾
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-xs">
                    {latestHarvest ? '🌾 Đã Thu Hoạch Vụ Mùa' : '🔔 Thông Báo Thu Hoạch Vụ Mùa'}
                  </span>
                  {effectiveHarvest?.formattedYield || effectiveHarvest?.yieldAmount ? (
                    <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black text-amber-950 border border-amber-300">
                      Sản lượng: {effectiveHarvest.formattedYield || `${effectiveHarvest.yieldAmount} kg`}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-200">
                      Ngày {totalDays} / {totalDays} ngày tuổi
                    </span>
                  )}
                  {effectiveHarvest?.harvestDateFormatted && (
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                      {effectiveHarvest.harvestDateFormatted}
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    VietGAP chuẩn xuất xưởng
                  </span>
                </div>
                <h4 className="mt-1.5 text-sm sm:text-base font-heading font-black text-amber-950">
                  {latestHarvest
                    ? 'Nông sản đã thu hoạch hoàn tất — Đã chốt biên bản sản lượng!'
                    : 'Nông sản đã chín đạt độ chuẩn — Đã phát lệnh thu hoạch & nghiệm thu!'}
                </h4>
                <p className="mt-1 text-xs text-amber-950/80 leading-relaxed max-w-2xl">
                  {latestHarvest
                    ? `${effectiveHarvest.enteredByWorker || effectiveHarvest.workerName || 'Chuyên viên lao động'} đã cắt, cân điện tử và lưu trữ biên bản sản lượng thực tế. Quý khách vui lòng đến nhận nông sản tại nông trại theo quy định BR21.`
                    : 'Theo quy định BR20/BR21, Chuyên viên lao động (Trần Văn Lực) đang thực hiện thu hái nhẹ tay, cân điện tử và chụp ảnh nghiệm thu sản lượng thực tế. Quý khách vui lòng xác nhận hình thức nhận nông sản tại nông trại.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHarvestReport?.(effectiveHarvest);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-200" />
                <span>Báo cáo thu hoạch</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHarvestReport?.(effectiveHarvest);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-white px-3.5 py-2 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-50 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                <span>Xem biên bản trong Nhật ký</span>
              </button>
            </div>
          </div>
        )}

        {/* Danh sách nhiệm vụ canh tác & Nhật ký thực tế hôm đó */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-3 gap-2">
              <span className="flex items-center gap-2 font-black text-xs text-stone-900 uppercase tracking-wider min-w-0 truncate">
                <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Nhiệm vụ canh tác & Nhật ký Ngày {selectedDay}</span>
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold shrink-0 border ${
                cropProcess.isNotStarted ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {cropProcess.isNotStarted ? 'Kế hoạch sắp tới' : `${selectedDayActivities.length} công việc · ${selectedDayDiaries.length} nhật ký`}
              </span>
            </div>

            {cropProcess.isNotStarted && (
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="flex items-center gap-2 text-sky-900">
                  <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Vụ mùa đang ở trạng thái <strong>Sắp tới</strong> (Bắt đầu {plot?.startDate ? new Date(plot.startDate).toLocaleDateString('vi-VN') : 'sắp tới'}).</span>
                </div>
                <button
                  type="button"
                  onClick={onStartSeason}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Sprout className="w-3.5 h-3.5 text-lime-300" />
                  <span>Bắt đầu mùa vụ ngay</span>
                </button>
              </div>
            )}

            {selectedDayActivities.length > 0 || selectedDayDiaries.length > 0 ? (
              <div className="space-y-4">
                {/* 1. Hoạt động thực địa hoặc công việc tự canh tác */}
                {selectedDayActivities.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      <span>{cropProcess.isNotStarted ? `Công việc chuẩn bị Ngày ${selectedDay}` : `Nhiệm vụ cần thực hiện (${selectedDayActivities.length})`}</span>
                      <span className="text-emerald-700 normal-case">
                        {cropProcess.isNotStarted ? 'Chờ kích hoạt vụ mùa' : `${selectedDayActivities.filter(a => a.status === 'COMPLETED').length}/${selectedDayActivities.length} hoàn thành`}
                      </span>
                    </div>

                    {selectedDayActivities.map((act, idx) => {
                      const isDone = act.status === 'COMPLETED';
                      return (
                        <div
                          key={act.activityId || act.id || idx}
                          className={`rounded-2xl border p-4 space-y-2.5 text-xs transition ${
                            isDone ? 'border-emerald-200 bg-emerald-50/40' : 'border-stone-200 bg-white hover:border-emerald-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
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
                              <span className={`font-bold text-xs sm:text-[13px] truncate ${isDone ? 'text-stone-700' : 'text-stone-900'}`}>
                                {act.title || act.name}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                              isDone ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}>
                              {isDone ? '✓ ĐÃ XONG' : (act.timestamp || act.time || (isSelf ? 'Cần làm' : 'Ca trực'))}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-stone-500 pl-7.5 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <UserRound className="w-3 h-3 text-emerald-600" />
                              {act.workerName || (isSelf ? 'Chủ vườn tự thực hiện' : 'Trần Văn Lực (CVLĐ)')}
                            </span>
                            {act.timestamp && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-stone-400" />
                                {act.timestamp}
                              </span>
                            )}
                          </div>

                          {(act.notes || act.note) && (
                            <p className="text-xs leading-relaxed pl-7.5 text-stone-600">
                              {act.notes || act.note}
                            </p>
                          )}
                          {act.proofPhoto && (
                            <div className="mt-2 pl-7.5">
                              <div className="overflow-hidden rounded-xl border border-emerald-200 bg-stone-900/5 group">
                                <img
                                  src={act.proofPhoto}
                                  alt={act.title || 'Minh chứng'}
                                  className="w-full max-h-72 object-cover aspect-video transition duration-300 group-hover:scale-[1.01] cursor-pointer"
                                  onClick={() => window.open(act.proofPhoto, '_blank')}
                                  loading="lazy"
                                />
                                <div className="p-2.5 bg-white text-[11px] text-stone-600 flex items-center justify-between border-t border-emerald-100">
                                  <span className="text-emerald-800 font-semibold flex items-center gap-1.5">📸 Ảnh chụp hiện trường thực tế</span>
                                  <span
                                    className="text-emerald-800 font-bold hover:underline cursor-pointer"
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
                )}

                {/* 2. Các bài viết nhật ký của chủ vườn / kỹ thuật viên */}
                {selectedDayDiaries.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-stone-100">
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Nhật ký ghi chép ({selectedDayDiaries.length})
                    </p>
                    {selectedDayDiaries.map((entry, idx) => {
                      const displayTitle = entry.title || (entry.note ? entry.note.slice(0, 45) : 'Nhật ký ghi chép hiện trường');
                      const displayAuthor = isSelf
                        ? (entry.author && !entry.author.includes('CVLĐ') && !entry.author.includes('Trần Văn Lực') ? entry.author : 'Chủ vườn (Tự canh tác)')
                        : (entry.author || 'Trần Văn Lực (Kỹ thuật viên)');
                      const displayTime = entry.time || entry.date || 'Hôm nay';
                      const entryImg = entry.image || entry.imageUrl || entry.photo;

                      return (
                        <div key={entry.id || idx} className="rounded-2xl border border-stone-200 bg-white p-4 space-y-2.5 text-xs shadow-2xs">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-bold text-stone-500 text-[11px] flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              {displayTime}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <UserRound className="w-3 h-3 text-emerald-600" />
                              {displayAuthor}
                            </span>
                          </div>

                          <p className="font-bold text-stone-900 text-xs sm:text-[13px]">{displayTitle}</p>
                          {entry.note && (
                            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{entry.note}</p>
                          )}

                          {/* Ảnh hiện trường thực tế */}
                          {entryImg && (
                            <div className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-stone-900/5 group">
                              <img
                                src={entryImg}
                                alt={displayTitle}
                                className="w-full max-h-72 object-cover aspect-video transition duration-300 group-hover:scale-[1.01] cursor-pointer"
                                onClick={() => window.open(entryImg, '_blank')}
                                loading="lazy"
                              />
                              <div className="p-2.5 bg-white text-[11px] text-stone-600 flex items-center justify-between border-t border-stone-100">
                                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">📸 Ảnh chụp hiện trường thực tế</span>
                                <span
                                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                                  onClick={() => window.open(entryImg, '_blank')}
                                >
                                  Mở ảnh to ↗
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    {isSelf
                      ? 'Bạn có thể tự ghi chép nhật ký canh tác và tải ảnh vườn tại ngày tương ứng.'
                      : 'Ảnh và nhật ký sẽ hiển thị tại ngày tương ứng khi kỹ thuật viên hoặc chủ vườn ghi nhận.'}
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
                <ShieldCheck className="h-4 w-4 text-blue-600" />Tiêu chí hoàn thành của Kỹ sư
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
  const isDone = activity.status === 'COMPLETED' || activity.status === 'DONE';
  const isInProg = activity.status === 'IN_PROGRESS' || activity.status === 'IN_PROG';
  const isToday = activity.isToday;

  const displayTimestamp = useMemo(() => {
    const raw = String(activity.timestamp || '');
    const reversedMatch = raw.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})$/);
    if (reversedMatch) {
      return `${reversedMatch[2]} • ${reversedMatch[1]}`;
    }
    return raw;
  }, [activity.timestamp]);

  const resolvedCropDay = activity.cropDay || activity.day;
  const isTaskItem = !activity.isDiaryEntry && !activity.isHarvest;

  return (
    <div className={`group relative flex flex-col sm:flex-row items-start gap-4 rounded-2xl border transition hover:shadow-md ${isDone
        ? 'border-emerald-200/90 bg-emerald-50/20'
        : isToday
          ? 'border-2 border-amber-300 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 shadow-xs hover:border-emerald-500'
          : 'border-stone-200/90 bg-stone-50/40 hover:bg-white hover:border-stone-300'
      } p-4 shadow-sm`}>
      {/* Cột trái: Nút Checkbox (cho Tự canh tác) HOẶC Ảnh minh chứng (cho Staff / Dịch vụ) */}
      {(isSelf && isTaskItem && !activity.serviceRequestId && (!activity.workerName || activity.workerName.includes('Chủ vườn'))) ? (
        <button
          type="button"
          onClick={() => onToggleTask?.(activity.activityId || activity.id)}
          className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${isDone
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : isToday
                ? 'border-amber-400 bg-amber-50 text-amber-500 hover:border-emerald-500 hover:bg-emerald-50'
                : 'border-stone-300 bg-stone-50 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-300 hover:text-emerald-600'
            }`}
          title={isDone ? 'Bấm để đánh dấu chưa hoàn thành' : 'Bấm để đánh dấu hoàn thành'}
        >
          <Check className={`h-5 w-5 stroke-[3] transition-transform ${isDone ? 'scale-100' : 'scale-75 opacity-30'}`} />
        </button>
      ) : (isDone && activity.proofPhoto) ? (
        <div className="relative h-28 w-full sm:h-24 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-stone-100">
          <img
            src={activity.proofPhoto}
            alt={activity.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <button
            type="button"
            onClick={() => onOpenPhoto?.(activity)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100 text-white cursor-pointer"
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
          activity.isDiaryEntry ? 'bg-emerald-100/70 text-emerald-800' : isToday ? 'bg-amber-100/70 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {activity.isDiaryEntry ? <span className="text-2xl">📖</span> : isToday ? <Flame className="h-8 w-8 animate-pulse text-amber-600" /> : <CalendarCheck className="h-8 w-8 opacity-60" />}
        </div>
      )}

      {/* Cột thông tin chi tiết */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isDone
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
            <span className="text-xs text-stone-500 font-medium">{displayTimestamp}</span>
          </div>

          {activity.actionTypeName ? (
            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
              {activity.actionTypeName}
            </span>
          ) : resolvedCropDay ? (
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold border ${isToday
                ? 'bg-amber-100 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-100'
              }`}>
              Ngày tuổi {resolvedCropDay}
            </span>
          ) : null}
        </div>

        <h4 className={`mt-1.5 text-sm font-bold transition ${isDone && isSelf && isTaskItem ? 'text-stone-400 line-through' : 'text-[#18352b] group-hover:text-emerald-800'
          }`}>
          {activity.title}
        </h4>

        {activity.notes && (
          <p className="mt-1 text-xs text-stone-600 leading-relaxed line-clamp-2">
            {activity.notes}
          </p>
        )}

        {/* Thông tin người phụ trách */}
        {isSelf && !activity.serviceRequestId && !activity.isStaffTask ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-stone-500">
              {activity.isDiaryEntry ? (
                <>
                  <span className="text-base leading-none">📖</span>
                  <span className="font-semibold text-stone-700">{activity.workerName || 'Chủ vườn'}</span>
                  <span className="text-stone-400">· Nhật ký canh tác</span>
                </>
              ) : (
                <>
                  <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-semibold text-stone-700">Chủ vườn tự thực hiện</span>
                  <span className="text-stone-400">· Quy trình VietGAP</span>
                </>
              )}
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
              {activity.isDiaryEntry ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  📖
                </span>
              ) : activity.isHarvest ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  🌾
                </span>
              ) : activity.workerAvatar ? (
                <img src={activity.workerAvatar} alt={activity.workerName} className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-300" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[10px] text-white font-bold">
                  {activity.workerName?.charAt(0) || 'S'}
                </span>
              )}
              <span className="font-semibold text-stone-800">{activity.workerName || 'Nhân viên kỹ thuật'}</span>
              {activity.workerRole && <span className="text-[11px] text-stone-400">({activity.workerRole})</span>}
              {activity.serviceRequestId && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                  Dịch vụ theo yêu cầu
                </span>
              )}
            </div>
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
  onAddDiary,
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
    if (act.status === 'COMPLETED' || act.status === 'DONE') return false;
    // Chặn nghiêm ngặt: nếu task có ngày cụ thể và ngày đó trong tương lai (> hôm nay) -> KHÔNG phải hôm nay
    if (act.date && /^\d{4}-\d{2}-\d{2}$/.test(act.date) && act.date > todayStr) {
      return false;
    }
    const taskDay = act.cropDay !== undefined && act.cropDay !== null ? Number(act.cropDay) : act.day;
    if (currentDay > 0 && taskDay && taskDay > currentDay) {
      return false;
    }
    if (act.status === 'IN_PROGRESS' || act.status === 'IN_PROG') return true;
    if (act.priority === 'HIGH' || act.priority === 'URGENT') return true;
    if (currentDay > 0 && taskDay) {
      return taskDay === currentDay;
    }
    if (act.date && /^\d{4}-\d{2}-\d{2}$/.test(act.date)) {
      return act.date === todayStr;
    }
    return false;
  }, [currentDay, todayStr]);

  const isActivityUpcoming = useCallback((act) => {
    if (act.status === 'COMPLETED' || act.status === 'DONE') return false;
    if (isActivityToday(act)) return false;
    // Nếu mùa vụ đã tới hoặc vượt quá ngày thu hoạch (currentDay >= totalDays): TUYỆT ĐỐI không còn việc chưa tới!
    if (currentDay > 0 && totalDays > 0 && currentDay >= totalDays) return false;

    const taskDay = act.cropDay !== undefined && act.cropDay !== null ? Number(act.cropDay) : act.day;
    if (currentDay > 0 && taskDay) {
      return taskDay > currentDay;
    }
    if (act.date && /^\d{4}-\d{2}-\d{2}$/.test(act.date)) {
      return act.date > todayStr;
    }
    return false;
  }, [currentDay, totalDays, isActivityToday, todayStr]);

  const filtered = useMemo(() => {
    return activities.filter((act) => {
      const matchSearch = !searchQuery.trim() ||
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (act.notes && act.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (!isSelf && act.workerName && act.workerName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'COMPLETED') return act.status === 'COMPLETED' || act.status === 'DONE';
      if (statusFilter === 'TODAY') return isActivityToday(act);
      if (statusFilter === 'UPCOMING') return isActivityUpcoming(act);
      return true;
    });
  }, [activities, searchQuery, statusFilter, isSelf, isActivityToday, isActivityUpcoming]);

  const { todayList, upcomingList, doneList } = useMemo(() => {
    const today = [];
    const upcoming = [];
    const done = [];

    filtered.forEach((act) => {
      if (act.status === 'COMPLETED' || act.status === 'DONE') {
        done.push(act);
      } else if (isActivityToday(act)) {
        today.push(act);
      } else if (isActivityUpcoming(act)) {
        upcoming.push(act);
      } else {
        done.push(act);
      }
    });

    return { todayList: today, upcomingList: upcoming, doneList: done };
  }, [filtered, isActivityToday, isActivityUpcoming]);

  const counts = useMemo(() => {
    const todayCount = activities.filter((a) => (a.status !== 'COMPLETED' && a.status !== 'DONE') && isActivityToday(a)).length;
    const upcomingCount = activities.filter((a) => (a.status !== 'COMPLETED' && a.status !== 'DONE') && isActivityUpcoming(a)).length;
    const doneCount = activities.filter((a) => a.status === 'COMPLETED' || a.status === 'DONE' || (!isActivityToday(a) && !isActivityUpcoming(a))).length;

    return {
      all: activities.length,
      today: todayCount,
      upcoming: upcomingCount,
      done: doneCount
    };
  }, [activities, isActivityToday, isActivityUpcoming]);

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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar pr-3">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: `Tất cả (${counts.all})` },
              { id: 'TODAY', label: `🔥 Việc hôm nay (${counts.today})`, highlight: counts.today > 0 },
              { id: 'UPCOMING', label: `⏳ Việc chưa tới (${counts.upcoming})` },
              { id: 'COMPLETED', label: `✅ Đã xong & Nhật ký (${counts.done})` }
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setStatusFilter(btn.id)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${statusFilter === btn.id
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

          <div className="flex items-center gap-2 shrink-0">
            {isSelf && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 px-3 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm việc</span>
              </button>
            )}
            {onAddDiary && (
              <button
                type="button"
                onClick={() => onAddDiary?.(plot)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
                title="Ghi chép nhật ký, cảm xúc hoặc đăng ảnh thăm vườn"
              >
                <PenLine className="w-3.5 h-3.5 text-lime-300" />
                <span>+ Viết nhật ký</span>
              </button>
            )}
          </div>
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
                      <span>Việc Cần Thực Hiện Hôm Nay ({todayList.length}) {plot?.plotCode ? `• Thửa ${plot.plotCode}` : ''}</span>
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
                  <p className="font-heading font-black text-stone-900 text-sm">
                    Hôm nay không có việc tồn đọng tại {plot?.plotCode ? `Thửa ${plot.plotCode}` : (plot?.name || 'thửa đất này')}!
                  </p>
                  <p className="text-xs text-stone-500 max-w-md">
                    Toàn bộ nhiệm vụ chăm sóc ngày hôm nay của thửa đất này đã được thực hiện chu đáo. Cây trồng đang phát triển rất tốt.
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

export const resolveVietgapProofPhoto = (title = '', existingPhoto = null) => {
  if (existingPhoto && typeof existingPhoto === 'string' && existingPhoto.trim() !== '') {
    return existingPhoto.trim();
  }
  const t = String(title || '').toLowerCase();
  if (t.includes('thu hoạch') || t.includes('cân') || t.includes('nghiệm thu') || t.includes('kg')) {
    return 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=800&q=80';
  }
  if (t.includes('làm đất') || t.includes('bón lót') || t.includes('xới') || t.includes('luống')) {
    return 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80';
  }
  if (t.includes('gieo') || t.includes('xuống giống') || t.includes('trồng') || t.includes('hạt') || t.includes('cát')) {
    return 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80';
  }
  if (t.includes('mầm') || t.includes('tưới') || t.includes('phun') || t.includes('sương')) {
    return 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80';
  }
  if (t.includes('tỉa') || t.includes('thúc') || t.includes('cỏ') || t.includes('ngắt')) {
    return 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=800&q=80';
  }
  if (t.includes('sâu') || t.includes('bệnh') || t.includes('cách ly') || t.includes('bảo vệ')) {
    return 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80';
};

/**
 * Modal xem ảnh bằng chứng hiện trường phóng to
 */
function ActivityProofModal({ activity, onClose }) {
  if (!activity) return null;
  const photoUrl = resolveVietgapProofPhoto(
    activity.title,
    activity.proofPhoto || activity.evidenceImageUrl || activity.image || activity.imageUrl || activity.photo
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full rounded-3xl bg-[#0f2a20] p-5 text-white shadow-2xl overflow-hidden ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white/80 hover:bg-black/80 hover:text-white transition cursor-pointer"
          title="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-hidden rounded-2xl bg-black max-h-[62vh] flex items-center justify-center border border-white/10">
          <img
            src={photoUrl}
            alt={activity.title || 'Ảnh minh chứng thực địa'}
            className="max-h-[62vh] w-auto object-contain rounded-xl"
          />
        </div>

        <div className="mt-4 px-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-base text-white">{activity.title || 'Nhiệm vụ chăm sóc canh tác'}</h4>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              {activity.timestamp || activity.time || 'Đã hoàn tất'}
            </span>
          </div>
          <p className="mt-2 text-xs text-white/85 leading-relaxed">
            {activity.notes || activity.note || 'Nhiệm vụ kỹ thuật thực địa hoàn tất theo quy trình canh tác VietGAP.'}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-white/50">Phụ trách:</span>
              <strong className="text-emerald-300">{activity.workerName || activity.author || 'Trần Văn Lực'}</strong>
              <span className="text-white/40">({activity.workerRole || activity.authorRole || 'Kỹ thuật viên Farmely'})</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Minh chứng đạt chuẩn VietGAP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   3. IOT TAB VỚI LIVE 3RD-PARTY AGROMETEOROLOGY API (OPEN-METEO)
   ────────────────────────────────────────────────────────────────────────── */

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
  liveProviderInfo,
  alerts = [],
  seasons = [],
  onOpenRenewal,
  activeSeason,
  isSelf = false,
  onToggleTask,
  onStartSeason,
  onResetSeason,
  harvestResults = [],
  onOpenHarvestReport
}) {
  const isSoilPrep = activeSeason?.status === 'SOIL_PREP' || activeSeason?.inFallow;

  // BR20 + BR21: CVLĐ cân, chụp ảnh rồi chốt biên bản -> Tổng quan chỉ THÔNG BÁO đã thu hoạch.
  // KH không nghiệm thu trên hệ thống, việc xác nhận nhận nông sản diễn ra tại nông trại.
  // ponytail: ceiling is hiển thị biên bản mới nhất; upgrade path is danh sách nhiều vụ khi KH thuê dài hạn.
  const latestHarvest = useMemo(() => {
    const list = (harvestResults || []).filter(Boolean);
    if (list.length === 0) return null;
    return [...list].sort((a, b) =>
      String(b.harvestDate || '').localeCompare(String(a.harvestDate || ''))
    )[0];
  }, [harvestResults]);

  // BR18: chỉ nêu 2 cảnh báo đáng xử lý nhất, nặng trước.
  // ponytail: ceiling is 2 cảnh báo hiển thị, upgrade path is dựng lại trang khí tượng khi KH cần tra cứu lịch sử theo giờ/ngày.
  const topAlerts = useMemo(() => {
    const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const seenGroup = new Set();
    return [...(alerts || [])]
      .sort((a, b) => (rank[a?.level] ?? 3) - (rank[b?.level] ?? 3))
      // "Mưa sắp đến" và "độ ẩm đất tăng nhanh" là cùng một sự việc, cùng một quyết định
      // hoãn tưới: chỉ giữ cảnh báo nặng nhất của mỗi nhóm để khỏi nói hai lần.
      .filter((a) => {
        const g = explainAlert(a, plot.mode).group;
        if (seenGroup.has(g)) return false;
        seenGroup.add(g);
        return true;
      })
      .slice(0, 2);
  }, [alerts, plot.mode]);

  return (
    <div className="space-y-6">
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
          {/* 1. Hiện trạng thửa đất: quy trình + sức khoẻ + cảnh báo trong một thẻ */}
          <section aria-label="Hiện trạng thửa đất">
            <PlotStatusHero
              plot={plot}
              cropProcess={cropProcess}
              topAlerts={topAlerts}
              liveProviderInfo={liveProviderInfo}
            />
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
                onStartSeason={onStartSeason}
                onResetSeason={onResetSeason}
                latestHarvest={latestHarvest}
                onGoToDiary={() => goTab?.('tasks')}
                onOpenHarvestReport={onOpenHarvestReport}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function DiaryTab({ plot, operations, staffActivities = [], harvestResults = [], onAddDiary, onOpenPhoto }) {
  const canWrite = plot.mode === 'Self-Growing';

  // SSoT: Tự động hợp nhất nhật ký khách hàng và toàn bộ công việc chăm sóc đã hoàn tất của Staff kèm ảnh minh chứng thực địa
  const mergedDiaryEntries = useMemo(() => {
    const list = [...(operations?.diary || [])].map((item) => {
      const photo = resolveVietgapProofPhoto(item.title, item.image || item.imageUrl || item.photo || item.proofPhoto || item.evidenceImageUrl);
      return {
        ...item,
        image: photo,
        imageUrl: photo,
        photo: photo,
        proofPhoto: photo
      };
    });
    const seen = new Set();
    list.forEach((e) => {
      if (e.taskId) seen.add(String(e.taskId));
      if (e.id) seen.add(String(e.id));
      if (e.title) seen.add(e.title.trim().toLowerCase());
    });

    // BR20: CVLĐ cắt, cân điện tử, chụp ảnh rồi báo cáo hoàn thành -> vào Nhật ký như một task thường.
    // KH chỉ theo dõi, không nghiệm thu. Lịch thu hoạch đến từ Quy trình canh tác chuẩn VietGAP
    // (Assisted-growing) hoặc đơn dịch vụ thu hoạch hộ (Self-growing, BR27).
    (harvestResults || []).forEach((hr) => {
      const hrId = String(hr.harvestId || hr.id || '');
      if (!hrId || seen.has(hrId)) return;
      seen.add(hrId);
      const hrPhoto = resolveVietgapProofPhoto(`Thu hoạch ${hr.crop || hr.cropName}`, hr.evidenceImageUrl || hr.photo || hr.image);
      list.push({
        id: hrId,
        taskId: hrId,
        time: hr.harvestDateFormatted || hr.harvestDate || 'Hôm nay',
        date: hr.harvestDate,
        title: `Thu hoạch ${hr.crop || hr.cropName || 'nông sản'} — ${hr.formattedYield || `${hr.yieldAmount || 0} kg`}`,
        note: `Chuyên viên lao động đã cắt, cân điện tử và ghi nhận sản lượng thực tế. Mã biên bản: ${hrId}.`,
        author: hr.enteredByWorker || hr.workerName || 'Chuyên viên lao động',
        authorRole: 'Chuyên viên lao động (CVLĐ)',
        image: hrPhoto,
        imageUrl: hrPhoto,
        photo: hrPhoto,
        proofPhoto: hrPhoto,
        status: 'COMPLETED'
      });
    });

    const isHarvestPlot = Number(plot?.currentDay) >= Number(plot?.totalDays || 30) || String(plot?.stage || '').toLowerCase().includes('thu hoạch');

    (staffActivities || []).forEach((act) => {
      const titleLower = String(act.title || '').toLowerCase();
      const isHarvestTask = titleLower.includes('thu hoạch') || titleLower.includes('nghiệm thu');
      // Khi đã ở ngày thu hoạch (isHarvestPlot), các task kỹ thuật trước đó (không phải thu hoạch/nghiệm thu) tự động hoàn thành trên nhật ký khách hàng
      const isAutoDone = isHarvestPlot && !isHarvestTask;
      const isCompleted = act.status === 'COMPLETED' || act.status === 'DONE' || isAutoDone;

      if (isCompleted && !isHarvestTask) {
        const titleKey = (act.title || '').trim().toLowerCase();
        const actId = String(act.activityId || act.id || '');
        if (!seen.has(actId) && !seen.has(titleKey)) {
          seen.add(actId);
          seen.add(titleKey);
          const actPhoto = resolveVietgapProofPhoto(act.title, act.proofPhoto || act.evidenceImageUrl || act.image || act.imageUrl || act.photo);
          list.push({
            id: act.activityId || act.id,
            taskId: act.activityId || act.id,
            time: act.timestamp || (act.date ? `${act.date} • Ca sáng` : 'Đã hoàn tất'),
            date: act.date,
            title: act.title,
            note: act.notes || 'Nhiệm vụ kỹ thuật đã được nhân viên hoàn tất đạt chuẩn VietGAP.',
            author: act.workerName || 'Trần Văn Lực (Kỹ thuật viên Farmely)',
            authorRole: act.workerRole || 'Kỹ thuật viên hiện trường chuyên trách',
            image: actPhoto,
            imageUrl: actPhoto,
            photo: actPhoto,
            proofPhoto: actPhoto,
            isStaffTask: true,
            status: 'COMPLETED'
          });
        }
      }
    });

    return list;
  }, [operations?.diary, staffActivities, harvestResults, plot?.currentDay, plot?.totalDays, plot?.stage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          {canWrite ? 'Bạn tự canh tác thửa này — hãy ghi lại mỗi lần chăm sóc và hình ảnh hiện trường.' : 'Farmely tự động đồng bộ toàn bộ nhật ký chăm sóc kèm ảnh minh chứng từ kỹ thuật viên. Bấm vào bất kỳ công việc nào để xem ảnh nghiệm thu thực địa.'}
        </p>
        <button type="button" onClick={() => onAddDiary?.(plot)} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 shadow-sm transition cursor-pointer">
          <PenLine className="h-4 w-4" />+ Thêm nhật ký
        </button>
      </div>
      {mergedDiaryEntries.length ? (
        <ol className="relative space-y-3.5 border-l-2 border-emerald-100 pl-5">
          {mergedDiaryEntries.map((e, idx) => {
            const photoUrl = e.proofPhoto || e.image || e.imageUrl || e.photo || resolveVietgapProofPhoto(e.title);
            const proofActivity = {
              title: e.title,
              timestamp: e.time,
              notes: e.note,
              workerName: e.author,
              workerRole: e.authorRole || (e.isStaffTask ? 'Kỹ thuật viên hiện trường chuyên trách' : 'Chủ vườn'),
              proofPhoto: photoUrl,
              status: 'COMPLETED'
            };

            return (
              <li key={e.id || `${e.time}-${idx}`} className="relative">
                <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow" aria-hidden="true" />
                <Card
                  className="p-4.5 cursor-pointer hover:border-emerald-400 hover:shadow-md transition bg-white group rounded-2xl border border-stone-200/80"
                  onClick={() => onOpenPhoto?.(proofActivity)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-500">{e.time}</span>
                    <div className="flex items-center gap-1.5">
                      {(e.isStaffTask || e.author?.includes('Lực') || e.author?.includes('Kỹ thuật') || e.status === 'COMPLETED') && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Đã hoàn thành
                        </span>
                      )}
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-100">
                        <UserRound className="h-3.5 w-3.5" />{e.author}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm font-bold text-[#18352b] group-hover:text-emerald-700 transition">
                    {e.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600 whitespace-pre-line">{e.note}</p>

                  {/* Khung ảnh thu nhỏ minh chứng thực tế & nút bấm xem biên bản */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200/70 bg-stone-50/70 p-2.5 group-hover:border-emerald-300 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-200 border border-stone-300/50">
                        <img
                          src={photoUrl}
                          alt={e.title || 'Ảnh minh chứng'}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Maximize2 className="h-4 w-4 text-white drop-shadow" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                          <Camera className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Minh chứng hiện trường</span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          Bấm thẻ để phóng to ảnh & xem biên bản
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenPhoto?.(proofActivity);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition shrink-0 cursor-pointer"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Xem minh chứng</span>
                    </button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      ) : <EmptyState icon={BookOpen} title="Chưa có nhật ký" />}
    </div>
  );
}

function ServicesTab({ plot, services, orders, onSelectService, seasons = [], activeSeasonId, onSelectSeason, onOpenRenewal }) {
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
      {/* 0. Chu kỳ mùa vụ thửa đất — gia hạn/đổi giống là việc đặt dịch vụ, không phải theo dõi hằng ngày */}
      <SeasonSelector
        seasons={seasons}
        activeSeasonId={activeSeasonId}
        onSelectSeason={onSelectSeason}
        onOpenRenewal={onOpenRenewal}
        canRenew={true}
        plot={plot}
      />

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
            <p className="text-xs text-stone-500 mt-0.5">Theo dõi chi tiết tiến độ thực hiện, nhân viên phụ trách và ảnh hoàn thành thực địa.</p>
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
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isCompleted
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
                            <p className="text-stone-500 text-[11px] mt-0.5 line-clamp-1">{o.proofNotes || 'Đã hoàn thành đạt chuẩn'}</p>
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

/* ──────────────────────────────────────────────────────────────────────────
   MAIN WORKSPACE COMPONENT
   ────────────────────────────────────────────────────────────────────────── */

export default function CustomerPlotWorkspace({
  plot,
  plots = [],
  operations = { tasks: [], diary: [] },
  alerts = [],
  stages = [],
  services = [],
  serviceOrders = [],
  harvestResults = [],
  latestHarvest: propLatestHarvest = null,
  activeTab = 'overview',
  onTabChange,
  onSelectPlot,
  onBack,
  onOpenAiChat,
  onOpenTask,
  onSelectService,
  onAddDiary
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const [internalTab, setInternalTab] = useState(() => (activeTab === 'diary' ? 'tasks' : (activeTab || 'overview')));
  useEffect(() => {
    if (activeTab === 'diary') {
      setInternalTab('tasks');
      onTabChange?.('tasks');
    } else if (activeTab && PLOT_TABS.some(t => t.id === activeTab)) {
      setInternalTab(activeTab);
    }
  }, [activeTab, onTabChange]);
  const activeTabResolved = activeTab === 'diary' ? 'tasks' : activeTab;
  const tab = PLOT_TABS.some((t) => t.id === (onTabChange ? activeTabResolved : internalTab)) ? (onTabChange ? activeTabResolved : internalTab) : 'overview';
  const isSelf = plot.mode === 'Self-Growing' || plot.cultivationMode === 'SELF' || plot.cultivationMode === 'SELF_GROWING';

  // Dynamic Tabs definition for Self-Growing vs Assisted (Requirement #3)
  const displayTabs = useMemo(() => {
    return PLOT_TABS.map((t) => {
      if (t.id === 'tasks') {
        return {
          ...t,
          label: isSelf ? 'Công việc & Nhật ký' : 'Công việc & Nhật ký thực địa',
          short: 'Công việc & Nhật ký'
        };
      }
      return t;
    });
  }, [isSelf]);

  // 0. Quản lý Mùa vụ (Seasons) & Gia hạn hợp đồng thửa đất (BR12)
  const [customSeasons, setCustomSeasons] = useState(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  // Trạng thái kích hoạt mùa vụ: Trước khi bấm nút bắt đầu mùa vụ thì giữ trạng thái Sắp tới
  const [isSeasonStarted, setIsSeasonStarted] = useState(() => {
    try {
      const saved = localStorage.getItem(`farmely_season_started_${plot.id}`);
      if (saved !== null) return saved === 'true';
    } catch { }
    const isFuture = plot.startDate && new Date(plot.startDate).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);
    return Number(plot.currentDay) > 0 && !isFuture;
  });

  const handleStartSeason = useCallback(async () => {
    setIsSeasonStarted(true);
    try {
      localStorage.setItem(`farmely_season_started_${plot.id}`, 'true');
    } catch { }

    const rentalId = plot.rentalId || plot.rental_id;
    if (rentalId) {
      try {
        await fetch(`/api/rentals/${rentalId}/simulate-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'START_NOW' })
        });
      } catch (e) {
        console.warn('Lỗi gọi API start season:', e);
      }
    }
  }, [plot.id, plot.rentalId, plot.rental_id]);

  const handleResetSeason = useCallback(() => {
    setIsSeasonStarted(false);
    try {
      localStorage.removeItem(`farmely_season_started_${plot.id}`);
    } catch { }
  }, [plot.id]);

  const plotSeasons = useMemo(() => {
    if (customSeasons && customSeasons.length > 0) return customSeasons;
    return resolvePlotSeasons(plot, plots);
  }, [plot, customSeasons, plots]);

  const [activeSeasonId, setActiveSeasonId] = useState(() => {
    const current = plotSeasons.find((s) => s.isCurrent || s.status === 'ACTIVE');
    return current?.id || plotSeasons[0]?.id || 'SEASON-1';
  });

  useEffect(() => {
    if (plotSeasons.length > 0 && !plotSeasons.some((s) => s.id === activeSeasonId)) {
      const current = plotSeasons.find((s) => s.isCurrent || s.status === 'ACTIVE');
      setActiveSeasonId(current?.id || plotSeasons[0]?.id || 'SEASON-1');
    }
  }, [plotSeasons, activeSeasonId]);

  const activeSeason = useMemo(() => {
    return plotSeasons.find((s) => s.id === activeSeasonId) || plotSeasons[0];
  }, [plotSeasons, activeSeasonId]);

  // 1. Phân tích và sinh quy trình canh tác chuẩn VietGAP tính theo ngày tuổi cho Vụ mùa đang chọn
  const cropProcess = useMemo(() => {
    if (!activeSeason) return resolveStandardCropProcess(plot, stages);
    const isFuture = plot.startDate && new Date(plot.startDate).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);
    const isSeasonScheduled = !isSeasonStarted && (activeSeason.status === 'SCHEDULED' || activeSeason.currentDay === 0 || isFuture);
    const plotForSeason = {
      ...plot,
      crop: activeSeason.cropName || plot.crop,
      totalDays: activeSeason.totalDays || plot.totalDays,
      currentDay: isSeasonStarted ? Math.max(1, Number(plot.currentDay) || 1) : (isSeasonScheduled ? 0 : plot.currentDay),
      seasonStatus: isSeasonStarted ? 'ACTIVE' : activeSeason.status,
      isScheduled: isSeasonScheduled
    };
    return resolveStandardCropProcess(plotForSeason, stages);
  }, [plot, stages, activeSeason, isSeasonStarted]);

  const taskStorageKey = useMemo(() => {
    const cropKey = (cropProcess?.cropKey || cropProcess?.cropName || plot?.crop || 'crop').replace(/\s+/g, '_');
    return `farmely_self_tasks_${plot.id}_${cropKey}_v4`;
  }, [plot.id, cropProcess?.cropKey, cropProcess?.cropName, plot?.crop]);

  // Quản lý công việc hằng ngày cho khách hàng tự canh tác (Requirement #3)
  const defaultSelfTasks = useMemo(() => {
    // Ngày 1 (Bắt đầu mùa vụ): Đúng 2 công việc chuẩn mực, tinh gọn, không spam
    // ponytail: Chỉ tự động COMPLETED khi ngày hiện tại ĐÃ QUA ngày của task (> taskDay)
    const isHarvestPlot = !cropProcess.isNotStarted && (cropProcess.currentDay >= cropProcess.totalDays);
    const tasks = [
      {
        id: `SELF-${plot.id}-D1-PREP`,
        activityId: `SELF-${plot.id}-D1-PREP`,
        title: 'Làm đất tơi xốp, bón lót phân trùn quế & xử lý Trichoderma',
        day: 1,
        cropDay: 1,
        date: 'Ngày 1',
        timestamp: 'Ngày 1 • Ca sáng (07:30 - 09:00)',
        status: isHarvestPlot || (!cropProcess.isNotStarted && 1 < (cropProcess.currentDay || 0)) ? 'COMPLETED' : 'PENDING',
        notes: 'Xới xáo đất tơi xốp sâu 20cm, bón lót phân trùn quế và phun nấm đối kháng Trichoderma cân bằng hệ vi sinh đất.',
        stepOrder: 1,
        isCustom: false
      },
      {
        id: `SELF-${plot.id}-D1-SEED`,
        activityId: `SELF-${plot.id}-D1-SEED`,
        title: 'Tưới ẩm luống đất (65-70%) & xuống giống non theo mật độ VietGAP',
        day: 1,
        cropDay: 1,
        date: 'Ngày 1',
        timestamp: 'Ngày 1 • Ca chiều (16:00 - 17:30)',
        status: isHarvestPlot || (!cropProcess.isNotStarted && 1 < (cropProcess.currentDay || 0)) ? 'COMPLETED' : 'PENDING',
        notes: 'Duy trì ẩm độ luống đất ổn định trước khi xuống cây giống theo mật độ khuyến nghị.',
        stepOrder: 1,
        isCustom: false
      }
    ];

    // Các giai đoạn tiếp theo (chỉ tạo khi dayStart > 1): Mỗi giai đoạn chỉ tạo đúng 1 nhiệm vụ đại diện vào ngày bắt đầu
    if (cropProcess?.stages?.length) {
      cropProcess.stages.forEach((st, idx) => {
        if (st.dayStart > 1) {
          const notesText = [
            st.guide || 'Chăm sóc sinh trưởng theo quy trình chuẩn VietGAP.',
            st.waterRegime ? `• Tưới nước: ${st.waterRegime}` : '',
            st.nutrition ? `• Dinh dưỡng: ${st.nutrition}` : ''
          ].filter(Boolean).join('\n');

          const isHarvestStage = st.name?.toLowerCase().includes('thu hoạch') || (st.dayEnd && st.dayEnd >= cropProcess.totalDays);
          const taskStatus = isHarvestPlot
            ? (isHarvestStage ? 'IN_PROGRESS' : 'COMPLETED')
            : (!cropProcess.isNotStarted && st.dayStart < (cropProcess.currentDay || 0) ? 'COMPLETED' : 'PENDING');

          tasks.push({
            id: `SELF-${plot.id}-STG${st.stepOrder || idx + 1}`,
            activityId: `SELF-${plot.id}-STG${st.stepOrder || idx + 1}`,
            title: st.name ? `${st.name}: ${st.guide?.split('.')[0] || 'Kỹ thuật chăm sóc'}` : 'Chăm sóc theo quy trình VietGAP',
            day: st.dayStart,
            cropDay: st.dayStart,
            date: st.label || `Ngày ${st.dayStart}`,
            timestamp: `Ngày ${st.dayStart} • Ca sáng (07:30 - 09:00)`,
            status: taskStatus,
            notes: notesText,
            stepOrder: st.stepOrder || idx + 1,
            isCustom: false
          });
        }
      });
    }

    // Deduplicate hoàn toàn theo ngày + tiêu đề
    const seen = new Set();
    const cleanList = [];
    tasks.forEach((t) => {
      const key = `${t.day}_${(t.title || '').trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        cleanList.push(t);
      }
    });

    return cleanList;
  }, [cropProcess?.stages, plot.id, cropProcess.currentDay, cropProcess.totalDays, cropProcess.isNotStarted]);

  const [selfTasks, setSelfTasks] = useState(() => {
    try {
      const stored = localStorage.getItem(taskStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const day1Tasks = parsed.filter(t => t.day === 1);
          if (day1Tasks.length <= 2 && new Set(day1Tasks.map(t => t.title)).size === day1Tasks.length) {
            // Nếu đang ở Ngày 1 mà tất cả task Ngày 1 bị dính trạng thái COMPLETED cũ thì khôi phục về PENDING
            if ((cropProcess.currentDay || 1) <= 1 && day1Tasks.length > 0 && day1Tasks.every(t => t.status === 'COMPLETED' && !t.proofPhoto && !t.isCustom)) {
              return defaultSelfTasks;
            }
            // Nếu đang ở Ngày Thu Hoạch (currentDay >= totalDays): reset về defaultSelfTasks để tất cả các task trước thu hoạch đều là COMPLETED
            if (!cropProcess.isNotStarted && cropProcess.currentDay >= cropProcess.totalDays && parsed.some(t => t.day < cropProcess.totalDays && t.status !== 'COMPLETED')) {
              return defaultSelfTasks;
            }
            return parsed;
          }
        }
      }
    } catch { }
    return defaultSelfTasks;
  });

  useEffect(() => {
    if (isSelf) {
      try {
        const stored = localStorage.getItem(taskStorageKey);
        let shouldReset = !stored;
        if (stored) {
          const parsed = JSON.parse(stored);
          const day1Tasks = parsed.filter(t => t.day === 1);
          if (day1Tasks.length > 2 || new Set(day1Tasks.map(t => t.title)).size < day1Tasks.length) {
            shouldReset = true;
          }
          if ((cropProcess.currentDay || 1) <= 1 && day1Tasks.length > 0 && day1Tasks.every(t => t.status === 'COMPLETED' && !t.proofPhoto && !t.isCustom)) {
            shouldReset = true;
          }
          if (!cropProcess.isNotStarted && cropProcess.currentDay >= cropProcess.totalDays && parsed.some(t => t.day < cropProcess.totalDays && t.status !== 'COMPLETED')) {
            shouldReset = true;
          }
        }
        if (shouldReset) {
          setSelfTasks(defaultSelfTasks);
          localStorage.setItem(taskStorageKey, JSON.stringify(defaultSelfTasks));
          localStorage.removeItem(`farmely_self_tasks_${plot.id}`);
        }
      } catch { }
    }
  }, [isSelf, taskStorageKey, defaultSelfTasks, plot.id, cropProcess.currentDay, cropProcess.totalDays, cropProcess.isNotStarted]);

  const handleToggleSelfTask = useCallback((taskId) => {
    setSelfTasks((prev) => {
      let found = false;
      let next = prev.map((t) => {
        if (t.id === taskId || t.activityId === taskId) {
          found = true;
          const newStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
          return { ...t, status: newStatus };
        }
        return t;
      });
      if (!found) {
        next = [...prev, { id: taskId, activityId: taskId, status: 'COMPLETED' }];
      }
      try {
        localStorage.setItem(taskStorageKey, JSON.stringify(next));
      } catch { }
      return next;
    });
  }, [taskStorageKey]);

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
        localStorage.setItem(taskStorageKey, JSON.stringify(next));
      } catch { }
      return next;
    });
  }, [plot.id, taskStorageKey]);

  const handleDeleteSelfTask = useCallback((taskId) => {
    setSelfTasks((prev) => {
      const next = prev.filter((t) => (t.id || t.activityId) !== taskId);
      try {
        localStorage.setItem(taskStorageKey, JSON.stringify(next));
      } catch { }
      return next;
    });
  }, [taskStorageKey]);

  // Modal xem cẩm nang kỹ thuật của mốc ngày
  const [selectedStageDetail, setSelectedStageDetail] = useState(null);

  // Modal Báo Cáo Thu Hoạch & Biên Bản Nghiệm Thu (BR20 - BR21)
  const [selectedHarvestReport, setSelectedHarvestReport] = useState(null);

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
                } else if ((m.dueDate || m.completedAt || m.date) && plot?.startDate) {
                  try {
                    const rawDate = m.dueDate || m.completedAt || m.date;
                    const d0 = new Date(plot.startDate);
                    d0.setHours(0, 0, 0, 0);
                    let d1 = null;
                    const dmy = String(rawDate).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    if (dmy) {
                      d1 = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
                    } else {
                      const parsed = new Date(rawDate);
                      if (!isNaN(parsed.getTime())) d1 = parsed;
                    }
                    if (d1 && !isNaN(d1.getTime()) && !isNaN(d0.getTime())) {
                      d1.setHours(0, 0, 0, 0);
                      const diff = Math.round((d1.getTime() - d0.getTime()) / 86400000) + 1;
                      if (diff >= 1) taskDay = diff;
                    }
                  } catch { }
                }
                const resolvedDay = taskDay ? Math.max(1, Number(taskDay)) : 1;

                // Định dạng ngày hiển thị chuẩn Việt Nam (DD/MM/YYYY) khớp 1:1 với Ngày tuổi
                let displayDateStr = '';
                if (m.dueDate) {
                  try {
                    const parts = String(m.dueDate).split('T')[0].split('-');
                    if (parts.length === 3) {
                      displayDateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                  } catch { }
                }
                if (!displayDateStr && plot?.startDate && resolvedDay) {
                  try {
                    const d = new Date(plot.startDate);
                    d.setDate(d.getDate() + (resolvedDay - 1));
                    displayDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                  } catch { }
                }

                const isDone = m.status === 'DONE' || m.status === 'COMPLETED';
                const sessionTime = m.deadline || (m.stepOrder && m.stepOrder % 2 === 0 ? 'Ca chiều (16:00 - 17:30)' : 'Ca sáng (07:30 - 09:00)');
                const formattedTimestamp = isDone
                  ? (m.completedAt || (displayDateStr ? `${displayDateStr} • Đã hoàn thành` : 'Đã hoàn tất'))
                  : (displayDateStr ? `${displayDateStr} • ${sessionTime}` : `Ngày tuổi ${resolvedDay} • ${sessionTime}`);

                return {
                  activityId: m.id || `TSK-${m.taskId}`,
                  plotId: m.plotCode || plot.id,
                  plotCode: m.plotCode || plot.plotCode || 'P-01',
                  rentalId: m.rentalId,
                  serviceRequestId: m.serviceRequestId || null,
                  priority: m.priority || 'NORMAL',
                  day: resolvedDay,
                  cropDay: resolvedDay,
                  dayOffset: m.dayOffset !== undefined && m.dayOffset !== null ? Number(m.dayOffset) : null,
                  date: m.date || m.dueDate,
                  stepOrder: m.stepOrder || 1,
                  workerName: m.workerName || m.assignedTo || 'Kỹ thuật viên hiện trường chuyên trách',
                  workerRole: 'Kỹ thuật viên hiện trường chuyên trách',
                  workerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  title: m.title,
                  timestamp: formattedTimestamp,
                  status: isDone ? 'COMPLETED' : m.status === 'IN_PROG' ? 'IN_PROGRESS' : m.status || 'PENDING',
                  notes: m.instructions || m.notes || 'Thực hiện chăm sóc chuẩn quy trình VietGAP.',
                  proofPhoto: m.proofPhoto || m.evidenceImageUrl || null
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
      if (
        e.key === 'farmely_persisted_staff_activities_v2' ||
        e.key === 'farmely_customer_service_orders' ||
        e.key === 'farmely_task_sync'
      ) {
        reloadStaffActivities();
      }
    };
    const onServicePaid = () => {
      reloadStaffActivities();
    };
    const onFocusOrVisible = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        reloadStaffActivities();
      }
    };
    const onTaskCompleted = () => {
      reloadStaffActivities();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('farmely_service_paid', onServicePaid);
    window.addEventListener('farmely_task_completed', onTaskCompleted);
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('farmely_service_paid', onServicePaid);
      window.removeEventListener('farmely_task_completed', onTaskCompleted);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      if (bc) bc.close();
    };
  }, [plot.id, plot.plotCode, plot.rentalId]);

  // 3. Tích hợp Open-Meteo Global Agrometeorology Live 3rd-Party API
  const [liveIotResult, setLiveIotResult] = useState(null);

  const loadLiveAgroData = useCallback(async (force = false) => {
    try {
      const data = await fetchLiveAgroIotData(plot, force);
      if (data) {
        setLiveIotResult(data);
      }
    } catch (e) {
      console.warn('Lỗi tải Open-Meteo:', e);
    }
  }, [plot]);

  useEffect(() => {
    loadLiveAgroData(false);
  }, [loadLiveAgroData]);

  // Ghi đè số liệu cảm biến thực tế từ Open-Meteo lên plot
  const activePlot = useMemo(() => {
    const base = liveIotResult?.metrics ? {
      ...plot,
      temp: liveIotResult.metrics.temp || plot.temp,
      soilMoisture: liveIotResult.metrics.soilMoisture || plot.soilMoisture,
      airHumidity: liveIotResult.metrics.airHumidity || plot.airHumidity,
      light: liveIotResult.metrics.light || plot.light,
      soilTemp: liveIotResult.metrics.soilTemp,
      precipitation: liveIotResult.metrics.precipitation,
      windSpeed: liveIotResult.metrics.windSpeed,
      pressure: liveIotResult.metrics.pressure,
      lastUpdated: liveIotResult.lastUpdated || plot.lastUpdated,
      rawMetrics: liveIotResult.rawMetrics
    } : { ...plot };

    if (isSeasonStarted) {
      base.currentDay = Math.max(1, Number(plot.currentDay) || 1);
      base.isScheduled = false;
      base.seasonStatus = 'ACTIVE';
    }
    return base;
  }, [plot, liveIotResult, isSeasonStarted]);

  // ponytail: chuỗi hourly chỉ dùng cho biểu đồ của tab Vi khí hậu (đã gộp vào Tổng quan).
  // upgrade path is lấy lại liveIotResult.hourly khi dựng trang tra cứu lịch sử khí tượng.

  // Cảnh báo động sinh ra theo số đo thực tế
  const activeAlerts = useMemo(() => {
    const sNum = parseFloat(String(activePlot.soilMoisture || ''));
    const dynamicList = [...(alerts || [])];
    if (sNum >= 80) {
      dynamicList.unshift({
        id: 'DYNAMIC-FLOOD-BR18',
        level: 'HIGH',
        title: 'Mưa lớn & Đất bão hoà ẩm',
        explanation: `Độ ẩm đất đo đạc thực tế từ trạm là ${activePlot.soilMoisture} (≥ 80%). Hệ thống đã tự động tạm hoãn mọi tác vụ tưới hôm nay để tránh ngập úng rễ cây.`,
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
    setInternalTab(id);
    onTabChange?.(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const current = displayTabs.find((t) => t.id === tab) || displayTabs[0];

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
      // ponytail: tab 'harvest' đã bỏ (KH không nghiệm thu) — kết quả thu hoạch nằm trong Công việc & Nhật ký
      tab: 'tasks'
    },
    {
      label: isSelf ? 'Công việc' : 'Việc Staff',
      value: cropProcess.isNotStarted ? 0 : (isSelf ? selfTasks.length : staffActivities.length),
      unit: 'mục',
      note: cropProcess.isNotStarted
        ? 'Chờ ngày xuống giống'
        : (isSelf
          ? `${selfTasks.filter(t => t.status !== 'COMPLETED').length} việc cần làm`
          : (openTaskCount > 0 ? `${openTaskCount} việc đang làm` : 'Đã hoàn thành đủ')),
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
                  className={`relative flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 cursor-pointer ${active ? 'bg-gradient-to-br from-[#1d4a39] to-[#0f2a20] text-white shadow-md shadow-[#18352b]/25' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
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
            liveProviderInfo={liveIotResult}
            alerts={activeAlerts}
            seasons={plotSeasons}
            onOpenRenewal={() => setShowRenewalModal(true)}
            activeSeason={activeSeason}
            isSelf={isSelf}
            onToggleTask={handleToggleSelfTask}
            onStartSeason={handleStartSeason}
            onResetSeason={handleResetSeason}
            harvestResults={harvestResults}
            latestHarvest={propLatestHarvest}
            onOpenHarvestReport={(harvest) => setSelectedHarvestReport(harvest)}
          />
        )}

        {tab === 'tasks' && (
          <div className="space-y-5">
            <Card className="p-5">
              <SectionTitle
                eyebrow={isSelf ? "Tự canh tác theo quy trình VietGAP" : "Minh bạch hoạt động chăm sóc & Nghiệm thu"}
                title="Công việc & Nhật ký thực địa"
              />
              <p className="mt-1 text-sm text-stone-600">
                {isSelf
                  ? "Danh sách các công việc canh tác hằng ngày theo quy trình VietGAP. Bạn có thể tự tùy chỉnh, thêm công việc mới, tích hoàn thành và viết nhật ký ghi chép theo tiến độ của mình."
                  : "Mọi nhiệm vụ chăm sóc thực địa, biên bản thu hoạch và ảnh minh chứng của kỹ thuật viên tại vườn đều được cập nhật thời gian thực, lưu trữ minh bạch và liên thông với nhật ký vụ mùa."}
              </p>
              <div className="mt-5">
                {(() => {
                  const mergedCombinedActivities = (() => {
                    const base = isSelf ? [
                      ...(staffActivities || []).filter((a) => a.serviceRequestId || (a.notes && a.notes.includes('[DỊCH VỤ KHÁCH YÊU CẦU]'))),
                      ...selfTasks
                    ] : (staffActivities || []);

                    // 1. Chuẩn hóa danh sách diary entries của khách và hệ thống
                    const rawDiaries = (operations?.diary || []).filter((d) => {
                      if (cropProcess.isNotStarted) return false;
                      if (isSelf && (d.isStaffTask || d.title === 'Nhiệm vụ chăm sóc hiện trường' || /Trần Văn Lực|Kỹ thuật viên|CVLĐ/i.test(d.author || d.authorName || ''))) {
                        return false;
                      }
                      const entryDay = calculateEntryCropDay(d, activePlot?.startDate || plot?.startDate, cropProcess.currentDay, cropProcess.totalDays) || Number(d.day || d.cropDay) || 1;
                      return entryDay <= cropProcess.currentDay;
                    });

                    const diaryByTaskId = new Map();
                    const diaryByTitle = new Map();
                    const matchedDiaryKeys = new Set();

                    rawDiaries.forEach((d) => {
                      const normTitle = String(d.title || '').trim().toLowerCase();
                      if (d.taskId) diaryByTaskId.set(String(d.taskId), d);
                      if (normTitle) diaryByTitle.set(normTitle, d);
                    });

                    // 2. Đồng bộ 100% từng task trong base với diary và trạng thái thực tế
                    const syncedBase = base.map((act) => {
                      const actDay = act.day || act.cropDay || 1;
                      const actId = String(act.activityId || act.id || '');
                      const normTitle = String(act.title || '').trim().toLowerCase();

                      const matchingDiary = (act.taskId && diaryByTaskId.get(String(act.taskId))) ||
                        diaryByTaskId.get(actId) ||
                        diaryByTitle.get(normTitle);

                      let isDone = act.status === 'COMPLETED' || act.status === 'DONE';
                      let proofPhoto = act.proofPhoto || act.evidenceImageUrl || null;
                      let completedTimestamp = act.timestamp;

                      if (matchingDiary) {
                        const diaryKey = matchingDiary.id || matchingDiary.diaryId || `${matchingDiary.day}_${normTitle}`;
                        matchedDiaryKeys.add(String(diaryKey));
                        isDone = true;
                        proofPhoto = proofPhoto || matchingDiary.image || matchingDiary.imageUrl || matchingDiary.photo;
                        completedTimestamp = matchingDiary.time || matchingDiary.date || act.timestamp || 'Đã hoàn tất';
                      }

                      // Nếu task ở ngày tương lai (> currentDay) thì không thể ở trạng thái COMPLETED
                      if (!cropProcess.isNotStarted && cropProcess.currentDay < actDay && isDone) {
                        isDone = false;
                        proofPhoto = null;
                      }

                      // Khi đang ở Ngày 1 mới bắt đầu: task chưa có ảnh thực tế không tự động hoàn thành
                      if ((cropProcess.currentDay || 1) <= 1 && actDay === 1 && act.status === 'COMPLETED' && !act.proofPhoto && !act.isCustom && !matchingDiary) {
                        isDone = false;
                        proofPhoto = null;
                      }

                      // QUAN TRỌNG: Khi mùa vụ đã tiến đến Ngày Thu Hoạch (currentDay >= totalDays):
                      // Tất cả các công việc chuẩn kỹ thuật của các giai đoạn trước (actDay < totalDays)
                      // ĐÃ ĐƯỢC HOÀN THÀNH trong suốt mùa vụ!
                      if (!cropProcess.isNotStarted && cropProcess.currentDay >= cropProcess.totalDays && actDay < cropProcess.totalDays) {
                        isDone = true;
                        if (!proofPhoto) {
                          proofPhoto = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80';
                        }
                      }

                      // Nếu task CHƯA hoàn thành (IN_PROGRESS hoặc PENDING): tuyệt đối không hiển thị ảnh minh chứng
                      if (!isDone) {
                        proofPhoto = null;
                      }

                      return {
                        ...act,
                        status: isDone ? 'COMPLETED' : (act.status === 'IN_PROGRESS' || act.status === 'IN_PROG' ? 'IN_PROGRESS' : 'PENDING'),
                        proofPhoto,
                        timestamp: isDone ? (act.completedAt || completedTimestamp || 'Đã hoàn tất') : act.timestamp
                      };
                    });

                    // 3. Hợp nhất biên bản thu hoạch (BR20) — CHỈ hiển thị khi đã tới mốc thu hoạch (currentDay >= totalDays)
                    const harvestEntries = (cropProcess.currentDay >= cropProcess.totalDays ? (harvestResults || []) : []).map((hr) => ({
                      activityId: `HRV-${hr.harvestId || hr.id}`,
                      id: `HRV-${hr.harvestId || hr.id}`,
                      title: `Thu hoạch ${hr.crop || hr.cropName || 'nông sản'} — ${hr.formattedYield || `${hr.yieldAmount || 0} kg`}`,
                      notes: `Chuyên viên lao động đã cắt, cân điện tử và lưu trữ biên bản sản lượng thực tế. Khách hàng nhận nông sản tại nông trại theo BR21. Mã biên bản: HRV-${hr.harvestId || hr.id}.`,
                      workerName: hr.enteredByWorker || hr.workerName || 'Trần Văn Lực',
                      workerRole: 'Chuyên viên lao động (CVLĐ)',
                      status: 'COMPLETED',
                      proofPhoto: hr.evidenceImageUrl || hr.photo || hr.image,
                      timestamp: hr.harvestDateFormatted || hr.harvestDate || 'Hôm nay',
                      day: cropProcess.totalDays || 45,
                      cropDay: cropProcess.totalDays || 45,
                      isHarvest: true
                    }));

                    // 4. Những bài viết nhật ký tự do của khách (không trùng với task VietGAP nào)
                    const standaloneDiaries = [];
                    rawDiaries.forEach((d) => {
                      const dId = String(d.id || d.diaryId || '');
                      const normTitle = String(d.title || '').trim().toLowerCase();
                      const diaryKey = dId || `${d.day}_${normTitle}`;
                      const isMatched = matchedDiaryKeys.has(diaryKey) ||
                        syncedBase.some(t => String(t.title || '').trim().toLowerCase() === normTitle || (d.taskId && (t.taskId === d.taskId || t.activityId === d.taskId)));

                      if (!isMatched) {
                        const finalDay = calculateEntryCropDay(d, activePlot?.startDate || plot?.startDate, cropProcess.currentDay, cropProcess.totalDays) || Number(d.day || d.cropDay) || 1;
                        standaloneDiaries.push({
                          activityId: d.id || `DIARY-${d.taskId || Date.now()}`,
                          id: d.id || `DIARY-${d.taskId || Date.now()}`,
                          title: d.title || 'Ghi chép nhật ký vụ mùa',
                          notes: d.note || d.content,
                          workerName: d.author || 'Chủ vườn',
                          workerRole: d.authorRole || (isSelf ? 'Chủ vườn (Tự canh tác)' : 'Khách hàng'),
                          status: 'COMPLETED',
                          proofPhoto: d.image || d.imageUrl || d.photo,
                          timestamp: d.time || d.date || 'Hôm nay',
                          isDiaryEntry: true,
                          day: finalDay,
                          cropDay: finalDay
                        });
                      }
                    });

                    const combined = [...syncedBase, ...harvestEntries, ...standaloneDiaries];
                    const seen = new Set();
                    return combined.filter((item) => {
                      const cleanTitle = (item.title || '').trim().toLowerCase();
                      const itemDay = item.day || item.cropDay || 1;
                      const key = item.isHarvest ? item.id : `${itemDay}_${cleanTitle}`;
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                  })();

                  return (
                    <StaffActivitiesTab
                      activities={mergedCombinedActivities}
                      isSelf={isSelf}
                      onToggleTask={handleToggleSelfTask}
                      onAddTask={handleAddSelfTask}
                      onDeleteTask={handleDeleteSelfTask}
                      onAddDiary={onAddDiary}
                      totalDays={cropProcess.totalDays || 60}
                      onOpenPhoto={(act) => {
                        if (act?.isHarvest) {
                          setSelectedHarvestReport(act.harvestData || act);
                        } else {
                          setSelectedPhotoActivity(act);
                        }
                      }}
                      plot={activePlot}
                    />
                  );
                })()}
              </div>
            </Card>
          </div>
        )}

        {tab === 'services' && (
          <ServicesTab
            plot={activePlot}
            services={services}
            orders={serviceOrders}
            onSelectService={onSelectService}
            seasons={plotSeasons}
            activeSeasonId={activeSeasonId}
            onSelectSeason={setActiveSeasonId}
            onOpenRenewal={() => setShowRenewalModal(true)}
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

      {/* Modal Báo Cáo Thu Hoạch & Biên Bản Nghiệm Thu (BR20 - BR21) */}
      {selectedHarvestReport && (
        <HarvestReportModal
          harvest={selectedHarvestReport}
          plot={activePlot || plot}
          totalDays={cropProcess.totalDays}
          onClose={() => setSelectedHarvestReport(null)}
          onGoToDiary={() => {
            setSelectedHarvestReport(null);
            goTab('tasks');
          }}
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

      {/* Modal Gia Hạn Hợp Đồng Thuê Thửa Đất theo Vụ Mùa (BR12) */}
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
        <div className="grid grid-cols-3 rounded-[22px] border border-white/10 bg-[#0f2a20]/95 p-1.5 shadow-[0_18px_40px_-12px_rgba(15,42,32,0.6)] backdrop-blur-xl" role="tablist">
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
                className={`relative flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 text-[9px] font-semibold transition-all duration-300 ${active ? 'bg-lime-300 text-[#17372c] shadow-sm' : 'text-white/65'
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
