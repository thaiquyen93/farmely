import React from 'react';
import {
  Wrench,
  Clock,
  RotateCcw,
  FileText,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { resolveFallowProgress } from '../../services/cropStandardProcess';

/**
 * Component hiển thị thông báo Thửa đất đang trong thời gian Bảo trì 4 ngày (BR23).
 * Tiến độ bảo trì & các bước 4 ngày được tính trực tiếp từ ngày thu hoạch thực tế / dữ liệu mùa vụ.
 */
export default function SoilPrepView({
  plot = {},
  season = {},
  nextSeason,
  onOpenRenewal,
  onChangeCrop,
  latestHarvest,
  onOpenHarvestReport,
  onSimulateDay1,
  onBackToTimeline,
  isPendingApproval = false
}) {
  const plotCode = plot.plotCode || plot.mapPlotId || plot.code || plot.key || '—';
  const cropName = season.cropName || plot.crop || 'Vụ mùa hiện tại';
  const rawYield = latestHarvest?.formattedYield
    ? String(latestHarvest.formattedYield).replace(/\s*kg/gi, '').trim()
    : (latestHarvest?.yieldAmount ?? latestHarvest?.actualWeight ?? latestHarvest?.yieldKg ?? null);
  const yieldKg = rawYield !== null && rawYield !== undefined && String(rawYield).trim() !== ''
    ? String(rawYield)
    : null;

  const pendingSeason = nextSeason?.status === 'PENDING_APPROVAL' ? nextSeason : (isPendingApproval ? nextSeason : null);
  const isLocked = Boolean(pendingSeason || isPendingApproval || nextSeason?.status === 'PENDING_APPROVAL');

  const fallowProgress = resolveFallowProgress({ plot, season, nextSeason, latestHarvest });
  const totalFallowDays = fallowProgress.totalDays;
  const remainingBadgeText = fallowProgress.isCompleted
    ? 'Hoàn tất bảo dưỡng'
    : fallowProgress.remainingDays === 0
      ? 'Ngày cuối bảo dưỡng'
      : `Còn ${fallowProgress.remainingDays} ngày bảo dưỡng`;

  return (
    <div className="py-2 animate-fadeIn space-y-6">
      {/* THẺ BANNER BỰ: THỬA ĐẤT ĐANG TRONG THỜI GIAN BẢO TRÌ 4 NGÀY (MAINTENANCE - BR23) */}
      <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-6 sm:p-10 shadow-md text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Icon Cờ lê / Bảo trì bự */}
            <span className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-3xl bg-amber-500 text-white shadow-lg ring-8 ring-amber-100">
              <Wrench className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse" />
            </span>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-black tracking-wide text-white uppercase shadow-xs">
                  NGHỈ ĐẤT · BẢO TRÌ ĐẤT {totalFallowDays} NGÀY
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900 border border-amber-300">
                  Chu kỳ nghỉ đất
                </span>
                <span className="text-xs font-bold text-stone-500">
                  Thửa {plotCode}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight">
                Thửa Đất Đang Trong Thời Gian Bảo Trì {totalFallowDays} Ngày
              </h1>

              <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
                Vụ mùa <strong className="text-stone-800">{cropName}</strong>{' '}
                {yieldKg ? `vừa thu hoạch xong (${yieldKg} kg)` : 'đã hoàn tất chu kỳ thu hoạch'}. Thửa đất đang trong thời gian nghỉ đất {totalFallowDays} ngày để thu dọn gốc rễ, rải vôi khử trùng và phơi ải phục hồi đất trước khi gieo trồng vụ mới.
              </p>
            </div>
          </div>

          {/* Khối đếm ngày tính từ dữ liệu thu hoạch thực tế */}
          <div className="shrink-0 rounded-2xl bg-amber-100/90 border-2 border-amber-300 p-4 sm:p-5 text-center min-w-[180px] shadow-sm">
            <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
              <Clock className="h-4 w-4" /> Tiến độ bảo trì
            </span>
            <div className="my-1.5 font-heading text-2xl sm:text-3xl font-black text-amber-950">
              {fallowProgress.isCompleted
                ? `Hoàn tất ${totalFallowDays} / ${totalFallowDays} Ngày`
                : `Ngày ${fallowProgress.currentDay} / ${totalFallowDays} Ngày`}
            </div>
            <span className="inline-block rounded-md bg-amber-200/80 px-2.5 py-1 text-xs font-extrabold text-amber-900">
              {remainingBadgeText}
            </span>
          </div>
        </div>

        {/* Thanh trạng thái {totalFallowDays} ngày động theo tiến độ bảo trì */}
        <div className="mt-8 pt-6 border-t border-amber-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {fallowProgress.steps.map((step) => {
            if (step.status === 'COMPLETED') {
              return (
                <div
                  key={step.step}
                  className="p-3 rounded-xl bg-white/80 border border-emerald-200 flex items-center gap-2 text-emerald-800 font-bold"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{step.duration}: {step.shortTitle}</span>
                </div>
              );
            }
            if (step.status === 'IN_PROGRESS') {
              return (
                <div
                  key={step.step}
                  className="p-3 rounded-xl bg-amber-100 border-2 border-amber-400 flex items-center gap-2 text-amber-950 font-black shadow-xs"
                >
                  <Wrench className="h-4 w-4 text-amber-700 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>{step.duration}: {step.shortTitle} (Đang làm)</span>
                </div>
              );
            }
            return (
              <div
                key={step.step}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2 text-stone-500 font-medium"
              >
                <Clock className="h-4 w-4 text-stone-400 shrink-0" />
                <span>{step.duration}: {step.shortTitle}</span>
              </div>
            );
          })}
        </div>

        {/* THẺ KHÓA: ĐÃ GỬI GIA HẠN — CHỜ BAN QUẢN TRỊ (ADMIN) PHÊ DUYỆT (BR11b) */}
        {isLocked && (
          <div className="mt-6 rounded-2xl border-2 border-amber-400 bg-amber-100/70 p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white font-black text-xl shadow-xs">
                ⏳
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-700 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-2xs">
                    Đang chờ Admin duyệt hợp đồng
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                    Đã thanh toán VNPay 100%
                  </span>
                  <span className="rounded-full bg-amber-200/90 px-2.5 py-0.5 text-[10px] font-black text-amber-950 border border-amber-300">
                    Vụ {pendingSeason?.seasonNumber || 2}: {pendingSeason?.cropName || 'Giống mới'}
                  </span>
                </div>
                <h4 className="mt-1 font-heading font-black text-base text-amber-950">
                  Yêu Cầu Gia Hạn Đang Chờ Ban Quản Trị Phê Duyệt & Phân Bổ Nhân Sự
                </h4>
                <p className="mt-0.5 text-xs text-amber-900/90 leading-relaxed max-w-2xl">
                  Thửa đất đang trong thời gian nghỉ đất {totalFallowDays} ngày. Vụ mùa mới sẽ bắt đầu sau khi Ban Quản Trị phê duyệt hợp đồng và hoàn tất thời gian nghỉ đất.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Các nút hành động chính */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-amber-100">
          <div className="flex flex-wrap items-center gap-2.5">
            {onBackToTimeline && (
              <button
                type="button"
                onClick={onBackToTimeline}
                disabled={isLocked}
                className={`inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs font-bold transition shadow-2xs ${
                  isLocked ? 'bg-stone-100 text-stone-400 cursor-not-allowed border-stone-200' : 'bg-white text-stone-700 hover:bg-stone-50 cursor-pointer'
                }`}
                title={isLocked ? "Đang khóa chờ Admin duyệt hợp đồng" : "Quay lại xem dòng thời gian và nhật ký vụ vừa thu hoạch"}
              >
                <span>‹ Xem lại Dòng thời gian vụ mùa</span>
              </button>
            )}

            {onOpenHarvestReport && latestHarvest && (
              <button
                type="button"
                onClick={() => onOpenHarvestReport(latestHarvest)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition shadow-2xs cursor-pointer"
              >
                <FileText className="h-4 w-4 text-stone-600" />
                <span>Xem Biên bản thu hoạch{yieldKg ? ` (${yieldKg} kg)` : ''}</span>
              </button>
            )}

            {onSimulateDay1 && (
              isLocked ? (
                <button
                  type="button"
                  disabled={true}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-400 cursor-not-allowed shadow-none"
                  title="Cần Quản trị viên (Admin) phê duyệt hợp đồng gia hạn trước khi bắt đầu mùa vụ mới"
                >
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  <span>🔒 Chờ Admin duyệt để bắt đầu Vụ {pendingSeason?.seasonNumber || 2}</span>
                </button>
              ) : nextSeason ? (
                <button
                  type="button"
                  onClick={() => onSimulateDay1(nextSeason)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-800 transition shadow-2xs cursor-pointer"
                  title={`Bắt đầu canh tác Vụ ${nextSeason.seasonNumber} (Ngày 1)`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{`🌱 Bắt đầu Vụ ${nextSeason.seasonNumber} (Ngày 1)`}</span>
                </button>
              ) : null
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLocked ? (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 border border-amber-300 px-4 py-2.5 text-xs font-bold text-amber-900 cursor-not-allowed shadow-2xs">
                <Clock className="h-4 w-4 text-amber-700 animate-pulse" />
                <span>⏳ Đã gửi gia hạn Vụ {pendingSeason?.seasonNumber || 2}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenRenewal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-xs font-black text-white shadow-sm transition cursor-pointer"
              >
                <span>Gia hạn / Đăng ký vụ mới</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
