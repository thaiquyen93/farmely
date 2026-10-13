import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Check, Crosshair, Eraser, Focus, Hand, Info, LocateFixed, MousePointerClick, PenLine, Undo2, X
} from 'lucide-react';
import {
  cleanRing, formatArea, formatLength, interiorPoint, parseLatLng, perimeterM, ringBounds, validateRing
} from '../../utils/polygonGeometry';

/**
 * Bản đồ vệ tinh cho Admin KHOANH VÙNG một đa giác (ranh giới nông trại hoặc thửa đất).
 *
 *  - Vẽ: bấm từng điểm trên bản đồ; bấm lại điểm đầu, nhấp đúp hoặc Enter để khép vùng.
 *  - Sửa: kéo đỉnh trắng; bấm dấu "+" giữa cạnh để chèn đỉnh; chuột phải vào đỉnh để xoá.
 *  - Hút điểm (snap): con trỏ tự dính vào đỉnh của ranh giới nông trại / thửa bên cạnh
 *    trong bán kính 14px, để các thửa liền kề khít bờ nhau tuyệt đối.
 *  - Kiểm tra trực tiếp: tự cắt, lòi ra ngoài nông trại, đè lên thửa khác (cùng quy tắc với backend).
 *
 * @param {object} props
 * @param {Array<[number, number]>} props.value  ring mở [lng, lat] — [] nếu chưa vẽ
 * @param {(ring: Array<[number, number]>) => void} props.onChange
 * @param {{ ring: Array, label: string }|null} props.outer  vùng chứa (vd ranh giới nông trại khi vẽ thửa)
 * @param {Array<{ ring: Array, label: string }>} props.others  vùng không được đè lên (thửa khác)
 * @param {Array<{ ring: Array, label: string }>} props.mustContain vùng phải nằm trong (thửa cũ khi vẽ lại nông trại)
 * @param {'land'|'plot'} props.kind
 */

const SNAP_PX = 14;
const DEFAULT_CENTER = [106.6602, 10.7626]; // TP.HCM
const COLORS = {
  ok: '#22c55e',
  bad: '#f43f5e',
  draft: '#facc15',
  outer: '#f59e0b',
  other: '#e2e8f0'
};

const emptyFC = { type: 'FeatureCollection', features: [] };
const polygonFeature = (ring, props = {}) => ({
  type: 'Feature',
  properties: props,
  geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] }
});
const lineFeature = (coords, props = {}) => ({ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: coords } });

function vertexElement(index, editable) {
  const el = document.createElement('div');
  el.className = editable ? 'boundary-vertex boundary-vertex--edit' : 'boundary-vertex';
  el.setAttribute('aria-label', `Đỉnh ${index + 1}`);
  el.title = editable ? 'Kéo để di chuyển · chuột phải để xoá đỉnh' : `Đỉnh ${index + 1}`;
  if (index === 0) el.dataset.first = 'true';
  return el;
}

function midpointElement() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'boundary-mid';
  el.title = 'Bấm để thêm đỉnh vào giữa cạnh này';
  el.setAttribute('aria-label', 'Thêm đỉnh');
  el.textContent = '+';
  return el;
}

function labelElement(text, tone) {
  const el = document.createElement('div');
  el.className = `boundary-label boundary-label--${tone}`;
  el.textContent = text;
  return el;
}

export default function BoundaryDrawMap({
  value = [],
  onChange,
  outer = null,
  others = [],
  mustContain = [],
  kind = 'plot',
  height = 460,
  pin = null, // [lng, lat] — ghim vị trí GPS do Admin nhập
  focusKey = null, // đổi giá trị này để bản đồ bay tới vùng hiện tại (vd khi tự sinh ranh giới)
  hideCoordSearch = false
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const labelMarkersRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  const ring = useMemo(() => cleanRing(value), [value]);
  const [mode, setMode] = useState(ring.length >= 3 ? 'edit' : 'idle'); // idle | draw | edit
  const [draft, setDraft] = useState([]); // điểm đang vẽ
  const [cursor, setCursor] = useState(null);
  const [snapped, setSnapped] = useState(false);
  const [coordText, setCoordText] = useState('');
  const [coordError, setCoordError] = useState('');

  // ref cho handler của maplibre (tránh closure cũ)
  const st = useRef({});
  st.current = { mode, draft, ring, onChange, outer, others };

  const outerRing = useMemo(() => cleanRing(outer?.ring || []), [outer]);
  const otherRings = useMemo(() => others.map((o) => ({ ...o, ring: cleanRing(o.ring || []) })).filter((o) => o.ring.length >= 3), [others]);

  const shapeName = kind === 'land' ? 'nông trại' : 'thửa đất';
  const activeRing = mode === 'draw' ? draft : ring;
  const validation = useMemo(
    () => (activeRing.length >= 3
      ? validateRing(activeRing, { outer: outerRing.length >= 3 ? outerRing : null, outerName: outer?.label || 'nông trại', others: otherRings, mustContain })
      : null),
    [activeRing, outerRing, otherRings, outer?.label, mustContain]
  );

  /** Các điểm có thể hút vào: đỉnh nông trại + đỉnh các thửa khác + điểm đầu khi đang vẽ */
  const snapTarget = useCallback((lngLat) => {
    const map = mapRef.current;
    const { mode: m, draft: d, outer: o, others: os } = st.current;
    const p = map.project(lngLat);
    const candidates = [
      ...cleanRing(o?.ring || []),
      ...(os || []).flatMap((x) => cleanRing(x.ring || []))
    ];
    let best = null;
    let bestD = SNAP_PX;
    if (m === 'draw' && d.length >= 3) {
      const q = map.project(d[0]);
      const dist = Math.hypot(q.x - p.x, q.y - p.y);
      if (dist < SNAP_PX) return { point: d[0], closes: true };
    }
    for (const c of candidates) {
      const q = map.project(c);
      const dist = Math.hypot(q.x - p.x, q.y - p.y);
      if (dist < bestD) {
        bestD = dist;
        best = c;
      }
    }
    return best ? { point: [best[0], best[1]], closes: false } : null;
  }, []);

  // ── Khởi tạo bản đồ ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return undefined;
    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            sat: { type: 'raster', tileSize: 256, maxzoom: 19, attribution: 'Ảnh vệ tinh © Esri', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'] },
            ref: { type: 'raster', tileSize: 256, maxzoom: 19, tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'] }
          },
          layers: [
            { id: 'sat', type: 'raster', source: 'sat' },
            { id: 'ref', type: 'raster', source: 'ref', paint: { 'raster-opacity': 0.85 } }
          ]
        },
        center: DEFAULT_CENTER,
        zoom: 11,
        maxZoom: 20,
        attributionControl: { compact: true }
      });
    } catch (e) {
      setLoadError('Trình duyệt không hỗ trợ WebGL nên không mở được bản đồ.');
      return undefined;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.addSource('ctx-outer', { type: 'geojson', data: emptyFC });
      map.addSource('ctx-others', { type: 'geojson', data: emptyFC });
      map.addSource('shape', { type: 'geojson', data: emptyFC });
      map.addSource('draft', { type: 'geojson', data: emptyFC });

      map.addLayer({ id: 'ctx-outer-fill', type: 'fill', source: 'ctx-outer', paint: { 'fill-color': COLORS.outer, 'fill-opacity': 0.06 } });
      map.addLayer({ id: 'ctx-outer-line', type: 'line', source: 'ctx-outer', paint: { 'line-color': COLORS.outer, 'line-width': 2.5, 'line-dasharray': [3, 2] } });
      map.addLayer({ id: 'ctx-others-fill', type: 'fill', source: 'ctx-others', paint: { 'fill-color': '#0f172a', 'fill-opacity': 0.35 } });
      map.addLayer({ id: 'ctx-others-line', type: 'line', source: 'ctx-others', paint: { 'line-color': COLORS.other, 'line-width': 1.5, 'line-opacity': 0.9 } });
      map.addLayer({ id: 'shape-fill', type: 'fill', source: 'shape', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.28 } });
      map.addLayer({ id: 'shape-glow', type: 'line', source: 'shape', paint: { 'line-color': ['get', 'color'], 'line-width': 9, 'line-opacity': 0.35, 'line-blur': 4 } });
      map.addLayer({ id: 'shape-line', type: 'line', source: 'shape', paint: { 'line-color': ['get', 'color'], 'line-width': 2.5 } });
      map.addLayer({ id: 'draft-line', type: 'line', source: 'draft', paint: { 'line-color': COLORS.draft, 'line-width': 2.5 } });
      map.addLayer({ id: 'draft-rubber', type: 'line', source: 'draft', filter: ['==', ['get', 'rubber'], true], paint: { 'line-color': COLORS.draft, 'line-width': 2, 'line-dasharray': [2, 2] } });
      setReady(true);
    });

    map.on('error', (e) => {
      // lỗi tải 1 tile không làm hỏng việc vẽ — chỉ ghi log
      if (e?.error) console.warn('[BoundaryDrawMap]', e.error.message || e.error);
    });

    map.on('mousemove', (e) => {
      if (st.current.mode !== 'draw') return;
      const s = snapTarget(e.lngLat);
      setCursor(s ? s.point : [e.lngLat.lng, e.lngLat.lat]);
      setSnapped(Boolean(s));
    });

    map.on('click', (e) => {
      if (st.current.mode !== 'draw') return;
      const s = snapTarget(e.lngLat);
      if (s?.closes) {
        finishRef.current();
        return;
      }
      const pt = s ? s.point : [e.lngLat.lng, e.lngLat.lat];
      setDraft((d) => cleanRing([...d, pt]));
    });

    map.on('dblclick', (e) => {
      if (st.current.mode !== 'draw') return;
      e.preventDefault();
      finishRef.current();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      labelMarkersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [snapTarget]);

  // ── Hoàn tất / huỷ vẽ ───────────────────────────────────────────────────
  const finish = useCallback(() => {
    const d = cleanRing(st.current.draft);
    if (d.length < 3) return;
    st.current.onChange?.(d);
    setDraft([]);
    setCursor(null);
    setMode('edit');
  }, []);
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const startDraw = () => {
    setDraft([]);
    setCursor(null);
    setMode('draw');
  };
  const cancelDraw = () => {
    setDraft([]);
    setCursor(null);
    setMode(ring.length >= 3 ? 'edit' : 'idle');
  };
  const undo = () => setDraft((d) => d.slice(0, -1));
  const clearShape = () => {
    onChange?.([]);
    setMode('idle');
  };

  const fitTo = useCallback((r, animate = true) => {
    const map = mapRef.current;
    if (!map || !r || r.length < 3) return false;
    map.fitBounds(ringBounds(r), { padding: 60, maxZoom: 19, duration: animate ? 700 : 0 });
    return true;
  }, []);

  // Phím tắt khi đang vẽ
  useEffect(() => {
    if (mode !== 'draw') return undefined;
    const map = mapRef.current;
    map?.doubleClickZoom.disable();
    if (map) map.getCanvas().style.cursor = 'crosshair';
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'Enter') { e.preventDefault(); finishRef.current(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancelDraw(); }
      else if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      map?.doubleClickZoom.enable();
      if (map) map.getCanvas().style.cursor = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Lần đầu sẵn sàng: căn khung theo vùng đã có / nông trại / thửa lân cận
  const didFitRef = useRef(false);
  useEffect(() => {
    if (!ready || didFitRef.current) return;
    if (fitTo(ring, false) || fitTo(outerRing, false)) {
      didFitRef.current = true;
    } else if (otherRings.length) {
      fitTo(otherRings.flatMap((o) => o.ring), false);
      didFitRef.current = true;
    }
  }, [ready, ring, outerRing, otherRings, fitTo]);

  // Bay tới vùng mỗi khi focusKey đổi (ranh giới vừa được tự sinh từ GPS)
  useEffect(() => {
    if (!ready || focusKey == null) return;
    if (!fitTo(ring) && pin) mapRef.current?.flyTo({ center: pin, zoom: 17, duration: 700 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, focusKey]);

  // Ghim GPS
  const pinRef = useRef(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return undefined;
    pinRef.current?.remove();
    pinRef.current = null;
    if (pin) {
      // Phần tử marker để trống cho MapLibre định vị; hình ghim nằm ở phần tử con
      const el = document.createElement('div');
      el.className = 'boundary-pin-anchor';
      el.title = `Toạ độ GPS: ${pin[1].toFixed(6)}, ${pin[0].toFixed(6)}`;
      const shape = document.createElement('div');
      shape.className = 'boundary-pin';
      el.appendChild(shape);
      pinRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(pin).addTo(map);
    }
    return () => { pinRef.current?.remove(); pinRef.current = null; };
  }, [ready, pin?.[0], pin?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Vẽ lớp ngữ cảnh (nông trại + thửa khác) ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.getSource('ctx-outer').setData(outerRing.length >= 3 ? polygonFeature(outerRing) : emptyFC);
    map.getSource('ctx-others').setData({ type: 'FeatureCollection', features: otherRings.map((o) => polygonFeature(o.ring, { label: o.label })) });

    labelMarkersRef.current.forEach((m) => m.remove());
    labelMarkersRef.current = otherRings.map((o) =>
      new maplibregl.Marker({ element: labelElement(o.label, 'other'), anchor: 'center' }).setLngLat(interiorPoint(o.ring)).addTo(map)
    );
    if (outerRing.length >= 3 && outer?.label) {
      const top = outerRing.reduce((a, b) => (b[1] > a[1] ? b : a));
      labelMarkersRef.current.push(
        new maplibregl.Marker({ element: labelElement(outer.label, 'outer'), anchor: 'bottom', offset: [0, -6] }).setLngLat(top).addTo(map)
      );
    }
  }, [ready, outerRing, otherRings, outer?.label]);

  // ── Vẽ vùng hiện tại + đỉnh/điểm giữa ───────────────────────────────────
  const valid = validation?.ok !== false;
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const color = mode === 'draw' ? COLORS.draft : valid ? COLORS.ok : COLORS.bad;

    if (mode === 'draw') {
      map.getSource('shape').setData(draft.length >= 3 ? polygonFeature(draft, { color }) : emptyFC);
      const feats = [];
      if (draft.length >= 2) feats.push(lineFeature(draft));
      if (draft.length >= 1 && cursor) feats.push(lineFeature([draft[draft.length - 1], cursor], { rubber: true }));
      map.getSource('draft').setData({ type: 'FeatureCollection', features: feats });
    } else {
      map.getSource('draft').setData(emptyFC);
      map.getSource('shape').setData(ring.length >= 3 ? polygonFeature(ring, { color }) : emptyFC);
    }
  }, [ready, mode, draft, cursor, ring, valid]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return undefined;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (mode === 'draw') {
      markersRef.current = draft.map((p, i) => {
        const el = vertexElement(i, false);
        if (i === 0 && draft.length >= 3) {
          el.classList.add('boundary-vertex--close');
          el.title = 'Bấm vào đây để khép vùng';
          el.addEventListener('click', (ev) => { ev.stopPropagation(); finishRef.current(); });
        }
        return new maplibregl.Marker({ element: el }).setLngLat(p).addTo(map);
      });
      return undefined;
    }
    if (mode !== 'edit' || ring.length < 3) return undefined;

    // đỉnh kéo được
    ring.forEach((p, i) => {
      const el = vertexElement(i, true);
      const marker = new maplibregl.Marker({ element: el, draggable: true }).setLngLat(p).addTo(map);
      marker.on('drag', () => {
        const ll = marker.getLngLat();
        const next = ring.map((q, j) => (j === i ? [ll.lng, ll.lat] : q));
        map.getSource('shape').setData(polygonFeature(next, { color: COLORS.draft }));
      });
      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        const s = snapTarget(ll);
        const pt = s ? s.point : [ll.lng, ll.lat];
        onChange?.(cleanRing(ring.map((q, j) => (j === i ? pt : q))));
      });
      el.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        if (ring.length <= 3) return;
        onChange?.(ring.filter((_, j) => j !== i));
      });
      markersRef.current.push(marker);
    });

    // điểm giữa cạnh: bấm để chèn đỉnh
    ring.forEach((p, i) => {
      const q = ring[(i + 1) % ring.length];
      const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const el = midpointElement();
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const next = [...ring.slice(0, i + 1), mid, ...ring.slice(i + 1)];
        onChange?.(next);
      });
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat(mid).addTo(map));
    });
    return undefined;
  }, [ready, mode, draft, ring, onChange, snapTarget]);

  // Đồng bộ mode khi value bị đổi từ bên ngoài (tải dữ liệu chỉnh sửa)
  useEffect(() => {
    if (mode === 'draw') return;
    setMode(ring.length >= 3 ? 'edit' : 'idle');
    if (ring.length >= 3 && !didFitRef.current && ready) {
      didFitRef.current = fitTo(ring, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ring.length >= 3]);

  const goToCoords = (e) => {
    e?.preventDefault?.();
    const ll = parseLatLng(coordText);
    if (!ll) {
      setCoordError('Nhập dạng "vĩ độ, kinh độ", ví dụ 10.6876, 106.3502');
      return;
    }
    setCoordError('');
    mapRef.current?.flyTo({ center: ll, zoom: 17, duration: 900 });
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 17 }),
      () => setCoordError('Không lấy được vị trí hiện tại của thiết bị.')
    );
  };

  const metrics = activeRing.length >= 3
    ? { area: formatArea(validation?.areaM2 ?? 0), perimeter: formatLength(perimeterM(activeRing, true)) }
    : { area: '—', perimeter: activeRing.length >= 2 ? formatLength(perimeterM(activeRing, false)) : '—' };

  const hint = {
    idle: `Chưa có ranh giới. Bấm "Vẽ ranh giới" rồi chấm từng góc ${shapeName} trên ảnh vệ tinh.`,
    draw: draft.length < 3
      ? `Bấm lên bản đồ để đặt góc thứ ${draft.length + 1}. Cần ít nhất 3 góc.`
      : 'Bấm lại điểm đầu (vòng vàng), nhấp đúp hoặc nhấn Enter để khép vùng.',
    edit: 'Kéo chấm trắng để chỉnh góc · bấm dấu + để thêm góc · chuột phải vào góc để xoá.'
  }[mode];

  const btn = 'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-[#0f2a20] shadow-sm">
      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0f2a20] px-3 py-2.5">
        {mode !== 'draw' ? (
          <>
            <button type="button" onClick={startDraw} className={`${btn} bg-lime-300 text-[#17372c] hover:bg-lime-200`}>
              <PenLine className="h-4 w-4" />{ring.length >= 3 ? 'Vẽ lại từ đầu' : 'Vẽ ranh giới'}
            </button>
            {ring.length >= 3 && (
              <>
                <button type="button" onClick={() => fitTo(ring)} className={`${btn} bg-white/10 text-white hover:bg-white/20`}>
                  <Focus className="h-4 w-4" />Căn vào vùng
                </button>
                <button type="button" onClick={clearShape} className={`${btn} bg-white/10 text-rose-200 hover:bg-rose-500/30`}>
                  <Eraser className="h-4 w-4" />Xoá ranh giới
                </button>
              </>
            )}
            {outerRing.length >= 3 && (
              <button type="button" onClick={() => fitTo(outerRing)} className={`${btn} bg-white/10 text-amber-200 hover:bg-white/20`}>
                <Focus className="h-4 w-4" />Xem cả nông trại
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={finish} disabled={draft.length < 3} className={`${btn} bg-lime-300 text-[#17372c] hover:bg-lime-200`}>
              <Check className="h-4 w-4" />Hoàn tất ({draft.length} góc)
            </button>
            <button type="button" onClick={undo} disabled={!draft.length} className={`${btn} bg-white/10 text-white hover:bg-white/20`}>
              <Undo2 className="h-4 w-4" />Hoàn tác
            </button>
            <button type="button" onClick={cancelDraw} className={`${btn} bg-white/10 text-white hover:bg-white/20`}>
              <X className="h-4 w-4" />Huỷ
            </button>
          </>
        )}

        <div className={`ml-auto min-w-[240px] flex-1 items-center gap-1.5 sm:max-w-sm ${hideCoordSearch ? 'hidden' : 'flex'}`} role="search">
          <label className="sr-only" htmlFor={`coord-${kind}`}>Đi tới toạ độ</label>
          <input
            id={`coord-${kind}`}
            value={coordText}
            onChange={(e) => setCoordText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') goToCoords(e); }}
            placeholder="Đi tới toạ độ: 10.6876, 106.3502"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-white/50 focus:border-lime-300 focus:outline-none"
          />
          <button type="button" onClick={goToCoords} className={`${btn} bg-white/10 text-white hover:bg-white/20`} title="Đi tới">
            <Crosshair className="h-4 w-4" />
          </button>
          <button type="button" onClick={locateMe} className={`${btn} bg-white/10 text-white hover:bg-white/20`} title="Vị trí của tôi">
            <LocateFixed className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bản đồ */}
      <div className="relative" style={{ height }}>
        <div ref={containerRef} className="absolute inset-0" />
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/80 p-6 text-center text-sm text-white">{loadError}</div>
        )}

        {/* Gợi ý thao tác */}
        <div className="pointer-events-none absolute left-3 top-3 flex max-w-[min(420px,calc(100%-90px))] items-start gap-2 rounded-xl bg-[#0f2a20]/85 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
          {mode === 'draw' ? <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" /> : mode === 'edit' ? <Hand className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />}
          <span>{hint}{mode === 'draw' && snapped && <strong className="ml-1 text-lime-300">· Đã hút vào góc có sẵn</strong>}</span>
        </div>

        {/* Chú giải */}
        {(outerRing.length >= 3 || otherRings.length > 0) && (
          <div className="pointer-events-none absolute bottom-10 left-3 space-y-1 rounded-xl bg-[#0f2a20]/85 px-3 py-2 text-[11px] text-white/90 backdrop-blur">
            {outerRing.length >= 3 && <p className="flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dashed border-amber-400" />Ranh giới {outer?.label || 'nông trại'}</p>}
            {otherRings.length > 0 && <p className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm border border-slate-200 bg-slate-900/60" />Thửa đã có ({otherRings.length})</p>}
            <p className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm border-2 border-green-500 bg-green-500/30" />{shapeName === 'thửa đất' ? 'Thửa đang vẽ' : 'Nông trại đang vẽ'}</p>
          </div>
        )}
      </div>

      {/* Số đo + kiểm tra */}
      <div className="grid gap-3 bg-white p-4 sm:grid-cols-[auto_auto_auto_1fr] sm:items-center">
        <div><p className="text-[11px] text-stone-500">Diện tích</p><p className="text-lg font-bold text-[#18352b]">{metrics.area}</p></div>
        <div><p className="text-[11px] text-stone-500">Chu vi</p><p className="text-lg font-bold text-[#18352b]">{metrics.perimeter}</p></div>
        <div><p className="text-[11px] text-stone-500">Số góc</p><p className="text-lg font-bold text-[#18352b]">{activeRing.length || '—'}</p></div>
        <div className="sm:pl-2" aria-live="polite">
          {coordError && <p className="text-xs font-medium text-rose-600">{coordError}</p>}
          {validation && !validation.ok && validation.errors.map((err) => (
            <p key={err} className="flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"><X className="mt-0.5 h-3.5 w-3.5 shrink-0" />{err}</p>
          ))}
          {validation?.ok && mode === 'edit' && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"><Check className="h-4 w-4" />Ranh giới hợp lệ{outerRing.length >= 3 ? `, nằm trong ${outer?.label || 'nông trại'}` : ''}{otherRings.length ? ', không đè lên thửa nào' : ''}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
