import React, { useState } from 'react';
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
  Layers
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

  if (!plot) return null;

  const isVacant = plot.status === 'Đang trống' || plot.status === 'AVAILABLE';
  const displayStatus = isVacant ? 'Đang trống' : 'Đã thuê';
  const plotCode = plot.code || `Plot ${plot.id}`;
  const plotName = plot.name || `Thửa Ruộng ${plot.id}`;
  const farmName = plot.farmName || 'Happy Valley';
  const plotArea =
    plot.areaFormatted ||
    (typeof plot.area === 'number' ? `${plot.area} m²` : plot.area) ||
    '160 m²';
  const plotPrice =
    plot.rentalPriceFormatted ||
    plot.price ||
    (plot.rentalPrice ? `${plot.rentalPrice.toLocaleString('vi-VN')} đ` : '1.250.000 đ');
  const plotImg =
    plot.img ||
    plot.imageUrl ||
    'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80';

  // Format crops list (ngắn gọn, tối đa 3-4 loại)
  let cropsList = [];
  if (Array.isArray(plot.crops)) {
    cropsList = plot.crops;
  } else if (Array.isArray(plot.compatibleCrops)) {
    cropsList = plot.compatibleCrops.map((c) => `${c.icon || '🌱'} ${c.name}`);
  } else {
    cropsList = ['🍅 Cà chua bi', '🥬 Xà lách xoăn', '🌿 Bạc hà'];
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

  return (
    <aside
      id="detail-panel"
      className={`absolute top-4 right-4 bottom-4 z-20 w-[350px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.14)] border border-white/80 flex flex-col overflow-hidden transition-all duration-300 ease-out transform will-change-transform ${
        isOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-[390px] opacity-0 pointer-events-none'
      }`}
    >
      {/* 1. Header Hero Image & Status Badges (Gọn gàng, độ cao 140px) */}
      <div className="relative h-36 w-full bg-slate-900 shrink-0 overflow-hidden group">
        <img
          key={plotImg}
          id="detail-img"
          src={plotImg}
          alt={plotName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30 pointer-events-none" />

        {/* Top Badges & Actions */}
        <div className="absolute top-3 left-3.5 right-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span
              id="detail-tag-status"
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide flex items-center gap-1.5 shadow-sm backdrop-blur-md border ${
                isVacant
                  ? 'bg-emerald-500/95 text-white border-emerald-400/50'
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
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/20">
              VietGAP
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/60 hover:text-white transition-all flex items-center justify-center border border-white/20 cursor-pointer"
              title="Sao chép liên kết thửa"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/60 hover:text-white transition-all flex items-center justify-center border border-white/20 cursor-pointer"
              title="Đóng chi tiết"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {copied && (
          <div className="absolute top-12 right-3.5 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-lg z-20">
            Đã chép liên kết!
          </div>
        )}

        {/* Bottom Title inside Hero Image */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white z-10 pointer-events-none">
          <span className="text-[10px] text-emerald-300 font-bold block mb-0.5 tracking-tight">
            {plotCode} • {farmName}
          </span>
          <h3
            id="detail-title"
            className="text-base font-black text-white leading-tight drop-shadow truncate"
          >
            {plotName}
          </h3>
        </div>
      </div>

      {/* 2. Scrollable Body Content (Thoáng đãng, loại bỏ hộp rối mắt) */}
      <div
        key={plot.id}
        className="p-3.5 flex-1 overflow-y-auto no-scrollbar space-y-3 text-slate-700 text-xs"
      >
        {/* Row 1: Giá thuê & Quy mô chính */}
        <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Đơn giá thuê
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span id="detail-price" className="text-xl font-black text-emerald-600 tracking-tight">
                {plotPrice}
              </span>
              <span className="text-[10px] font-medium text-slate-400">/tháng</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Thông số
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end text-slate-800 font-extrabold text-xs">
              <span>{plotArea}</span>
              <span className="text-slate-300">•</span>
              <span>{direction}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Hạ tầng & Thông số IoT (4 ô nhỏ gọn đồng nhất) */}
        <div>
          <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Hạ tầng & Thổ nhưỡng IoT
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400">Nhiệt độ TB</p>
                <p className="font-bold text-slate-800">{tempValue}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400">Độ pH đất</p>
                <p className="font-bold text-slate-800">{phValue}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400">Tưới tự động</p>
                <p className="font-bold text-slate-800">Israel nhỏ giọt</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500 shrink-0" />
              <div>
                <p className="text-[9px] text-slate-400">Cảm biến</p>
                <p className="font-bold text-slate-800">IoT trực tiếp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Cây trồng khuyến nghị */}
        <div>
          <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Cây trồng phù hợp thổ nhưỡng
          </h4>
          <div id="detail-crops" className="flex flex-wrap gap-1.5">
            {cropsList.map((crop, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200/60 rounded-lg text-[10px] font-semibold"
              >
                {crop}
              </span>
            ))}
          </div>
        </div>

        {/* Row 4: Cam kết tinh gọn 1 dòng */}
        <div className="px-3 py-2 rounded-xl bg-emerald-50/40 border border-emerald-100/80 flex items-center gap-2 text-[10px] text-emerald-800 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Chuẩn VietGAP • Hỗ trợ kỹ sư nông nghiệp 24/7</span>
        </div>
      </div>

      {/* 3. Bottom Action CTA Buttons */}
      <div className="p-3 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => onBookPlot(plot)}
          disabled={!isVacant}
          className={`w-full py-2.5 rounded-xl font-black text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isVacant
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{isVacant ? 'Thuê ngay thửa này' : 'Thửa đất đã có người thuê'}</span>
        </button>

        {isVacant && onToggleSelectPlotForContract && (
          <button
            type="button"
            onClick={() => onToggleSelectPlotForContract(plot)}
            className={`w-full py-2 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isPlotSelectedForContract
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isPlotSelectedForContract
                ? '✓ Đã chọn vào hợp đồng (Bấm để gỡ)'
                : '+ Thêm vào hợp đồng Master'}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
