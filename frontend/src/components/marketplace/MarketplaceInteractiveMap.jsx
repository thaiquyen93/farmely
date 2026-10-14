import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FARMS_GEOJSON_DATA, FARM_GPS_BOUNDS } from '../../data/marketplaceGisData';
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

export default function MarketplaceInteractiveMap({
  plotsData = FARMS_GEOJSON_DATA,
  selectedPlot = null,
  onSelectPlot,
  onResetView,
  onPhaseChange,
  detailPanelOpen = false
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const cornerMarkersRef = useRef([]);
  const badgesRef = useRef(new Map());
  const badgeMarkersRef = useRef([]);
  const workingDataRef = useRef(null);
  const prevSelectedIdRef = useRef(null);
  const introSkippedRef = useRef(false);
  // Dữ liệu thửa mới nhất (live từ Database tới SAU khi map đã load) — handler
  // click của map phải đọc qua ref, nếu không sẽ trả về trạng thái cũ
  const plotsDataRef = useRef(plotsData);
  const builtFromDataRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  // Bản đồ không khởi tạo được (không có WebGL) hoặc 'load' không bao giờ bắn:
  // phải báo 'done' lên page, nếu không chrome của trang nằm sau màn che mãi mãi.
  const [mapFailed, setMapFailed] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [workingData, setWorkingData] = useState(null);
  const [compact] = useState(() => isCompactViewport());
  // Spotlight chỉ bật khi NGƯỜI DÙNG chủ động chọn thửa. Giữ đúng hành vi cũ
  // (isFirstRenderRef): thửa mặc định P-01 được highlight nhưng camera KHÔNG tự
  // lao vào nó, nhờ vậy màn mở "tổng quan trang trại" không bị phá.
  const [hasUserSelected, setHasUserSelected] = useState(false);
  const initialSelectedIdRef = useRef(selectedPlot?.id || 'P-01');

  // Giữ callback chọn thửa trong ref để handler của map luôn gọi bản mới nhất
  const onSelectPlotRef = useRef(onSelectPlot);
  useEffect(() => {
    onSelectPlotRef.current = onSelectPlot;
  }, [onSelectPlot]);

  const settledPitch = compact ? MOBILE_PITCH : CAMERA.settled.pitch;
  const focusedPitch = compact ? MOBILE_PITCH : CAMERA.focused.pitch;

  /** Dựng (lại) toàn bộ badge — gọi lúc load và khi dữ liệu live đổi trạng thái/giá */
  function buildBadges(map, data, selectedId, staggerMs) {
    badgesRef.current.forEach((b) => b.destroy());
    badgesRef.current.clear();
    badgeMarkersRef.current.forEach((m) => m.remove());
    badgeMarkersRef.current = [];

    data.features.forEach((f, index) => {
      const badge = createPlotBadge({
        properties: f.properties,
        isSelected: selectedId === f.properties.id,
        enterDelayMs: index * staggerMs,
        onClick: (props) => onSelectPlotRef.current?.(props)
      });

      const marker = new maplibregl.Marker({ element: badge.element })
        .setLngLat(getCentroid(f))
        .addTo(map);

      badgeMarkersRef.current.push(marker);
      badgesRef.current.set(f.properties.id, badge);
    });
  }

  // Dữ liệu live (Database) về SAU khi map đã dựng: cập nhật màu thửa + badge
  // nhưng GIỮ NGUYÊN chiều cao khối đang animate
  useEffect(() => {
    plotsDataRef.current = plotsData;
    const map = mapRef.current;
    const wd = workingDataRef.current;
    if (!mapReady || !map || !wd || builtFromDataRef.current === plotsData) return;
    builtFromDataRef.current = plotsData;

    const byId = new Map(plotsData.features.map((f) => [f.properties.id, f.properties]));
    let badgeContentChanged = false;
    wd.features.forEach((f) => {
      const next = byId.get(f.properties.id);
      if (!next) return;
      if (next.status !== f.properties.status || next.rentalPrice !== f.properties.rentalPrice) {
        badgeContentChanged = true;
      }
      f.properties = { ...next, riseHeight: f.properties.riseHeight };
    });
    map.getSource?.(LAYER_IDS.plotsSource)?.setData(wd);

    if (badgeContentChanged) {
      buildBadges(map, plotsData, prevSelectedIdRef.current || '', 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotsData, mapReady]);

  // ── Khởi tạo bản đồ vệ tinh ESRI tại toạ độ thực của trang trại ─────────────
  useEffect(() => {
    if (!mapContainerRef.current) return undefined;

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
      center: FARM_GPS_BOUNDS.center, // [106.350258, 10.687662]
      zoom: CAMERA.intro.zoom,
      pitch: CAMERA.intro.pitch,
      bearing: CAMERA.intro.bearing
    };

    // Không có WebGL thì constructor ném lỗi — bắt lại để trang vẫn dùng được
    let map;
    try {
      map = new maplibregl.Map(mapOptions);
    } catch (err) {
      console.error('Không khởi tạo được bản đồ MapLibre:', err);
      setMapFailed(true);
      return undefined;
    }

    mapRef.current = map;

    // Mất WebGL context giữa đường (driver reset, tab bị treo) cũng phải xuống
    // trạng thái "đã an vị" để chrome của trang không bị khoá sau màn che.
    const onContextLost = () => {
      console.error('WebGL context của bản đồ bị mất — chuyển trang về trạng thái tối giản.');
      setMapFailed(true);
    };
    const rawCanvas = typeof map.getCanvas === 'function' ? map.getCanvas() : null;
    const canvas =
      rawCanvas && typeof rawCanvas.addEventListener === 'function' ? rawCanvas : null;
    canvas?.addEventListener('webglcontextlost', onContextLost);

    map.on('load', () => {
      const initialSelectedId = selectedPlot?.id || 'P-01';

      // 1. Toàn bộ source & layer (idempotent, màu lấy từ mapTheme)
      const { workingData: wd } = registerFarmLayers(map, plotsData, {
        initialHeight: 0,
        selectedId: initialSelectedId
      });
      workingDataRef.current = wd;
      builtFromDataRef.current = plotsData;
      setWorkingData(wd);

      // 2. Badge trên tâm mỗi thửa — dựng bằng factory, stagger khớp pha nhô lên
      buildBadges(map, plotsData, initialSelectedId, compact ? 0 : STAGGER_STEP_MS);
      prevSelectedIdRef.current = initialSelectedId;

      // 3. 4 marker định vị toạ độ GPS góc khu đất
      [
        FARM_GPS_BOUNDS.topLeft,
        FARM_GPS_BOUNDS.topRight,
        FARM_GPS_BOUNDS.bottomLeft,
        FARM_GPS_BOUNDS.bottomRight
      ].forEach((c) => {
        const pinWrapper = document.createElement('div');
        pinWrapper.className =
          'select-none pointer-events-none flex items-center justify-center';

        const pin = document.createElement('div');
        pin.className = 'w-2 h-2 rounded-full bg-amber-400 border border-white shadow-sm';
        pinWrapper.appendChild(pin);

        const cornerMarker = new maplibregl.Marker({
          element: pinWrapper,
          anchor: 'center'
        })
          .setLngLat([c.lng, c.lat])
          .addTo(map);

        cornerMarkersRef.current.push(cornerMarker);
      });

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
      canvas?.removeEventListener('webglcontextlost', onContextLost);
      badgesRef.current.forEach((b) => b.destroy());
      badgesRef.current.clear();
      badgeMarkersRef.current.forEach((m) => m.remove());
      badgeMarkersRef.current = [];
      cornerMarkersRef.current.forEach((m) => m.remove());
      cornerMarkersRef.current = [];
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
    targetPitch: settledPitch
  });

  // Lưới an toàn cấp component: nếu 'load' không bao giờ bắn (style lỗi, mất
  // WebGL) thì hook intro còn chưa được bật, nên phase sẽ kẹt ở 'waiting'.
  useEffect(() => {
    if (mapReady || mapFailed) return undefined;
    const timer = setTimeout(() => setLoadTimedOut(true), MAP_LOAD_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, [mapReady, mapFailed]);

  // Bản đồ hỏng/quá hạn -> coi như đã an vị để chrome của trang vẫn dùng được
  const degraded = mapFailed || (!mapReady && loadTimedOut);
  const effectivePhase = degraded ? 'done' : phase;

  // Đẩy phase lên page để các panel biết khi nào được vào sân khấu
  useEffect(() => {
    onPhaseChange?.(effectivePhase);
  }, [effectivePhase, onPhaseChange]);

  // Ghi nhận lần người dùng chủ động đổi thửa (khác thửa mặc định ban đầu)
  useEffect(() => {
    const id = selectedPlot?.id || selectedPlot?.label || '';
    if (id && id !== initialSelectedIdRef.current) {
      setHasUserSelected(true);
    }
  }, [selectedPlot]);

  // Chọn thửa sớm KHÔNG bị khoá: huỷ intro và nhảy thẳng tới trạng thái an vị
  useEffect(() => {
    if (!mapReady || introSkippedRef.current) return;
    if (phase === 'done' || phase === 'waiting') return;
    if (!hasUserSelected) return;

    introSkippedRef.current = true;
    skip();
  }, [hasUserSelected, phase, mapReady, skip]);

  const isSettled = effectivePhase === 'done' || effectivePhase === 'settling';

  // ── Spotlight khi chọn thửa (dim, nhô cao, marching ants, glow, brackets) ───
  const { clear: clearSpotlight } = usePlotSpotlight({
    map: mapReady ? mapRef.current : null,
    plotsData,
    workingData,
    selectedPlot,
    isReady: mapReady && isSettled && hasUserSelected,
    focusPitch: focusedPitch
  });

  // ── Đồng bộ filter layer + badge (chỉ chạm 2 badge thay vì cả danh sách) ────
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

  // Điều khiển phóng to / thu nhỏ với hiệu ứng mượt
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 350 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 350 });

  // Reset về góc nhìn tổng quan trang trại
  const handleReset = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    setSelectedPlotFilters(map, '');
    badgesRef.current.forEach((b) => b.setSelected(false));
    prevSelectedIdRef.current = '';

    // Hạ mọi khối về độ dày làm việc
    const source = map.getSource?.(LAYER_IDS.plotsSource);
    if (source && workingDataRef.current) {
      workingDataRef.current.features.forEach((f) => {
        f.properties.riseHeight = RISE_SETTLE_HEIGHT;
      });
      source.setData(workingDataRef.current);
    }

    clearSpotlight();

    map.fitBounds(CAMERA.bounds, {
      padding: CAMERA.padding,
      bearing: CAMERA.settled.bearing,
      pitch: settledPitch,
      duration: 1000
    });

    onResetView?.();
  }, [clearSpotlight, onResetView, settledPitch]);

  const availableConfig = getStatusConfig('AVAILABLE');

  return (
    <div className="relative w-full h-full">
      {/* 1. Canvas Bản Đồ MapLibre GL JS */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* 2. Màn che lúc nạp tile (tự tháo khỏi DOM khi bản đồ sẵn sàng) */}
      <MarketplaceIntroVeil phase={effectivePhase} />

      {/* 3. Điều khiển bản đồ (Map Controls) — né drawer chi tiết bên phải khi nó mở,
             nếu không cả cụm nút bị drawer (cùng z-20, nằm trên) che mất */}
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

      {/* 4. Badge toạ độ GPS — đặt ngay bên phải sidebar (left-6 + w-84 + khoảng cách),
             trước đây nằm ở bottom-left nên bị sidebar che chỉ còn lòi chữ "etGAP" */}
      <div className="absolute top-20 left-[23.5rem] z-10 hidden lg:flex items-center gap-2 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-rail border border-white/70 text-[10px] text-slate-600 font-mono font-medium pointer-events-none">
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: availableConfig.color }}
        />
        <span>Tọa độ khu đất: 10°41′15″N 106°21′01″E</span>
        <span className="text-slate-300">|</span>
        <span>{plotsData.features.length} Thửa đất VietGAP</span>
      </div>
    </div>
  );
}
