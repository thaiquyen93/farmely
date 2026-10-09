import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Map as MapIcon
} from 'lucide-react';
import { GIS_STATUSES } from '../../data/marketplaceGisData';

/**
 * EXACT WGS84 COORDINATES FOR 16 FARMLAND PLOTS
 * Centered on 10°41'31.73"N, 106°21'24.37"E (10.692147, 106.356769)
 * 4x4 precision survey grid matching actual agricultural boundaries
 */
export const GEO_FARM_CENTER = [10.692147, 106.356769];

export const GEO_PLOTS_COORDINATES = {
  'Plot P-01': { label: 'P-01 (A1)', center: [10.692852, 106.355764], polygon: [[10.693047, 106.355469], [10.693047, 106.356059], [10.692657, 106.356059], [10.692657, 106.355469]] },
  'Plot P-02': { label: 'P-02 (A2)', center: [10.692852, 106.356414], polygon: [[10.693047, 106.356119], [10.693047, 106.356709], [10.692657, 106.356709], [10.692657, 106.356119]] },
  'Plot P-03': { label: 'P-03 (A3)', center: [10.692852, 106.357064], polygon: [[10.693047, 106.356769], [10.693047, 106.357359], [10.692657, 106.357359], [10.692657, 106.356769]] },
  'Plot P-04': { label: 'P-04 (A4)', center: [10.692852, 106.357714], polygon: [[10.693047, 106.357419], [10.693047, 106.358009], [10.692657, 106.358009], [10.692657, 106.357419]] },
  'Plot P-05': { label: 'P-05 (B1)', center: [10.692402, 106.355764], polygon: [[10.692597, 106.355469], [10.692597, 106.356059], [10.692207, 106.356059], [10.692207, 106.355469]] },
  'Plot P-06': { label: 'P-06 (B2)', center: [10.692402, 106.356414], polygon: [[10.692597, 106.356119], [10.692597, 106.356709], [10.692207, 106.356709], [10.692207, 106.356119]] },
  'Plot P-07': { label: 'P-07 (B-03)', center: [10.692402, 106.357064], polygon: [[10.692597, 106.356769], [10.692597, 106.357359], [10.692207, 106.357359], [10.692207, 106.356769]] },
  'Plot P-08': { label: 'P-08 (B4)', center: [10.692402, 106.357714], polygon: [[10.692597, 106.357419], [10.692597, 106.358009], [10.692207, 106.358009], [10.692207, 106.357419]] },
  'Plot P-09': { label: 'P-09 (C1)', center: [10.691952, 106.355764], polygon: [[10.692147, 106.355469], [10.692147, 106.356059], [10.691757, 106.356059], [10.691757, 106.355469]] },
  'Plot P-10': { label: 'P-10 (C2)', center: [10.691952, 106.356414], polygon: [[10.692147, 106.356119], [10.692147, 106.356709], [10.691757, 106.356709], [10.691757, 106.356119]] },
  'Plot P-11': { label: 'P-11 (C3)', center: [10.691952, 106.357064], polygon: [[10.692147, 106.356769], [10.692147, 106.357359], [10.691757, 106.357359], [10.691757, 106.356769]] },
  'Plot P-12': { label: 'P-12 (C4)', center: [10.691952, 106.357714], polygon: [[10.692147, 106.357419], [10.692147, 106.358009], [10.691757, 106.358009], [10.691757, 106.357419]] },
  'Plot P-13': { label: 'P-13 (D1)', center: [10.691502, 106.355764], polygon: [[10.691697, 106.355469], [10.691697, 106.356059], [10.691307, 106.356059], [10.691307, 106.355469]] },
  'Plot P-14': { label: 'P-14 (D2)', center: [10.691502, 106.356414], polygon: [[10.691697, 106.356119], [10.691697, 106.356709], [10.691307, 106.356709], [10.691307, 106.356119]] },
  'Plot P-15': { label: 'P-15 (D3)', center: [10.691502, 106.357064], polygon: [[10.691697, 106.356769], [10.691697, 106.357359], [10.691307, 106.357359], [10.691307, 106.356769]] },
  'Plot P-16': { label: 'P-16 (D4)', center: [10.691502, 106.357714], polygon: [[10.691697, 106.357419], [10.691697, 106.358009], [10.691307, 106.358009], [10.691307, 106.357419]] },
};

export default function MarketplaceInteractiveMap({
  plots = [],
  selectedPlot = null,
  onSelectPlot,
  currentFarm,
  onSelectFarm
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);
  const markersGroupRef = useRef(null);
  const verticesGroupRef = useRef(null);

  // Layer Toggles matching Precision GIS UI
  const [layersOpen, setLayersOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    boundary: true,
    ndvi: true,
    soil: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: GEO_FARM_CENTER,
      zoom: 17,
      minZoom: 14,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    });

    // High-Resolution Satellite Layer (Google Satellite Pyramid)
    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxNativeZoom: 19,
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);
    verticesGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render or Update Plots Polygons & Labels
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersGroupRef.current || !markersGroupRef.current || !verticesGroupRef.current) return;

    layersGroupRef.current.clearLayers();
    markersGroupRef.current.clearLayers();
    verticesGroupRef.current.clearLayers();

    if (!activeLayers.boundary) return;

    plots.forEach((plot, index) => {
      const geo = GEO_PLOTS_COORDINATES[plot.code] || Object.values(GEO_PLOTS_COORDINATES)[index];
      if (!geo) return;

      const isSelected = selectedPlot?.code === plot.code;
      const isAvailable = plot.status === 'AVAILABLE';
      const isRented = plot.status === 'RENTED';
      const isMaintenance = plot.status === 'MAINTENANCE';

      // Status-based polygon styles
      let strokeColor = '#FFFFFF';
      let fillColor = '#10B981';
      let fillOpacity = 0.22;
      let weight = 2.2;

      if (isRented) {
        fillColor = '#F59E0B';
        strokeColor = '#FBBF24';
      } else if (isMaintenance) {
        fillColor = '#64748B';
        strokeColor = '#94A3B8';
      }

      // NDVI Spectrometry Overlay
      if (activeLayers.ndvi && isAvailable) {
        fillColor = '#22C55E';
        fillOpacity = 0.38;
      }

      // Soil Moisture Telemetry Overlay
      if (activeLayers.soil) {
        fillColor = '#06B6D4';
        fillOpacity = 0.35;
      }

      if (isSelected) {
        strokeColor = '#00F0FF';
        weight = 3.8;
        fillOpacity = 0.55;
      }

      // 1. Polygon Layer
      const polygon = L.polygon(geo.polygon, {
        color: strokeColor,
        weight: weight,
        opacity: 0.95,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        className: 'cursor-pointer'
      });

      polygon.on('click', () => {
        if (onSelectPlot) onSelectPlot(plot);
        map.flyTo(geo.center, 18, { duration: 0.6 });
      });

      polygon.on('mouseover', () => {
        if (!isSelected) {
          polygon.setStyle({
            weight: 3.2,
            color: '#38BDF8',
            fillOpacity: 0.45
          });
        }
      });

      polygon.on('mouseout', () => {
        if (!isSelected) {
          polygon.setStyle({
            weight: weight,
            color: strokeColor,
            fillOpacity: fillOpacity
          });
        }
      });

      layersGroupRef.current.addLayer(polygon);

      // 2. Corner Vertex Handles on Selected Plot
      if (isSelected) {
        geo.polygon.forEach((pt) => {
          const vertexMarker = L.circleMarker(pt, {
            radius: 4,
            color: '#FFFFFF',
            weight: 2,
            fillColor: '#00F0FF',
            fillOpacity: 1.0
          });
          verticesGroupRef.current.addLayer(vertexMarker);
        });
      }

      // 3. Central Plot Label
      const labelText = geo.label || plot.code;
      const labelIcon = L.divIcon({
        className: 'custom-plot-label',
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            transform: translate(-50%, -50%);
          ">
            <span style="
              background: ${isSelected ? 'rgba(0, 240, 255, 0.95)' : 'rgba(15, 23, 42, 0.85)'};
              color: ${isSelected ? '#0F172A' : '#FFFFFF'};
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.04em;
              padding: 2px 7px;
              border-radius: 6px;
              border: 1px solid ${isSelected ? '#00F0FF' : 'rgba(255, 255, 255, 0.4)'};
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              white-space: nowrap;
            ">
              ${labelText}
            </span>
            <span style="
              font-size: 9px;
              color: #E2E8F0;
              font-weight: 600;
              text-shadow: 0 1px 3px rgba(0,0,0,0.9);
              margin-top: 1px;
            ">
              ${plot.areaFormatted || '150 m²'}
            </span>
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker(geo.center, { icon: labelIcon, interactive: false });
      markersGroupRef.current.addLayer(marker);
    });
  }, [plots, selectedPlot, activeLayers, onSelectPlot]);

  // Sync Map Focus when selectedPlot changes externally
  useEffect(() => {
    if (!selectedPlot || !mapInstanceRef.current) return;
    const geo = GEO_PLOTS_COORDINATES[selectedPlot.code];
    if (geo) {
      mapInstanceRef.current.flyTo(geo.center, 18, { duration: 0.6 });
    }
  }, [selectedPlot]);

  // Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetCenter = () => mapInstanceRef.current?.flyTo(GEO_FARM_CENTER, 17, { duration: 0.6 });

  const handleSearchPlot = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const found = plots.find((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    if (found && onSelectPlot) {
      onSelectPlot(found);
      const geo = GEO_PLOTS_COORDINATES[found.code];
      if (geo && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(geo.center, 18, { duration: 0.6 });
      }
    }
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-stone-800 shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none h-screen bg-stone-950'
          : 'h-[540px] sm:h-[580px] bg-stone-950'
      }`}
    >
      {/* 1. TOP HEADER TOOLBAR (Precision Agriculture WebGIS Theme) */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Location & Coordinates Info */}
        <div className="bg-stone-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-stone-700/60 shadow-lg flex items-center gap-2.5 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="leading-tight">
            <div className="text-[11px] font-heading font-black text-white flex items-center gap-1.5">
              <span>Trang Trại Công Nghệ Cao</span>
              <span className="text-stone-400 font-normal">·</span>
              <span className="text-emerald-400 font-mono text-[10px]">10°41'31.73"N, 106°21'24.37"E</span>
            </div>
            <div className="text-[10px] text-stone-400 font-medium">
              Vệ tinh thực địa · Zoom vô cực không vỡ nét
            </div>
          </div>
        </div>

        {/* Right: Search + Layers Toggle + Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Plot Search */}
          <form
            onSubmit={handleSearchPlot}
            className="hidden sm:flex items-center bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-700/60 px-2.5 py-1.5 shadow-lg text-xs"
          >
            <Search className="w-3.5 h-3.5 text-stone-400 mr-1.5" />
            <input
              type="text"
              placeholder="Tìm thửa (ví dụ P-07)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-stone-400 text-xs focus:outline-none w-36"
            />
          </form>

          {/* Layer Selector Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLayersOpen(!layersOpen)}
              className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                layersOpen
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/20'
                  : 'bg-stone-900/90 text-stone-200 border-stone-700/60 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden md:inline">Lớp bản đồ</span>
            </button>

            {/* Layers Dropdown Menu */}
            {layersOpen && (
              <div className="absolute right-0 top-11 w-56 bg-stone-900/95 backdrop-blur-xl border border-stone-700/80 rounded-2xl shadow-2xl p-3 z-[1100] text-xs space-y-2">
                <div className="font-heading font-black text-white text-[11px] pb-1 border-b border-stone-800 flex items-center justify-between">
                  <span>CÁC LỚP VIỄN THÁM</span>
                  <button onClick={() => setLayersOpen(false)} className="text-stone-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-800/60 cursor-pointer">
                  <span className="text-stone-200 flex items-center gap-1.5 font-medium">
                    <div className="w-3 h-3 border-2 border-white rounded-xs" /> Ranh giới thửa
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.boundary}
                    onChange={(e) => setActiveLayers({ ...activeLayers, boundary: e.target.checked })}
                    className="accent-emerald-500 w-3.5 h-3.5 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-800/60 cursor-pointer">
                  <span className="text-stone-200 flex items-center gap-1.5 font-medium">
                    <div className="w-3 h-3 bg-emerald-500 rounded-xs" /> Phổ thực vật (NDVI)
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.ndvi}
                    onChange={(e) => setActiveLayers({ ...activeLayers, ndvi: e.target.checked })}
                    className="accent-emerald-500 w-3.5 h-3.5 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-800/60 cursor-pointer">
                  <span className="text-stone-200 flex items-center gap-1.5 font-medium">
                    <div className="w-3 h-3 bg-cyan-500 rounded-xs" /> Thổ nhưỡng & Độ ẩm đất
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

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-stone-900/90 text-stone-200 hover:text-white border border-stone-700/60 backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. LEAFLET MAP VIEWPORT CONTAINER */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* 3. RIGHT TOOLBAR CONTROLS (Zoom, Reset Center, North Compass) */}
      <div className="absolute right-3 bottom-14 z-[1000] flex flex-col items-center gap-2 pointer-events-auto">
        <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-700/60 shadow-lg flex flex-col p-1 gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-200 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-full h-[1px] bg-stone-800" />
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
          onClick={handleResetCenter}
          className="w-9 h-9 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-700/60 shadow-lg flex items-center justify-center text-stone-200 hover:text-emerald-400 hover:bg-stone-800 transition-all cursor-pointer"
          title="Định vị tâm trang trại"
        >
          <LocateFixed className="w-4 h-4" />
        </button>

        <div
          className="w-9 h-9 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-700/60 shadow-lg flex items-center justify-center text-stone-300"
          title="Hướng Bắc (North)"
        >
          <Compass className="w-4 h-4 text-emerald-400 rotate-45" />
        </div>
      </div>

      {/* 4. BOTTOM-LEFT LEGEND BAR */}
      <div className="absolute left-3 bottom-3 z-[1000] bg-stone-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-stone-700/60 shadow-lg flex items-center gap-3 text-[11px] font-medium text-stone-300 pointer-events-auto">
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span>Khả dụng</span>
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span>Đang canh tác</span>
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm shadow-slate-400/50" />
          <span>Nghỉ đất bảo trì</span>
        </span>
        <span className="hidden sm:flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/50" />
          <span>Đang chọn</span>
        </span>
      </div>

      {/* 5. FLOATING ACTIVE PLOT POPOVER CARD (Anchored on Selection matching reference UI) */}
      {selectedPlot && (
        <div className="absolute top-16 left-3 sm:left-4 z-[1000] max-w-xs w-80 bg-stone-950/95 backdrop-blur-xl border border-cyan-400/60 rounded-3xl p-4 shadow-2xl text-white pointer-events-auto animate-fadeIn">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base text-cyan-300">
                  {GEO_PLOTS_COORDINATES[selectedPlot.code]?.label || selectedPlot.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                  {selectedPlot.status === 'AVAILABLE' ? 'Sẵn sàng thuê' : selectedPlot.status === 'RENTED' ? 'Đang canh tác' : 'Bảo trì'}
                </span>
              </div>
              <h4 className="text-xs text-stone-300 mt-0.5 font-medium line-clamp-1">{selectedPlot.name}</h4>
            </div>
            <button
              onClick={() => onSelectPlot && onSelectPlot(null)}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Telemetry & Specifications Grid */}
          <div className="grid grid-cols-2 gap-2 my-3 text-[11px]">
            <div className="bg-stone-900/80 rounded-xl p-2 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">Diện tích</span>
              <span className="font-bold text-white text-sm">{selectedPlot.areaFormatted || '150 m²'}</span>
            </div>
            <div className="bg-stone-900/80 rounded-xl p-2 border border-stone-800">
              <span className="text-stone-400 block text-[10px] flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" /> Độ ẩm đất IoT
              </span>
              <span className="font-bold text-emerald-400 text-sm">65% · Tối ưu</span>
            </div>
            <div className="bg-stone-900/80 rounded-xl p-2 border border-stone-800">
              <span className="text-stone-400 block text-[10px]">Thổ nhưỡng</span>
              <span className="font-semibold text-stone-200">Phù sa cổ (pH 6.5)</span>
            </div>
            <div className="bg-stone-900/80 rounded-xl p-2 border border-stone-800">
              <span className="text-stone-400 block text-[10px] flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-400" /> Cây trồng
              </span>
              <span className="font-semibold text-stone-200">{selectedPlot.crop || 'VietGAP'}</span>
            </div>
          </div>

          {/* Pricing & Call to Action */}
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 block">Giá thuê trọn gói</span>
              <span className="text-xs font-black text-amber-400">
                {selectedPlot.rentalPriceFormatted || '1.500.000 đ/tháng'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('plot-booking-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-stone-950 font-heading font-black text-xs hover:brightness-110 shadow-lg shadow-cyan-500/20 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem Chi Tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
