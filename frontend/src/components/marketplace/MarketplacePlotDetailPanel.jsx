import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  X,
  Droplets,
  Cpu,
  Sprout,
  Thermometer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Leaf,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Compass,
  BookOpen,
  Info,
  Clock
} from 'lucide-react';
import { safeCrops, getSafeCropsList } from '../../data/safeCrops';
import PlotLeaseOptions from './PlotLeaseOptions';
import { getLeaseConfigError, computePlotLeasePrice } from '../../utils/leaseSelection';
import { CROP_STANDARDS, detectCropKey } from '../../services/cropStandardProcess';

/* ──────────────────────────────────────────────────────────────────────────────
   MarketplacePlotDetailPanel — Per-plot lease config + responsive 1366x768
   ────────────────────────────────────────────────────────────────────────── */
export default function MarketplacePlotDetailPanel({
  plot,
  isOpen,
  onClose,
  onBookPlot,
  isPlotSelectedForContract = false,
  onToggleSelectPlotForContract,
  leaseConfig,
  onChangeLeaseConfig,
  cropOptions = [],
  compatibilityMissing = false,
  onOpenSiteVisit,
  cartPlotsCount = 0
}) {
  const [copied, setCopied] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfigErrors, setShowConfigErrors] = useState(false);
  const [expandedStageId, setExpandedStageId] = useState(null);
  const [showTechnicalHandbookModal, setShowTechnicalHandbookModal] = useState(false);

  // Reset photo index, tab & error khi đổi thửa đất
  useEffect(() => {
    setPhotoIndex(0);
    setActiveTab('overview');
    setShowConfigErrors(false);
    setExpandedStageId(null);
    setShowTechnicalHandbookModal(false);
  }, [plot?.id, plot?.code]);

  const allSafeFallback = getSafeCropsList();
  const effectiveCropOptions = cropOptions && cropOptions.length > 0 ? cropOptions : allSafeFallback;
  const selectedCrop = effectiveCropOptions.find((c) => c.id === leaseConfig?.cropId) || null;
  const currentTechnicalCrop = selectedCrop || effectiveCropOptions[0];

  const cropProcessData = useMemo(() => {
    if (!currentTechnicalCrop) return null;
    const cropKey = detectCropKey(currentTechnicalCrop.variety || currentTechnicalCrop.name || '');
    const standard = CROP_STANDARDS[cropKey] || CROP_STANDARDS['lettuce'];
    return {
      cropKey,
      standard,
      cropName: currentTechnicalCrop.variety || currentTechnicalCrop.name || standard.cropName,
      cropIcon: currentTechnicalCrop.icon || '🌱',
      duration: currentTechnicalCrop.duration || `${standard.totalDays} ngày`,
      totalDays: standard.totalDays,
      expectedYield: standard.expectedYield,
      optimalConditions: standard.optimalConditions,
      stages: standard.stages || []
    };
  }, [currentTechnicalCrop]);

  if (!plot) return null;

  const isVacant =
    (plot.status === 'Đang trống' || plot.status === 'AVAILABLE' || plot.status === 'AVAIL') &&
    plot.status !== 'Đã thuê' &&
    plot.statusCode !== 'RENTED' &&
    plot.statusCode !== 'RENT';
  const isMaintenance =
    plot.status === 'Bảo trì' ||
    plot.status === 'MAINT' ||
    plot.statusCode === 'MAINT' ||
    plot.statusCode === 'MAINTENANCE';
  const displayStatus = isVacant ? 'Đang trống' : isMaintenance ? 'Bảo trì (4 ngày)' : 'Đã thuê';
  const plotCode = String(plot.code || plot.id || '').replace(/^Plot\s+/i, '');
  const plotName = plot.name || `Thửa đất ${plot.id}`;
  const farmName = plot.farmName || 'Happy Valley';
  const plotArea =
    plot.areaFormatted ||
    (typeof plot.area === 'number' ? `${plot.area} m²` : plot.area) ||
    '150 m²';
  const rawPriceStr =
    plot.price ||
    plot.rentalPriceFormatted ||
    (plot.rentalPrice ? `${plot.rentalPrice.toLocaleString('vi-VN')} đ` : '1.200.000 đ');
  const plotPrice = String(rawPriceStr).replace(/\/tháng/gi, '').trim();

  const baseImg =
    plot.img ||
    plot.imageUrl ||
    'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80';

  const photos =
    Array.isArray(plot.gallery) && plot.gallery.length > 0
      ? plot.gallery
      : [
          baseImg,
          'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
        ];

  const currentPhoto = photos[photoIndex] || baseImg;

  // Tính đơn giá theo m²
  const areaNumber = parseInt(String(plotArea).replace(/\D/g, ''), 10) || 150;
  const rentalPriceNum =
    plot.rentalPrice || parseInt(String(plotPrice).replace(/\D/g, ''), 10) || 1200000;
  const unitPricePerSqm = Math.round(rentalPriceNum / areaNumber);
  const formattedUnitPrice = `${unitPricePerSqm.toLocaleString('vi-VN')} đ/m²`;

  // Specifications & IoT Telemetry
  const direction = plot.direction || plot.specs?.orientation || 'Đông Nam';
  const phValue = plot.ph || plot.specs?.ph || '6.2 - 6.6';
  const tempValue = plot.temp || plot.specs?.temp || '20 - 28°C';

  const configError = getLeaseConfigError(leaseConfig, selectedCrop);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // IoT metrics
  const iotMetrics = [
    {
      icon: Thermometer,
      label: 'Nhiệt độ',
      value: tempValue,
      statusText: 'Tối ưu',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      iconBorder: 'border-rose-100'
    },
    {
      icon: Sparkles,
      label: 'Độ pH đất',
      value: phValue,
      statusText: 'Tối ưu',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      iconBorder: 'border-amber-100'
    },
    {
      icon: Droplets,
      label: 'Tưới tự động',
      value: 'Israel nhỏ giọt',
      statusText: 'Hoạt động',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-500',
      iconBorder: 'border-sky-100'
    },
    {
      icon: Cpu,
      label: 'Cảm biến IoT',
      value: 'Vi khí hậu',
      statusText: 'Online',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
      iconBorder: 'border-violet-100'
    }
  ];

  const handleBookClick = () => {
    const err = getLeaseConfigError(leaseConfig, selectedCrop);
    if (err) {
      setShowConfigErrors(true);
      setActiveTab('overview');
      return;
    }
    setShowConfigErrors(false);
    onBookPlot(plot);
  };

  const handleToggleSelectClick = () => {
    if (!isPlotSelectedForContract) {
      const err = getLeaseConfigError(leaseConfig, selectedCrop);
      if (err) {
        setShowConfigErrors(true);
        setActiveTab('overview');
        return;
      }
    }
    setShowConfigErrors(false);
    onToggleSelectPlotForContract?.(plot);
  };

  const livePrice = computePlotLeasePrice({
    monthlyRent: rentalPriceNum,
    termMonths: leaseConfig.termMonths,
    cultivationMode: leaseConfig.cultivationMode
  });

  return (
    <>
      <aside
      id="detail-panel"
      data-plot-detail-panel={isOpen && plot ? 'open' : 'closed'}
      aria-label={`Chi tiết thửa đất ${plot?.code || ''}`}
      className={`absolute inset-x-2 top-20 bottom-2 z-40 flex w-auto flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform sm:inset-x-auto sm:right-3 sm:bottom-3 sm:w-[340px] sm:rounded-3xl 2xl:right-4 2xl:bottom-4 2xl:w-[370px] ${
        isOpen
          ? 'translate-x-0 translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-[110%] opacity-0 pointer-events-none sm:translate-x-[400px] sm:translate-y-0'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO IMAGE (h-[128px] sm:h-[136px] 2xl:h-[160px])
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="relative h-[128px] sm:h-[136px] 2xl:h-[160px] w-full shrink-0 select-none overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 group">
        <img
          key={currentPhoto}
          id="detail-img"
          src={currentPhoto}
          alt=""
          onError={(e) => {
            // Giấu hẳn ảnh vỡ nếu network/CDN lỗi, giữ nền gradient sang trọng
            e.currentTarget.classList.add('hidden');
          }}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 text-transparent [font-size:0]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/15 pointer-events-none" />

        {photos.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              type="button"
              onClick={prevPhoto}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/70 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/15 pointer-events-auto cursor-pointer"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/70 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/15 pointer-events-auto cursor-pointer"
              title="Ảnh tiếp theo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Badges & Actions */}
        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span
              id="detail-tag-status"
              className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide flex items-center gap-1 shadow-sm backdrop-blur-md border ${
                isVacant
                  ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-950/30'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isVacant ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
              {displayStatus}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/25 shadow-2xs">
              ✨ VietGAP
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/65 hover:text-white transition-all flex items-center justify-center border border-white/15 cursor-pointer"
              title="Sao chép liên kết thửa"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/65 hover:text-white transition-all flex items-center justify-center border border-white/15 cursor-pointer"
              title="Đóng chi tiết"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {copied && (
          <div className="absolute top-11 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg z-20 animate-fade-in">
            Đã chép liên kết!
          </div>
        )}

        {/* Bottom Hero Overlay */}
        <div className="absolute bottom-2 left-3 right-3 text-white z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="px-1.5 py-0.2 rounded bg-white/20 backdrop-blur-md text-[9px] font-black text-white border border-white/30 tracking-wider">
              {plotCode}
            </span>
            <span className="max-w-[60%] truncate whitespace-nowrap text-[10px] text-emerald-200 font-semibold drop-shadow">
              • {farmName}
            </span>
          </div>
          <h3 id="detail-title" className="text-base font-black text-white leading-tight drop-shadow-md truncate">
            {plotName}
          </h3>

          {photos.length > 1 && (
            <div className="hidden 2xl:flex items-center gap-1.5 mt-1.5">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(idx);
                  }}
                  className={`rounded-full transition-all duration-300 pointer-events-auto cursor-pointer ${
                    idx === photoIndex ? 'w-4 h-1 bg-white' : 'w-1 h-1 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. GIÁ THUÊ (Focal point, py-2, text-lg)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-b border-slate-100/80 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="whitespace-nowrap text-[9px] font-black uppercase tracking-wider text-slate-400">
                Giá thuê hàng tháng
              </span>
              <span className="whitespace-nowrap text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/60">
                {formattedUnitPrice}
              </span>
            </div>
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span id="detail-price" className="text-lg 2xl:text-xl font-black text-emerald-600 tracking-tight tabular-nums">
                {plotPrice}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">/tháng</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
              Quy mô
            </span>
            <div className="flex items-center gap-1">
              <span className="whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60 text-[11px] font-black text-slate-800">
                {plotArea}
              </span>
              <span className="whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60 text-[11px] font-black text-slate-800">
                {direction}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. TAB NAVIGATION
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-0 shrink-0">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100/70 rounded-xl border border-slate-200/40">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Tổng quan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('technical')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'technical'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Kỹ thuật
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. SCROLLABLE TAB CONTENT (space-y-3 pt-2.5 pb-6)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div
        key={`${plot.id}-${activeTab}`}
        className="px-4 pt-2.5 pb-6 flex-1 overflow-y-auto no-scrollbar space-y-3"
      >
        {/* ═══════════ TAB: TỔNG QUAN ═══════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Bộ chọn giống cây — Thiết kế tối giản, cao cấp, không vỡ chữ */}
            <div
              className={`rounded-2xl border p-2.5 transition-all ${
                showConfigErrors && !leaseConfig.cropId
                  ? 'border-2 border-rose-500 bg-rose-50/70 shadow-sm ring-2 ring-rose-500/20'
                  : 'border-slate-200/90 bg-white shadow-2xs'
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="text-emerald-600 text-sm">🌱</span>
                  <span>Giống cây trồng canh tác</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                {leaseConfig.cropId ? (
                  <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    ✓ Đã chọn
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                    Bắt buộc
                  </span>
                )}
              </div>

              <div className="relative">
                <select
                  value={leaseConfig.cropId || ''}
                  onChange={(event) => {
                    setShowConfigErrors(false);
                    onChangeLeaseConfig({ cropId: event.target.value });
                  }}
                  className={`w-full appearance-none rounded-xl pl-3 pr-8 py-2 text-xs font-semibold outline-hidden transition-all cursor-pointer ${
                    showConfigErrors && !leaseConfig.cropId
                      ? 'border-2 border-rose-500 bg-white text-rose-900 ring-2 ring-rose-500/30'
                      : 'border border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-white focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                >
                  <option value="">Chọn giống cây canh tác...</option>
                  {effectiveCropOptions.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name} — {crop.variety}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {compatibilityMissing && (
                <p className="mt-1 text-[10px] text-amber-700">
                  Thửa đất chưa có dữ liệu tương thích giống cây trong hệ thống – đang hiển thị toàn bộ danh mục.
                </p>
              )}

              {showConfigErrors && !leaseConfig.cropId && (
                <p className="mt-1.5 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  Vui lòng chọn giống cây cho thửa đất này!
                </p>
              )}

              {selectedCrop ? (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-100 px-2.5 py-1.5 text-[11px] text-emerald-900">
                  <div className="flex items-center gap-1.5 font-bold truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="truncate">{selectedCrop.name} ({selectedCrop.variety})</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-emerald-700">
                    Chu kỳ: {selectedCrop.duration || `${selectedCrop.growthDays || 90} ngày`}
                  </span>
                </div>
              ) : !showConfigErrors ? (
                <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                  Gợi ý chu kỳ canh tác chuẩn kỹ thuật VietGAP.
                </p>
              ) : null}
            </div>

            {/* Cấu hình thuê thửa đất: Hình thức + Thời hạn + Tạm tính */}
            <PlotLeaseOptions
              crop={selectedCrop}
              cultivationMode={leaseConfig.cultivationMode}
              termMonths={leaseConfig.termMonths}
              monthlyRent={rentalPriceNum}
              onChange={onChangeLeaseConfig}
              compact={true}
              showErrors={showConfigErrors}
            />
          </>
        )}

        {/* ═══════════ TAB: KỸ THUẬT ═══════════ */}
        {activeTab === 'technical' && (
          <>
            {/* Bảo chứng Farmely di chuyển sang tab kỹ thuật */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/[0.08] via-emerald-50/50 to-teal-500/[0.06] border border-emerald-200/40 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="leading-snug">
                <p className="font-black text-emerald-900 text-xs">Bảo chứng chất lượng Farmely</p>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">
                  Kỹ sư VietGAP hỗ trợ • Đóng gói giao tận nhà
                </p>
              </div>
            </div>

            {/* Quick specs grid 3 cột di chuyển sang tab kỹ thuật */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                <p className="text-[9px] text-slate-400 font-medium">Diện tích</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">{plotArea}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                <p className="text-[9px] text-slate-400 font-medium">Hướng</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">{direction}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                <p className="text-[9px] text-slate-400 font-medium">Đơn giá</p>
                <p className="text-xs font-black text-emerald-600 mt-0.5">
                  {unitPricePerSqm.toLocaleString('vi-VN')}
                </p>
                <p className="text-[8px] text-slate-400">đ/m²</p>
              </div>
            </div>

            {/* ═══════════ QUY TRÌNH KỸ THUẬT CANH TÁC VIETGAP ═══════════ */}
            <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/50 via-white to-white p-3 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider truncate">
                      Quy trình kỹ thuật canh tác
                    </h4>
                    <p className="text-[10px] text-emerald-700 font-semibold truncate">
                      Tiêu chuẩn VietGAP • 100% sinh học
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[9px] font-black uppercase text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300/60">
                  Chuẩn kỹ sư
                </span>
              </div>

              {/* Bộ chọn giống cây để xem quy trình kỹ thuật */}
              <div className="rounded-xl bg-slate-50/90 p-2 border border-slate-200/70">
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <span>{cropProcessData?.cropIcon}</span>
                    <span>Quy trình cho giống cây:</span>
                  </span>
                  {selectedCrop ? (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      ✓ Đã chọn thuê
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                      Xem trước
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={leaseConfig.cropId || currentTechnicalCrop?.id || ''}
                    onChange={(e) => {
                      setShowConfigErrors(false);
                      onChangeLeaseConfig({ cropId: e.target.value });
                    }}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 py-1.5 text-xs font-bold text-slate-800 hover:border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition cursor-pointer"
                  >
                    {effectiveCropOptions.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.icon ? `${crop.icon} ` : ''}{crop.name} — {crop.variety}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Thẻ chỉ số tổng quan mùa vụ */}
              {cropProcessData && (
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100/80">
                    <p className="text-[8px] text-emerald-700 uppercase font-bold">Chu kỳ vụ</p>
                    <p className="text-[11px] font-black text-emerald-950 mt-0.5">{cropProcessData.totalDays} ngày</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100/80">
                    <p className="text-[8px] text-emerald-700 uppercase font-bold">Năng suất dự kiến</p>
                    <p className="text-[11px] font-black text-emerald-950 mt-0.5 truncate">{cropProcessData.expectedYield}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100/80">
                    <p className="text-[8px] text-emerald-700 uppercase font-bold">Nhiệt độ tối ưu</p>
                    <p className="text-[11px] font-black text-emerald-950 mt-0.5">{cropProcessData.optimalConditions?.tempRange || '20–30°C'}</p>
                  </div>
                </div>
              )}

              {/* Dòng thời gian các giai đoạn kỹ thuật (Stages Timeline) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-0.5">
                  <span>Các giai đoạn kỹ thuật ({cropProcessData?.stages?.length || 0} mốc):</span>
                  <span className="text-[9px] text-emerald-600 font-medium">Bấm để xem chi tiết</span>
                </div>

                <div className="space-y-1.5">
                  {cropProcessData?.stages?.map((stage, sIdx) => {
                    const isExpanded = expandedStageId === stage.id || (expandedStageId === null && sIdx === 0);
                    return (
                      <div
                        key={stage.id || sIdx}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                          isExpanded
                            ? 'border-emerald-300 bg-white shadow-2xs'
                            : 'border-slate-200/70 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedStageId(isExpanded ? false : stage.id)}
                          className="w-full p-2 flex items-center justify-between gap-2 text-left cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isExpanded ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {stage.stepOrder || sIdx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                                {stage.name}
                              </p>
                              <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                                {stage.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                              GĐ {stage.stepOrder || sIdx + 1}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-600' : ''}`} />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-2.5 pb-2.5 pt-1 border-t border-slate-100 text-[10px] space-y-2 bg-gradient-to-b from-emerald-50/20 to-white">
                            {stage.statusDesc && (
                              <p className="text-[10px] text-slate-600 italic leading-snug">
                                {stage.statusDesc}
                              </p>
                            )}

                            {/* Hướng dẫn kỹ thuật trọng tâm */}
                            <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100/80">
                              <span className="font-extrabold text-emerald-900 block mb-0.5 flex items-center gap-1">
                                <Sprout className="w-3 h-3 text-emerald-600" />
                                Chỉ dẫn kỹ thuật canh tác:
                              </span>
                              <p className="text-slate-700 leading-relaxed text-[10px]">
                                {stage.guide}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5">
                              {stage.waterRegime && (
                                <div className="p-1.5 rounded-lg bg-sky-50/60 border border-sky-100 flex items-start gap-1.5">
                                  <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-sky-900 block text-[9px]">Chế độ tưới nước:</span>
                                    <span className="text-slate-600 text-[10px] leading-tight block">{stage.waterRegime}</span>
                                  </div>
                                </div>
                              )}

                              {stage.nutrition && (
                                <div className="p-1.5 rounded-lg bg-amber-50/60 border border-amber-100 flex items-start gap-1.5">
                                  <Leaf className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-amber-900 block text-[9px]">Dinh dưỡng & Bón phân:</span>
                                    <span className="text-slate-600 text-[10px] leading-tight block">{stage.nutrition}</span>
                                  </div>
                                </div>
                              )}

                              {stage.pestAlert && (
                                <div className="p-1.5 rounded-lg bg-rose-50/60 border border-rose-100 flex items-start gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-rose-900 block text-[9px]">Phòng trừ sâu bệnh sinh học:</span>
                                    <span className="text-slate-600 text-[10px] leading-tight block">{stage.pestAlert}</span>
                                  </div>
                                </div>
                              )}

                              {stage.inspectionCriteria && (
                                <div className="p-1.5 rounded-lg bg-teal-50/60 border border-teal-100 flex items-start gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <span className="font-bold text-teal-900 block text-[9px]">Tiêu chí nghiệm thu VietGAP:</span>
                                    <span className="text-slate-600 text-[10px] leading-tight block">{stage.inspectionCriteria}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Nút xem cẩm nang kỹ thuật chi tiết */}
                <button
                  type="button"
                  onClick={() => setShowTechnicalHandbookModal(true)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Xem cẩm nang kỹ thuật toàn diện (VietGAP)
                </button>
              </div>
            </div>

            {/* IoT Telemetry */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <h4 className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
                    Vi Khí Hậu & Thổ Nhưỡng
                  </h4>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Trực tiếp 24/7
                </span>
              </div>

              <div className="space-y-1.5">
                {iotMetrics.map((metric, idx) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs flex items-center gap-2.5 hover:border-emerald-200 transition-all group"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${metric.iconBg} ${metric.iconColor} flex items-center justify-center shrink-0 border ${metric.iconBorder} group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-slate-400 font-medium">{metric.label}</p>
                        <p className="text-xs font-extrabold text-slate-900 leading-tight">
                          {metric.value}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-600">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        {metric.statusText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thông số thổ nhưỡng */}
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60">
              <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                Thông số thổ nhưỡng
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Độ ẩm đất', value: 65, unit: '%' },
                  { label: 'Chất hữu cơ', value: 82, unit: '%' },
                  { label: 'Nitrogen (N)', value: 74, unit: 'mg/kg' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-medium text-slate-500">{item.label}</span>
                      <span className="text-[9px] font-bold text-slate-700">
                        {item.value}
                        {item.unit === '%' ? '%' : ` ${item.unit}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. BOTTOM CTA BUTTONS (Ghim cố định đáy, p-3.5 pb-4)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="p-3.5 pb-4 border-t border-slate-100/90 bg-white/98 backdrop-blur-xl shrink-0 space-y-2">
        {/* Dòng tạm tính live */}
        {selectedCrop && (
          <div className="flex items-center justify-between text-[11px] text-stone-600 px-1 font-semibold">
            <span>Tổng tạm tính ({leaseConfig.termMonths} tháng):</span>
            <span className="font-extrabold text-emerald-700 text-xs">
              {livePrice.total.toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}

        {/* Nút chính — Thuê ngay thửa này hoặc Tiến hành thuê N thửa */}
        <button
          type="button"
          onClick={handleBookClick}
          disabled={!isVacant}
          className={`w-full py-2.5 rounded-2xl font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isVacant
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 hover:shadow-emerald-700/30 active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isVacant
              ? (cartPlotsCount > 1 || (isPlotSelectedForContract && cartPlotsCount > 0)
                  ? `Tiến hành thuê (${Math.max(cartPlotsCount, isPlotSelectedForContract ? cartPlotsCount : cartPlotsCount + 1)} thửa đã chọn)`
                  : 'Thuê ngay thửa này')
              : 'Thửa đất đã có người thuê'}
          </span>
        </button>

        {/* Nút phụ — Chọn thửa đất */}
        {isVacant && onToggleSelectPlotForContract && (
          <button
            type="button"
            onClick={handleToggleSelectClick}
            className={`w-full py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
              isPlotSelectedForContract
                ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                : 'border-slate-300 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-800 text-slate-800'
            }`}
          >
            <span>{isPlotSelectedForContract ? '✓ Đã chọn vào hợp đồng (bấm để bỏ)' : '+ Thêm vào hợp đồng thuê'}</span>
          </button>
        )}

        {/* Nút phụ — Đặt lịch tham quan khảo sát thực tế */}
        <button
          type="button"
          onClick={() => onOpenSiteVisit?.(plot)}
          className="w-full py-2.5 rounded-xl border border-emerald-300/80 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.99]"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
          <span>Chưa vội thuê? Đặt lịch xem đất thực tế (Miễn phí)</span>
        </button>

        {showConfigErrors && configError && (
          <p className="text-[11px] font-bold text-rose-600 text-center leading-tight pt-0.5" role="alert">
            {configError}
          </p>
        )}
      </div>
    </aside>

    {/* Modal Cẩm nang quy trình kỹ thuật canh tác VietGAP toàn diện */}
    {showTechnicalHandbookModal && cropProcessData && (
      <TechnicalHandbookModal
        isOpen={showTechnicalHandbookModal}
        onClose={() => setShowTechnicalHandbookModal(false)}
        cropData={cropProcessData}
        isSelected={Boolean(leaseConfig.cropId && leaseConfig.cropId === currentTechnicalCrop?.id)}
        onSelectCrop={() => {
          setShowConfigErrors(false);
          onChangeLeaseConfig({ cropId: currentTechnicalCrop.id });
        }}
      />
    )}
  </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   TechnicalHandbookModal — Sổ tay cẩm nang quy trình kỹ thuật chuẩn VietGAP
   ────────────────────────────────────────────────────────────────────────── */
function TechnicalHandbookModal({ isOpen, onClose, cropData, onSelectCrop, isSelected }) {
  if (!isOpen || !cropData) return null;
  const { cropName, cropIcon, totalDays, expectedYield, optimalConditions, stages } = cropData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header modal */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">{cropIcon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-[#18352b] truncate font-heading">
                  Cẩm nang quy trình kỹ thuật canh tác VietGAP
                </h3>
                <span className="shrink-0 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Chuẩn VietGAP
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                {cropName} • Chu kỳ chuẩn {totalDays} ngày tuổi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Đóng cẩm nang"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung cẩm nang cuộn mượt */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Thông số tối ưu */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Chu kỳ toàn vụ</span>
              <span className="text-sm font-black text-emerald-950 mt-0.5 block">{totalDays} ngày</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Năng suất ước tính</span>
              <span className="text-sm font-black text-emerald-950 mt-0.5 block">{expectedYield}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Nhiệt độ thích hợp</span>
              <span className="text-sm font-black text-emerald-950 mt-0.5 block">{optimalConditions?.tempRange || '20–30°C'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Độ ẩm đất tối ưu</span>
              <span className="text-sm font-black text-emerald-950 mt-0.5 block">{optimalConditions?.soilMoistureRange || '65–75%'}</span>
            </div>
          </div>

          {/* Chi tiết từng giai đoạn */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" />
              Chi tiết các giai đoạn sinh trưởng & biện pháp kỹ thuật ({stages.length} giai đoạn)
            </h4>

            {stages.map((st, idx) => (
              <div key={st.id || idx} className="rounded-2xl border border-stone-200 bg-stone-50/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {st.stepOrder || idx + 1}
                    </span>
                    <div>
                      <h5 className="font-extrabold text-sm text-stone-900">{st.name}</h5>
                      <span className="text-[11px] text-stone-500 font-semibold">{st.label}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                    Giai đoạn {st.stepOrder || idx + 1}
                  </span>
                </div>

                {st.statusDesc && (
                  <p className="text-stone-600 italic text-xs leading-relaxed">
                    {st.statusDesc}
                  </p>
                )}

                {/* Hướng dẫn kỹ thuật trọng tâm */}
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-900 block mb-1 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    Chỉ dẫn kỹ thuật canh tác trọng tâm:
                  </span>
                  <p className="text-emerald-950 leading-relaxed text-xs">
                    {st.guide}
                  </p>
                </div>

                {/* 2 cột: Nước tưới & Dinh dưỡng */}
                <div className="grid sm:grid-cols-2 gap-2">
                  {st.waterRegime && (
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <span className="text-[11px] font-bold text-sky-800 flex items-center gap-1 mb-0.5">
                        <Droplets className="w-3.5 h-3.5 text-sky-500" />
                        Chế độ nước tưới
                      </span>
                      <p className="text-stone-600 text-xs leading-relaxed">{st.waterRegime}</p>
                    </div>
                  )}

                  {st.nutrition && (
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                      <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mb-0.5">
                        <Leaf className="w-3.5 h-3.5 text-amber-600" />
                        Dinh dưỡng & Bón phân
                      </span>
                      <p className="text-stone-600 text-xs leading-relaxed">{st.nutrition}</p>
                    </div>
                  )}
                </div>

                {/* Sâu bệnh & Nghiệm thu */}
                {st.pestAlert && (
                  <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
                    <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1 mb-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      Phòng ngừa sâu bệnh sinh học
                    </span>
                    <p className="text-rose-950 text-xs leading-relaxed">{st.pestAlert}</p>
                  </div>
                )}

                {st.inspectionCriteria && (
                  <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100">
                    <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1 mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      Tiêu chí nghiệm thu VietGAP của Kỹ sư
                    </span>
                    <p className="text-teal-950 text-xs leading-relaxed">{st.inspectionCriteria}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer modal */}
        <div className="px-5 py-3.5 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-stone-500 font-medium">
            100% quy trình được giám sát nhật ký số và hỗ trợ bởi đội ngũ kỹ sư Farmely.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer"
            >
              Đóng
            </button>
            {!isSelected && onSelectCrop && (
              <button
                type="button"
                onClick={() => {
                  onSelectCrop();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                Chọn giống cây này
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
