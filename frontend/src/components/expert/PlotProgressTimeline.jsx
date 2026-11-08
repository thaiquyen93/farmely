import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  Camera,
  ZoomIn,
  MessageSquare,
  Sprout,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  Droplets,
  Layers
} from 'lucide-react';
import Button from '../common/Button';

/**
 * PlotWorkProgressTimeline
 * Bảng Tiến Trình Các Công Việc & Nhật Ký Canh Tác Theo Thửa Đất dành cho Chuyên Gia Nông Nghiệp (Expert).
 * Đồng bộ toàn bộ hoạt động của CVLĐ, ảnh minh chứng thực địa (BR15/BR20) và quy trình chuẩn VietGAP theo ngày.
 */
export default function PlotWorkProgressTimeline({
  plot,
  tasks = [],
  onOpenPhoto,
  onOpenChat,
  onClose
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'PENDING'

  const totalCount = tasks.length;
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'DONE').length,
    [tasks]
  );
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = useMemo(() => {
    if (filter === 'COMPLETED') {
      return tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'DONE');
    }
    if (filter === 'PENDING') {
      return tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'DONE');
    }
    return tasks;
  }, [tasks, filter]);

  return (
    <div className="bg-stone-50/90 rounded-2xl p-4 sm:p-5 border border-sky-200/80 space-y-4 text-xs animate-fade-in">
      {/* 1. Header Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-brand-border/70 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800">
            <BookOpen className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-heading font-black text-sm text-brand-dark">
                Tiến Trình Công Việc & Nhật Ký Hiện Trường
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200">
                Thửa {plot.plotCode}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {plot.crop}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Đồng bộ thời gian thực các bước kỹ thuật, việc thực hiện của CVLĐ và ảnh hiện trường thực địa (BR15/BR20).
            </p>
          </div>
        </div>

        {/* Counters & Progress badge */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{completedCount}/{totalCount} Đã hoàn thành ({progressPercent}%)</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 font-bold text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
            <span>Chuẩn VietGAP toàn trình</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-stone-200/60 pb-3">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Bộ lọc tiến trình">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
              filter === 'ALL'
                ? 'bg-brand-dark text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
              filter === 'COMPLETED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <Check className="w-3 h-3" />
            Đã hoàn thành ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
              filter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3 h-3" />
            Chờ thực hiện ({pendingCount})
          </button>
        </div>

        <div className="text-[11px] text-stone-500 font-medium">
          Khách hàng: <strong className="text-brand-dark">{plot.renterName}</strong> · CVLĐ phụ trách: <strong className="text-emerald-800">{plot.staffName || 'Trần Văn Lực (CVLĐ)'}</strong>
        </div>
      </div>

      {/* 3. Task & Diary Timeline List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-stone-500 space-y-2 bg-white rounded-xl border border-stone-200/70 p-6">
          <BookOpen className="w-8 h-8 mx-auto text-stone-300" />
          <p className="font-bold text-xs text-stone-600">Không có công việc nào trong danh mục này</p>
          <p className="text-[11px] text-stone-400">Thay đổi bộ lọc để xem các công việc khác của thửa đất.</p>
        </div>
      ) : (
        <ol className="relative space-y-3.5 border-l-2 border-emerald-200/80 pl-5 ml-2.5">
          {filteredTasks.map((task, idx) => {
            const isDone = task.status === 'COMPLETED' || task.status === 'DONE';
            const isProg = task.status === 'IN_PROGRESS' || task.status === 'IN_PROG';

            return (
              <li key={task.id || `${task.day}-${idx}`} className="relative">
                {/* Timeline Bullet */}
                <span
                  className={`absolute -left-[27px] top-4 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                    isDone
                      ? 'bg-emerald-600'
                      : isProg
                      ? 'bg-sky-500 ring-2 ring-sky-200 animate-pulse'
                      : 'bg-stone-300'
                  }`}
                  aria-hidden="true"
                />

                {/* Entry Card */}
                <div className="p-4 rounded-xl border border-stone-200/80 bg-white hover:border-emerald-300 hover:shadow-2xs transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-xs text-stone-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {task.time || `Ngày tuổi ${task.day || 1}`}
                      </span>

                      {task.day && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                          Ngày {task.day}
                        </span>
                      )}

                      {task.dayRange && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          {task.dayRange}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã hoàn thành
                        </span>
                      ) : isProg ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                          <Clock className="w-3 h-3 text-sky-600" />
                          Đang thực hiện
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-600 border border-stone-200">
                          <Clock className="w-3 h-3 text-stone-400" />
                          Chờ thực hiện
                        </span>
                      )}

                      {/* Author badge */}
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-100">
                        <UserCheck className="w-3 h-3 text-emerald-700" />
                        {task.author || 'CVLĐ Hiện Trường'}
                      </span>
                    </div>
                  </div>

                  {/* Task Title */}
                  <h4 className="font-heading font-bold text-sm text-[#18352b]">
                    {task.title}
                  </h4>

                  {/* Note / Technical Instructions */}
                  {task.note && (
                    <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/70 p-2.5 rounded-lg border border-stone-200/50 whitespace-pre-line">
                      {task.note}
                    </p>
                  )}

                  {/* Proof Photo (BR15 / BR20) */}
                  {task.proofPhoto && (
                    <div className="pt-1 max-w-md">
                      <div
                        className="relative rounded-xl overflow-hidden border border-emerald-200 bg-stone-900 group cursor-pointer shadow-2xs"
                        onClick={() => onOpenPhoto?.(task.proofPhoto, task.title, task.time)}
                      >
                        <img
                          src={task.proofPhoto}
                          alt={task.title}
                          className="w-full h-44 object-cover group-hover:scale-105 transition-all duration-300 opacity-90 group-hover:opacity-100"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                          <ZoomIn className="w-4 h-4" /> Bấm để mở kính lúp nông học
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 font-semibold text-emerald-300">
                            <Camera className="w-3.5 h-3.5" />
                            Ảnh hiện trường nghiệm thu thực địa (BR15)
                          </span>
                          <span className="text-[10px] text-stone-300 underline">Phóng to ↗</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* 4. Action bar footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200/70 bg-white p-3 rounded-xl border">
        <div className="flex items-center gap-2 text-stone-500 text-[11px]">
          <Sprout className="w-4 h-4 text-emerald-700" />
          <span>Theo dõi quy trình canh tác khép kín chuẩn VietGAP theo thời gian thực</span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition cursor-pointer"
            >
              Thu gọn bảng tiến trình
            </button>
          )}

          {onOpenChat && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenChat}
              className="font-bold text-xs gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mở Kênh Tư Vấn 1-1 Với Khách ({plot.renterName})</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
