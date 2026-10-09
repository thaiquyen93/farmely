import React, { useState } from 'react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

/**
 * 2D ORTHOGRAPHIC FARM MAP — Top-down 90° aerial view
 * Pure SVG grid: 16 plots in 4×4 layout, central IoT station, pathways
 * ponytail: no raster overlay, add satellite toggle when design requests it
 */
export default function FarmAerialMap2D({ plots = [], selectedPlot, onSelectPlot }) {
  const [hoveredPlot, setHoveredPlot] = useState(null);

  // Grid layout: 4×4 plots, each 120×100 units, 20-unit pathways between
  const PLOT_WIDTH = 120;
  const PLOT_HEIGHT = 100;
  const GAP = 20;
  const GRID_START_X = 100;
  const GRID_START_Y = 80;

  // Generate 16 plot rectangles in grid
  const gridPlots = plots.slice(0, 16).map((plot, idx) => {
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    const x = GRID_START_X + col * (PLOT_WIDTH + GAP);
    const y = GRID_START_Y + row * (PLOT_HEIGHT + GAP);
    return { ...plot, x, y, width: PLOT_WIDTH, height: PLOT_HEIGHT };
  });

  const isSelected = (plot) => selectedPlot?.id === plot.id;
  const isHovered = (plot) => hoveredPlot?.id === plot.id;

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-brand-border bg-[#EBF0E4] shadow-sm">
      <svg viewBox="0 0 700 600" className="w-full h-full">
        <defs>
          {/* Furrow pattern for cultivated soil */}
          <pattern id="furrows" width="8" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="2" x2="8" y2="2" stroke="#8B7355" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          {/* Selected plot glow */}
          <filter id="glow2d" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F6D365" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Background grass */}
        <rect width="700" height="600" fill="#C8D5B9" />

        {/* Pathways (gravel/grass strips) */}
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={`path-${i}`}>
            {/* Horizontal pathways */}
            <rect
              x={GRID_START_X}
              y={GRID_START_Y + i * (PLOT_HEIGHT + GAP) + PLOT_HEIGHT}
              width={4 * PLOT_WIDTH + 3 * GAP}
              height={GAP}
              fill="#A8B89A"
            />
            {/* Vertical pathways */}
            <rect
              x={GRID_START_X + i * (PLOT_WIDTH + GAP) + PLOT_WIDTH}
              y={GRID_START_Y}
              width={GAP}
              height={4 * PLOT_HEIGHT + 3 * GAP}
              fill="#A8B89A"
            />
          </React.Fragment>
        ))}

        {/* Central IoT weather station */}
        <g transform="translate(340, 290)">
          <circle cx="0" cy="0" r="18" fill="#294C38" stroke="#F6D365" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fill="#F6D365" fontSize="14" fontWeight="bold">
            IoT
          </text>
          <text x="0" y="-28" textAnchor="middle" fill="#294C38" fontSize="10" fontWeight="600">
            Trạm Vi Khí Hậu
          </text>
        </g>

        {/* Plot rectangles */}
        {gridPlots.map((plot) => {
          const statusConfig = GIS_STATUSES[plot.status] || GIS_STATUSES.AVAILABLE;
          const selected = isSelected(plot);
          const hovered = isHovered(plot);

          return (
            <g
              key={plot.id}
              className="cursor-pointer transition-all"
              onClick={() => onSelectPlot(plot)}
              onMouseEnter={() => setHoveredPlot(plot)}
              onMouseLeave={() => setHoveredPlot(null)}
            >
              {/* Plot soil + furrows */}
              <rect
                x={plot.x}
                y={plot.y}
                width={plot.width}
                height={plot.height}
                fill={selected || hovered ? statusConfig.hoverFillColor : statusConfig.fillColor}
                stroke={selected ? '#FFFFFF' : hovered ? '#F6D365' : statusConfig.strokeColor}
                strokeWidth={selected ? 3 : hovered ? 2.5 : 1.5}
                filter={selected ? 'url(#glow2d)' : undefined}
                rx="4"
              />
              <rect
                x={plot.x}
                y={plot.y}
                width={plot.width}
                height={plot.height}
                fill="url(#furrows)"
                pointerEvents="none"
                opacity="0.4"
                rx="4"
              />

              {/* Plot label pill */}
              <g transform={`translate(${plot.x + plot.width / 2}, ${plot.y + plot.height / 2})`}>
                <rect
                  x="-22"
                  y="-12"
                  width="44"
                  height="24"
                  rx="8"
                  fill={selected ? '#294C38' : 'rgba(20, 30, 20, 0.8)'}
                  stroke={selected ? '#F6D365' : '#FFFFFF'}
                  strokeWidth={selected ? 1.5 : 1}
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {plot.label || plot.code.replace('Plot ', '')}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredPlot && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-brand-dark/95 backdrop-blur text-white text-xs rounded-xl p-3 shadow-xl border border-white/20 min-w-[160px]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-brand-yellow">{hoveredPlot.code}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${GIS_STATUSES[hoveredPlot.status]?.badgeClass}`}>
                {GIS_STATUSES[hoveredPlot.status]?.label}
              </span>
            </div>
            <p className="text-[11px] text-stone-300 mb-2">{hoveredPlot.name}</p>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
              <span className="text-stone-400">{hoveredPlot.areaFormatted}</span>
              <span className="font-bold text-emerald-400">{hoveredPlot.rentalPriceFormatted}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-xl px-3 py-2 border border-brand-border shadow-md flex flex-wrap gap-3 text-xs font-semibold text-brand-dark">
        {Object.values(GIS_STATUSES).map((status) => (
          <div key={status.key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full shadow-sm`} style={{ backgroundColor: status.color }} />
            <span>{status.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
