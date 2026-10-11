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
  Layers,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';

export default function MarketplacePlotDetailPanel({
  plot = null,
  isOpen = true,
  onBookPlot,
  onClose,
  isPlotSelectedForContract = false,
  onToggleSelectPlotForContract = null
}) {
  const [copied, setCopied] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Reset photo index khi đổi thửa đất
  useEffect(() => {
    setPhotoIndex(0);
  }, [plot?.id]);

  if (!plot) return null;

  const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE';
  const displayStatus = isVacant ? 'Đang trống' : 'Đã thuê';
  const plotCode = plot.code || `Plot ${plot.id}`;
  const plotName = plot.name || `Thửa Ruộng ${plot.id}`;
  const farmName = plot.farmName || 'Happy Valley';
  const plotArea =
    plot.areaFormatted ||
    (typeof plot.area === 'number' ? `${plot.area} m²` : plot.area) ||
    '150 m²';
  const plotPrice =
    plot.rentalPriceFormatted ||
    plot.price ||
    (plot.rentalPrice ? `${plot.rentalPrice.toLocaleString('vi-VN')} đ` : '1.200.000 đ');
  
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

  // Format crops list
  let cropsList = [];
  if (Array.isArray(plot.crops)) {
    cropsList = plot.crops;
  } else if (Array.isArray(plot.compatibleCrops)) {
    cropsList = plot.compatibleCrops.map((c) => `${c.icon || '🌱'} ${c.name}`);
  } else {
    cropsList = ['🌶️ Ớt chuông', '🍆 Cà tím', '🍅 Cà chua bi'];
  }

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

  return (
    <aside
      id="detail-panel"
      className={`absolute top-4 right-4 bottom-4 z-20 w-[355px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/80 flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform ${
        isOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-[390px] opacity-0 pointer-events-none'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER HERO IMAGE & INTERACTIVE GALLERY (Độ cao 148px, chuẩn Airbnb Luxe)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="relative h-[148px] w-full bg-slate-950 shrink-0 overflow-hidden group select-none">
        <img
          key={currentPhoto}
          id="detail-img"
          src={currentPhoto}
          alt={plotName}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient Scrim nhiều lớp tăng độ tương phản */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-black/35 pointer-events-none" />

        {/* Nút lướt ảnh trái / phải (Hiện khi hover) */}
        {photos.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              type="button"
              onClick={prevPhoto}
              className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:bg-black/75 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/20 pointer-events-auto cursor-pointer"
              title="Ảnh trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:bg-black/75 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/20 pointer-events-auto cursor-pointer"
              title="Ảnh tiếp theo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Badges & Actions */}
        <div className="absolute top-3 left-3.5 right-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span
              id="detail-tag-status"
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide flex items-center gap-1.5 shadow-sm backdrop-blur-md border ${
                isVacant
                  ? 'bg-emerald-500/95 text-white border-emerald-400/50 shadow-emerald-950/30'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isVacant ? 'bg-white animate-ping' : 'bg-slate-400'
                }`}
              />
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
              className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md text-white/90 hover:bg-black/70 hover:text-white transition-all flex items-center justify-center border border-white/20 cursor-pointer"
              title="Sao chép liên kết thửa"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md text-white/90 hover:bg-black/70 hover:text-white transition-all flex items-center justify-center border border-white/20 cursor-pointer"
              title="Đóng chi tiết"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Thông báo copy liên kết */}
        {copied && (
          <div className="absolute top-12 right-3.5 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-lg z-20 animate-fade-in">
            Đã chép liên kết!
          </div>
        )}

        {/* Bottom Hero Overlay: Mã thửa + Tên thửa */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white z-10 pointer-events-none flex items-end justify-between">
          <div className="max-w-[80%]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.2 rounded-md bg-white/20 backdrop-blur-md text-[9px] font-black text-white border border-white/30 tracking-wider">
                {plotCode}
              </span>
              <span className="text-[10px] text-emerald-200 font-semibold drop-shadow">
                • {farmName}
              </span>
            </div>
            <h3
              id="detail-title"
              className="text-base font-black text-white leading-tight drop-shadow-md truncate"
            >
              {plotName}
            </h3>
          </div>

          {/* Chỉ số ảnh (1/3) */}
          {photos.length > 1 && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-[9px] font-mono font-bold text-white/90 border border-white/15">
              {photoIndex + 1}/{photos.length}
            </span>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. SCROLLABLE BODY CONTENT (Bento Grid Cao Cấp)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div
        key={plot.id}
        className="p-3.5 flex-1 overflow-y-auto no-scrollbar space-y-3 text-slate-700 text-xs"
      >
        {/* Row 1: Thẻ Giá Niêm Yết & Quy Mô Thổ Nhưỡng (Glassmorphism Bento) */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/[0.08] via-white to-emerald-50/40 border border-emerald-500/20 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Đơn giá thuê
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded-full">
                {formattedUnitPrice}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span id="detail-price" className="text-xl font-black text-emerald-600 tracking-tight">
                {plotPrice}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">/tháng</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
              Quy mô & Hướng
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end text-slate-900 font-black text-xs">
              <span className="bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200/60">
                {plotArea}
              </span>
              <span className="text-slate-300">•</span>
              <span className="bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200/60">
                {direction}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Cụm 4 Chỉ Số IoT & Vi Khí Hậu (Đồng bộ, trang nhã) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <h4 className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
                Vi Khí Hậu & Thổ Nhưỡng IoT
              </h4>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Trực tiếp 24/7
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex items-center gap-2.5 hover:border-emerald-300 transition-colors group">
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                <Thermometer className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-medium">Nhiệt độ TB</p>
                <p className="font-extrabold text-slate-900 leading-tight">{tempValue}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex items-center gap-2.5 hover:border-emerald-300 transition-colors group">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-medium">Độ pH đất</p>
                <p className="font-extrabold text-slate-900 leading-tight">{phValue}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex items-center gap-2.5 hover:border-emerald-300 transition-colors group">
              <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100 group-hover:scale-105 transition-transform">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-medium">Tưới tự động</p>
                <p className="font-extrabold text-slate-900 leading-tight">Israel nhỏ giọt</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex items-center gap-2.5 hover:border-emerald-300 transition-colors group">
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 group-hover:scale-105 transition-transform">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-medium">Cảm biến</p>
                <p className="font-extrabold text-slate-900 leading-tight">IoT vi khí hậu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Cây Trồng Tương Thích Thổ Nhưỡng (Có chỉ số %) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Cây Trồng Tương Thích Nhất
            </h4>
            <span className="text-[9px] text-emerald-600 font-bold">Thổ nhưỡng chuẩn</span>
          </div>
          <div id="detail-crops" className="flex flex-wrap gap-1.5">
            {cropsList.map((crop, idx) => {
              const matchPercent = 98 - idx * 2;
              return (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white text-slate-800 border border-slate-200/80 rounded-xl text-[10px] font-bold shadow-2xs hover:border-emerald-400 hover:text-emerald-700 transition-colors flex items-center gap-1.5 cursor-default"
                >
                  <span>{crop}</span>
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-[9px] text-emerald-600 font-semibold">{matchPercent}%</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Row 4: Bảo Chứng Chất Lượng & Đặc Quyền Farmely */}
        <div className="px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] via-emerald-50/50 to-teal-500/[0.08] border border-emerald-500/20 flex items-center gap-2.5 text-[11px] text-emerald-950 font-medium">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="leading-tight">
            <p className="font-black text-emerald-900 text-[11px]">Bảo chứng chất lượng Farmely</p>
            <p className="text-[10px] text-emerald-700/80">Kỹ sư VietGAP hỗ trợ • Đóng gói giao tận nhà</p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. BOTTOM ACTION CTA BUTTONS (Gradient Đa Tầng, Hiệu Ứng Bấm Sang Trọng)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-slate-100/90 bg-white/98 backdrop-blur-md shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => onBookPlot(plot)}
          disabled={!isVacant}
          className={`w-full py-2.5 rounded-2xl font-black text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isVacant
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isVacant ? 'Thuê ngay thửa này' : 'Thửa đất đã có người thuê'}</span>
        </button>

        {isVacant && onToggleSelectPlotForContract && (
          <button
            type="button"
            onClick={() => onToggleSelectPlotForContract(plot)}
            className={`w-full py-2 rounded-2xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isPlotSelectedForContract
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isPlotSelectedForContract
                ? '✓ Đã chọn vào hợp đồng (Bấm để gỡ)'
                : '+ Thêm vào HĐ'}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
