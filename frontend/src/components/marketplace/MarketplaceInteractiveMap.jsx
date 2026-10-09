import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Plus,
  Minus,
  LocateFixed,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  Droplets,
  Leaf,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  MapPin,
  CheckCircle2,
  Trees,
  Activity,
  Flame,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

/**
 * RECTILINEAR PLOTS LAYOUT (CALIBRATED TO ACTUAL GOOGLE EARTH CANALS & BOUNDARIES)
 * Total ViewBox: 1000 x 1150 (matching the natural satellite imagery aspect ratio)
 * Aligned with the central north-south canal at x=460 and horizontal dikes at y=230, 460, 690, 920.
 */
export const SATELLITE_RECT_PLOTS = [
  // ROW 1 (North)
  {
    code: 'Plot P-01',
    label: 'PLOT A1',
    areaText: '12.5 ha',
    x: 25,
    y: 25,
    width: 425,
    height: 200,
    status: 'ACTIVE',
    crop: 'Đồng cỏ tự nhiên',
    soilMoisture: '62%',
    temp: '27.4°C'
  },
  {
    code: 'Plot P-02',
    label: 'PLOT B1',
    areaText: '8.2 ha',
    x: 465,
    y: 25,
    width: 255,
    height: 200,
    status: 'ACTIVE',
    crop: 'Ngô sinh khối',
    soilMoisture: '64%',
    temp: '27.6°C'
  },
  {
    code: 'Plot P-03',
    label: 'PLOT B2',
    areaText: '8.2 ha',
    x: 735,
    y: 25,
    width: 240,
    height: 200,
    status: 'ACTIVE',
    crop: 'Lúa thơm VietGAP',
    soilMoisture: '68%',
    temp: '27.2°C'
  },

  // ROW 2 (Mid-North - PLOT B-03 HIGHLIGHT)
  {
    code: 'Plot P-04',
    label: 'PLOT A2',
    areaText: '12.5 ha',
    x: 25,
    y: 240,
    width: 425,
    height: 215,
    status: 'ACTIVE',
    crop: 'Đồng cỏ chăn thả',
    soilMoisture: '61%',
    temp: '28.0°C'
  },
  {
    code: 'Plot P-05',
    label: 'PLOT B-03',
    areaText: '14.5 Ha',
    x: 465,
    y: 240,
    width: 255,
    height: 215,
    status: 'OPTIMAL',
    crop: 'Grassland (Đồng cỏ)',
    soilMoisture: '65%',
    temp: '28.2°C'
  },
  {
    code: 'Plot P-06',
    label: 'PLOT B4',
    areaText: '8.2 ha',
    x: 735,
    y: 240,
    width: 240,
    height: 215,
    status: 'ACTIVE',
    crop: 'Rau hữu cơ',
    soilMoisture: '66%',
    temp: '27.8°C'
  },

  // ROW 3 (Center)
  {
    code: 'Plot P-07',
    label: 'PLOT A3',
    areaText: '12.5 ha',
    x: 25,
    y: 470,
    width: 425,
    height: 215,
    status: 'ACTIVE',
    crop: 'Dược liệu hữu cơ',
    soilMoisture: '63%',
    temp: '28.1°C'
  },
  {
    code: 'Plot P-08',
    label: 'PLOT C1',
    areaText: '8.2 ha',
    x: 465,
    y: 470,
    width: 255,
    height: 215,
    status: 'ACTIVE',
    crop: 'Xà lách VietGAP',
    soilMoisture: '67%',
    temp: '27.5°C'
  },
  {
    code: 'Plot P-09',
    label: 'PLOT C2',
    areaText: '8.2 ha',
    x: 735,
    y: 470,
    width: 240,
    height: 215,
    status: 'HARVESTED',
    crop: 'Vừa thu hoạch (Nghỉ đất)',
    soilMoisture: '54%',
    temp: '29.3°C'
  },

  // ROW 4 (Mid-South)
  {
    code: 'Plot P-10',
    label: 'PLOT C3',
    areaText: '8.2 ha',
    x: 465,
    y: 700,
    width: 255,
    height: 215,
    status: 'ACTIVE',
    crop: 'Cà chua bi Cherry',
    soilMoisture: '65%',
    temp: '27.9°C'
  },
  {
    code: 'Plot P-11',
    label: 'PLOT C4',
    areaText: '8.2 ha',
    x: 735,
    y: 700,
    width: 240,
    height: 215,
    status: 'ACTIVE',
    crop: 'Dưa chuột baby',
    soilMoisture: '64%',
    temp: '27.7°C'
  },

  // ROW 5 (South)
  {
    code: 'Plot P-12',
    label: 'PLOT C5',
    areaText: '8.3 ha',
    x: 465,
    y: 930,
    width: 255,
    height: 195,
    status: 'ACTIVE',
    crop: 'Rau ăn lá tổng hợp',
    soilMoisture: '66%',
    temp: '28.0°C'
  },
  {
    code: 'Plot P-13',
    label: 'PLOT C6',
    areaText: '8.3 ha',
    x: 735,
    y: 930,
    width: 240,
    height: 195,
    status: 'HARVESTED',
    crop: 'Cải tạo vi sinh',
    soilMoisture: '58%',
    temp: '28.8°C'
  },

  // SOUTH-WEST QUADRANT: FOREST & CONSERVATION
  {
    code: 'Plot P-16',
    label: 'KHU BẢO TỒN SINH THÁI',
    areaText: '42.0 ha',
    x: 25,
    y: 700,
    width: 425,
    height: 425,
    status: 'FOREST',
    crop: 'Rừng phòng hộ ngập nước',
    soilMoisture: '78%',
    temp: '26.5°C'
  }
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
  const [hoveredPlotItem, setHoveredPlotItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Layers (NDVI, Soil, Boundary)
  const [activeLayers, setActiveLayers] = useState({
    boundary: true,
    ndvi: true,
    soil: false
  });
  const [layersDropdownOpen, setLayersDropdownOpen] = useState(false);

  // Default selection to PLOT B-03 on initial mount if none selected
  const activeSelectedCode = selectedPlot?.code || 'Plot P-05';
  const activePlotData =
    SATELLITE_RECT_PLOTS.find((p) => p.code === activeSelectedCode) || SATELLITE_RECT_PLOTS[4];

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () =>
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.25, 0.8);
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

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const found = SATELLITE_RECT_PLOTS.find(
      (p) => p.label.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
    if (found) {
      const matchedPlot = plots.find((p) => p.code === found.code) || {
        id: found.code,
        code: found.code,
        name: `Thửa Đất ${found.label}`,
        status: found.status === 'OPTIMAL' || found.status === 'ACTIVE' ? 'AVAILABLE' : 'RENTED',
        areaFormatted: found.areaText,
        rentalPriceFormatted: '1.800.000 đ/tháng'
      };
      if (onSelectPlot) onSelectPlot(matchedPlot);

      // Smooth pan to target
      const cx = found.x + found.width / 2;
      const cy = found.y + found.height / 2;
      setPanOffset({ x: (500 - cx) * 0.35, y: (575 - cy) * 0.35 });
      setZoomLevel(1.2);
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
          : 'h-[560px] sm:h-[620px] lg:h-[680px]'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* ============================================================== */}
      {/* 1. TOP HEADER TOOLBAR (DARK SLEEK PRECISION AGRI-GIS CHROME)    */}
      {/* ============================================================== */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Farm Identity & Coordinates */}
        <div className="bg-[#0D1527]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-stone-700/60 shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Trees className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-heading font-black text-white flex items-center gap-1.5">
              <span>Trang Trại Công Nghệ Cao</span>
              <span className="text-stone-400">·</span>
              <span className="text-emerald-400 font-mono text-[11px]">10°41'31.73"N, 106°21'24.37"E</span>
            </div>
            <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Vệ tinh độ phân giải cao · Phân lô ô cờ vuông vắn</span>
            </div>
          </div>
        </div>

        {/* Right: Search + Layer Dropdown + Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Plot Search */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex items-center bg-[#0D1527]/90 backdrop-blur-md rounded-2xl border border-stone-700/60 px-3 py-1.5 shadow-xl text-xs"
          >
            <Search className="w-3.5 h-3.5 text-stone-400 mr-2" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-stone-400 text-xs focus:outline-none w-32"
            />
          </form>

          {/* Layer Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLayersDropdownOpen(!layersDropdownOpen)}
              className={`px-3 py-2 rounded-2xl backdrop-blur-md border shadow-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                layersDropdownOpen
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-[#0D1527]/90 text-stone-200 border-stone-700/60 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Lớp bản đồ</span>
            </button>

            {layersDropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-[#0B111E]/95 backdrop-blur-2xl border border-stone-700/80 rounded-2xl shadow-2xl p-3 z-40 text-xs space-y-2">
                <div className="font-heading font-black text-white text-[11px] pb-1.5 border-b border-stone-800 flex items-center justify-between">
                  <span>CÁC LỚP VIỄN THÁM</span>
                  <button onClick={() => setLayersDropdownOpen(false)} className="text-stone-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-800/60 cursor-pointer">
                  <span className="text-stone-200 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-emerald-400 rounded-xs" /> Ranh giới thửa
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.boundary}
                    onChange={(e) => setActiveLayers({ ...activeLayers, boundary: e.target.checked })}
                    className="accent-emerald-500 w-3.5 h-3.5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-800/60 cursor-pointer">
                  <span className="text-stone-200 flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-xs" /> Phổ NDVI thực vật
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.ndvi}
                    onChange={(e) => setActiveLayers({ ...activeLayers, ndvi: e.target.checked })}
                    className="accent-emerald-500 w-3.5 h-3.5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-800/60 cursor-pointer">
                  <span className="text-stone-200 flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-xs" /> Độ ẩm đất IoT
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.soil}
                    onChange={(e) => setActiveLayers({ ...activeLayers, soil: e.target.checked })}
                    className="accent-emerald-500 w-3.5 h-3.5 rounded"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-2xl bg-[#0D1527]/90 text-stone-300 hover:text-white border border-stone-700/60 backdrop-blur-md shadow-xl transition-all cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN SATELLITE CANVAS + PRECISION RECTILINEAR PLOTS OVERLAY  */}
      {/* ============================================================== */}
      <div
        className="absolute inset-0 w-full h-full origin-center transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`
        }}
      >
        {/* Base Layer: High-Resolution Orthophoto Satellite Image */}
        <img
          src="/images/farm_satellite_hd.png"
          alt="Satellite Farm Base"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ imageRendering: 'crisp-edges' }}
        />

        {/* Ambient Subtle Vignette / Contrast Layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/25 pointer-events-none" />

        {/* SVG Vector Precision Plot Overlay */}
        <svg
          viewBox="0 0 1000 1150"
          className="w-full h-full absolute inset-0"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Neon Cyan Glow for Active Selection (matching reference UI) */}
            <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00F0FF" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#00F0FF" floodOpacity="0.7" />
            </filter>

            {/* Hover Glow */}
            <filter id="hoverGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FBBF24" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Render 14-16 Rectilinear Parcels fitting natural terrain */}
          {activeLayers.boundary &&
            SATELLITE_RECT_PLOTS.map((p) => {
              const isSelected = activeSelectedCode === p.code;
              const isHovered = hoveredPlotItem?.code === p.code;
              const isOptimal = p.status === 'OPTIMAL';
              const isHarvested = p.status === 'HARVESTED';
              const isForest = p.status === 'FOREST';

              // Colors based on Status & Layers
              let strokeColor = isSelected ? '#00F0FF' : isHovered ? '#FBBF24' : '#34D399';
              let strokeWidth = isSelected ? 4 : isHovered ? 3 : 2.2;
              let fillColor = 'rgba(16, 185, 129, 0.12)';

              if (isOptimal) {
                fillColor = isSelected ? 'rgba(0, 240, 255, 0.22)' : 'rgba(16, 185, 129, 0.2)';
              } else if (isHarvested) {
                strokeColor = isSelected ? '#00F0FF' : isHovered ? '#FBBF24' : '#94A3B8';
                fillColor = 'rgba(148, 163, 184, 0.18)';
              } else if (isForest) {
                strokeColor = isSelected ? '#00F0FF' : isHovered ? '#FBBF24' : '#22C55E';
                fillColor = 'rgba(34, 197, 94, 0.1)';
              }

              // NDVI Spectrometry Overlay
              if (activeLayers.ndvi && !isHarvested && !isForest) {
                fillColor = isSelected ? 'rgba(0, 240, 255, 0.25)' : 'rgba(34, 197, 94, 0.28)';
              }

              // Soil Moisture Overlay
              if (activeLayers.soil) {
                fillColor = isSelected ? 'rgba(0, 240, 255, 0.3)' : 'rgba(6, 182, 212, 0.25)';
              }

              return (
                <g
                  key={p.code}
                  className="cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    const matchedPlot = plots.find((item) => item.code === p.code) || {
                      id: p.code,
                      code: p.code,
                      name: `Thửa Đất ${p.label}`,
                      status: p.status === 'HARVESTED' ? 'MAINTENANCE' : 'AVAILABLE',
                      areaFormatted: p.areaText,
                      rentalPriceFormatted: '1.800.000 đ/tháng',
                      crop: p.crop,
                      soilMoisture: p.soilMoisture
                    };
                    if (onSelectPlot) onSelectPlot(matchedPlot);
                  }}
                  onMouseEnter={() => setHoveredPlotItem(p)}
                  onMouseLeave={() => setHoveredPlotItem(null)}
                >
                  {/* Clean Rectangular Boundary */}
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={p.height}
                    rx="6"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    filter={isSelected ? 'url(#neonCyanGlow)' : isHovered ? 'url(#hoverGlow)' : undefined}
                  />

                  {/* Corner Vertex Anchors for Selected Plot (Precision Surveying Dots) */}
                  {isSelected && (
                    <>
                      <circle cx={p.x} cy={p.y} r="4" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx={p.x + p.width} cy={p.y} r="4" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx={p.x + p.width} cy={p.y + p.height} r="4" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx={p.x} cy={p.y + p.height} r="4" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="1.5" />
                    </>
                  )}

                  {/* Centered Plot Label & Metadata Badge (matching reference layout) */}
                  <g transform={`translate(${p.x + p.width / 2}, ${p.y + p.height / 2})`} pointerEvents="none">
                    {/* Plot Code Badge */}
                    <rect
                      x="-42"
                      y="-22"
                      width="84"
                      height="24"
                      rx="6"
                      fill={isSelected ? '#00F0FF' : 'rgba(15, 23, 42, 0.88)'}
                      stroke={isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />
                    <text
                      x="0"
                      y="-6"
                      textAnchor="middle"
                      fill={isSelected ? '#0F172A' : '#FFFFFF'}
                      fontSize="11"
                      fontWeight="900"
                      fontFamily="system-ui, sans-serif"
                    >
                      {p.label}
                    </text>

                    {/* Area Subtitle & Status Indicator */}
                    <text
                      x="0"
                      y="14"
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
                    >
                      {p.areaText} · {p.status === 'OPTIMAL' ? 'Optimal' : p.status === 'HARVESTED' ? 'Harvested' : p.status === 'FOREST' ? 'Forest' : 'Active'}
                    </text>
                  </g>
                </g>
              );
            })}
        </svg>
      </div>

      {/* ============================================================== */}
      {/* 3. LEFT TOOLBAR STACK (COMPASS, ZOOM, RESET, MINI-LEGEND)      */}
      {/* ============================================================== */}
      <div className="absolute left-3 top-20 bottom-3 z-30 flex flex-col justify-between pointer-events-none">
        {/* Navigation Tools */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-[#0D1527]/90 backdrop-blur-md rounded-2xl border border-stone-700/60 shadow-xl flex flex-col p-1 gap-1">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-200 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
              title="Phóng to"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-stone-800" />
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-200 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
              title="Thu nhỏ"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetView}
            className="w-9 h-9 rounded-2xl bg-[#0D1527]/90 backdrop-blur-md border border-stone-700/60 shadow-xl flex items-center justify-center text-stone-200 hover:text-emerald-400 hover:bg-stone-800 transition-all cursor-pointer"
            title="Căn giữa bản đồ"
          >
            <LocateFixed className="w-4 h-4" />
          </button>

          <div
            className="w-9 h-9 rounded-2xl bg-[#0D1527]/90 backdrop-blur-md border border-stone-700/60 shadow-xl flex items-center justify-center text-stone-300"
            title="Hướng Bắc (North)"
          >
            <Compass className="w-4 h-4 text-emerald-400 rotate-45" />
          </div>
        </div>

        {/* Legend Stack (Bottom-Left) */}
        <div className="bg-[#0D1527]/90 backdrop-blur-md p-2.5 rounded-2xl border border-stone-700/60 shadow-xl text-[10px] space-y-1.5 pointer-events-auto text-stone-300">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-400 shadow-xs" />
            <span>NDVI (Cây khỏe)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-xs bg-cyan-400 shadow-xs" />
            <span>Độ ẩm đất (Soil)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 border border-white rounded-xs" />
            <span>Ranh giới (Boundary)</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. FLOATING POPOVER CARD FOR ACTIVE PLOT (ANCHORED TO B-03)    */}
      {/* ============================================================== */}
      {activePlotData && (
        <div className="absolute top-16 right-3 sm:right-4 z-30 max-w-xs w-80 bg-[#0B111E]/95 backdrop-blur-2xl border border-cyan-400/80 rounded-3xl p-4 shadow-2xl text-white pointer-events-auto animate-fadeIn">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base text-cyan-300">
                  {activePlotData.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                  {activePlotData.status === 'OPTIMAL'
                    ? 'Optimal'
                    : activePlotData.status === 'HARVESTED'
                    ? 'Harvested'
                    : 'Active'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 mt-0.5 font-medium">
                {activePlotData.code} · Thửa đất nông trại
              </p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping mt-1 mr-1" />
          </div>

          {/* Telemetry Metrics Grid (Area, Status, Moisture, Crop) */}
          <div className="grid grid-cols-2 gap-2 my-3 text-[11px]">
            <div className="bg-[#121B2F]/80 rounded-xl p-2.5 border border-stone-800/80">
              <span className="text-stone-400 block text-[10px]">Diện tích</span>
              <span className="font-bold text-white text-sm">{activePlotData.areaText}</span>
            </div>
            <div className="bg-[#121B2F]/80 rounded-xl p-2.5 border border-stone-800/80">
              <span className="text-stone-400 block text-[10px] flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" /> Độ ẩm đất IoT
              </span>
              <span className="font-bold text-emerald-400 text-sm">{activePlotData.soilMoisture}</span>
            </div>
            <div className="bg-[#121B2F]/80 rounded-xl p-2.5 border border-stone-800/80">
              <span className="text-stone-400 block text-[10px] flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> Nhiệt độ đất
              </span>
              <span className="font-semibold text-stone-200">{activePlotData.temp}</span>
            </div>
            <div className="bg-[#121B2F]/80 rounded-xl p-2.5 border border-stone-800/80">
              <span className="text-stone-400 block text-[10px] flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-400" /> Cây trồng
              </span>
              <span className="font-semibold text-stone-200 truncate block">{activePlotData.crop}</span>
            </div>
          </div>

          {/* Call To Action */}
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 block">Định giá trọn gói</span>
              <span className="text-xs font-black text-amber-400">1.800.000 đ/tháng</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('plot-booking-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-stone-950 font-heading font-black text-xs hover:brightness-110 shadow-lg shadow-cyan-500/20 flex items-center gap-1 cursor-pointer"
            >
              <span>Đặt Thuê Ngay</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. BOTTOM-RIGHT TELEMETRY STATS WIDGET (MATCHING REFERENCE UI)  */}
      {/* ============================================================== */}
      <div className="absolute right-3 bottom-3 z-30 pointer-events-auto">
        <div className="bg-[#0B111E]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-stone-700/60 shadow-xl flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 text-[10px]">NDVI</span>
            <span className="font-bold text-emerald-400">43.6</span>
          </div>
          <div className="w-px h-4 bg-stone-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 text-[10px]">Độ ẩm</span>
            <span className="font-bold text-cyan-400">65%</span>
          </div>
          <div className="w-px h-4 bg-stone-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 text-[10px]">Nhiệt độ</span>
            <span className="font-bold text-amber-400">37°C</span>
          </div>
          <div className="w-px h-4 bg-stone-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 text-[10px]">Tổng</span>
            <span className="font-bold text-white">377 ha</span>
          </div>
        </div>
      </div>
    </div>
  );
}
