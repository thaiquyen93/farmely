import React, { useState } from 'react';
import {
  MapPin,
  Droplets,
  Radio,
  Leaf,
  Waves,
  Compass,
  Thermometer,
  Calendar,
  Heart,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Maximize,
  Sprout,
  MoreHorizontal,
  TestTube2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

const STATUS_BADGE = {
  AVAILABLE: {
    bg: 'bg-emerald-50',
    bd: 'border-emerald-200',
    c: 'text-emerald-700',
    t: 'Đang trống',
    dot: 'bg-emerald-500'
  },
  RENTED: {
    bg: 'bg-amber-50',
    bd: 'border-amber-200',
    c: 'text-amber-700',
    t: 'Đã thuê',
    dot: 'bg-amber-500'
  },
  MAINTENANCE: {
    bg: 'bg-slate-100',
    bd: 'border-slate-200',
    c: 'text-slate-600',
    t: 'Bảo trì',
    dot: 'bg-slate-400'
  }
};

export default function MarketplacePlotDetailPanel({
  plot = null,
  onBookPlot,
  onFocusOnMap
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!plot) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-16 text-center bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl">
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
  const sb = STATUS_BADGE[plot.status] || STATUS_BADGE.AVAILABLE;

  const prev = (e) => {
    e.stopPropagation();
    setImgIdx((i) => (i > 0 ? i - 1 : gallery.length - 1));
  };
  const next = (e) => {
    e.stopPropagation();
    setImgIdx((i) => (i < gallery.length - 1 ? i + 1 : 0));
  };

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden font-sans">
      {/* 1. Header with Title & Context Menu */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-[260px]">
            {plot.name || `Thửa Đất ${plot.label}`}
          </h2>
        </div>
        <button
          type="button"
          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title="Tùy chọn"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {/* 2. Photo Carousel with rounded-xl */}
        <div className="relative h-44 w-full rounded-xl overflow-hidden shadow-inner group shrink-0 bg-slate-100">
          <img
            src={gallery[imgIdx] || plot.imageUrl}
            alt={plot.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Photo Pagination Count */}
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm shadow">
            {imgIdx + 1} / {gallery.length}
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

        {/* 3. Title, Status & Location Sub-label */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {plot.code}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-sm ${sb.bg} ${sb.bd} ${sb.c}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sb.dot}`} />
              {sb.t}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{plot.farmName || 'Trang trại Happy Valley'}</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">{plot.areaFormatted || '150 m²'}</span>
          </p>
        </div>

        {/* 4. Pricing Block */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-baseline justify-between">
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {plot.rentalPriceFormatted?.replace('/tháng', '') || '1.200.000 đ'}
            </span>
            <span className="text-xs text-slate-500 ml-1 font-medium">/ tháng</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {plot.unitPrice || '12.000 đ/m²/tháng'}
          </span>
        </div>

        {/* 5. Features Grid (2x2 Chips) */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-800 block">Tiện ích canh tác</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Droplets, label: 'Tưới nhỏ giọt', color: 'text-sky-600', bg: 'bg-sky-50' },
              { icon: Radio, label: 'Cảm biến IoT', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Leaf, label: 'Đất hữu cơ', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Waves, label: 'Gần nguồn nước', color: 'text-blue-600', bg: 'bg-blue-50' }
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

        {/* 6. Recommended Crops (Loại cây phù hợp) */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-800 block">Loại cây phù hợp</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(
              plot.compatibleCrops || [
                { name: 'Ớt chuông', icon: '🫑' },
                { name: 'Cà tím', icon: '🍆' },
                { name: 'Cà chua', icon: '🍅' },
                { name: 'Mướp đắng', icon: '🥒' }
              ]
            ).slice(0, 4).map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm text-[11px] font-bold text-slate-700"
              >
                <span className="text-sm shrink-0">{c.icon || '🌱'}</span>
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Technical Specifications (Thông số kỹ thuật) */}
        <div className="space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-800 block">Thông số kỹ thuật</span>
          <div className="space-y-1.5 text-xs">
            {[
              {
                icon: Compass,
                label: 'Hướng đất',
                val: plot.specs?.orientation || 'Đông Nam'
              },
              {
                icon: TestTube2,
                label: 'Độ pH',
                val: plot.specs?.ph || '6.2 – 6.5'
              },
              {
                icon: Thermometer,
                label: 'Nhiệt độ',
                val: plot.specs?.temp || '18 – 25°C'
              },
              {
                icon: Calendar,
                label: 'Mùa vụ',
                val: plot.specs?.season || 'Quanh năm'
              }
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <s.icon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.label}</span>
                </span>
                <span className="font-bold text-slate-800">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 8. Mini-map Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Vị trí
            </span>
            <button
              type="button"
              onClick={onFocusOnMap}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
            >
              Xem trên bản đồ <Maximize className="w-3 h-3" />
            </button>
          </div>
          <div
            onClick={onFocusOnMap}
            className="relative h-16 w-full rounded-xl overflow-hidden border border-slate-200/90 shadow-sm cursor-pointer group"
          >
            <img
              src="/images/land_rect_ultra_hd.jpg"
              alt="Mini Map"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white flex items-center justify-center animate-bounce">
                <MapPin className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Action Buttons (Footer) */}
      <div className="p-4 border-t border-slate-100 space-y-2 bg-white shrink-0">
        {isAvail ? (
          <button
            type="button"
            onClick={() => onBookPlot(plot)}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#14532D] hover:bg-[#1b6b3b] shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Calendar className="w-4 h-4" />
            Thuê ngay
          </button>
        ) : (
          <div className="py-2.5 px-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            Thửa đất đang có người canh tác hoặc đang bảo trì
          </div>
        )}

        <button
          type="button"
          onClick={() => setSaved(!saved)}
          className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            saved
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          {saved ? 'Đã lưu vào danh sách' : 'Lưu vào danh sách'}
        </button>
      </div>
    </div>
  );
}
