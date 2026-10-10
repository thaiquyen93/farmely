import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, LocateFixed, Maximize2, Minimize2, Layers, Compass } from 'lucide-react';
import { MARKETPLACE_PLOTS_GIS } from '../../data/marketplaceGisData';

/**
 * 16 PLOTS — viewBox 1000×1400 mapped to 1200×1700 Ultra-HD orthophoto.
 * Clean, modern light GIS aesthetic matching reference design.
 * ponytail: ceiling is static SVG grid, upgrade path is GeoJSON Leaflet layer.
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

const ST_STROKE = {
  AVAILABLE: 'rgba(16, 185, 129, 0.65)',
  RENTED: 'rgba(245, 158, 11, 0.65)',
  MAINTENANCE: 'rgba(148, 163, 184, 0.65)'
};

const ST_DOT = {
  AVAILABLE: '#10B981',
  RENTED: '#F59E0B',
  MAINTENANCE: '#94A3B8'
};

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

  const sel = selectedPlot?.code || 'Plot P-01';

  useEffect(() => {
    if (!selectedPlot) return;
    const g = GRID_16_PLOTS.find((p) => p.code === selectedPlot.code);
    if (g) {
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
        rentalPriceFormatted: '1.200.000 đ/tháng'
      };
    onSelectPlot?.(m);
  };

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
      {/* 1. Canvas with Satellite Orthophoto */}
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

        {/* Subtle vignette for contrast */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 65%, rgba(0,0,0,0.35) 100%)'
          }}
        />

        {/* 2. SVG Plot Outlines & Badges */}
        <svg
          viewBox="0 0 1000 1400"
          className="w-full h-full absolute inset-0"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Emerald glow for selected plot */}
            <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.5" />
            </filter>
            {/* Drop shadow for floating white badges */}
            <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {GRID_16_PLOTS.map((p) => {
            const isSel = sel === p.code;
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
                style={{ opacity: vis ? 1 : 0.2 }}
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
                      ? 'rgba(16, 185, 129, 0.22)' // Light green semi-transparent inner overlay
                      : isHov
                      ? 'rgba(16, 185, 129, 0.10)'
                      : 'rgba(255, 255, 255, 0.03)'
                  }
                  stroke={
                    isSel
                      ? '#10B981' // Vibrant emerald green border for selected
                      : isHov
                      ? '#34D399'
                      : 'rgba(255, 255, 255, 0.85)' // Clean white border for unselected
                  }
                  strokeWidth={isSel ? 3.0 : isHov ? 2.0 : 1.4}
                  strokeDasharray={isSel ? 'none' : 'none'}
                  filter={isSel ? 'url(#emerald-glow)' : undefined}
                  style={{ transition: 'all 0.2s ease-in-out' }}
                />

                {/* Floating Modern Pill Badge */}
                <g
                  transform={`translate(${cx - 24}, ${p.y + 10})`}
                  pointerEvents="none"
                  filter="url(#badge-shadow)"
                >
                  {/* Badge Background */}
                  <rect
                    x="0"
                    y="0"
                    width="48"
                    height="22"
                    rx="11"
                    fill={isSel ? '#10B981' : '#FFFFFF'}
                    stroke={isSel ? '#059669' : 'rgba(226, 232, 240, 0.8)'}
                    strokeWidth="1"
                    style={{ transition: 'all 0.2s ease-in-out' }}
                  />

                  {/* Status Indicator Dot */}
                  <circle
                    cx="12"
                    cy="11"
                    r="3"
                    fill={isSel ? '#FFFFFF' : ST_DOT[st] || ST_DOT.AVAILABLE}
                  />

                  {/* Parcel ID Text */}
                  <text
                    x="30"
                    y="14.5"
                    textAnchor="middle"
                    fill={isSel ? '#FFFFFF' : '#1E293B'}
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', Segoe UI, sans-serif"
                    letterSpacing="0.02em"
                  >
                    {p.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 3. Subtle Bottom Right Map UI Controls (Zoom In/Out, Locate, Scale Bar) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Map Control Buttons Card */}
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
