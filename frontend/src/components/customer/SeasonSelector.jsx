import React from 'react';
import { CheckCircle2, ChevronRight, Clock, Plus, Sparkles, Sprout, Wheat, Calendar } from 'lucide-react';

/**
 * Component thanh chuyển Vụ Mùa (Season Switcher) cho thửa đất
 * Cho phép khách hàng xem lịch sử các vụ đã thu hoạch, vụ đang canh tác,
 * giai đoạn nghỉ đất chuẩn VietGAP, và kích hoạt gia hạn vụ tiếp theo.
 */
export default function SeasonSelector({
  seasons = [],
  activeSeasonId,
  onSelectSeason,
  onOpenRenewal,
  canRenew = true,
  plot
}) {
  if (!seasons || seasons.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-r from-stone-50 via-white to-emerald-50/30 p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Tiêu đề & Thông tin chu kỳ */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
            <Sprout className="h-4 w-4 text-lime-300" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                Chu kỳ mùa vụ thửa đất
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                {seasons.length} Vụ canh tác
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Chuyển đổi để xem quy trình, nhật ký và minh chứng kỹ thuật của từng vụ mùa.
            </p>
          </div>
        </div>

        {/* Danh sách các Vụ & Nút Gia Hạn */}
        <div className="flex flex-wrap items-center gap-2">
          {seasons.map((season, index) => {
            const isSelected = activeSeasonId === season.id;
            const isCompleted = season.status === 'COMPLETED';
            const isActive = season.status === 'ACTIVE';
            const isSoilPrep = season.status === 'SOIL_PREP' || season.inFallow;
            const isScheduled = season.status === 'SCHEDULED' || (!isCompleted && !isActive && !isSoilPrep);

            return (
              <React.Fragment key={season.id}>
                {/* Nút Vụ mùa */}
                <button
                  type="button"
                  onClick={() => onSelectSeason?.(season.id)}
                  className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-300 scale-[1.02]'
                      : isCompleted
                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-200'
                      : isSoilPrep
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      : isScheduled
                      ? 'bg-stone-50/90 text-stone-600 border border-dashed border-stone-300 hover:bg-stone-100 hover:text-stone-900'
                      : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${isSelected ? 'text-lime-300' : 'text-emerald-700'}`} />
                  ) : isSoilPrep ? (
                    <Sparkles className={`h-4 w-4 shrink-0 animate-pulse ${isSelected ? 'text-amber-200' : 'text-amber-600'}`} />
                  ) : isScheduled ? (
                    <Clock className={`h-4 w-4 shrink-0 ${isSelected ? 'text-stone-200' : 'text-stone-400'}`} />
                  ) : (
                    <Sprout className={`h-4 w-4 shrink-0 ${isSelected ? 'text-lime-300' : 'text-emerald-600'}`} />
                  )}

                  <div className="text-left">
                    <span className="block truncate max-w-[150px] sm:max-w-[190px]">
                      {season.seasonName || `Vụ ${season.seasonNumber}`}
                    </span>
                    <span className={`block text-[10px] font-normal ${isSelected ? 'text-white/80' : 'text-stone-500'}`}>
                      {isCompleted
                        ? `Hoàn tất (${season.yieldKgActual ? `${season.yieldKgActual}kg` : `${season.totalDays}N`})`
                        : isSoilPrep
                        ? `Cải tạo đất (${season.fallowDays || 5} ngày)`
                        : isScheduled
                        ? `Chưa bắt đầu (N0/${season.totalDays})`
                        : `Đang trồng (N${season.currentDay}/${season.totalDays})`}
                    </span>
                  </div>
                </button>

                {/* Kết nối mũi tên giữa các vụ nếu có */}
                {index < seasons.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-stone-300 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}

          {/* Nút Gia Hạn Vụ Mới */}
          {canRenew && (
            <button
              type="button"
              onClick={onOpenRenewal}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100/90 hover:border-emerald-500 transition-all shadow-2xs cursor-pointer ml-auto sm:ml-0"
              title="Đăng ký thêm vụ mùa tiếp theo để giữ đất ưu tiên"
            >
              <Plus className="h-4 w-4 text-emerald-700" />
              <span>Gia hạn vụ mới</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
