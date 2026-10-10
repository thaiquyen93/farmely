import React, { useState } from 'react';
import {
  MapPin, Droplets, Radio, Leaf, Waves, Compass, Thermometer, Calendar,
  Heart, ChevronLeft, ChevronRight, TrendingUp, Maximize, Sprout
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

// ponytail: ceiling is inline styles, upgrade path is design tokens in tailwind config
const G = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const BORDER = '1px solid rgba(255,255,255,0.06)';

const STATUS_BADGE = {
  AVAILABLE:   { bg: 'rgba(16,185,129,0.12)', bd: 'rgba(16,185,129,0.25)', c: '#10B981', t: 'Đang trống' },
  RENTED:      { bg: 'rgba(245,158,11,0.12)', bd: 'rgba(245,158,11,0.25)', c: '#F59E0B', t: 'Đã thuê' },
  MAINTENANCE: { bg: 'rgba(148,163,184,0.12)', bd: 'rgba(148,163,184,0.25)', c: '#94A3B8', t: 'Bảo trì' },
};

export default function MarketplacePlotDetailPanel({ plot = null, onBookPlot, onFocusOnMap }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!plot) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-16 text-center"
        style={{ background: '#0f1011', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <Sprout className="w-5 h-5 text-emerald-500/70" />
        </div>
        <p className="text-[13px] font-medium text-[#d0d6e0] mb-1">Chưa chọn thửa đất</p>
        <p className="text-[11px] text-[#62666d] max-w-[200px] leading-relaxed">
          Nhấp vào một thửa trên bản đồ để xem thông số chi tiết
        </p>
      </div>
    );
  }

  const isAvail = plot.status === 'AVAILABLE';
  const gallery = plot.gallery || [plot.imageUrl];
  const sb = STATUS_BADGE[plot.status] || STATUS_BADGE.AVAILABLE;

  const prev = (e) => { e.stopPropagation(); setImgIdx((i) => (i > 0 ? i - 1 : gallery.length - 1)); };
  const next = (e) => { e.stopPropagation(); setImgIdx((i) => (i < gallery.length - 1 ? i + 1 : 0)); };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
      style={{ background: '#0f1011', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>

      {/* 1. Photo */}
      <div className="relative h-44 w-full overflow-hidden group" style={{ borderRadius: '12px 12px 0 0' }}>
        <img src={gallery[imgIdx] || plot.imageUrl} alt={plot.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0f1011, transparent 60%)' }} />
        <div className="absolute top-2 right-2 px-1.5 py-px rounded text-[9px] font-mono text-[#d0d6e0]"
          style={{ background: 'rgba(8,9,10,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {imgIdx + 1}/{gallery.length}
        </div>
        {gallery.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={prev} className="w-6 h-6 rounded flex items-center justify-center text-[#d0d6e0] hover:text-white cursor-pointer" style={G}><ChevronLeft className="w-3 h-3" /></button>
            <button onClick={next} className="w-6 h-6 rounded flex items-center justify-center text-[#d0d6e0] hover:text-white cursor-pointer" style={G}><ChevronRight className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 space-y-3 -mt-1">
        {/* 2. Title + Status */}
        <div className="flex items-start justify-between pt-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[#f7f8f8]" style={{ letterSpacing: '-0.3px' }}>{plot.code}</h3>
            <p className="text-[11px] text-[#8a8f98] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#62666d]" />{plot.farmName} · {plot.areaFormatted}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 mt-0.5"
            style={{ background: sb.bg, border: `1px solid ${sb.bd}`, color: sb.c }}>{sb.t}</span>
        </div>

        {/* 3. Price */}
        <div className="flex items-baseline justify-between pb-3" style={{ borderBottom: BORDER }}>
          <div>
            <span className="text-[17px] font-semibold text-[#f7f8f8]" style={{ letterSpacing: '-0.4px' }}>
              {plot.rentalPriceFormatted.replace('/tháng', '')}
            </span>
            <span className="text-[11px] text-[#62666d] ml-1">/ tháng</span>
          </div>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"
            style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.15)' }}>
            <TrendingUp className="w-2.5 h-2.5" />~ {plot.unitPrice}
          </span>
        </div>

        {/* 4. Facilities */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { icon: Droplets, label: 'Tưới nhỏ giọt', c: '#0ea5e9' },
            { icon: Radio, label: 'Cảm biến IoT', c: '#10B981' },
            { icon: Leaf, label: 'Đất hữu cơ', c: '#22c55e' },
            { icon: Waves, label: 'Gần nguồn nước', c: '#0284c7' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-[#d0d6e0] font-medium" style={G}>
              <f.icon className="w-3.5 h-3.5 shrink-0" style={{ color: f.c }} />{f.label}
            </div>
          ))}
        </div>

        {/* 5. Crops */}
        <div className="space-y-2 pt-2.5" style={{ borderTop: BORDER }}>
          <span className="text-[11px] font-medium text-[#8a8f98]">Loại cây phù hợp</span>
          <div className="flex gap-1.5 flex-wrap">
            {(plot.compatibleCrops || [
              { name: 'Xà lách', icon: '🥬' }, { name: 'Cải bó xôi', icon: '🥦' },
              { name: 'Rau muống', icon: '🌿' }, { name: 'Húng quế', icon: '🍃' }
            ]).slice(0, 4).map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-[#d0d6e0]" style={G}>
                <span className="text-xs">{c.icon || '🌱'}</span>{c.name}
              </span>
            ))}
          </div>
        </div>

        {/* 6. Specs */}
        <div className="space-y-1 pt-2.5" style={{ borderTop: BORDER }}>
          <span className="text-[11px] font-medium text-[#8a8f98] block mb-1">Thông số kỹ thuật</span>
          {[
            { icon: Compass, label: 'Hướng đất', val: plot.specs?.orientation || 'Đông Nam' },
            { emoji: '🧪', label: 'Độ pH', val: plot.specs?.ph || '6.2 – 6.8' },
            { icon: Thermometer, label: 'Nhiệt độ', val: plot.specs?.temp || '18 – 28°C' },
            { icon: Calendar, label: 'Mùa vụ', val: plot.specs?.season || 'Quanh năm' },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between py-0.5 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#62666d]">
                {s.icon ? <s.icon className="w-3 h-3" /> : <span className="text-[10px]">{s.emoji}</span>}{s.label}
              </span>
              <span className="font-medium text-[#d0d6e0]">{s.val}</span>
            </div>
          ))}
        </div>

        {/* 7. Mini map */}
        <div className="pt-2.5 space-y-1.5" style={{ borderTop: BORDER }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#8a8f98] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#62666d]" />Vị trí
            </span>
            <button type="button" onClick={onFocusOnMap}
              className="text-[10px] font-medium text-[#7170ff] hover:text-[#828fff] flex items-center gap-0.5 cursor-pointer transition-colors">
              Xem trên bản đồ<Maximize className="w-2.5 h-2.5" />
            </button>
          </div>
          <div onClick={onFocusOnMap} className="relative h-14 w-full rounded-lg overflow-hidden cursor-pointer group"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <img src="/images/land_rect_ultra_hd.jpg" alt="Map" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#5e6ad2', border: '2px solid rgba(255,255,255,0.5)' }}>
                <MapPin className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* 8. Actions */}
        <div className="pt-2.5 space-y-1.5" style={{ borderTop: BORDER }}>
          {isAvail ? (
            <button type="button" onClick={() => onBookPlot(plot)}
              className="w-full py-2.5 rounded-lg text-[12px] font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] hover:brightness-110"
              style={{ background: '#5e6ad2', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Calendar className="w-3.5 h-3.5" />Thuê ngay
            </button>
          ) : (
            <div className="py-2.5 rounded-lg text-[11px] text-[#62666d] text-center font-medium" style={G}>
              Thửa đất đang có người canh tác hoặc đang bảo trì
            </div>
          )}
          <button type="button" onClick={() => setSaved(!saved)}
            className="w-full py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            style={{ ...G, color: saved ? '#f43f5e' : '#8a8f98' }}>
            <Heart className={`w-3 h-3 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
            {saved ? 'Đã lưu' : 'Lưu vào danh sách'}
          </button>
        </div>
      </div>
    </div>
  );
}
