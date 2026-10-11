import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Grid3X3, ArrowRight, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';

export default function FarmCard({ land }) {
  return (
    <div className="editorial-card group bg-white flex flex-col h-full">
      <div className="relative h-60 overflow-hidden">
        <img
          src={land.imageUrl}
          alt={land.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute top-3.5 left-3.5">
          <Badge variant="ACTIVE" size="sm">
            Quy hoạch chuẩn VietGAP
          </Badge>
        </div>

        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="text-[11px] text-brand-yellow font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
            <MapPin className="w-3.5 h-3.5" />
            {land.location.split(',')[1] || land.location}
          </p>
          <h3 className="font-heading text-xl font-bold text-white drop-shadow">
            {land.name}
          </h3>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
          {land.description}
        </p>

        <div className="grid grid-cols-2 gap-2 py-3 border-y border-brand-border/60 text-xs">
          <div>
            <span className="text-[10px] text-brand-muted uppercase font-bold block">Tổng diện tích</span>
            <span className="font-bold text-brand-dark">{land.totalArea}</span>
          </div>
          <div>
            <span className="text-[10px] text-brand-muted uppercase font-bold block">Thửa đất chia sẵn</span>
            <span className="font-bold text-brand-green flex items-center gap-1">
              <Grid3X3 className="w-3.5 h-3.5" />
              {land.activePlots} / {land.totalPlots} thửa sẵn sàng
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-brand-muted flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
            Đất đã cải tạo sẵn
          </span>
          <Link
            to={`/marketplace?landId=${land.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-green group-hover:text-brand-dark transition-colors"
          >
            <span>Xem các thửa đất</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
