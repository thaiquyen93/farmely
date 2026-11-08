import React, { useId } from 'react';
import { UserCheck, CheckCircle2, Calendar, Zap, Flame, Leaf, Info } from 'lucide-react';
import Button from '../common/Button';

export const PRIORITY_OPTIONS = [
  {
    id: 'EMERGENCY',
    label: 'Làm ngay',
    sub: 'Khẩn cấp trong 2 giờ',
    icon: Zap,
    selected: 'border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-400',
    iconColor: 'text-rose-600',
  },
  {
    id: 'HIGH',
    label: 'Ưu tiên cao',
    sub: 'Trong ngày',
    icon: Flame,
    selected: 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-400',
    iconColor: 'text-amber-600',
  },
  {
    id: 'NORMAL',
    label: 'Bình thường',
    sub: 'Ca làm việc tới',
    icon: Leaf,
    selected: 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500',
    iconColor: 'text-emerald-600',
  },
];

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const fieldClass =
  'w-full rounded-xl border border-brand-border bg-white px-3 py-2.5 text-sm font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green/25';

export default function IssueAssignmentPanel({
  workers,
  workerId,
  onWorkerChange,
  dueDate,
  onDueDateChange,
  priority,
  onPriorityChange,
  onSubmit,
  isSubmitting,
  assignedTaskCode,
  assignedWorkerName,
  assignedDueDate,
  hasDiagnosis,
}) {
  const baseId = useId();
  const workerFieldId = `${baseId}-worker`;
  const dateFieldId = `${baseId}-date`;
  const priorityLabelId = `${baseId}-priority`;
  const hintId = `${baseId}-hint`;

  const selectedWorker = workers.find((w) => w.id === Number(workerId));
  const missingDate = !dueDate;
  const isDisabled = isSubmitting || missingDate;

  const submitLabel = isSubmitting
    ? 'Đang giao việc...'
    : assignedTaskCode
    ? 'Giao thêm việc cho CVLĐ'
    : 'Giao việc cho CVLĐ';

  return (
    <div className="space-y-4">
      {assignedTaskCode && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-white p-3 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-bold text-emerald-800 break-words">Đã phát lệnh: {assignedTaskCode}</p>
            <p className="text-xs text-stone-600 break-words">
              Giao cho: <strong className="text-stone-800">{assignedWorkerName || 'Chuyên viên hiện trường'}</strong> • Hạn:{' '}
              <strong className="text-stone-800">{assignedDueDate || 'Trong ca trực'}</strong>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor={workerFieldId} className="block text-xs font-semibold text-stone-700">
          CVLĐ nhận việc
        </label>
        <select
          id={workerFieldId}
          value={workerId}
          onChange={(e) => onWorkerChange(Number(e.target.value))}
          className={fieldClass}
        >
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {selectedWorker && (
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
              aria-hidden="true"
            >
              {getInitials(selectedWorker.name)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-dark break-words">{selectedWorker.name}</p>
              <p className="text-xs text-stone-600 break-words">{selectedWorker.role}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={dateFieldId} className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
          <Calendar className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
          Hạn hoàn thành
        </label>
        <input
          id={dateFieldId}
          type="date"
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <span id={priorityLabelId} className="block text-xs font-semibold text-stone-700">
          Mức độ ưu tiên
        </span>
        <div role="radiogroup" aria-labelledby={priorityLabelId} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {PRIORITY_OPTIONS.map((p) => {
            const Icon = p.icon;
            const isSelected = priority === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onPriorityChange(p.id)}
                className={`rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-green/30 ${
                  isSelected ? p.selected : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <Icon className={`h-4 w-4 shrink-0 ${p.iconColor}`} aria-hidden="true" />
                  {p.label}
                </span>
                <span className="mt-0.5 block text-xs text-stone-600">{p.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!hasDiagnosis && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>Chưa có chỉ đạo kỹ thuật ở bước 2 — CVLĐ sẽ nhận mô tả sự cố làm hướng dẫn.</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Button
          type="button"
          variant="secondary"
          onClick={onSubmit}
          disabled={isDisabled}
          aria-describedby={missingDate ? hintId : undefined}
          className="w-full py-2.5 text-center whitespace-normal"
        >
          <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {submitLabel}
        </Button>
        {missingDate && (
          <p id={hintId} className="text-center text-xs text-stone-600">
            Chọn hạn hoàn thành để giao việc.
          </p>
        )}
      </div>
    </div>
  );
}
