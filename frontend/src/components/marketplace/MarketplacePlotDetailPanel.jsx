import React, { useState } from 'react';
import {
  MapPin,
  Droplets,
  Radio,
  Leaf,
  Heart,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Sprout,
  X,
  Minus,
  ShieldCheck,
  Zap,
  Camera
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

export default function MarketplacePlotDetailPanel({
  plot = null,
  onBookPlot,
  onFocusOnMap,
  onClose
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  if (!plot) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-16 text-center bg-white rounded-2xl shadow-xl border border-slate-200/90">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3 text-emerald-700">
          <Sprout className="w-6 h-6 stroke-[2]" />
        </div>
        <p className="text-sm font-bold text-slate-800 mb-1">Chưa chọn thửa đất</p>
        <p className="text-xs text-slate-500 max-w-[220px] leading-relaxed">
          Nhấp vào một thửa trên bản đồ vệ tinh để xem thông số kỹ thuật chi tiết
        </p>
      </div>
    );
  }

  const isAvail = plot.status === 'AVAILABLE';
  const gallery = plot.gallery || [plot.imageUrl];

  const prev = (e) => {
    e.stopPropagation();
    setImgIdx((i) => (i > 0 ? i - 1 : gallery.length - 1));
  };
  const next = (e) => {
    e.stopPropagation();
    setImgIdx((i) => (i < gallery.length - 1 ? i + 1 : 0));
  };

  const handleCtaClick = () => {
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 400);
    onBookPlot(plot);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden font-sans">
      {/* 1. Header Bar with Title & Window Controls */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E5A3] shadow-sm" />
          <h2 className="text-xs font-bold text-slate-900 tracking-tight truncate">
            {plot.name || `Thửa Ruộng Đất Nông ${plot.label}`}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
        {/* Hero Photo with Terraced Fields & 360 Badge */}
        <div className="relative h-44 w-full rounded-xl overflow-hidden shadow-sm group shrink-0 bg-slate-100">
          <img
            src={gallery[imgIdx] || plot.imageUrl}
            alt={plot.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.src = '/images/land_rect_ultra_hd.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* 360° / VR Tour Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/65 backdrop-blur-sm shadow flex items-center gap-1.5">
            <Camera className="w-3 h-3 text-[#00E5A3]" />
            <span>360° VR ({imgIdx + 1}/{gallery.length})</span>
          </div>

          {gallery.length > 1 && (
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={prev}
                className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Title, Status Pill & Location Sub-label */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
              {plot.name || `Thửa Ruộng Đất Nông ${plot.label}`}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-emerald-200 shrink-0 shadow-sm">
              {isAvail ? 'Còn trống' : 'Đã thuê'}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{plot.farmName || 'Trang trại Happy Valley'}</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">{plot.areaFormatted || '150 m²'}</span>
          </p>
        </div>

        {/* Price Section */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-baseline justify-between">
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {plot.rentalPriceFormatted || '1.000.000 đ/tháng'}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            Thanh toán linh hoạt
          </span>
        </div>

        {/* 2x2 Feature Chips (dynamic from plot data) */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-800 block">Đặc điểm thửa đất</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Droplets, label: plot.facilities?.irrigation ? 'Tưới nhỏ giọt' : 'Nguồn nước sạch', color: 'text-sky-600', bg: 'bg-sky-50', on: plot.facilities?.irrigation || plot.facilities?.waterSource },
              { icon: Radio, label: 'Cảm biến IoT', color: 'text-emerald-600', bg: 'bg-emerald-50', on: plot.facilities?.iot },
              { icon: Leaf, label: 'Đất hữu cơ', color: 'text-green-600', bg: 'bg-green-50', on: plot.facilities?.organicSoil },
              { icon: ShieldCheck, label: 'Hỗ trợ kỹ thuật', color: 'text-blue-600', bg: 'bg-blue-50', on: plot.facilities?.techSupport }
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs text-slate-700 font-semibold"
              >
                <div className={`w-6 h-6 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>
                  <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                </div>
                <span className="truncate">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suitable Crops Row (dynamic from plot data) */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-800 block">Cây trồng phù hợp</span>
          <div className="grid grid-cols-4 gap-1.5">
            {(plot.compatibleCrops || [
              { name: 'Cà chua', icon: '🍅' },
              { name: 'Cà tím', icon: '🍆' },
              { name: 'Ớt ngọt', icon: '🫑' },
              { name: 'Đậu bắp', icon: '🥒' }
            ]).slice(0, 4).map((c, i) => {
              const colorSets = [
                'bg-red-50 text-red-700 border-red-200',
                'bg-purple-50 text-purple-700 border-purple-200',
                'bg-amber-50 text-amber-700 border-amber-200',
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              ];
              return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center shadow-sm ${colorSets[i % 4]}`}
              >
                <span className="text-lg leading-none mb-1">{c.icon}</span>
                <span className="text-[10px] font-bold leading-tight truncate w-full">{c.name}</span>
              </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Specifications (Thông tin chi tiết) */}
        <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-800 block">Thông tin chi tiết</span>
          <div className="space-y-1.5 text-xs">
            {[
              { label: 'Diện tích thửa', val: plot.areaFormatted || '150 m²' },
              { label: 'Độ pH thổ nhưỡng', val: plot.specs?.ph || '6.5 pH' },
              { label: 'Hướng đất', val: plot.specs?.orientation || 'Đông Nam' },
              { label: 'Nhiệt độ', val: plot.specs?.temp || '18 – 25°C' }
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500">{s.label}:</span>
                <span className="font-bold text-slate-800">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini-map with Animated Radar Pulse Beacon */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Vị trí trên bản đồ
            </span>
            <button
              type="button"
              onClick={onFocusOnMap}
              className="text-[11px] font-bold text-[#059669] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Xem chi tiết <Maximize className="w-3 h-3" />
            </button>
          </div>
          <div
            onClick={onFocusOnMap}
            className="relative h-20 w-full rounded-xl overflow-hidden border border-slate-200/90 shadow-sm cursor-pointer group"
          >
            <img
              src="/images/land_rect_ultra_hd.jpg"
              alt="Mini Map"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/25" />

            {/* Pulsing Radar Beacon (matching GIF) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#00E5A3] opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#059669] border-2 border-white shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Footer Buttons */}
      <div className="p-4 border-t border-slate-100 space-y-2 bg-white shrink-0">
        <button
          type="button"
          onClick={handleCtaClick}
          className={`relative w-full py-3.5 rounded-xl text-sm font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-lg shadow-emerald-800/20 flex items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden ${
            isClicking ? 'scale-[0.98]' : 'active:scale-[0.98]'
          }`}
        >
          {/* Ripple wave animation on click */}
          {isClicking && (
            <span className="absolute inset-0 bg-white/30 animate-ping rounded-xl" />
          )}
          <Zap className="w-4 h-4 fill-white text-white" />
          <span>Thuê ngay</span>
        </button>

        <button
          type="button"
          onClick={() => setSaved(!saved)}
          className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          <span>{saved ? 'Đã lưu vào danh sách' : 'Lưu vào danh sách'}</span>
        </button>
      </div>
    </div>
  );
}
