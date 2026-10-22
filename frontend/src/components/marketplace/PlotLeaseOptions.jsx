import React from 'react';
import {
  CULTIVATION_MODES,
  LEASE_TERM_OPTIONS,
  getCropGrowthDays,
  getMinTermMonths,
  getTermLockReason,
  getCareFeePerMonth,
  computePlotLeasePrice
} from '../../utils/leaseSelection';
import { Shield, Sparkles, AlertCircle, Lock } from 'lucide-react';

export default function PlotLeaseOptions({
  crop = null,
  cultivationMode = null,
  termMonths = 3,
  monthlyRent = 1200000,
  onChange = () => {},
  compact = false,
  showErrors = false
}) {
  const growthDays = getCropGrowthDays(crop);
  const careFee = getCareFeePerMonth(monthlyRent);
  const pricing = computePlotLeasePrice({ monthlyRent, termMonths, cultivationMode });
  const isModeMissing = !cultivationMode;

  const handleModeChange = (mode) => {
    const minTerm = getMinTermMonths({ growthDays, cultivationMode: mode });
    const nextTerm = termMonths < minTerm ? minTerm : termMonths;
    onChange({ cultivationMode: mode, termMonths: nextTerm });
  };

  const handleTermChange = (months) => {
    const lockReason = getTermLockReason(months, { growthDays, cultivationMode });
    if (lockReason) return;
    onChange({ termMonths: months });
  };

  return (
    <div className={`space-y-3 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* (A) Hình thức canh tác */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="flex items-center gap-1 text-xs font-bold text-slate-800">
            <span>Hình thức canh tác</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Lựa chọn mô hình</span>
        </div>

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Hình thức canh tác">
          {/* 1. Tự canh tác (Self-Growing) */}
          <button
            type="button"
            role="radio"
            aria-checked={cultivationMode === CULTIVATION_MODES.SELF}
            onClick={() => handleModeChange(CULTIVATION_MODES.SELF)}
            className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
              cultivationMode === CULTIVATION_MODES.SELF
                ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Tự canh tác</span>
              {cultivationMode === CULTIVATION_MODES.SELF ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Self-growing · Miễn phí</p>
          </button>

          {/* 2. Ủy thác trọn gói (Assisted-Growing) */}
          <button
            type="button"
            role="radio"
            aria-checked={cultivationMode === CULTIVATION_MODES.ASSISTED}
            onClick={() => handleModeChange(CULTIVATION_MODES.ASSISTED)}
            className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
              cultivationMode === CULTIVATION_MODES.ASSISTED
                ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Ủy thác trọn gói</span>
              {cultivationMode === CULTIVATION_MODES.ASSISTED ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
              +{careFee.toLocaleString('vi-VN')} đ/tháng
            </p>
          </button>
        </div>

        {showErrors && isModeMissing && (
          <p className="text-[11px] font-bold text-rose-600 mt-1.5 flex items-center gap-1" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Vui lòng chọn hình thức canh tác
          </p>
        )}
      </div>

      {/* (B) Thời hạn thuê */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1 text-xs font-bold text-slate-800">
            <span>Thời hạn thuê</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          {growthDays > 35 && (
            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Shield className="w-3 h-3 text-amber-600 shrink-0" />
              Cây &gt;35 ngày: Tối thiểu 3 tháng
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 pt-2.5">
          {LEASE_TERM_OPTIONS.map((opt) => {
            const isSelected = termMonths === opt.months;
            const lockReason = getTermLockReason(opt.months, { growthDays, cultivationMode });
            const isLocked = Boolean(lockReason);
            const lockTitle =
              lockReason === 'BR04'
                ? `Giống cây có chu kỳ ${growthDays} ngày (>35 ngày), yêu cầu thuê tối thiểu 3 tháng để trọn vẹn vụ mùa.`
                : lockReason === 'ASSISTED'
                ? 'Gói Assisted-Growing trọn gói yêu cầu tối thiểu 3 tháng (1 vụ mùa).'
                : '';

            return (
              <button
                key={opt.months}
                type="button"
                disabled={isLocked}
                title={lockTitle || opt.cycleName}
                onClick={() => handleTermChange(opt.months)}
                className={`rounded-2xl border text-center transition-all cursor-pointer relative ${
                  opt.recommended && !isLocked ? 'pt-3 pb-2 px-1' : 'py-2 px-1'
                } ${
                  isLocked
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'border-emerald-600 bg-emerald-50/90 text-slate-900 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300 text-slate-700'
                }`}
              >
                {opt.recommended && !isLocked && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-2xs z-10">
                    Khuyên dùng
                  </span>
                )}
                <div className="font-extrabold text-xs text-slate-800 leading-tight">
                  {opt.title}
                </div>
                {isLocked ? (
                  <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 shrink-0" />
                    <span>Khóa</span>
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-500 mt-1 truncate font-medium">
                    {opt.short}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* (C) Dòng tính giá tạm tính trực quan */}
      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Tạm tính ({termMonths} tháng):</span>
          <span className="font-black text-emerald-800 text-sm">
            {pricing.total.toLocaleString('vi-VN')} đ
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {Number(monthlyRent).toLocaleString('vi-VN')} đ/tháng × {termMonths} tháng
          {cultivationMode === CULTIVATION_MODES.ASSISTED && (
            <span className="text-emerald-700 font-semibold"> + ủy thác {careFee.toLocaleString('vi-VN')} đ/tháng × {termMonths} tháng</span>
          )}
        </div>
      </div>
    </div>
  );
}
