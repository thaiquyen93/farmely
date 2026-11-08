/**
 * usePlotSpotlight — Sân khấu hoá thửa đất đang được chọn.
 *
 * Gồm 5 hiệu ứng chạy song song:
 *  1. Dim mask   : làm tối ngoài khu đất + các thửa không được chọn (rAF fill-opacity)
 *  2. Extrusion  : thửa đang chọn nhô cao hơn các thửa còn lại
 *  3. Marching ants : setInterval bước qua DASH_SEQUENCE (line-dasharray không transition được)
 *  4. Glow pulse : rAF sine điều khiển line-width / line-opacity
 *  5. Corner brackets : 4 marker SVG góc vuông nhô vào lệch pha nhau
 */

import { useCallback, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  CAMERA,
  DASH_SEQUENCE,
  FOCUS_PADDING,
  LAYER_IDS,
  RISE_SETTLE_HEIGHT,
  SELECTED_HEIGHT,
  dashSequenceAt,
} from '../utils/mapTheme';
import {
  setExtrusionSpotlight,
  setSelectedPlotAccent,
} from '../components/marketplace/map/mapLayers';
import {
  clamp01,
  easeInOutCubic,
  getCentroid,
  getFeatureBBox,
  getRingCorners,
} from '../utils/geoUtils';

const DIM_OPACITY = 0.5;
const DIM_DURATION_MS = 400;
const EXTRUSION_DURATION_MS = 450;
const DASH_INTERVAL_MS = 70;
const BRACKET_DELAYS = [0, 60, 120, 180];

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Sóng radar lan toả từ tâm thửa đang chọn: 3 vòng lệch pha.
 * Animation (có transform) đặt trên các vòng CON — phần tử marker ngoài cùng
 * để MapLibre toàn quyền định vị bằng transform.
 */
export function createRippleElement(color) {
  const el = document.createElement('div');
  el.className = 'pointer-events-none select-none';
  el.style.zIndex = '0';
  el.setAttribute('aria-hidden', 'true');

  const stage = document.createElement('div');
  stage.style.cssText = 'position:relative;width:132px;height:132px;';

  [0, 800, 1600].forEach((delay) => {
    const ring = document.createElement('span');
    ring.className = 'animate-ripple';
    ring.style.cssText = [
      'position:absolute',
      'inset:0',
      'border-radius:9999px',
      `border:2px solid ${color}`,
      `background:radial-gradient(circle, ${color}33 0%, ${color}00 70%)`,
      `animation-delay:${delay}ms`,
    ].join(';');
    stage.appendChild(ring);
  });

  const core = document.createElement('span');
  core.style.cssText = [
    'position:absolute',
    'left:50%',
    'top:50%',
    'width:12px',
    'height:12px',
    'margin:-6px 0 0 -6px',
    'border-radius:9999px',
    `background:${color}`,
    'border:2px solid #fff',
    `box-shadow:0 0 0 6px ${color}40, 0 0 18px ${color}`,
  ].join(';');
  stage.appendChild(core);

  el.appendChild(stage);
  return el;
}

/** Marker góc vuông emerald ở 1 trong 4 góc thửa */
function createBracketElement(delayMs, color, rotationDeg = 0) {
  const el = document.createElement('div');
  el.className = 'pointer-events-none select-none';
  // Phần tử marker để MapLibre toàn quyền định vị bằng transform. Animation vào
  // sân khấu (scale) đặt trên lớp con; góc xoay đặt trên <svg> bên trong.
  el.innerHTML = `
    <div class="animate-bracketIn" style="animation-delay:${Number(delayMs) || 0}ms">
    <svg width="30" height="30" viewBox="0 0 22 22" fill="none" aria-hidden="true"
         style="display:block; transform: rotate(${Number(rotationDeg) || 0}deg);">
      <path d="M2 10V4a2 2 0 0 1 2-2h6" stroke="#ffffff" stroke-width="4.2"
            stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.9" />
      <path d="M2 10V4a2 2 0 0 1 2-2h6" stroke="${color}" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round"
            style="filter: drop-shadow(0 0 5px ${color});" />
    </svg>
    </div>
  `;
  return el;
}

/**
 * @param {{ map: object, plotsData: object, workingData: object,
 *           selectedPlot: object|null, isReady: boolean, focusPitch?: number }} config
 * @returns {{ clear: Function }}
 */
export default function usePlotSpotlight({
  map,
  plotsData,
  workingData,
  selectedPlot,
  isReady = false,
  focusPitch = CAMERA.focused.pitch,
}) {
  const dimRafRef = useRef(null);
  const heightRafRef = useRef(null);
  const glowRafRef = useRef(null);
  const dashIntervalRef = useRef(null);
  const bracketsRef = useRef([]);
  const rippleRef = useRef(null);

  const cancelRaf = (ref) => {
    if (ref.current !== null) {
      cancelAnimationFrame(ref.current);
      ref.current = null;
    }
  };

  const removeBrackets = useCallback(() => {
    [...bracketsRef.current, rippleRef.current].filter(Boolean).forEach((m) => {
      try {
        m.remove();
      } catch {
        /* marker đã bị tháo cùng map */
      }
    });
    bracketsRef.current = [];
    rippleRef.current = null;
  }, []);

  const stopDash = useCallback(() => {
    if (dashIntervalRef.current !== null) {
      clearInterval(dashIntervalRef.current);
      dashIntervalRef.current = null;
    }
  }, []);

  /** Animate fill-opacity của 2 layer dim từ giá trị hiện tại -> target */
  const animateDim = useCallback(
    (target, instant = false) => {
      if (!map) return;
      cancelRaf(dimRafRef);

      const layers = [LAYER_IDS.farmDimOutside, LAYER_IDS.plotsDim].filter((id) =>
        map.getLayer?.(id)
      );
      if (layers.length === 0) return;

      const setAll = (v) =>
        layers.forEach((id) => map.setPaintProperty(id, 'fill-opacity', v));

      let from = 0;
      try {
        const current = map.getPaintProperty(layers[0], 'fill-opacity');
        if (typeof current === 'number') from = current;
      } catch {
        from = 0;
      }

      if (instant || prefersReducedMotion()) {
        setAll(target);
        return;
      }

      const start = performance.now();
      const frame = (now) => {
        const t = clamp01((now - start) / DIM_DURATION_MS);
        setAll(from + (target - from) * easeInOutCubic(t));
        if (t < 1) dimRafRef.current = requestAnimationFrame(frame);
        else dimRafRef.current = null;
      };
      dimRafRef.current = requestAnimationFrame(frame);
    },
    [map]
  );

  /** Animate riseHeight: thửa đang chọn lên SELECTED_HEIGHT, còn lại về RISE_SETTLE_HEIGHT */
  const animateHeights = useCallback(
    (selectedId, instant = false) => {
      if (!map || !workingData) return;
      const source = map.getSource?.(LAYER_IDS.plotsSource);
      if (!source || typeof source.setData !== 'function') return;

      cancelRaf(heightRafRef);

      const features = workingData.features;
      const from = features.map((f) => f.properties.riseHeight ?? RISE_SETTLE_HEIGHT);
      const to = features.map((f) =>
        f.properties.id === selectedId ? SELECTED_HEIGHT : RISE_SETTLE_HEIGHT
      );

      const write = (t) => {
        features.forEach((f, i) => {
          f.properties.riseHeight = from[i] + (to[i] - from[i]) * t;
        });
        source.setData(workingData);
      };

      if (instant || prefersReducedMotion()) {
        write(1);
        return;
      }

      const start = performance.now();
      const frame = (now) => {
        const t = clamp01((now - start) / EXTRUSION_DURATION_MS);
        write(easeInOutCubic(t));
        if (t < 1) heightRafRef.current = requestAnimationFrame(frame);
        else heightRafRef.current = null;
      };
      heightRafRef.current = requestAnimationFrame(frame);
    },
    [map, workingData]
  );

  /** Reset mọi hiệu ứng spotlight — dùng cho nút "về góc nhìn tổng quan" */
  const clear = useCallback(() => {
    stopDash();
    cancelRaf(glowRafRef);
    removeBrackets();
    animateDim(0);
    animateHeights(null);

    if (map?.getLayer?.(LAYER_IDS.plotsSelectedBorder)) {
      map.setPaintProperty(LAYER_IDS.plotsSelectedBorder, 'line-dasharray', DASH_SEQUENCE[0]);
    }
    if (map?.getLayer?.(LAYER_IDS.plotsSelectedGlow)) {
      map.setPaintProperty(LAYER_IDS.plotsSelectedGlow, 'line-width', 8);
      map.setPaintProperty(LAYER_IDS.plotsSelectedGlow, 'line-opacity', 0.4);
    }
    if (map?.getLayer?.(LAYER_IDS.plotsSelectedFill)) {
      map.setPaintProperty(LAYER_IDS.plotsSelectedFill, 'fill-opacity', 0.15);
    }
    if (map?.getLayer?.(LAYER_IDS.plotsDim)) {
      map.setFilter(LAYER_IDS.plotsDim, ['!=', ['get', 'id'], '']);
    }

    // Khối 3D trở lại màu trạng thái
    setExtrusionSpotlight(map, '');
  }, [map, stopDash, removeBrackets, animateDim, animateHeights]);

  useEffect(() => {
    if (!map || !isReady) return undefined;

    const selectedId = selectedPlot?.id || selectedPlot?.label || '';

    // Không có thửa nào được chọn -> tắt spotlight
    if (!selectedId) {
      clear();
      return undefined;
    }

    const feature = (plotsData?.features || []).find(
      (f) => f.properties.id === selectedId || f.properties.code === selectedPlot?.code
    );

    // Chỉ làm tối các thửa KHÔNG được chọn
    if (map.getLayer?.(LAYER_IDS.plotsDim)) {
      map.setFilter(LAYER_IDS.plotsDim, ['!=', ['get', 'id'], selectedId]);
    }

    animateDim(DIM_OPACITY);
    animateHeights(selectedId);

    const reduced = prefersReducedMotion();

    // Một nguồn màu duy nhất cho glow / viền / fill highlight VÀ 4 góc vuông
    const accent = setSelectedPlotAccent(map, selectedPlot?.status).strokeColor;

    // Làm tối khối 3D của các thửa còn lại (layer fill không với tới extrusion)
    setExtrusionSpotlight(map, selectedId);

    // Marching ants — line-dasharray không transition được nên phải bước từng giá trị
    if (!reduced && map.getLayer?.(LAYER_IDS.plotsSelectedBorder)) {
      let frame = 0;
      dashIntervalRef.current = setInterval(() => {
        if (!map.getLayer?.(LAYER_IDS.plotsSelectedBorder)) return;
        frame += 1;
        map.setPaintProperty(
          LAYER_IDS.plotsSelectedBorder,
          'line-dasharray',
          dashSequenceAt(frame)
        );
      }, DASH_INTERVAL_MS);
    }

    // Glow nhịp sin: line-width 6 -> 10, line-opacity 0.35 -> 0.6
    if (!reduced && map.getLayer?.(LAYER_IDS.plotsSelectedGlow)) {
      const glowStart = performance.now();
      const glowFrame = (now) => {
        if (!map.getLayer?.(LAYER_IDS.plotsSelectedGlow)) {
          glowRafRef.current = null;
          return;
        }
        const wave = (Math.sin(((now - glowStart) / 1400) * Math.PI * 2) + 1) / 2;
        map.setPaintProperty(LAYER_IDS.plotsSelectedGlow, 'line-width', 8 + wave * 8);
        map.setPaintProperty(LAYER_IDS.plotsSelectedGlow, 'line-opacity', 0.45 + wave * 0.35);
        // Mặt thửa "thở" cùng nhịp với glow
        if (map.getLayer?.(LAYER_IDS.plotsSelectedFill)) {
          map.setPaintProperty(LAYER_IDS.plotsSelectedFill, 'fill-opacity', 0.14 + wave * 0.2);
        }
        glowRafRef.current = requestAnimationFrame(glowFrame);
      };
      glowRafRef.current = requestAnimationFrame(glowFrame);
    }

    // 4 góc vuông emerald nhô vào lệch pha
    removeBrackets();
    if (feature) {
      getRingCorners(feature)
        .slice(0, 4)
        .forEach((corner, i) => {
          const el = createBracketElement(reduced ? 0 : BRACKET_DELAYS[i] || 0, accent, i * 90);
          const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat(corner)
            .addTo(map);
          bracketsRef.current.push(marker);
        });

      // Sóng radar lan toả từ tâm thửa (tĩnh nếu người dùng tắt chuyển động)
      const rippleEl = createRippleElement(accent);
      if (reduced) {
        rippleEl.querySelectorAll('.animate-ripple').forEach((r) => {
          r.style.animation = 'none';
          r.style.opacity = '0';
        });
      }
      rippleRef.current = new maplibregl.Marker({ element: rippleEl, anchor: 'center' })
        .setLngLat(getCentroid(feature))
        .addTo(map);

      // Camera: fitBounds theo bbox thật của thửa -> mọi thửa to/nhỏ đều được đóng khung đều
      if (typeof map.fitBounds === 'function') {
        map.fitBounds(getFeatureBBox(feature), {
          padding: FOCUS_PADDING,
          maxZoom: CAMERA.focused.maxZoom,
          pitch: focusPitch,
          bearing: CAMERA.focused.bearing,
          duration: reduced ? 0 : 1100,
          easing: easeInOutCubic,
          essential: true,
        });
      }
    }

    return () => {
      stopDash();
      cancelRaf(glowRafRef);
      removeBrackets();
    };
  }, [
    map,
    isReady,
    selectedPlot,
    plotsData,
    clear,
    animateDim,
    animateHeights,
    removeBrackets,
    stopDash,
    focusPitch,
  ]);

  // Dọn dẹp cuối cùng khi unmount — không để rò rAF / interval / marker
  useEffect(
    () => () => {
      cancelRaf(dimRafRef);
      cancelRaf(heightRafRef);
      cancelRaf(glowRafRef);
      stopDash();
      removeBrackets();
    },
    [stopDash, removeBrackets]
  );

  return { clear };
}
