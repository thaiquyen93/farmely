import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, LocateFixed, Maximize2, Minimize2 } from 'lucide-react';
import { MARKETPLACE_PLOTS_GIS } from '../../data/marketplaceGisData';

/**
 * 16 PLOTS — viewBox 1000×1400 mapped to 1200×1700 Ultra-HD orthophoto.
 * ponytail: ceiling is static grid, upgrade path is GeoJSON when backend exists.
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

const ST_STROKE = { AVAILABLE: 'rgba(16,185,129,0.55)', RENTED: 'rgba(245,158,11,0.45)', MAINTENANCE: 'rgba(100,116,139,0.35)' };
const ST_DOT   = { AVAILABLE: '#10B981', RENTED: '#F59E0B', MAINTENANCE: '#94A3B8' };

export default function MarketplaceInteractiveMap({
  plots = [], selectedPlot = null, onSelectPlot, currentFarm, activeStatusTab = 'ALL'
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
    if (g) setPan({ x: (500 - g.x - g.w / 2) * 0.25, y: (700 - g.y - g.h / 2) * 0.25 });
  }, [selectedPlot]);

  const zIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const zOut = () => setZoom((z) => { const n = Math.max(z - 0.25, 0.85); if (n <= 1) setPan({ x: 0, y: 0 }); return n; });
  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const md = (e) => { if (e.button !== 0) return; setDrag(true); setDStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const mm = (e) => { if (!drag) return; setPan({ x: e.clientX - dStart.x, y: e.clientY - dStart.y }); };
  const mu = () => setDrag(false);

  const click = (p) => {
    const m = plots.find((i) => i.code === p.code || i.id === p.id) ||
      MARKETPLACE_PLOTS_GIS.find((i) => i.code === p.code) ||
      { id: p.id, code: p.code, label: p.label, name: `Thửa Đất ${p.label}`, status: 'AVAILABLE', areaFormatted: '150 m²', rentalPriceFormatted: '1.500.000 đ/tháng' };
    onSelectPlot?.(m);
  };

  // -- Inline styles following Linear dark-mode design tokens --
  const glassStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div ref={ref} onMouseDown={md} onMouseMove={mm} onMouseUp={mu} onMouseLeave={() => setDrag(false)}
      className={`relative w-full overflow-hidden select-none ${fs ? 'fixed inset-0 z-50' : 'h-full min-h-[580px] lg:min-h-[720px] rounded-xl'} ${drag ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ background: '#08090A', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>

      <style>{`
        @keyframes gd { to { stroke-dashoffset: -48 } }
        @keyframes gf { 0%,100% { opacity:.65 } 50% { opacity:1 } }
        @keyframes gs { 0% { transform:translateY(-10%); opacity:0 } 10% { opacity:.5 } 90% { opacity:.5 } 100% { transform:translateY(110%); opacity:0 } }
      `}</style>

      {/* Controls — top-right, ultra-compact glass */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
        <div className="flex items-center rounded-md overflow-hidden" style={glassStyle}>
          <button onClick={zIn} className="w-7 h-7 flex items-center justify-center text-[#8a8f98] hover:text-[#f7f8f8] transition-colors cursor-pointer"><Plus className="w-3 h-3" /></button>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.06)' }} />
          <button onClick={zOut} className="w-7 h-7 flex items-center justify-center text-[#8a8f98] hover:text-[#f7f8f8] transition-colors cursor-pointer"><Minus className="w-3 h-3" /></button>
        </div>
        <button onClick={reset} className="w-7 h-7 rounded-md flex items-center justify-center text-[#8a8f98] hover:text-[#f7f8f8] transition-colors cursor-pointer" style={glassStyle}><LocateFixed className="w-3 h-3" /></button>
        <button onClick={() => setFs(!fs)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#8a8f98] hover:text-[#f7f8f8] transition-colors cursor-pointer" style={glassStyle}>
          {fs ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>

      {/* Canvas */}
      <div className="absolute inset-0 w-full h-full origin-center" style={{ transform: `scale(${zoom}) translate(${pan.x/zoom}px,${pan.y/zoom}px)`, transition: 'transform 0.2s ease-out' }}>
        <img src="/images/land_rect_ultra_hd.jpg" alt="Orthophoto" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ imageRendering: 'crisp-edges' }} draggable={false} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(8,9,10,0.5) 100%)' }} />

        <svg viewBox="0 0 1000 1400" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
          <defs>
            <filter id="gs" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00F0FF" floodOpacity="0.75" />
              <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#00F0FF" floodOpacity="0.35" />
            </filter>
            <filter id="gh" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FBBF24" floodOpacity="0.6" />
            </filter>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0" />
              <stop offset="80%" stopColor="#00F0FF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {GRID_16_PLOTS.map((p) => {
            const isSel = sel === p.code;
            const isHov = hov === p.code;
            const real = plots.find((i) => i.code === p.code) || MARKETPLACE_PLOTS_GIS.find((i) => i.code === p.code);
            const st = real?.status || 'AVAILABLE';
            const vis = activeStatusTab === 'ALL' || st === activeStatusTab;
            const cx = p.x + p.w / 2;

            return (
              <g key={p.code} className="cursor-pointer" style={{ opacity: vis ? 1 : 0.15, transition: 'opacity 0.3s' }}
                onClick={(e) => { e.stopPropagation(); click(p); }}
                onMouseEnter={() => setHov(p.code)} onMouseLeave={() => setHov(null)}>

                {/* Fill */}
                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="5"
                  fill={isSel ? 'rgba(0,240,255,0.08)' : isHov ? 'rgba(251,191,36,0.06)' : 'rgba(0,0,0,0.01)'}
                  style={{ transition: 'fill 0.25s' }} />

                {/* Border */}
                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="5" fill="none"
                  stroke={isSel ? '#00F0FF' : isHov ? '#FBBF24' : (ST_STROKE[st] || ST_STROKE.AVAILABLE)}
                  strokeWidth={isSel ? 2.5 : isHov ? 2 : 1.2}
                  filter={isSel ? 'url(#gs)' : isHov ? 'url(#gh)' : undefined}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.15s' }} />

                {/* Selected: running dash */}
                {isSel && <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="5" fill="none"
                  stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="12 8"
                  style={{ animation: 'gd 2s linear infinite' }} pointerEvents="none" />}

                {/* Selected: scanline */}
                {isSel && (
                  <g pointerEvents="none">
                    <clipPath id={`c-${p.id}`}><rect x={p.x} y={p.y} width={p.w} height={p.h} rx="5" /></clipPath>
                    <g clipPath={`url(#c-${p.id})`} style={{ animation: 'gs 3.5s ease-in-out infinite' }}>
                      <rect x={p.x} y={p.y} width={p.w} height={24} fill="url(#sg)" />
                      <line x1={p.x} y1={p.y+24} x2={p.x+p.w} y2={p.y+24} stroke="#00F0FF" strokeWidth="1" strokeOpacity="0.7" />
                    </g>
                  </g>
                )}

                {/* Selected: corner brackets */}
                {isSel && (
                  <g stroke="#00F0FF" strokeWidth="2" fill="none" pointerEvents="none" style={{ animation: 'gf 2s ease-in-out infinite' }}>
                    <path d={`M${p.x-3} ${p.y+14} L${p.x-3} ${p.y-3} L${p.x+14} ${p.y-3}`} />
                    <path d={`M${p.x+p.w-14} ${p.y-3} L${p.x+p.w+3} ${p.y-3} L${p.x+p.w+3} ${p.y+14}`} />
                    <path d={`M${p.x+p.w+3} ${p.y+p.h-14} L${p.x+p.w+3} ${p.y+p.h+3} L${p.x+p.w-14} ${p.y+p.h+3}`} />
                    <path d={`M${p.x+14} ${p.y+p.h+3} L${p.x-3} ${p.y+p.h+3} L${p.x-3} ${p.y+p.h-14}`} />
                  </g>
                )}

                {/* Badge: minimal number + status dot */}
                <g transform={`translate(${cx - 18}, ${p.y + 8})`} pointerEvents="none">
                  <rect x="0" y="0" width="36" height="20" rx="5"
                    fill={isSel ? '#00F0FF' : isHov ? 'rgba(251,191,36,0.85)' : 'rgba(8,9,10,0.78)'}
                    stroke={isSel || isHov ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}
                    strokeWidth="0.6" style={{ transition: 'fill 0.2s' }} />
                  <circle cx="9" cy="10" r="2.5" fill={isSel ? '#08090A' : (ST_DOT[st] || ST_DOT.AVAILABLE)} />
                  <text x="25" y="14" textAnchor="middle" fill={isSel || isHov ? '#08090A' : '#f7f8f8'}
                    fontSize="9" fontWeight="600" fontFamily="'Inter',system-ui,sans-serif" letterSpacing="0.01em">
                    {p.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom-left: coord */}
      <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
        <span className="px-2 py-0.5 rounded text-[9px] font-mono text-[#62666d] tracking-wide"
          style={{ background: 'rgba(8,9,10,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
          10°41′N 106°20′E · WGS84
        </span>
      </div>
    </div>
  );
}
