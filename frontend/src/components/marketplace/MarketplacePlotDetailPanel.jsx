import React, { useState } from 'react';
import {
  MapPin,
  Maximize2,
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
  Sparkles,
  Sprout,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

export default function MarketplacePlotDetailPanel({
  plot = null,
  onBookPlot,
  onFocusOnMap
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // If no plot selected, render welcoming empty state
  if (!plot) {
    return (
      <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-brand-green flex items-center justify-center mx-auto">
          <Sprout className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading font-black text-base text-brand-dark">
            Chưa Chọn Thửa Đất
          </h3>
          <p className="text-xs text-brand-muted max-w-xs mx-auto leading-relaxed">
            Nhấp chuột vào một phân khu trên bản đồ vệ tinh GIS hoặc danh sách bên dưới để xem thông số nông học chi tiết.
          </p>
        </div>
        <div className="pt-2 text-[11px] text-stone-400">
          ✓ Dữ liệu trạm cảm biến IoT và thổ nhưỡng chuẩn VietGAP
        </div>
      </div>
    );
  }

  const statusConfig = GIS_STATUSES[plot.status] || GIS_STATUSES.AVAILABLE;
  const isAvailable = plot.status === 'AVAILABLE';
  const gallery = plot.gallery || [plot.imageUrl];

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-sm space-y-4 text-brand-dark">
      {/* 1. Photo Carousel */}
      <div className="relative h-44 sm:h-48 w-full rounded-xl overflow-hidden bg-stone-100 group">
        <img
          src={gallery[activeImageIndex] || plot.imageUrl}
          alt={plot.name}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Counter Badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-sm">
          {activeImageIndex + 1}/{gallery.length}
        </div>

        {/* Navigation arrows */}
        {gallery.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handlePrevImage}
              className="w-7 h-7 rounded-full bg-white/90 text-brand-dark flex items-center justify-center hover:bg-white shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="w-7 h-7 rounded-full bg-white/90 text-brand-dark flex items-center justify-center hover:bg-white shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Header: Title & Status */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-black text-xl text-brand-dark">
            {plot.code}
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badgeClass}`}>
            {statusConfig.iconText} {statusConfig.label}
          </span>
        </div>

        <p className="text-xs text-brand-muted flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-brand-green shrink-0" />
          <span>{plot.farmName} • {plot.areaFormatted}</span>
        </p>
      </div>

      {/* 3. Pricing */}
      <div className="flex items-baseline justify-between pt-1 pb-2 border-b border-brand-border/60">
        <div>
          <span className="font-heading font-black text-xl text-brand-dark">
            {plot.rentalPriceFormatted.replace('/tháng', '')}
          </span>
          <span className="text-xs text-brand-muted"> / tháng</span>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          <span>~ {plot.unitPrice}</span>
        </span>
      </div>

      {/* 4. Facilities 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-brand-cream/50 border border-brand-border/60">
          <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
          <span className="text-stone-700 font-medium">Tưới nhỏ giọt</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-brand-cream/50 border border-brand-border/60">
          <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-stone-700 font-medium">Cảm biến IoT</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-brand-cream/50 border border-brand-border/60">
          <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-stone-700 font-medium">Đất hữu cơ</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-brand-cream/50 border border-brand-border/60">
          <Waves className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-stone-700 font-medium">Gần nguồn nước</span>
        </div>
      </div>

      {/* 5. Compatible Crops */}
      <div className="space-y-2 pt-1 border-t border-brand-border/60">
        <label className="text-xs font-bold text-brand-dark block">
          Loại cây phù hợp
        </label>
        <div className="grid grid-cols-4 gap-2 text-center">
          {(plot.compatibleCrops || [
            { name: 'Xà lách', icon: '🥬' },
            { name: 'Cải bó xôi', icon: '🥦' },
            { name: 'Rau muống', icon: '🌿' },
            { name: 'Húng quế', icon: '🍃' }
          ]).slice(0, 4).map((crop, idx) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center space-y-1"
            >
              <span className="text-lg">{crop.icon || '🌱'}</span>
              <span className="text-[10px] font-bold text-stone-700 truncate w-full">
                {crop.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Additional Specs */}
      <div className="space-y-1.5 pt-1 border-t border-brand-border/60 text-xs">
        <label className="font-bold text-brand-dark block text-xs">
          Thông tin thêm
        </label>
        <div className="space-y-1 text-stone-600 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Compass className="w-3.5 h-3.5 text-stone-400" /> Hướng đất:
            </span>
            <span className="font-bold text-brand-dark">{plot.specs?.orientation || 'Đông Nam'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-500">
              🧪 Độ pH:
            </span>
            <span className="font-bold text-brand-dark">{plot.specs?.ph || '6.2 – 6.8'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Thermometer className="w-3.5 h-3.5 text-stone-400" /> Nhiệt độ phù hợp:
            </span>
            <span className="font-bold text-brand-dark">{plot.specs?.temp || '18 – 28°C'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Calendar className="w-3.5 h-3.5 text-stone-400" /> Mùa vụ:
            </span>
            <span className="font-bold text-brand-dark">{plot.specs?.season || 'Quanh năm'}</span>
          </div>
        </div>
      </div>

      {/* 7. Mini Map Location Preview */}
      <div className="pt-1 border-t border-brand-border/60 space-y-1.5">
        <label className="font-bold text-brand-dark block text-xs flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand-green" />
            <span>Vị trí plot</span>
          </span>
          <button
            type="button"
            onClick={onFocusOnMap}
            className="text-[11px] text-brand-green hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Xem trên bản đồ lớn</span>
            <Maximize className="w-3 h-3" />
          </button>
        </label>

        <div
          onClick={onFocusOnMap}
          className="relative h-20 w-full rounded-xl overflow-hidden border border-brand-border cursor-pointer group"
        >
          <img
            src="/images/land_rect_ultra_hd.jpg"
            alt="Mini Map Preview"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-[#294C38] text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
            </div>
          </div>
        </div>
      </div>

      {/* 8. Action CTAs */}
      <div className="pt-2 space-y-2">
        {isAvailable ? (
          <button
            type="button"
            onClick={() => onBookPlot(plot)}
            className="w-full py-3 px-4 rounded-xl bg-[#294C38] hover:bg-[#203c2c] text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <Calendar className="w-4 h-4 text-brand-yellow" />
            <span>Thuê ngay</span>
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-stone-100 text-stone-500 text-xs text-center font-medium border border-stone-200">
            Thửa đất đang có người canh tác hoặc đang bảo trì
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isSaved
              ? 'bg-rose-50 border-rose-300 text-rose-600'
              : 'bg-white border-brand-border text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
          <span>{isSaved ? 'Đã lưu vào danh sách' : 'Lưu vào danh sách'}</span>
        </button>
      </div>
    </div>
  );
}
