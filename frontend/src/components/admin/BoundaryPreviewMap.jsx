import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cleanRing, interiorPoint, ringBounds } from '../../utils/polygonGeometry';

/**
 * Bản đồ CHỈ XEM: ranh giới nông trại + các thửa tô màu theo trạng thái.
 * Bấm vào thửa -> onSelect(plotId).
 */
const STATUS_COLOR = { AVAIL: '#22c55e', RENT: '#f59e0b', MAINT: '#94a3b8' };
const empty = { type: 'FeatureCollection', features: [] };
const poly = (ring, props) => ({ type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] } });

export default function BoundaryPreviewMap({
  land, plots = [], highlightId = null, onSelect, height = 380,
  emptyText = 'Nông trại chưa có toạ độ ranh giới. Bấm "Chỉnh sửa thông tin" để nhập GPS các góc.'
}) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const labelsRef = useRef([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let map;
    try {
      map = new maplibregl.Map({
        container: ref.current,
        style: {
          version: 8,
          sources: { sat: { type: 'raster', tileSize: 256, maxzoom: 19, attribution: 'Ảnh vệ tinh © Esri', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'] } },
          layers: [{ id: 'sat', type: 'raster', source: 'sat' }]
        },
        center: [106.6602, 10.7626],
        zoom: 11,
        attributionControl: { compact: true }
      });
    } catch {
      return undefined;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => {
      map.addSource('land', { type: 'geojson', data: empty });
      map.addSource('plots', { type: 'geojson', data: empty });
      map.addLayer({ id: 'land-fill', type: 'fill', source: 'land', paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.06 } });
      map.addLayer({ id: 'land-line', type: 'line', source: 'land', paint: { 'line-color': '#f59e0b', 'line-width': 2.5, 'line-dasharray': [3, 2] } });
      map.addLayer({ id: 'plots-fill', type: 'fill', source: 'plots', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['case', ['get', 'hl'], 0.6, 0.32] } });
      map.addLayer({ id: 'plots-line', type: 'line', source: 'plots', paint: { 'line-color': ['case', ['get', 'hl'], '#ffffff', ['get', 'color']], 'line-width': ['case', ['get', 'hl'], 3.5, 1.8] } });
      map.on('click', 'plots-fill', (e) => onSelectRef.current?.(e.features?.[0]?.properties?.id));
      map.on('mouseenter', 'plots-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'plots-fill', () => { map.getCanvas().style.cursor = ''; });
      setReady(true);
    });
    return () => { labelsRef.current.forEach((m) => m.remove()); map.remove(); };
  }, []);

  const landRing = cleanRing(land?.boundary || []);
  const plotRings = plots.map((p) => ({ ...p, ring: cleanRing(p.boundary || []) })).filter((p) => p.ring.length >= 3);
  const key = JSON.stringify([landRing, plotRings.map((p) => [p.plotId, p.status, p.ring]), highlightId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.getSource('land').setData(landRing.length >= 3 ? poly(landRing, {}) : empty);
    map.getSource('plots').setData({
      type: 'FeatureCollection',
      features: plotRings.map((p) => poly(p.ring, { id: p.plotId, color: STATUS_COLOR[p.status] || '#22c55e', hl: String(p.plotId) === String(highlightId) }))
    });
    labelsRef.current.forEach((m) => m.remove());
    labelsRef.current = plotRings.map((p) => {
      const el = document.createElement('div');
      el.className = 'boundary-label boundary-label--other';
      el.textContent = p.plotCode;
      return new maplibregl.Marker({ element: el }).setLngLat(interiorPoint(p.ring)).addTo(map);
    });
    const all = landRing.length >= 3 ? landRing : plotRings.flatMap((p) => p.ring);
    if (all.length >= 3) map.fitBounds(ringBounds(all), { padding: 40, maxZoom: 19, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key]);

  const nothing = landRing.length < 3 && plotRings.length === 0;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-border" style={{ height }}>
      <div ref={ref} className="absolute inset-0" />
      {nothing && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f2a20]/70 p-6 text-center text-sm text-white">
          {emptyText}
        </div>
      )}
      {!nothing && (
        <div className="pointer-events-none absolute left-3 top-3 space-y-1 rounded-xl bg-[#0f2a20]/85 px-3 py-2 text-[11px] text-white backdrop-blur">
          <p className="flex items-center gap-2"><span className="h-3 w-4 rounded-sm bg-green-500/70" />Đang trống</p>
          <p className="flex items-center gap-2"><span className="h-3 w-4 rounded-sm bg-amber-500/70" />Đã thuê</p>
          <p className="flex items-center gap-2"><span className="h-3 w-4 rounded-sm bg-slate-400/70" />Bảo trì</p>
        </div>
      )}
    </div>
  );
}
