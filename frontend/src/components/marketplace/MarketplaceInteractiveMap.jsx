import React, { useState, useRef, useEffect } from 'react';
import {
  Trees,
  ChevronRight,
  Layers,
  Map as MapIcon,
  Plus,
  Minus,
  LocateFixed,
  Maximize2,
  Sparkles,
  Info
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

export default function MarketplaceInteractiveMap({
  plots = [],
  selectedPlot = null,
  onSelectPlot,
  currentFarm,
  onSelectFarm
}) {
  const [mapMode, setMapMode] = useState('SATELLITE'); // 'SATELLITE' | 'VECTOR'
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPlot, setHoveredPlot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  // When selectedPlot changes externally (e.g. from card click), focus on it
  useEffect(() => {
    if (selectedPlot && selectedPlot.centroid) {
      const [cx, cy] = selectedPlot.centroid;
      // Slight focus towards center
      const targetX = (500 - cx) * 0.4;
      const targetY = (310 - cy) * 0.4;
      setPanOffset({ x: targetX, y: targetY });
    }
  }, [selectedPlot]);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 2.2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.25, 0.85);
      if (next <= 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setHoveredPlot(null);
      }}
      className={`relative w-full h-[400px] sm:h-[480px] lg:h-[520px] rounded-2xl overflow-hidden border border-brand-border bg-stone-900 select-none shadow-sm transition-all ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* 1. Base Map Layer (Satellite or Vector GIS) */}
      <div
        className="absolute inset-0 w-full h-full origin-center transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`
        }}
      >
        {mapMode === 'SATELLITE' ? (
          <div className="relative w-full h-full">
            <img
              src={currentFarm?.aerialImage || '/images/happy_valley_aerial.jpg'}
              alt="Farmely GIS Satellite View"
              className="w-full h-full object-cover pointer-events-none"
            />
            {/* Soft vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
          </div>
        ) : (
          /* Vector GIS Topological Farm Contour Canvas */
          <div className="w-full h-full bg-[#EBF0E4] relative overflow-hidden pointer-events-none">
            {/* Topo contour lines */}
            <svg className="w-full h-full absolute inset-0 opacity-25" viewBox="0 0 1000 620">
              <path d="M 0,150 Q 250,90 500,160 T 1000,120" fill="none" stroke="#557C3E" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M 0,260 Q 280,210 520,290 T 1000,230" fill="none" stroke="#557C3E" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M 0,380 Q 310,340 560,410 T 1000,360" fill="none" stroke="#557C3E" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M 0,500 Q 350,460 600,530 T 1000,480" fill="none" stroke="#557C3E" strokeWidth="2" strokeDasharray="6 4" />
              {/* Mountain ridge boundary */}
              <circle cx="500" cy="310" r="320" fill="none" stroke="#294C38" strokeWidth="3" opacity="0.3" strokeDasharray="8 8" />
            </svg>
            <div className="absolute inset-0 bg-[radial-gradient(#294C38_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
          </div>
        )}

        {/* 2. Interactive SVG GIS Polygons Overlay */}
        <svg
          viewBox="0 0 1000 620"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Selected plot animated glow filter */}
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFFFFF" floodOpacity="0.9" />
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#F6D365" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Farm boundary outline */}
          <polygon
            points="260,140 660,140 680,480 240,480"
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            pointerEvents="none"
          />

          {/* Individual Plot Polygons */}
          {plots.map((plot) => {
            if (!plot.polygon) return null;
            const isSelected = selectedPlot?.id === plot.id;
            const isHovered = hoveredPlot?.id === plot.id;
            const statusConfig = GIS_STATUSES[plot.status] || GIS_STATUSES.AVAILABLE;

            const pointsStr = plot.polygon.map(([px, py]) => `${px},${py}`).join(' ');

            return (
              <g
                key={plot.id}
                className="cursor-pointer transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlot(plot);
                }}
                onMouseEnter={() => setHoveredPlot(plot)}
                onMouseLeave={() => setHoveredPlot(null)}
              >
                {/* Polygon body */}
                <polygon
                  points={pointsStr}
                  fill={
                    isSelected
                      ? statusConfig.hoverFillColor
                      : isHovered
                      ? statusConfig.hoverFillColor
                      : statusConfig.fillColor
                  }
                  stroke={
                    isSelected
                      ? '#FFFFFF'
                      : isHovered
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.75)'
                  }
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                  filter={isSelected ? 'url(#glowEffect)' : undefined}
                  style={{
                    transition: 'all 0.2s ease-in-out'
                  }}
                />

                {/* Plot ID Centered Label Pill */}
                {plot.centroid && (
                  <g
                    transform={`translate(${plot.centroid[0]}, ${plot.centroid[1]})`}
                    pointerEvents="none"
                  >
                    <rect
                      x="-18"
                      y="-10"
                      width="36"
                      height="20"
                      rx="6"
                      fill={isSelected ? '#294C38' : 'rgba(20, 30, 20, 0.75)'}
                      stroke={isSelected ? '#F6D365' : '#FFFFFF'}
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                    >
                      {plot.label || plot.code.replace('Plot ', '')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Top-Left Floating Farm Info Card */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-[62%] sm:max-w-none">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-brand-border shadow-md flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Trees className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-black text-xs sm:text-sm text-brand-dark flex items-center gap-1.5">
              <span className="truncate">{currentFarm?.name || 'Trang trại Happy Valley'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </h4>
            <p className="text-[11px] text-brand-muted truncate">
              {currentFarm?.location || 'Huyện Quế Phong, Nghệ An'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Top-Right Floating Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Layer toggle pill: [🛰 Vệ tinh] [🗺 Bản đồ] */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-brand-border shadow-md flex items-center gap-1 text-xs font-bold text-brand-dark">
          <button
            type="button"
            onClick={() => setMapMode('SATELLITE')}
            className={`hidden sm:flex px-3 py-1.5 rounded-lg items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'SATELLITE'
                ? 'bg-[#294C38] text-white shadow-sm'
                : 'text-stone-600 hover:text-brand-dark'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vệ tinh</span>
          </button>
          <button
            type="button"
            onClick={() => setMapMode('VECTOR')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'VECTOR'
                ? 'bg-[#294C38] text-white shadow-sm'
                : 'text-stone-600 hover:text-brand-dark'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Bản đồ</span>
          </button>
        </div>

        {/* Vertical Zoom and Recenter Controls */}
        <div className="hidden sm:flex bg-white/95 backdrop-blur-md rounded-xl border border-brand-border shadow-md flex-col p-1 gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-dark hover:bg-stone-100 transition-colors cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-dark hover:bg-stone-100 transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-stone-200" />
          <button
            type="button"
            onClick={handleResetView}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-dark hover:bg-stone-100 transition-colors cursor-pointer"
            title="Căn giữa bản đồ"
          >
            <LocateFixed className="w-4 h-4 text-brand-green" />
          </button>
        </div>
      </div>

      {/* 5. Bottom-Left Floating GIS Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-xl px-3.5 py-2 border border-brand-border shadow-md flex flex-wrap items-center gap-3 text-xs font-semibold text-brand-dark">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm inline-block" />
            <span>Đang trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm inline-block" />
            <span>Đã thuê</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] shadow-sm inline-block" />
            <span>Bảo trì</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-sm inline-block" />
            <span>Sắp có</span>
          </div>
        </div>
      </div>

      {/* 6. Hover Tooltip */}
      {hoveredPlot && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 12}px`
          }}
        >
          <div className="bg-brand-dark/95 backdrop-blur-md text-white text-xs rounded-xl p-2.5 shadow-xl border border-white/20 space-y-1 min-w-[140px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-brand-yellow">{hoveredPlot.code}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${GIS_STATUSES[hoveredPlot.status]?.badgeClass}`}>
                {GIS_STATUSES[hoveredPlot.status]?.label}
              </span>
            </div>
            <p className="text-[11px] text-stone-300 truncate">{hoveredPlot.name}</p>
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
              <span className="text-stone-400">{hoveredPlot.areaFormatted}</span>
              <span className="font-bold text-emerald-400">{hoveredPlot.rentalPriceFormatted}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
