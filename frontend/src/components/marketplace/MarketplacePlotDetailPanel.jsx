import React, { useState, useEffect } from 'react';
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
  Leaf,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { safeCrops } from '../../data/safeCrops';

/* ──────────────────────────────────────────────────────────────────────────────
   MarketplacePlotDetailPanel — Luxury Redesign v2
   ────────────────────────────────────────────────────────────────────────── */
export default function MarketplacePlotDetailPanel({
  plot = null,
  isOpen = true,
  onBookPlot,
  onClose,
  isPlotSelectedForContract = false,
  onToggleSelectPlotForContract = null,
  selectedCropId = '',
  onSelectCrop = null
}) {
  const [copied, setCopied] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [cropError, setCropError] = useState(false);

  // Reset photo index, tab & error khi đổi thửa đất
  useEffect(() => {
    setPhotoIndex(0);
    setActiveTab('overview');
    setCropError(false);
  }, [plot?.id]);

  if (!plot) return null;

  const isVacant = (plot.status === 'Đang trống' || plot.status === 'AVAILABLE' || plot.status === 'AVAIL') && plot.status !== 'Đã thuê' && plot.statusCode !== 'RENTED' && plot.statusCode !== 'RENT';
  const isMaintenance = plot.status === 'Bảo trì' || plot.status === 'MAINT' || plot.statusCode === 'MAINT' || plot.statusCode === 'MAINTENANCE';
  const displayStatus = isVacant ? 'Đang trống' : (isMaintenance ? 'Bảo trì (4 ngày)' : 'Đã thuê');
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

  // Danh sách ảnh thực tế của thửa đất
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

  // IoT metrics với color-coded status
  const iotMetrics = [
    {
      icon: Thermometer,
      label: 'Nhiệt độ',
      value: tempValue,
      statusText: 'Tối ưu',
      statusColor: 'emerald',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      iconBorder: 'border-rose-100'
    },
    {
      icon: Sparkles,
      label: 'Độ pH đất',
      value: phValue,
      statusText: 'Tối ưu',
      statusColor: 'emerald',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      iconBorder: 'border-amber-100'
    },
    {
      icon: Droplets,
      label: 'Tưới tự động',
      value: 'Israel nhỏ giọt',
      statusText: 'Hoạt động',
      statusColor: 'emerald',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-500',
      iconBorder: 'border-sky-100'
    },
    {
      icon: Cpu,
      label: 'Cảm biến IoT',
      value: 'Vi khí hậu',
      statusText: 'Online',
      statusColor: 'emerald',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
      iconBorder: 'border-violet-100'
    }
  ];

  return (
    <aside
      id="detail-panel"
      className={`absolute inset-x-2 top-20 bottom-2 z-30 flex w-auto flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform sm:inset-x-auto sm:right-3 sm:bottom-3 sm:w-[340px] sm:rounded-3xl 2xl:right-4 2xl:bottom-4 2xl:w-[370px] ${
        isOpen
          ? 'translate-x-0 translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-[110%] opacity-0 pointer-events-none sm:translate-x-[400px] sm:translate-y-0'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO IMAGE (200px) + DOT INDICATORS
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="relative h-[145px] w-full shrink-0 select-none overflow-hidden bg-slate-950 group sm:h-[155px] 2xl:h-[190px]">
        <img
          key={currentPhoto}
          id="detail-img"
          src={currentPhoto}
          alt={plotName}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient Scrim nhiều lớp */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/15 pointer-events-none" />

        {/* Nút lướt ảnh trái / phải */}
        {photos.length > 1 && (
          <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              type="button"
              onClick={prevPhoto}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/70 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/15 pointer-events-auto cursor-pointer"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/70 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/15 pointer-events-auto cursor-pointer"
              title="Ảnh tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Badges & Actions */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span
              id="detail-tag-status"
              className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide flex items-center gap-1.5 shadow-sm backdrop-blur-md border ${
                isVacant
                  ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-950/30'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isVacant ? 'bg-white animate-ping' : 'bg-slate-400'
                }`}
              />
              {displayStatus}
            </span>
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/25 shadow-2xs">
              ✨ VietGAP
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/65 hover:text-white transition-all flex items-center justify-center border border-white/15 cursor-pointer"
              title="Sao chép liên kết thửa"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/65 hover:text-white transition-all flex items-center justify-center border border-white/15 cursor-pointer"
              title="Đóng chi tiết"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thông báo copy liên kết */}
        {copied && (
          <div className="absolute top-14 right-4 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-lg shadow-lg z-20 animate-fade-in">
            Đã chép liên kết!
          </div>
        )}

        {/* Bottom Hero Overlay: Mã thửa + Tên thửa + Dot indicators */}
        <div className="absolute bottom-3 left-4 right-4 text-white z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-black text-white border border-white/30 tracking-wider">
              {plotCode}
            </span>
            <span className="max-w-[55%] truncate whitespace-nowrap text-[11px] text-emerald-200 font-semibold drop-shadow">
              • {farmName}
            </span>
          </div>
          <h3
            id="detail-title"
            className="text-lg font-black text-white leading-tight drop-shadow-md truncate"
          >
            {plotName}
          </h3>

          {/* Dot indicators thay vì "1/3" */}
          {photos.length > 1 && (
            <div className="flex items-center gap-1.5 mt-2">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(idx);
                  }}
                  className={`rounded-full transition-all duration-300 pointer-events-auto cursor-pointer ${
                    idx === photoIndex
                      ? 'w-5 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. GIÁ THUÊ — FOCAL POINT (Tách riêng, to rõ)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100/80 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-wider text-slate-400">
                Giá thuê hàng tháng
              </span>
              <span className="whitespace-nowrap text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                {formattedUnitPrice}
              </span>
            </div>
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span
                id="detail-price"
                className="text-xl 2xl:text-2xl font-black text-emerald-600 tracking-tight tabular-nums"
              >
                {plotPrice}
              </span>
              <span className="text-xs font-semibold text-slate-400">/tháng</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Quy mô
            </span>
            <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60 text-xs font-black text-slate-800">
                {plotArea}
              </span>
                <span className="whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60 text-xs font-black text-slate-800">
                {direction}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. TAB NAVIGATION: Tổng quan / Kỹ thuật
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-2.5 pb-0 shrink-0">
        <div className="flex items-center gap-1 p-1 bg-slate-100/70 rounded-xl border border-slate-200/40">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
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
          4. SCROLLABLE TAB CONTENT
      ───────────────────────────────────────────────────────────────────────────── */}
      <div
        key={`${plot.id}-${activeTab}`}
        className="px-4 pt-3 pb-3 flex-1 overflow-y-auto no-scrollbar space-y-3"
      >
        {/* ═══════════ TAB: TỔNG QUAN ═══════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Đặt bộ chọn cây lên đầu nội dung để khách không phải cuộn mới chọn được */}
            <div className={`rounded-xl border p-2.5 transition-all ${
              cropError && !selectedCropId
                ? 'border-2 border-rose-500 bg-rose-50/70 shadow-sm ring-2 ring-rose-500/20'
                : 'border-emerald-200 bg-emerald-50/40'
            }`}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <h4 className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  Chọn cây trồng <span className="text-rose-500">*</span>
                </h4>
                {selectedCropId ? (
                  <span className="shrink-0 whitespace-nowrap text-[10px] font-bold text-emerald-600">10 quy trình</span>
                ) : (
                  <span className="shrink-0 whitespace-nowrap text-[10px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                    BẮT BUỘC CHỌN
                  </span>
                )}
              </div>
              <select
                value={selectedCropId}
                onChange={(event) => {
                  setCropError(false);
                  onSelectCrop?.(event.target.value);
                }}
                className={`w-full rounded-lg px-3 py-2 text-xs font-bold outline-none transition-all cursor-pointer ${
                  cropError && !selectedCropId
                    ? 'border-2 border-rose-500 bg-white text-rose-900 ring-2 ring-rose-500/30'
                    : 'border border-emerald-200 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-400/40'
                }`}
              >
                <option value="">-- Vui lòng chọn giống cây cho thửa đất này --</option>
                {safeCrops.map((crop) => (
                  <option key={crop.id} value={crop.id}>{crop.name} — {crop.variety}</option>
                ))}
              </select>
              {cropError && !selectedCropId && (
                <p className="mt-1.5 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  Vui lòng chọn giống cây trước khi nhấn thuê thửa!
                </p>
              )}
              {selectedCropId ? (() => {
                const selectedCrop = safeCrops.find((crop) => crop.id === selectedCropId);
                return selectedCrop ? (
                  <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-[10px] text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="truncate whitespace-nowrap"><strong className="text-slate-800">{selectedCrop.variety}</strong> · Chu kỳ {selectedCrop.duration} · Độ ẩm {selectedCrop.soilMoisture}</span>
                  </div>
                ) : null;
              })() : !cropError ? (
                <p className="mt-1.5 truncate whitespace-nowrap text-[10px] text-slate-500">Chọn cây trước khi thuê để Farmely gợi ý lịch canh tác phù hợp.</p>
              ) : null}
            </div>

            {/* Bảo chứng VietGAP */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] via-emerald-50/50 to-teal-500/[0.06] border border-emerald-200/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="leading-snug">
                <p className="font-black text-emerald-900 text-xs">
                  Bảo chứng chất lượng Farmely
                </p>
                <p className="text-[11px] text-emerald-700/80 mt-0.5">
                  Kỹ sư VietGAP hỗ trợ • Đóng gói giao tận nhà
                </p>
              </div>
            </div>

            {/* Quick specs grid 3 cột */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Diện tích</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{plotArea}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Hướng</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{direction}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Đơn giá</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">
                  {unitPricePerSqm.toLocaleString('vi-VN')}
                </p>
                <p className="text-[9px] text-slate-400">đ/m²</p>
              </div>
            </div>

          </>
        )}

        {/* ═══════════ TAB: KỸ THUẬT ═══════════ */}
        {activeTab === 'technical' && (
          <>
            {/* IoT Telemetry với color-coded status badges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <h4 className="font-extrabold text-[11px] text-slate-600 uppercase tracking-wider">
                    Vi Khí Hậu & Thổ Nhưỡng
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Trực tiếp 24/7
                </span>
              </div>

              <div className="space-y-2">
                {iotMetrics.map((metric, idx) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3 hover:border-emerald-200 transition-all group"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${metric.iconBg} ${metric.iconColor} flex items-center justify-center shrink-0 border ${metric.iconBorder} group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400 font-medium">{metric.label}</p>
                        <p className="text-xs font-extrabold text-slate-900 leading-tight">
                          {metric.value}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {metric.statusText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thông số thổ nhưỡng — Progress bars */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60">
              <h4 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                Thông số thổ nhưỡng
              </h4>
              <div className="space-y-2.5">
                {[
                  { label: 'Độ ẩm đất', value: 65, unit: '%' },
                  { label: 'Chất hữu cơ', value: 82, unit: '%' },
                  { label: 'Nitrogen (N)', value: 74, unit: 'mg/kg' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-slate-500">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700">
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
          5. BOTTOM CTA BUTTONS (Phân biệt rõ chính / phụ)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-slate-100/90 bg-white/98 backdrop-blur-xl shrink-0 space-y-2">
        {/* Nút chính — To, gradient nổi bật */}
        <button
          type="button"
          onClick={() => {
            if (!selectedCropId) {
              setCropError(true);
              setActiveTab('overview');
              return;
            }
            setCropError(false);
            onBookPlot(plot, selectedCropId);
          }}
          disabled={!isVacant}
          className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isVacant
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Zap className="w-4.5 h-4.5 fill-current" />
          <span>{isVacant ? 'Thuê ngay thửa này' : 'Thửa đất đã có người thuê'}</span>
        </button>

        {/* Nút phụ — Nhỏ hơn, outline */}
        {isVacant && onToggleSelectPlotForContract && (
          <button
            type="button"
            onClick={() => onToggleSelectPlotForContract(plot)}
            className={`w-full py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isPlotSelectedForContract
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            <span>
              {isPlotSelectedForContract
                ? 'Đã chọn — bấm để bỏ'
                : 'Chọn thửa đất'}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
