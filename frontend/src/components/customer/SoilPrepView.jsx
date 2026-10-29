import React from 'react';
import { CheckCircle2, Clock, Sparkles, Sprout, ShieldCheck, Camera, Info, ArrowRight } from 'lucide-react';
import { FALLOW_PROTOCOL_STEPS } from '../../services/cropStandardProcess';

/**
 * Component hiển thị Tiến trình Cải tạo đất & Nghỉ đất chuẩn VietGAP (Fallow Protocol)
 * Cung cấp minh chứng thực địa minh bạch giữa 2 vụ canh tác.
 */
export default function SoilPrepView({
  plot,
  season,
  nextSeason,
  onOpenRenewal,
  onChangeCrop
}) {
  return (
    <div className="space-y-6">
      {/* 1. Banner Trạng Thái Nghỉ Đất */}
      <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md">
              <Sparkles className="h-6 w-6 text-amber-100 animate-pulse" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-black text-amber-900 border border-amber-200">
                  Chuẩn VietGAP · Giai đoạn Nghỉ đất 05 Ngày
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs font-bold text-stone-600">
                  Thửa {plot.plotCode || plot.mapPlotId || plot.id}
                </span>
              </div>
              <h2 className="mt-1 text-xl font-black text-stone-900 sm:text-2xl">
                Đang Cải Tạo & Phơi Ải Phục Hồi Độ Phì Nhiêu Đất
              </h2>
              <p className="mt-1 text-xs text-stone-600 max-w-2xl leading-relaxed">
                Sau mỗi vụ thu hoạch, đất cần 5–7 ngày để khử khuẩn bằng vôi bột sinh học, phơi ải diệt mầm nấm bệnh và bón lót phân vi sinh hữu cơ nhằm bảo đảm năng suất tối đa cho vụ tiếp theo.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2 border-t border-amber-100 pt-3 sm:border-t-0 sm:pt-0">
            <div className="rounded-2xl bg-amber-100/90 px-4 py-2.5 text-right border border-amber-200">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Thời gian còn lại
              </span>
              <span className="font-heading text-lg font-black text-amber-950">
                2 Ngày Nữa
              </span>
              <span className="block text-[10px] text-amber-800">
                vào giống vụ mới
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quy trình 5 bước cải tạo đất chuẩn VietGAP kèm minh chứng thực địa */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-heading font-black text-base text-stone-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              Quy Trình Xử Lý Đất Nghiệm Thu Bắt Buộc (Fallow Protocol)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Toàn bộ các khâu được thực hiện bởi kỹ thuật viên phụ trách thửa đất và được giám sát qua ảnh chụp thời gian thực.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {FALLOW_PROTOCOL_STEPS.map((step) => {
            const isDone = step.status === 'COMPLETED';
            const isDoing = step.status === 'IN_PROGRESS';

            return (
              <div
                key={step.step}
                className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : isDoing
                    ? 'border-amber-300 bg-amber-50/40 ring-2 ring-amber-100 shadow-xs'
                    : 'border-stone-200/80 bg-stone-50/40 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                      isDone
                        ? 'bg-emerald-700 text-white'
                        : isDoing
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : step.step}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-sm text-stone-900">
                        {step.title}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDoing
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {isDone ? 'Đã hoàn thành' : isDoing ? 'Đang thực hiện' : 'Chờ tới lượt'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-600 leading-relaxed max-w-xl">
                      {step.desc}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-stone-500">
                      <span>⏱ {step.duration}</span>
                      <span>•</span>
                      <span>👤 {step.worker}</span>
                    </div>
                  </div>
                </div>

                {/* Ảnh minh chứng thực tế nếu có */}
                {step.image && (
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="h-14 w-20 rounded-xl object-cover border border-stone-200 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(step.image, '_blank')}
                      title="Bấm để xem ảnh minh chứng phóng to"
                    />
                    <div className="text-[10px] text-stone-500 hidden sm:block">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1">
                        <Camera className="h-3 w-3" /> Minh chứng
                      </span>
                      <span>Tại luống</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Khối Thông Tin Vụ Kế Tiếp & Đổi Giống Cây */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Sprout className="h-6 w-6 text-emerald-700" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Kế hoạch vụ tiếp theo
            </span>
            <h4 className="font-heading font-black text-base text-stone-900">
              {nextSeason ? nextSeason.cropName : 'Vụ kế tiếp theo kế hoạch'}
            </h4>
            <p className="text-xs text-stone-500">
              {nextSeason
                ? `Thời gian dự kiến: ${nextSeason.totalDays || 40} ngày sinh trưởng · Thời gian nghỉ đất: ${nextSeason.fallowDays || 5} ngày.`
                : 'Bấm "Gia hạn vụ mới" để chọn giống canh tác tiếp theo cho thửa đất.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onChangeCrop && (
            <button
              type="button"
              onClick={onChangeCrop}
              className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
            >
              Đổi giống cây khác
            </button>
          )}
          <button
            type="button"
            onClick={onOpenRenewal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 shadow-sm transition cursor-pointer"
          >
            <span>Gia hạn thêm vụ mới</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
