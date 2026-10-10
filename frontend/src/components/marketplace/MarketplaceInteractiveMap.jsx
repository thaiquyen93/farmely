import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, LocateFixed, Maximize2, Minimize2, Check, Sparkles } from 'lucide-react';
import { MARKETPLACE_PLOTS_GIS } from '../../data/marketplaceGisData';

/**
 * 16 PLOTS mapped to Ultra-HD farmland orthophoto.
 * Matches exact GIF styling:
 * - Thin crisp white plot boundaries
 * - White rectangular badges centered at top boundary
 * - Active plot (P-01): Cyan/mint #00E5A3 border, 4 corner anchor dots, semi-transparent pale green fill
 * - Anchored speech bubble tooltip with status and feature checkmarks
 */
export const GRID_16_PLOTS = [
  { id: 'PLT-HV-01', code: 'Plot P-01', label: 'P-01', x: 30,  y: 30,  w: 205, h: 360 },
  { id: 'PLT-HV-02', code: 'Plot P-02', label: 'P-02', x: 250, y: 30,  w: 205, h: 360 },
  { id: 'PLT-HV-03', code: 'Plot P-03', label: 'P-03', x: 475, y: 30,  w: 250, h: 360 },
  { id: 'PLT-HV-04', code: 'Plot P-04', label: 'P-04', x: 745, y: 30,  w: 230, h: 360 },
  { id: 'PLT-HV-05', code: 'Plot P-05', label: 'P-05', x: 30,  y: 415, w: 205, h: 420 },
  { id: 'PLT-HV-06', code: 'Plot P-06', label: 'P-06', x: 250, y: 415, w: 205, h: 420 },
  { id: 'PLT-HV-07', code: 'Plot P-07', label: 'P-07', x: 475, y: 415, w: 250, h: 420 },
  { id: 'PLT-HV-08', code: 'Plot P-08', label: 'P-08', x: 745, y: 415, w: 230, h: 420 },
  { id: 'PLT-HV-09', code: 'Plot P-09', label: 'P-09', x: 30,  y: 865, w: 205, h: 240 },
  { id: 'PLT-HV-10', code: 'Plot P-10', label: 'P-10', x: 250, y: 865, w: 205, h: 240 },
  { id: 'PLT-HV-11', code: 'Plot P-11', label: 'P-11', x: 475, y: 865, w: 250, h: 240 },
  { id: 'PLT-HV-12', code: 'Plot P-12', label: 'P-12', x: 745, y: 865, w: 230, h: 240 },
  { id: 'PLT-HV-13', code: 'Plot P-13', label: 'P-13', x: 30,  y: 1130, w: 205, h: 240 },
  { id: 'PLT-HV-14', code: 'Plot P-14', label: 'P-14', x: 250, y: 1130, w: 205, h: 240 },
  { id: 'PLT-HV-15', code: 'Plot P-15', label: 'P-15', x: 475, y: 1130, w: 250, h: 240 },
  { id: 'PLT-HV-16', code: 'Plot P-16', label: 'P-16', x: 745, y: 1130, w: 230, h: 240 },
];

export default function MarketplaceInteractiveMap({
  plots = [],
  selectedPlot = null,
  onSelectPlot,
  currentFarm,
  activeStatusTab = 'ALL'
}) {
  const ref = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(false);
  const [dStart, setDStart] = useState({ x: 0, y: 0 });
  const [hov, setHov] = useState(null);
  const [fs, setFs] = useState(false);

  const selCode = selectedPlot?.code || 'Plot P-01';

  useEffect(() => {
    if (!selectedPlot) return;
    const g = GRID_16_PLOTS.find((p) => p.code === selectedPlot.code);
    // ponytail: only auto-pan when zoomed in; at zoom=1 the whole map is visible
    if (g && zoom > 1) {
      setPan({
        x: (500 - g.x - g.w / 2) * 0.25,
        y: (700 - g.y - g.h / 2) * 0.25
      });
    }
  }, [selectedPlot]);

  const zIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const zOut = () =>
    setZoom((z) => {
      const n = Math.max(z - 0.25, 0.85);
      if (n <= 1) setPan({ x: 0, y: 0 });
      return n;
    });
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const md = (e) => {
    if (e.button !== 0) return;
    setDrag(true);
    setDStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const mm = (e) => {
    if (!drag) return;
    setPan({ x: e.clientX - dStart.x, y: e.clientY - dStart.y });
  };
  const mu = () => setDrag(false);

  const click = (p) => {
    const m =
      plots.find((i) => i.code === p.code || i.id === p.id) ||
      MARKETPLACE_PLOTS_GIS.find((i) => i.code === p.code) || {
        id: p.id,
        code: p.code,
        label: p.label,
        name: `Thửa Đất ${p.label}`,
        status: 'AVAILABLE',
        areaFormatted: '150 m²',
        rentalPriceFormatted: '1.000.000 đ/tháng'
      };
    onSelectPlot?.(m);
  };

  // Find currently selected plot geometry for anchor tooltip
  const activeGeo = GRID_16_PLOTS.find((p) => p.code === selCode) || GRID_16_PLOTS[0];

  return (
    <div
      ref={ref}
      onMouseDown={md}
      onMouseMove={mm}
      onMouseUp={mu}
      onMouseLeave={() => setDrag(false)}
      className={`relative w-full h-full overflow-hidden select-none bg-stone-900 ${
        fs ? 'fixed inset-0 z-50' : ''
      } ${drag ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* 1. Base Map Canvas with Ultra-HD Satellite Orthophoto */}
      <div
        className="absolute inset-0 w-full h-full origin-center"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transition: 'transform 0.2s ease-out'
        }}
      >
        <img
          src="/images/land_rect_ultra_hd.jpg"
          alt="Orthophoto GIS Map"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ imageRendering: 'crisp-edges' }}
          draggable={false}
        />

        {/* 2. SVG Vector Cadastral Grid Layer */}
        <svg
          viewBox="0 0 1000 1400"
          className="w-full h-full absolute inset-0"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Subtle glow for selected cyan boundary */}
            <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00E5A3" floodOpacity="0.6" />
            </filter>
            {/* Soft drop shadow for floating badges and tooltips */}
            <filter id="badge-shadow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Render All Plots */}
          {GRID_16_PLOTS.map((p) => {
            const isSel = selCode === p.code;
            const isHov = hov === p.code;
            const real =
              plots.find((i) => i.code === p.code) ||
              MARKETPLACE_PLOTS_GIS.find((i) => i.code === p.code);
            const st = real?.status || 'AVAILABLE';
            const vis = activeStatusTab === 'ALL' || st === activeStatusTab;
            const cx = p.x + p.w / 2;

            return (
              <g
                key={p.code}
                className="cursor-pointer transition-opacity duration-300"
                style={{ opacity: vis ? 1 : 0.25 }}
                onClick={(e) => {
                  e.stopPropagation();
                  click(p);
                }}
                onMouseEnter={() => setHov(p.code)}
                onMouseLeave={() => setHov(null)}
              >
                {/* Parcel Boundary / Fill */}
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  rx="6"
                  fill={
                    isSel
                      ? 'rgba(0, 229, 163, 0.16)' // Vibrant pale green / mint tint from GIF
                      : isHov
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)'
                  }
                  stroke={
                    isSel
                      ? '#00E5A3' // Exact Cyan / Mint stroke from GIF
                      : isHov
                      ? '#FFFFFF'
                      : 'rgba(255, 255, 255, 0.65)' // Clean crisp white lines
                  }
                  strokeWidth={isSel ? 3.0 : isHov ? 2.0 : 1.4}
                  filter={isSel ? 'url(#cyan-glow)' : undefined}
                  style={{ transition: 'all 0.2s ease-in-out' }}
                />

                {/* 4 Corner Vertex / Anchor Nodes for Selected Plot (matching GIF) */}
                {isSel && (
                  <g pointerEvents="none">
                    {/* Top-Left */}
                    <circle cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke="#00E5A3" strokeWidth="2.5" />
                    {/* Top-Right */}
                    <circle cx={p.x + p.w} cy={p.y} r="4" fill="#FFFFFF" stroke="#00E5A3" strokeWidth="2.5" />
                    {/* Bottom-Left */}
                    <circle cx={p.x} cy={p.y + p.h} r="4" fill="#FFFFFF" stroke="#00E5A3" strokeWidth="2.5" />
                    {/* Bottom-Right */}
                    <circle cx={p.x + p.w} cy={p.y + p.h} r="4" fill="#FFFFFF" stroke="#00E5A3" strokeWidth="2.5" />
                  </g>
                )}

                {/* Plot ID Badge - White capsule centered on top boundary */}
                <g
                  transform={`translate(${cx - 22}, ${p.y + 8})`}
                  pointerEvents="none"
                  filter="url(#badge-shadow)"
                >
                  <rect
                    x="0"
                    y="0"
                    width="44"
                    height="20"
                    rx="5"
                    fill="#FFFFFF"
                    stroke={isSel ? '#00E5A3' : 'rgba(226, 232, 240, 0.9)'}
                    strokeWidth={isSel ? 1.5 : 1}
                  />
                  <text
                    x="22"
                    y="14"
                    textAnchor="middle"
                    fill="#1E293B"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                    letterSpacing="0.02em"
                  >
                    {p.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 3. Anchored Speech Bubble Tooltip for Selected Plot (matching GIF frame 2/4) */}
          {activeGeo && (
            <g
              transform={`translate(${activeGeo.x + activeGeo.w + 14}, ${activeGeo.y + 30})`}
              pointerEvents="none"
              filter="url(#badge-shadow)"
              className="animate-in fade-in duration-200"
            >
              {/* Triangle Pointer Arrow */}
              <polygon points="-8,16 0,10 0,22" fill="#FFFFFF" />

              {/* Tooltip Card Body */}
              <rect
                x="0"
                y="0"
                width="165"
                height="70"
                rx="10"
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth="1"
              />

              {/* Status Header */}
              <g transform="translate(12, 18)">
                <circle cx="4" cy="0" r="3.5" fill="#10B981" />
                <text
                  x="14"
                  y="4"
                  fill="#059669"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                >
                  Đang trống
                </text>
              </g>

              {/* Checkmark 1: Đất trù phú */}
              <g transform="translate(12, 38)">
                <circle cx="4" cy="0" r="2" fill="#00E5A3" />
                <text
                  x="14"
                  y="3"
                  fill="#475569"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                >
                  Đất màu mỡ, tơi xốp
                </text>
              </g>

              {/* Checkmark 2: Bằng phẳng, gần nguồn nước */}
              <g transform="translate(12, 54)">
                <circle cx="4" cy="0" r="2" fill="#00E5A3" />
                <text
                  x="14"
                  y="3"
                  fill="#475569"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
                >
                  Bằng phẳng · Gần nước
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* 4. Subtle Map UI Controls (Zoom In/Out, Locate, Scale Bar) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 rounded-2xl p-1.5 flex flex-col gap-1 text-slate-700">
          <button
            type="button"
            onClick={zIn}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div className="w-full h-px bg-slate-200" />
          <button
            type="button"
            onClick={zOut}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div className="w-full h-px bg-slate-200" />
          <button
            type="button"
            onClick={reset}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer"
            title="Vị trí trung tâm"
          >
            <LocateFixed className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="w-full h-px bg-slate-200" />
          <button
            type="button"
            onClick={() => setFs(!fs)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-emerald-700 transition-colors cursor-pointer"
            title="Toàn màn hình"
          >
            {fs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Small Scale Bar & Coordinate Tag */}
        <div className="bg-white/90 backdrop-blur-md shadow-md border border-slate-200/80 rounded-xl px-2.5 py-1 flex items-center gap-2 text-[10px] text-slate-600 font-medium font-mono">
          <div className="flex items-center gap-1">
            <span className="w-6 h-1 border-b-2 border-l-2 border-r-2 border-slate-700 block"></span>
            <span>50m</span>
          </div>
          <span className="text-slate-300">|</span>
          <span>10°41′N 106°20′E</span>
        </div>
      </div>
    </div>
  );
}
