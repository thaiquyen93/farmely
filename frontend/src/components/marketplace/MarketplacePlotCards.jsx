import React from 'react';
import {
  Maximize2,
  Sprout,
  Droplets,
  Radio,
  ArrowRight,
  Eye,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

export default function MarketplacePlotCards({
  plots = [],
  selectedPlot = null,
  onSelectPlot,
  onBookPlot,
  activeStatusTab = 'ALL',
  setActiveStatusTab,
  statusCounts = {}
}) {
  const tabs = [
    { key: 'ALL', label: `Tất cả plots (${statusCounts.ALL || 0})` },
    { key: 'AVAILABLE', label: `Đang trống (${statusCounts.AVAILABLE || 0})` },
    { key: 'RENTED', label: `Đã thuê (${statusCounts.RENTED || 0})` },
    { key: 'MAINTENANCE', label: `Bảo trì (${statusCounts.MAINTENANCE || 0})` },
    { key: 'UPCOMING', label: `Sắp có (${statusCounts.UPCOMING || 0})` }
  ];

  return (
    <div className="space-y-4">
      {/* 1. Status Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeStatusTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStatusTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#294C38] text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:text-brand-dark border border-brand-border hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Plot Cards Grid */}
      {plots.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-brand-border space-y-2">
          <Sprout className="w-10 h-10 text-stone-300 mx-auto" />
          <h4 className="font-heading font-black text-sm text-brand-dark">
            Không tìm thấy thửa đất phù hợp
          </h4>
          <p className="text-xs text-brand-muted">
            Vui lòng thử chọn tiêu chí tìm kiếm hoặc trạng thái khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plots.map((plot) => {
            const isSelected = selectedPlot?.id === plot.id;
            const statusConfig = GIS_STATUSES[plot.status] || GIS_STATUSES.AVAILABLE;
            const isAvailable = plot.status === 'AVAILABLE';

            return (
              <div
                key={plot.id}
                onClick={() => onSelectPlot(plot)}
                className={`bg-white rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md ${
                  isSelected
                    ? 'border-[#294C38] ring-2 ring-[#294C38]/20 bg-emerald-50/20'
                    : 'border-brand-border hover:border-brand-green/40'
                }`}
              >
                {/* Image Section with Status Badge */}
                <div className="relative h-36 w-full overflow-hidden bg-stone-100">
                  <img
                    src={plot.imageUrl}
                    alt={plot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* Status Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm ${statusConfig.badgeClass}`}>
                      {statusConfig.iconText} {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-black text-sm text-brand-dark group-hover:text-brand-green transition-colors">
                        {plot.code}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-medium truncate max-w-[100px]">
                        {plot.farmName}
                      </span>
                    </div>

                    {/* Area and Crop */}
                    <div className="space-y-1 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                        <span className="font-medium">{plot.areaFormatted}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sprout className="w-3.5 h-3.5 text-brand-green shrink-0" />
                        <span className="truncate">{plot.crop}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Facilities */}
                  <div className="pt-2 border-t border-brand-border/60 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-heading font-black text-sm text-brand-dark">
                        {plot.rentalPriceFormatted}
                      </span>
                    </div>

                    {/* Facility Tags */}
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      {plot.facilities?.irrigation && (
                        <span className="flex items-center gap-1 bg-brand-cream/80 px-2 py-0.5 rounded-md border border-brand-border/60">
                          <Droplets className="w-3 h-3 text-sky-500" />
                          <span>Tưới nhỏ giọt</span>
                        </span>
                      )}
                      {plot.facilities?.iot && (
                        <span className="flex items-center gap-1 bg-brand-cream/80 px-2 py-0.5 rounded-md border border-brand-border/60">
                          <Radio className="w-3 h-3 text-emerald-500" />
                          <span>IoT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="pt-1">
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookPlot(plot);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-[#294C38] hover:bg-[#203c2c] text-white text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                      >
                        <span>Thuê ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlot(plot);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold border border-brand-border transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-400" />
                        <span>Xem chi tiết</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
