import React, { useState, useRef, useEffect } from 'react';
import {
  Trees,
  ChevronRight,
  Layers,
  Map as MapIcon,
  Compass,
  Plus,
  Minus,
  LocateFixed,
  Sparkles,
  Radio,
  Eye
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

/**
 * 2D TOP-DOWN ORTHOGRAPHIC GRID CALCULATOR
 * 16 plots arranged neatly in a 4x4 master architectural layout
 * Dimensions calibrated for 1000 x 620 SVG viewBox
 */
const ORTHO_PLOTS_LAYOUT = [
  // Row 0 (Plots P-01 .. P-04)
  { code: 'Plot P-01', x: 140, y: 70, width: 145, height: 95 },
  { code: 'Plot P-02', x: 305, y: 70, width: 145, height: 95 },
  { code: 'Plot P-03', x: 550, y: 70, width: 145, height: 95 },
  { code: 'Plot P-04', x: 715, y: 70, width: 145, height: 95 },

  // Row 1 (Plots P-05 .. P-08)
  { code: 'Plot P-05', x: 140, y: 185, width: 145, height: 95 },
  { code: 'Plot P-06', x: 305, y: 185, width: 145, height: 95 },
  { code: 'Plot P-07', x: 550, y: 185, width: 145, height: 95 },
  { code: 'Plot P-08', x: 715, y: 185, width: 145, height: 95 },

  // Row 2 (Plots P-09 .. P-12)
  { code: 'Plot P-09', x: 140, y: 340, width: 145, height: 95 },
  { code: 'Plot P-10', x: 305, y: 340, width: 145, height: 95 },
  { code: 'Plot P-11', x: 550, y: 340, width: 145, height: 95 },
  { code: 'Plot P-12', x: 715, y: 340, width: 145, height: 95 },

  // Row 3 (Plots P-13 .. P-16)
  { code: 'Plot P-13', x: 140, y: 455, width: 145, height: 95 },
  { code: 'Plot P-14', x: 305, y: 455, width: 145, height: 95 },
  { code: 'Plot P-15', x: 550, y: 455, width: 145, height: 95 },
  { code: 'Plot P-16', x: 715, y: 455, width: 145, height: 95 }
];

export default function MarketplaceInteractiveMap({
  plots = [],
  selectedPlot = null,
  onSelectPlot,
  currentFarm,
  onSelectFarm
}) {
  // DEFAULT MODE: 2D Orthographic Aerial Map (Mặt Bằng 2D Sắc Nét Từ Trên Cao)
  const [mapMode, setMapMode] = useState('AERIAL_2D'); // 'AERIAL_2D' | 'SATELLITE' | 'VECTOR'
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPlot, setHoveredPlot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  // When selectedPlot changes externally, center focus smoothly
  useEffect(() => {
    if (selectedPlot) {
      const ortho = ORTHO_PLOTS_LAYOUT.find((o) => o.code === selectedPlot.code);
      if (ortho && mapMode === 'AERIAL_2D') {
        const cx = ortho.x + ortho.width / 2;
        const cy = ortho.y + ortho.height / 2;
        setPanOffset({ x: (500 - cx) * 0.35, y: (310 - cy) * 0.35 });
      } else if (selectedPlot.centroid) {
        const [cx, cy] = selectedPlot.centroid;
        setPanOffset({ x: (500 - cx) * 0.35, y: (310 - cy) * 0.35 });
      }
    }
  }, [selectedPlot, mapMode]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.2));
  const handleZoomOut = () =>
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.25, 0.85);
      if (next <= 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });

  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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

  const handleMouseUp = () => setIsDragging(false);

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
      className={`relative w-full h-[420px] sm:h-[480px] lg:h-[530px] rounded-3xl overflow-hidden border border-brand-border bg-[#E3ECD7] select-none shadow-sm transition-all ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* MAP CANVAS WITH ZOOM & PAN */}
      <div
        className="absolute inset-0 w-full h-full origin-center transition-transform duration-300 ease-out"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`
        }}
      >
        {/* ============================================================== */}
        {/* MODE 1: 3D AERIAL PHOTO BASE + VECTOR PLOT OVERLAY */}
        {/* ============================================================== */}
        {mapMode === 'AERIAL_2D' && (
          <>
            {/* Base Layer: Real Aerial Photo */}
            <img
              src="/images/happy_valley_aerial.jpg"
              alt="Farmely Aerial View"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ imageRendering: 'crisp-edges' }}
            />
            
            {/* Overlay Layer: Interactive Vector Plots */}
            <svg
              viewBox="0 0 1000 620"
              className="w-full h-full absolute inset-0"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Glow Filter Khi Chọn Thửa Đất */}
                <filter id="plotSelectedGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FFFFFF" floodOpacity="0.95" />
                  <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#F6D365" floodOpacity="0.85" />
                </filter>
              </defs>

              {/* 16 THỬA ĐẤT VECTOR OVERLAY (4x4 GRID TRANSPARENT BORDERS) */}
              {ORTHO_PLOTS_LAYOUT.map((ortho, idx) => {
                const plot = plots.find((p) => p.code === ortho.code) || plots[idx];
                if (!plot) return null;

                const isSelected = selectedPlot?.id === plot.id;
                const isHovered = hoveredPlot?.id === plot.id;
                const statusConfig = GIS_STATUSES[plot.status] || GIS_STATUSES.AVAILABLE;

                return (
                  <g
                    key={plot.id || ortho.code}
                    className="cursor-pointer transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlot(plot);
                    }}
                    onMouseEnter={() => setHoveredPlot(plot)}
                    onMouseLeave={() => setHoveredPlot(null)}
                  >
                    {/* Transparent Plot Boundary (phủ mờ lên ảnh aerial) */}
                    <rect
                      x={ortho.x}
                      y={ortho.y}
                      width={ortho.width}
                      height={ortho.height}
                      rx="8"
                      fill={
                        isSelected || isHovered
                          ? 'rgba(246, 211, 101, 0.35)'
                          : plot.status === 'AVAILABLE'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : plot.status === 'RENTED'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(100, 116, 139, 0.15)'
                      }
                      stroke={
                        isSelected
                          ? '#FFFFFF'
                          : isHovered
                          ? '#F6D365'
                          : 'rgba(255, 255, 255, 0.6)'
                      }
                      strokeWidth={isSelected ? 5 : isHovered ? 3.5 : 2}
                      filter={isSelected ? 'url(#plotSelectedGlow)' : undefined}
                    />

                    {/* Nhãn Tên Thửa Đất */}
                    <g transform={`translate(${ortho.x + ortho.width / 2}, ${ortho.y + 36})`} pointerEvents="none">
                      <rect
                        x="-30"
                        y="-14"
                        width="60"
                        height="26"
                        rx="8"
                        fill={isSelected || isHovered ? 'rgba(41, 76, 56, 0.95)' : 'rgba(20, 35, 20, 0.75)'}
                        stroke={isSelected ? '#F6D365' : 'rgba(255, 255, 255, 0.8)'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="12"
                        fontWeight="900"
                        fontFamily="system-ui, sans-serif"
                      >
                        {plot.label || ortho.code.replace('Plot ', '')}
                      </text>
                    </g>

                    {/* Badge Trạng Thái Nhỏ Bên Dưới Thửa */}
                    <g transform={`translate(${ortho.x + ortho.width / 2}, ${ortho.y + ortho.height - 20})`} pointerEvents="none">
                      <rect
                        x="-48"
                        y="-10"
                        width="96"
                        height="20"
                        rx="6"
                        fill={
                          plot.status === 'AVAILABLE'
                            ? '#10B981'
                            : plot.status === 'RENTED'
                            ? '#F59E0B'
                            : '#64748B'
                        }
                        opacity={isSelected || isHovered ? '1' : '0.85'}
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
                        {statusConfig.label} • {plot.areaFormatted || `${plot.area || 100}m²`}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </>
        )}

        {/* ============================================================== */}
        {/* MODE 2: SATELLITE AERIAL PHOTO (ẢNH VỆ TINH TRUYỀN THỐNG)     */}
        {/* ============================================================== */}
        {mapMode === 'SATELLITE' && (
          <div className="relative w-full h-full">
            <img
              src={currentFarm?.aerialImage || '/images/happy_valley_aerial.jpg'}
              alt="Farmely GIS Satellite View"
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

            {/* Overlay Polygons for Satellite */}
            <svg viewBox="0 0 1000 620" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {plots.map((plot) => {
                if (!plot.polygon) return null;
                const isSelected = selectedPlot?.id === plot.id;
                const isHovered = hoveredPlot?.id === plot.id;
                const statusConfig = GIS_STATUSES[plot.status] || GIS_STATUSES.AVAILABLE;
                const pointsStr = plot.polygon.map(([px, py]) => `${px},${py}`).join(' ');

                return (
                  <g
                    key={plot.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlot(plot);
                    }}
                    onMouseEnter={() => setHoveredPlot(plot)}
                    onMouseLeave={() => setHoveredPlot(null)}
                  >
                    <polygon
                      points={pointsStr}
                      fill={isSelected || isHovered ? statusConfig.hoverFillColor : statusConfig.fillColor}
                      stroke={isSelected ? '#FFFFFF' : isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'}
                      strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                    />
                    {plot.centroid && (
                      <g transform={`translate(${plot.centroid[0]}, ${plot.centroid[1]})`} pointerEvents="none">
                        <rect x="-18" y="-10" width="36" height="20" rx="6" fill={isSelected ? '#294C38' : 'rgba(20, 30, 20, 0.8)'} stroke="#FFFFFF" strokeWidth={1} />
                        <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                          {plot.label || plot.code.replace('Plot ', '')}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: VECTOR CONTOUR GIS                                    */}
        {/* ============================================================== */}
        {mapMode === 'VECTOR' && (
          <div className="w-full h-full bg-[#EBF0E4] relative overflow-hidden pointer-events-none">
            <svg className="w-full h-full absolute inset-0 opacity-25" viewBox="0 0 1000 620">
              <path d="M 0,150 Q 250,90 500,160 T 1000,120" fill="none" stroke="#557C3E" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M 0,260 Q 280,210 520,290 T 1000,230" fill="none" stroke="#557C3E" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M 0,380 Q 310,340 560,410 T 1000,360" fill="none" stroke="#557C3E" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M 0,500 Q 350,460 600,530 T 1000,480" fill="none" stroke="#557C3E" strokeWidth="2" strokeDasharray="6 4" />
            </svg>
          </div>
        )}
      </div>

      {/* TOP-LEFT FLOATING FARM HEADER */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-brand-border shadow-md flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-black text-xs sm:text-sm text-brand-dark flex items-center gap-1.5">
              <span>{currentFarm?.name || 'Trang trại Happy Valley'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </h4>
            <p className="text-[11px] text-brand-muted">
              {currentFarm?.location || 'Huyện Quế Phong, Nghệ An'} • 16 Thửa Đất Chuẩn Hóa
            </p>
          </div>
        </div>
      </div>

      {/* TOP-RIGHT VIEW CONTROLS (3 VIEW MODES: 2D, SATELLITE, VECTOR) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-brand-border shadow-md flex items-center gap-1 text-xs font-bold text-brand-dark">
          <button
            type="button"
            onClick={() => setMapMode('AERIAL_2D')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'AERIAL_2D'
                ? 'bg-[#294C38] text-white shadow-sm'
                : 'text-stone-600 hover:text-brand-dark'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-brand-yellow" />
            <span>🌿 Mặt Bằng 2D</span>
          </button>

          <button
            type="button"
            onClick={() => setMapMode('SATELLITE')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'SATELLITE'
                ? 'bg-[#294C38] text-white shadow-sm'
                : 'text-stone-600 hover:text-brand-dark'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vệ Tinh</span>
          </button>

          <button
            type="button"
            onClick={() => setMapMode('VECTOR')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              mapMode === 'VECTOR'
                ? 'bg-[#294C38] text-white shadow-sm'
                : 'text-stone-600 hover:text-brand-dark'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Bình Độ GIS</span>
          </button>
        </div>

        {/* Zoom & Reset View */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-brand-border shadow-md flex flex-col p-1 gap-1">
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

      {/* BOTTOM-LEFT GIS LEGEND */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 border border-brand-border shadow-md flex flex-wrap items-center gap-3.5 text-xs font-semibold text-brand-dark">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#10B981] shadow-sm inline-block" />
            <span>Đang trống (Available)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#F59E0B] shadow-sm inline-block" />
            <span>Đã thuê (Rented)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#64748B] shadow-sm inline-block" />
            <span>Nghỉ đất bảo trì (4 ngày)</span>
          </div>
        </div>
      </div>

      {/* HOVER TOOLTIP */}
      {hoveredPlot && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 12}px`
          }}
        >
          <div className="bg-brand-dark/95 backdrop-blur-md text-white text-xs rounded-2xl p-3 shadow-xl border border-white/20 space-y-1 min-w-[160px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-brand-yellow text-sm">{hoveredPlot.code}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${GIS_STATUSES[hoveredPlot.status]?.badgeClass}`}>
                {GIS_STATUSES[hoveredPlot.status]?.label}
              </span>
            </div>
            <p className="text-[11px] text-stone-300 truncate">{hoveredPlot.name}</p>
            <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[11px]">
              <span className="text-stone-400">{hoveredPlot.areaFormatted}</span>
              <span className="font-bold text-emerald-400">{hoveredPlot.rentalPriceFormatted}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
