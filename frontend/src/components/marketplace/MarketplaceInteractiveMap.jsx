import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FARMS_GEOJSON_DATA } from '../../data/marketplaceGisData';
import { registerFarmLayers, setSelectedPlotFilters } from './map/mapLayers';
import { createPlotBadge } from './map/PlotBadge';
import MarketplaceIntroVeil from './MarketplaceIntroVeil';
import useMapIntroAnimation, { STAGGER_STEP_MS } from '../../hooks/useMapIntroAnimation';
import usePlotSpotlight from '../../hooks/usePlotSpotlight';
import {
  CAMERA,
  LAYER_IDS,
  MOBILE_PITCH,
  RISE_SETTLE_HEIGHT,
  getStatusConfig,
} from '../../utils/mapTheme';
import { getCentroid } from '../../utils/geoUtils';

/** Quá hạn chờ sự kiện 'load' của bản đồ -> hạ cấp về trạng thái an vị */
const MAP_LOAD_WATCHDOG_MS = 6000;

/** Dưới breakpoint lg thì hạ pitch và bỏ pha nhô lên để đỡ GPU */
function isCompactViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
}

/** Tính toán bounding box và tâm hình học động từ ranh giới nông trại & các thửa đất */
function getBoundsAndCenter(plotsData, farmBoundary) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let count = 0;

  if (Array.isArray(farmBoundary) && farmBoundary.length >= 3) {
    farmBoundary.forEach(([lng, lat]) => {
      const nLng = Number(lng);
      const nLat = Number(lat);
      if (Number.isFinite(nLng) && Number.isFinite(nLat)) {
        minLng = Math.min(minLng, nLng);
        maxLng = Math.max(maxLng, nLng);
        minLat = Math.min(minLat, nLat);
        maxLat = Math.max(maxLat, nLat);
        count++;
      }
    });
  }

  (plotsData?.features || []).forEach((f) => {
    const coords = f.geometry?.coordinates?.[0];
    if (Array.isArray(coords)) {
      coords.forEach(([lng, lat]) => {
        const nLng = Number(lng);
        const nLat = Number(lat);
        if (Number.isFinite(nLng) && Number.isFinite(nLat)) {
          minLng = Math.min(minLng, nLng);
          maxLng = Math.max(maxLng, nLng);
          minLat = Math.min(minLat, nLat);
          maxLat = Math.max(maxLat, nLat);
          count++;
        }
      });
    }
  });

  if (count === 0) {
    return {
      bounds: null,
      center: [106.345, 10.689], // Tọa độ đất nông trại Farmely
      zoom: 15.5
    };
  }

  return {
    bounds: [
      [minLng, minLat],
      [maxLng, maxLat]
    ],
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    zoom: 15.5
  };
}

export default function MarketplaceInteractiveMap({
  plotsData = FARMS_GEOJSON_DATA,
  farmBoundary = null,
  farmName = '',
  selectedPlot = null,
  onSelectPlot,
  onResetView,
  onPhaseChange,
  detailPanelOpen = false
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const badgesRef = useRef(new Map());
  const badgeMarkersRef = useRef([]);
  const workingDataRef = useRef(null);
  const prevSelectedIdRef = useRef(null);
  const introSkippedRef = useRef(false);
  // Dữ liệu thửa mới nhất (live từ Database tới SAU khi map đã load)
  const plotsDataRef = useRef(plotsData);
  const farmBoundaryRef = useRef(farmBoundary);
  const builtFromDataRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [workingData, setWorkingData] = useState(null);
  const [compact] = useState(() => isCompactViewport());
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const initialSelectedIdRef = useRef(selectedPlot?.id || plotsData?.features?.[0]?.properties?.id || '');

  // Giữ callback chọn thửa trong ref để handler của map luôn gọi bản mới nhất
  const onSelectPlotRef = useRef(onSelectPlot);
  useEffect(() => {
    onSelectPlotRef.current = onSelectPlot;
  }, [onSelectPlot]);

  const settledPitch = compact ? MOBILE_PITCH : CAMERA.settled.pitch;
  const focusedPitch = compact ? MOBILE_PITCH : CAMERA.focused.pitch;

  const boundsInfo = useMemo(() => getBoundsAndCenter(plotsData, farmBoundary), [plotsData, farmBoundary]);
  const boundsInfoRef = useRef(boundsInfo);
  useEffect(() => {
    boundsInfoRef.current = boundsInfo;
  }, [boundsInfo]);

  /** Dựng (lại) toàn bộ badge — chỉ cắm pin cho các thửa có toạ độ hợp lệ */
  function buildBadges(map, data, selectedId, staggerMs) {
    badgesRef.current.forEach((b) => b.destroy());
    badgesRef.current.clear();
    badgeMarkersRef.current.forEach((m) => m.remove());
    badgeMarkersRef.current = [];

    (data?.features || []).forEach((f, index) => {
      const ring = f.geometry?.coordinates?.[0];
      if (!Array.isArray(ring) || ring.length < 3) return;

      const centroid = getCentroid(f);
      if (!centroid || (centroid[0] === 0 && centroid[1] === 0)) return;

      const badge = createPlotBadge({
        properties: f.properties,
        isSelected: selectedId === f.properties.id,
        enterDelayMs: index * staggerMs,
        onClick: (props) => onSelectPlotRef.current?.(props)
      });

      const marker = new maplibregl.Marker({ element: badge.element })
        .setLngLat(centroid)
        .addTo(map);

      badgeMarkersRef.current.push(marker);
      badgesRef.current.set(f.properties.id, badge);
    });
  }

  // Dữ liệu live (Database) về SAU khi map đã dựng: cập nhật màu thửa + badge + ranh giới
  useEffect(() => {
    plotsDataRef.current = plotsData;
    farmBoundaryRef.current = farmBoundary;
    const map = mapRef.current;
    if (!mapReady || !map) return;

    // Cập nhật lại các layer (bao gồm ranh giới nông trại dynamic)
    const { workingData: wd } = registerFarmLayers(map, plotsData, {
      farmBoundary,
      selectedId: selectedPlot?.id || ''
    });
    workingDataRef.current = wd;
    setWorkingData(wd);

    buildBadges(map, plotsData, selectedPlot?.id || '', 0);

    // Nếu có khung toạ độ mới và chưa có thửa nào được chọn, bay tới khung bao
    if (boundsInfo.bounds && !selectedPlot) {
      map.fitBounds(boundsInfo.bounds, {
        padding: CAMERA.padding,
        bearing: CAMERA.settled.bearing,
        pitch: settledPitch,
        duration: 800
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotsData, farmBoundary, mapReady]);

  // ── Khởi tạo bản đồ vệ tinh ESRI tại toạ độ động của trang trại ─────────────
  useEffect(() => {
    if (!mapContainerRef.current) return undefined;

    const initialCenter = boundsInfo.center;
    const initialZoom = boundsInfo.bounds ? CAMERA.intro.zoom : boundsInfo.zoom;

    const mapOptions = {
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          [LAYER_IDS.satelliteSource]: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: LAYER_IDS.satellite,
            type: 'raster',
            source: LAYER_IDS.satelliteSource,
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: initialCenter,
      zoom: initialZoom,
      pitch: CAMERA.intro.pitch,
      bearing: CAMERA.intro.bearing
    };

    let map;
    try {
      map = new maplibregl.Map(mapOptions);
    } catch (err) {
      console.error('Không khởi tạo được bản đồ MapLibre:', err);
      setMapFailed(true);
      return undefined;
    }

    mapRef.current = map;
    const canvas = map.getCanvas?.();
    const handleContextLost = (event) => {
      event.preventDefault?.();
      console.error('WebGL context lost');
      setMapFailed(true);
    };
    canvas?.addEventListener?.('webglcontextlost', handleContextLost);

    const onContextLost = () => {
      console.error('WebGL context của bản đồ bị mất — chuyển trang về trạng thái tối giản.');
      setMapFailed(true);
    };
    const rawCanvas = typeof map.getCanvas === 'function' ? map.getCanvas() : null;
    const contextCanvas =
      rawCanvas && typeof rawCanvas.addEventListener === 'function' ? rawCanvas : null;
    contextCanvas?.addEventListener('webglcontextlost', onContextLost);

    map.on('load', () => {
      const initialSelectedId = selectedPlot?.id || plotsDataRef.current?.features?.[0]?.properties?.id || '';

      // 1. Toàn bộ source & layer (idempotent, màu lấy từ mapTheme)
      const { workingData: wd } = registerFarmLayers(map, plotsDataRef.current, {
        initialHeight: 0,
        selectedId: initialSelectedId,
        farmBoundary: farmBoundaryRef.current
      });
      workingDataRef.current = wd;
      builtFromDataRef.current = plotsDataRef.current;
      setWorkingData(wd);

      // 2. Badge trên tâm mỗi thửa — dựng bằng factory
      buildBadges(map, plotsDataRef.current, initialSelectedId, compact ? 0 : STAGGER_STEP_MS);
      prevSelectedIdRef.current = initialSelectedId;

      // 3. Nếu có bounding box thực tế từ DB, bay tới vùng đó
      const currentBounds = boundsInfoRef.current?.bounds;
      if (currentBounds) {
        map.fitBounds(currentBounds, {
          padding: CAMERA.padding,
          bearing: CAMERA.settled.bearing,
          pitch: settledPitch,
          duration: 900
        });
      }

      // 4. Click vào thửa đất trên bản đồ
      map.on('click', LAYER_IDS.plotsFill, (e) => {
        if (e.features && e.features.length > 0) {
          const plotId = e.features[0].properties.id;
          const feat = plotsDataRef.current.features.find((item) => item.properties.id === plotId);
          if (feat) onSelectPlotRef.current?.(feat.properties);
        }
      });

      // 5. Con trỏ + hover sáng khi rê chuột
      map.on('mousemove', LAYER_IDS.plotsFill, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0 && map.getLayer(LAYER_IDS.plotsFillHover)) {
          map.setFilter(LAYER_IDS.plotsFillHover, [
            '==',
            ['get', 'id'],
            e.features[0].properties.id
          ]);
        }
      });
      map.on('mouseleave', LAYER_IDS.plotsFill, () => {
        map.getCanvas().style.cursor = '';
        if (map.getLayer(LAYER_IDS.plotsFillHover)) {
          map.setFilter(LAYER_IDS.plotsFillHover, ['==', ['get', 'id'], '']);
        }
      });

      setMapReady(true);
    });

    return () => {
      canvas?.removeEventListener?.('webglcontextlost', handleContextLost);
      contextCanvas?.removeEventListener('webglcontextlost', onContextLost);
      badgesRef.current.forEach((b) => b.destroy());
      badgesRef.current.clear();
      badgeMarkersRef.current.forEach((m) => m.remove());
      badgeMarkersRef.current = [];
      workingDataRef.current = null;
      mapRef.current = null;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pha mở màn: vùng đất nhô lên rồi an vị ──────────────────────────────────
  const { phase, skip } = useMapIntroAnimation({
    map: mapReady ? mapRef.current : null,
    plotsData,
    workingData,
    enabled: mapReady,
    skipRise: compact,
    targetPitch: settledPitch,
    bounds: boundsInfo.bounds,
    center: boundsInfo.center
  });

  useEffect(() => {
    if (mapReady || mapFailed) return undefined;
    const timer = setTimeout(() => setLoadTimedOut(true), MAP_LOAD_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, [mapReady, mapFailed]);

  const degraded = mapFailed || (!mapReady && loadTimedOut);
  const effectivePhase = degraded ? 'done' : phase;
  const showLoadingStatus = !mapReady && !degraded;

  useEffect(() => {
    onPhaseChange?.(effectivePhase);
  }, [effectivePhase, onPhaseChange]);

  useEffect(() => {
    const id = selectedPlot?.id || selectedPlot?.label || '';
    if (id && id !== initialSelectedIdRef.current) {
      setHasUserSelected(true);
    }
  }, [selectedPlot]);

  useEffect(() => {
    if (!mapReady || introSkippedRef.current) return;
    if (phase === 'done' || phase === 'waiting') return;
    if (!hasUserSelected) return;

    introSkippedRef.current = true;
    skip();
  }, [hasUserSelected, phase, mapReady, skip]);

  const isSettled = effectivePhase === 'done' || effectivePhase === 'settling';

  // ── Spotlight khi chọn thửa ───
  const { clear: clearSpotlight } = usePlotSpotlight({
    map: mapReady ? mapRef.current : null,
    plotsData,
    workingData,
    selectedPlot,
    isReady: mapReady && isSettled && hasUserSelected,
    focusPitch: focusedPitch
  });

  // ── Đồng bộ filter layer + badge ────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const plotId = selectedPlot?.id || selectedPlot?.label || '';
    setSelectedPlotFilters(map, plotId);

    const prevId = prevSelectedIdRef.current;
    if (prevId && prevId !== plotId) {
      badgesRef.current.get(prevId)?.setSelected(false);
    }
    if (plotId) {
      badgesRef.current.get(plotId)?.setSelected(true);
    }
    prevSelectedIdRef.current = plotId;
  }, [selectedPlot, mapReady]);

  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 350 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 350 });

  // Reset về góc nhìn tổng quan trang trại
  const handleReset = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    setSelectedPlotFilters(map, '');
    badgesRef.current.forEach((b) => b.setSelected(false));
    prevSelectedIdRef.current = '';

    const source = map.getSource?.(LAYER_IDS.plotsSource);
    if (source && workingDataRef.current) {
      workingDataRef.current.features.forEach((f) => {
        f.properties.riseHeight = RISE_SETTLE_HEIGHT;
      });
      source.setData(workingDataRef.current);
    }

    clearSpotlight();

    if (boundsInfo.bounds) {
      map.fitBounds(boundsInfo.bounds, {
        padding: CAMERA.padding,
        bearing: CAMERA.settled.bearing,
        pitch: settledPitch,
        duration: 1000
      });
    } else {
      map.flyTo({
        center: boundsInfo.center,
        zoom: boundsInfo.zoom,
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
    }

    onResetView?.();
  }, [clearSpotlight, onResetView, settledPitch, boundsInfo]);

  const availableConfig = getStatusConfig('AVAILABLE');

  return (
    <div className="relative w-full h-full">
      {/* 1. Canvas Bản Đồ MapLibre GL JS */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />
      {showLoadingStatus && <div role="status" className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/70 text-sm font-bold text-white">Đang tải bản đồ...</div>}

      {/* 2. Màn che lúc nạp tile */}
      <MarketplaceIntroVeil phase={effectivePhase} />

      {/* 3. Điều khiển bản đồ (Map Controls) */}
      <div
        className={`absolute bottom-6 right-6 z-20 flex flex-col gap-2 pointer-events-auto transition-[right] duration-500 ease-out ${
          detailPanelOpen ? 'lg:right-[402px]' : ''
        }`}
      >
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-float border border-slate-100 flex flex-col">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center text-slate-700 font-semibold hover:bg-slate-100 rounded-lg text-lg cursor-pointer transition"
            title="Phóng to"
          >
            +
          </button>
          <div className="h-[1px] bg-slate-100 mx-1" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center text-slate-700 font-semibold hover:bg-slate-100 rounded-lg text-lg cursor-pointer transition"
            title="Thu nhỏ"
          >
            -
          </button>
        </div>
        <button
          type="button"
          onClick={handleReset}
          title="Về góc nhìn tổng quan"
          className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-xl shadow-float border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-base cursor-pointer transition"
        >
          🧭
        </button>
      </div>

      {/* 4. Badge toạ độ GPS & Tên nông trại động từ DB */}
      <div className="absolute top-20 left-[23.5rem] z-10 hidden lg:flex items-center gap-2 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-rail border border-white/70 text-[10px] text-slate-600 font-mono font-medium pointer-events-none">
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: availableConfig.color }}
        />
        <span>{farmName || 'Nông trại thông minh Farmely'}</span>
        <span className="text-slate-300">|</span>
        <span>{plotsData?.features?.length || 0} Thửa đất canh tác</span>
      </div>
    </div>
  );
}
