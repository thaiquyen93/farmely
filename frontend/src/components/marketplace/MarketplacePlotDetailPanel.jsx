import React, { useState } from 'react';
import {
  Zap,
  X,
  Droplets,
  Cpu,
  Sprout,
  Waves,
  Compass,
  Thermometer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Share2
} from 'lucide-react';

export default function MarketplacePlotDetailPanel({
  plot = null,
  isOpen = true,
  onBookPlot,
  onClose
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

  // Format crops list
  let cropsList = [];
  if (Array.isArray(plot.crops)) {
    cropsList = plot.crops;
  } else if (Array.isArray(plot.compatibleCrops)) {
    cropsList = plot.compatibleCrops.map((c) => `${c.icon || '🌱'} ${c.name}`);
  } else {
    cropsList = ['🍅 Cà chua', '🫑 Ớt hiểm', '🥬 Xà lách xoăn'];
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
      className={`absolute top-4 right-6 bottom-6 z-20 w-[400px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-white/80 flex flex-col overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform ${
        isOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-[440px] opacity-0 pointer-events-none'
      }`}
    >
      {/* 1. Header Hero Image & Status Badges */}
      <div className="relative h-48 w-full bg-slate-900 shrink-0 overflow-hidden group">
        <img
          key={plotImg}
          id="detail-img"
          src={plotImg}
          alt={plotName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Scrim Gradient mượt mà */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/25 pointer-events-none" />

        {/* Top Badges & Actions */}
        <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span
              id="detail-tag-status"
              className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide flex items-center gap-1.5 shadow-lg backdrop-blur-md border ${
                isVacant
                  ? 'bg-emerald-500/90 text-white border-emerald-400/40 shadow-emerald-950/40'
                  : 'bg-slate-800/90 text-slate-200 border-slate-700 shadow-slate-950/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isVacant ? 'bg-white animate-ping' : 'bg-slate-400'
                }`}
              />
              {displayStatus}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-sm">
              ✨ VietGAP
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/60 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/20 cursor-pointer"
              title="Sao chép liên kết thửa"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/60 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/20 cursor-pointer"
              title="Đóng chi tiết"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thông báo copy liên kết */}
        {copied && (
          <div className="absolute top-14 right-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-lg animate-fade-in z-20">
            Đã chép liên kết!
          </div>
        )}

        {/* Bottom Title inside Hero Image */}
        <div className="absolute bottom-3.5 left-4 right-4 text-white z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold mb-0.5 drop-shadow">
            <span>📍 {farmName}</span>
            <span>•</span>
            <span>Diện tích {plotArea}</span>
          </div>
          <h3
            id="detail-title"
            className="text-lg font-black text-white leading-tight drop-shadow-md truncate"
          >
            {plotName}
          </h3>
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div
        key={plot.id}
        className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-4 text-slate-700 text-xs"
      >
        {/* Banner Giá & Mã Thửa */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-50/40 to-slate-50/60 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Mã thửa đất
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                Canh tác số
              </span>
            </div>
            <p id="detail-code" className="text-base font-black text-slate-900 tracking-tight mt-0.5">
              {plotCode}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block">Đơn giá niêm yết</span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span id="detail-price" className="text-xl font-black text-emerald-600 tracking-tight">
                {plotPrice}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">/tháng</span>
            </div>
          </div>
        </div>

        {/* Tiện ích tích hợp (Amenities 2x2 Grid) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Tiện ích tích hợp sẵn
            </h4>
            <span className="text-[10px] font-medium text-slate-400">4 dịch vụ</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100/80 flex items-center gap-2.5 hover:bg-blue-50 transition-colors">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">Tưới nhỏ giọt</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Tự động Israel</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-purple-50/60 border border-purple-100/80 flex items-center gap-2.5 hover:bg-purple-50 transition-colors">
              <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">Cảm biến IoT</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Trực tuyến 24/7</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-2.5 hover:bg-emerald-50 transition-colors">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <Sprout className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">Đất hữu cơ</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Giàu mùn vi sinh</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-cyan-50/60 border border-cyan-100/80 flex items-center gap-2.5 hover:bg-cyan-50 transition-colors">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center shrink-0">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">Gần kênh nước</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Dồi dào mát lành</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cảm biến Thổ Nhưỡng & Khí hậu IoT */}
        <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/70">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/50">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                Vi khí hậu & Thổ nhưỡng IoT
              </span>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              Trực tiếp
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Compass className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-[9px] text-slate-400 block font-medium">Hướng đất</span>
              <span id="detail-direction" className="text-xs font-black text-slate-800 block mt-0.5">
                {direction}
              </span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-[9px] text-slate-400 block font-medium">Độ pH đất</span>
              <span id="detail-ph" className="text-xs font-black text-emerald-600 block mt-0.5">
                {phValue}
              </span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <span className="text-[9px] text-slate-400 block font-medium">Nhiệt độ TB</span>
              <span id="detail-temp" className="text-xs font-black text-slate-800 block mt-0.5">
                {tempValue}
              </span>
            </div>
          </div>
        </div>

        {/* Cây trồng khuyến nghị */}
        <div>
          <h4 className="font-extrabold text-slate-900 text-xs tracking-tight uppercase mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Cây trồng khuyến nghị vụ này
          </h4>
          <div id="detail-crops" className="flex flex-wrap gap-1.5">
            {cropsList.map((crop, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-200/80 rounded-xl text-[10px] font-bold shadow-2xs hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center gap-1"
              >
                <span>{crop}</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span className="text-[9px] text-emerald-600 font-medium">98% hợp</span>
              </span>
            ))}
          </div>
        </div>

        {/* Cam kết đặc quyền từ Farmely */}
        <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Đặc quyền người thuê thửa
          </p>
          <ul className="text-[10px] text-emerald-950/80 space-y-1 font-medium pl-1">
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Theo dõi camera và thông số đất đai 24/7 trên điện thoại</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Kỹ sư nông nghiệp đồng hành chăm sóc theo tiêu chuẩn VietGAP</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Thu hoạch và đóng thùng giao tận cửa nhà bạn</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Bottom Action CTA Buttons */}
      <div className="p-3.5 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0">
        <button
          type="button"
          onClick={() => onBookPlot(plot)}
          disabled={!isVacant}
          className={`w-full py-3.5 rounded-2xl font-black text-xs tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isVacant
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isVacant ? 'Thuê ngay thửa này' : 'Thửa đất đã có người thuê'}</span>
        </button>
      </div>
    </aside>
  );
}
