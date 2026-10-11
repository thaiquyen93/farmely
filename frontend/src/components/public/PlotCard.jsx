import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Maximize2, Sprout, ArrowRight, Activity } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function PlotCard({ plot }) {
  const isAvailable = plot.status === 'AVAILABLE';

  return (
    <div className="editorial-card group flex flex-col h-full bg-white">
      {/* Image with Tag & Status */}
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <img
          src={plot.imageUrl}
          alt={plot.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <Badge variant={plot.status} size="sm">
            {plot.status === 'AVAILABLE'
              ? 'Đang mở cho thuê'
              : plot.status === 'RESERVED'
              ? 'Đang giữ chỗ 15p'
              : plot.status === 'RENTED'
              ? 'Đang canh tác'
              : plot.status === 'MAINTENANCE'
              ? 'Nghỉ đất 4 ngày'
              : plot.status}
          </Badge>
        </div>

        <div className="absolute top-3.5 right-3.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-brand-yellow text-brand-dark shadow-sm">
            {plot.code}
          </span>
        </div>

        {/* Bottom Image Info */}
        <div className="absolute bottom-3 left-3.5 right-3.5 text-white flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 drop-shadow">
            <Maximize2 className="w-3.5 h-3.5 text-brand-yellow" />
            {plot.area}
          </span>
          {plot.recentSensorReadings && (
            <span className="flex items-center gap-1.5 drop-shadow bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-[11px]">
              <Activity className="w-3 h-3 text-emerald-400" />
              {plot.recentSensorReadings.temperature}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-green shrink-0" />
            <span className="truncate">{plot.landName}</span>
          </div>

          <h3 className="font-heading text-lg font-bold text-brand-dark group-hover:text-brand-green transition-colors line-clamp-1">
            {plot.name}
          </h3>

          <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
            {plot.description}
          </p>

          {/* Compatible crops */}
          <div className="mt-3.5 pt-3 border-t border-brand-border/60">
            <p className="text-[11px] font-bold text-brand-dark uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-brand-green" />
              Cây trồng tương thích:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {plot.compatibleCrops.slice(0, 3).map((crop, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-brand-cream text-brand-green font-medium border border-brand-border/60"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card Footer with Price and CTA */}
        <div className="pt-3 border-t border-brand-border flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">
              Giá thuê trọn gói
            </p>
            <p className="font-heading text-base font-extrabold text-brand-green">
              {plot.formattedPrice}
            </p>
          </div>

          <Link to={`/marketplace/plot/${plot.id}`}>
            <Button
              variant={isAvailable ? "primary" : "outline"}
              size="sm"
              className="text-xs font-bold"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
