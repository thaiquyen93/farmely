import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Minus,
  LocateFixed,
  Maximize2,
  Minimize2,
  Trees
} from 'lucide-react';
import { GIS_STATUSES, MARKETPLACE_PLOTS_GIS } from '../../data/marketplaceGisData';

/**
 * 16 STANDARDIZED PLOTS (GRID 4x4 CALIBRATED TO ACTUAL SURVEY CANALS)
 * ViewBox: 1000 x 1400 (matches exact 1200 x 1700 Ultra-HD rectified orthophoto)
 * Ultra-clean: ONLY parcels and number badges (P-01 .. P-16).
 * Detailed telemetry & specs smoothly transferred to right sidebar panel upon click.
 */
export const GRID_16_PLOTS = [
  // ---------------- ROW 0 (NORTH / HÀNG 1) ----------------
  { id: 'PLT-HV-01', code: 'Plot P-01', label: 'P-01', x: 30,  y: 30,  width: 205, height: 360 },
  { id: 'PLT-HV-02', code: 'Plot P-02', label: 'P-02', x: 250, y: 30,  width: 205, height: 360 },
  { id: 'PLT-HV-03', code: 'Plot P-03', label: 'P-03', x: 475, y: 30,  width: 250, height: 360 },
  { id: 'PLT-HV-04', code: 'Plot P-04', label: 'P-04', x: 745, y: 30,  width: 230, height: 360 },

  // ---------------- ROW 1 (MID-NORTH / HÀNG 2) ----------------
  { id: 'PLT-HV-05', code: 'Plot P-05', label: 'P-05', x: 30,  y: 415, width: 205, height: 420 },
  { id: 'PLT-HV-06', code: 'Plot P-06', label: 'P-06', x: 250, y: 415, width: 205, height: 420 },
  { id: 'PLT-HV-07', code: 'Plot P-07', label: 'P-07', x: 475, y: 415, width: 250, height: 420 },
  { id: 'PLT-HV-08', code: 'Plot P-08', label: 'P-08', x: 745, y: 415, width: 230, height: 420 },

  // ---------------- ROW 2 (MID-SOUTH / HÀNG 3) ----------------
  { id: 'PLT-HV-09', code: 'Plot P-09', label: 'P-09', x: 30,  y: 865, width: 205, height: 240 },
  { id: 'PLT-HV-10', code: 'Plot P-10', label: 'P-10', x: 250, y: 865, width: 205, height: 240 },
  { id: 'PLT-HV-11', code: 'Plot P-11', label: 'P-11', x: 475, y: 865, width: 250, height: 240 },
  { id: 'PLT-HV-12', code: 'Plot P-12', label: 'P-12', x: 745, y: 865, width: 230, height: 240 },

  // ---------------- ROW 3 (SOUTH / HÀNG 4) ----------------
  { id: 'PLT-HV-13', code: 'Plot P-13', label: 'P-13', x: 30,  y: 1130, width: 205, height: 240 },
  { id: 'PLT-HV-14', code: 'Plot P-14', label: 'P-14', x: 250, y: 1130, width: 205, height: 240 },
  { id: 'PLT-HV-15', code: 'Plot P-15', label: 'P-15', x: 475, y: 1130, width: 250, height: 240 },
  { id: 'PLT-HV-16', code: 'Plot P-16', label: 'P-16', x: 745, y: 1130, width: 230, height: 240 },
];

export default function MarketplaceInteractiveMap({
  plots = [],
  selectedPlot = null,
  onSelectPlot,
  currentFarm,
  onSelectFarm
}) {
  const containerRef = useRef(null);

  // Map Navigation & Drag/Zoom State
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPlotCode, setHoveredPlotCode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Selected Plot Code
  const activeSelectedCode = selectedPlot?.code || 'Plot P-01';

  // Smoothly center focus on selected plot when selection changes externally
  useEffect(() => {
    if (selectedPlot) {
      const geo = GRID_16_PLOTS.find((p) => p.code === selectedPlot.code);
      if (geo) {
        const cx = geo.x + geo.width / 2;
        const cy = geo.y + geo.height / 2;
        setPanOffset({ x: (500 - cx) * 0.25, y: (700 - cy) * 0.25 });
      }
    }
  }, [selectedPlot]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
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
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Handle click on plot: immediately pass data to right sidebar detail panel
  const handlePlotClick = (p) => {
    const matched =
      plots.find((item) => item.code === p.code || item.id === p.id) ||
      MARKETPLACE_PLOTS_GIS.find((item) => item.code === p.code || item.label === p.label) || {
        id: p.id,
        code: p.code,
        label: p.label,
        name: `Thửa Đất ${p.label}`,
        status: 'AVAILABLE',
        areaFormatted: '150 m²',
        rentalPriceFormatted: '1.500.000 đ/tháng'
      };

    if (onSelectPlot) {
      onSelectPlot(matched);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
      className={`relative w-full rounded-3xl overflow-hidden border border-stone-800 bg-[#070B14] select-none shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none h-screen w-screen'
          : 'h-[520px] sm:h-[580px] lg:h-[640px]'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* ============================================================== */}
      {/* 1. CUSTOM MODERN SVG & KEYFRAME ANIMATIONS STYLESHEET          */}
      {/* ============================================================== */}
      <style>{`
        @keyframes runningDash {
          to { stroke-dashoffset: -56; }
        }
        .anim-running-beam {
          stroke-dasharray: 18 10;
          animation: runningDash 2.4s linear infinite;
        }
        @keyframes radarSweep {
          0% { transform: translateY(0%); opacity: 0; }
          15% { opacity: 0.85; }
          85% { opacity: 0.85; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .anim-scanline {
          animation: radarSweep 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes bracketPulse {
          0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 2px #00F0FF); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px #00F0FF); }
        }
        .anim-bracket {
          animation: bracketPulse 2s ease-in-out infinite;
        }
        @keyframes pingRipple {
          0% { r: 8; opacity: 1; stroke-width: 2.5; }
          100% { r: 36; opacity: 0; stroke-width: 0.5; }
        }
        .anim-ping-ripple {
          animation: pingRipple 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
        }
      `}</style>

      {/* ============================================================== */}
      {/* 2. MINIMAL PRISTINE HEADER (TOP-LEFT CHIP)                     */}
      {/* ============================================================== */}
      <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
        <div className="bg-[#0B111E]/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-stone-700/60 shadow-lg flex items-center gap-2.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-heading font-black text-white text-[11px] tracking-wide">
            {currentFarm?.name || 'Trang trại Happy Valley'} · 16 Thửa Đất
          </span>
          <span className="text-[10px] text-stone-400 border-l border-stone-700 pl-2">
            Nhấp thửa để xem chi tiết
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MINIMAL CONTROLS (TOP-RIGHT ZOOM & VIEW BUTTONS)            */}
      {/* ============================================================== */}
      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 pointer-events-auto">
        <div className="bg-[#0B111E]/85 backdrop-blur-md rounded-2xl border border-stone-700/60 shadow-lg flex items-center p-1 gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-stone-200 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-stone-800" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-stone-200 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetView}
          className="w-9 h-9 rounded-2xl bg-[#0B111E]/85 backdrop-blur-md border border-stone-700/60 shadow-lg flex items-center justify-center text-stone-200 hover:text-emerald-400 hover:bg-stone-800 transition-all cursor-pointer"
          title="Căn giữa bản đồ"
        >
          <LocateFixed className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-9 h-9 rounded-2xl bg-[#0B111E]/85 text-stone-300 hover:text-white border border-stone-700/60 backdrop-blur-md shadow-lg transition-all flex items-center justify-center cursor-pointer"
          title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ============================================================== */}
      {/* 4. MAIN SATELLITE CANVAS + ULTRA-CLEAN 16 PLOTS OVERLAY        */}
      {/* ============================================================== */}
      <div
        className="absolute inset-0 w-full h-full origin-center transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`
        }}
      >
        {/* Base Orthophoto Satellite Image (Rectified HD) */}
        <img
          src="/images/land_rect_ultra_hd.jpg"
          alt="Satellite Farm Base"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ imageRendering: 'crisp-edges' }}
        />

        {/* Ambient Subtle Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/20 pointer-events-none" />

        {/* Interactive SVG Plot Layer */}
        <svg
          viewBox="0 0 1000 1400"
          className="w-full h-full absolute inset-0"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Luminous Neon Cyan Glow Filter */}
            <filter id="neonPlotGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00F0FF" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#00F0FF" floodOpacity="0.65" />
            </filter>

            {/* Hover Soft Glow */}
            <filter id="hoverPlotGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FBBF24" floodOpacity="0.85" />
            </filter>

            {/* Linear Gradient for Sonar Scanline */}
            <linearGradient id="scanlineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0" />
              <stop offset="85%" stopColor="#00F0FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* 16 Standardized Plots */}
          {GRID_16_PLOTS.map((p) => {
            const isSelected = activeSelectedCode === p.code;
            const isHovered = hoveredPlotCode === p.code;

            // Find matching data to get real status
            const realPlot =
              plots.find((item) => item.code === p.code) ||
              MARKETPLACE_PLOTS_GIS.find((item) => item.code === p.code);
            const statusKey = realPlot?.status || 'AVAILABLE';

            // Natural status colors
            const strokeColor =
              statusKey === 'RENTED'
                ? '#F59E0B'
                : statusKey === 'MAINTENANCE'
                ? '#64748B'
                : '#10B981';

            const cx = p.x + p.width / 2;
            const cy = p.y + p.height / 2;

            return (
              <g
                key={p.code}
                className="cursor-pointer transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlotClick(p);
                }}
                onMouseEnter={() => setHoveredPlotCode(p.code)}
                onMouseLeave={() => setHoveredPlotCode(null)}
              >
                {/* 1. Plot Base Fill (Ultra-light transparent to show ground) */}
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.width}
                  height={p.height}
                  rx="8"
                  fill={
                    isSelected
                      ? 'rgba(0, 240, 255, 0.16)'
                      : isHovered
                      ? 'rgba(251, 191, 36, 0.16)'
                      : 'rgba(0, 0, 0, 0.04)'
                  }
                  className="transition-colors duration-300"
                />

                {/* 2. Base Boundary Border */}
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.width}
                  height={p.height}
                  rx="8"
                  fill="none"
                  stroke={isSelected ? '#00F0FF' : isHovered ? '#FBBF24' : strokeColor}
                  strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                  strokeOpacity={isSelected ? 1 : isHovered ? 0.95 : 0.75}
                  filter={isSelected ? 'url(#neonPlotGlow)' : isHovered ? 'url(#hoverPlotGlow)' : undefined}
                />

                {/* 3. MODERN ANIMATION A: Running Neon Beam Border on Selected Plot */}
                {isSelected && (
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={p.height}
                    rx="8"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    className="anim-running-beam pointer-events-none"
                  />
                )}

                {/* 4. MODERN ANIMATION B: Sonar Laser Scanline Sweeping Vertically */}
                {isSelected && (
                  <g clipPath={`url(#clip-${p.code})`} pointerEvents="none">
                    <clipPath id={`clip-${p.code}`}>
                      <rect x={p.x} y={p.y} width={p.width} height={p.height} rx="8" />
                    </clipPath>
                    <g className="anim-scanline">
                      <rect
                        x={p.x}
                        y={p.y}
                        width={p.width}
                        height={36}
                        fill="url(#scanlineGrad)"
                      />
                      <line
                        x1={p.x}
                        y1={p.y + 36}
                        x2={p.x + p.width}
                        y2={p.y + 36}
                        stroke="#00F0FF"
                        strokeWidth="2.5"
                        filter="url(#neonPlotGlow)"
                      />
                    </g>
                  </g>
                )}

                {/* 5. MODERN ANIMATION C: 4 Cyber Surveying Corner Brackets ┌ ┐ └ ┘ */}
                {isSelected && (
                  <g className="anim-bracket pointer-events-none" stroke="#00F0FF" strokeWidth="3" fill="none">
                    {/* Top-Left ┌ */}
                    <path d={`M ${p.x - 4} ${p.y + 18} L ${p.x - 4} ${p.y - 4} L ${p.x + 18} ${p.y - 4}`} />
                    {/* Top-Right ┐ */}
                    <path d={`M ${p.x + p.width - 18} ${p.y - 4} L ${p.x + p.width + 4} ${p.y - 4} L ${p.x + p.width + 4} ${p.y + 18}`} />
                    {/* Bottom-Right ┘ */}
                    <path d={`M ${p.x + p.width + 4} ${p.y + p.height - 18} L ${p.x + p.width + 4} ${p.y + p.height + 4} L ${p.x + p.width - 18} ${p.y + p.height + 4}`} />
                    {/* Bottom-Left └ */}
                    <path d={`M ${p.x + 18} ${p.y + p.height + 4} L ${p.x - 4} ${p.y + p.height + 4} L ${p.x - 4} ${p.y + p.height - 18}`} />
                  </g>
                )}

                {/* 6. MODERN ANIMATION D: Concentric Sonar Ping Ripples from Center */}
                {isSelected && (
                  <g pointerEvents="none">
                    <circle cx={cx} cy={cy} stroke="#00F0FF" fill="none" className="anim-ping-ripple" />
                    <circle cx={cx} cy={cy} r="3.5" fill="#00F0FF" />
                  </g>
                )}

                {/* 7. MINIMAL CLEAN NUMBER BADGE (ONLY P-01 .. P-16) */}
                <g transform={`translate(${p.x + 14}, ${p.y + 14})`} pointerEvents="none">
                  {/* Badge Background Pill */}
                  <rect
                    x="0"
                    y="0"
                    width={52}
                    height={26}
                    rx="8"
                    fill={isSelected ? '#00F0FF' : isHovered ? '#FBBF24' : 'rgba(11, 17, 30, 0.88)'}
                    stroke={isSelected ? '#FFFFFF' : isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)'}
                    strokeWidth={isSelected || isHovered ? 1.5 : 1}
                    filter={isSelected ? 'url(#neonPlotGlow)' : undefined}
                    className="transition-colors duration-200"
                  />
                  {/* Number Label */}
                  <text
                    x="26"
                    y="17"
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#0A0F1D' : '#FFFFFF'}
                    fontSize="12"
                    fontWeight="900"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="0.04em"
                  >
                    {p.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
