/**
 * useMapIntroAnimation — "Vùng đất nhô lên".
 *
 * Kịch bản: chờ bản đồ idle (tránh chạy trên nền tile xám chưa tải) ->
 * các thửa gần camera nhất nhô lên trước (stagger theo toạ độ màn hình) ->
 * camera nghiêng dần từ gần-top-down về góc tổng quan -> hạ về độ dày làm việc.
 *
 * Chỉ dùng requestAnimationFrame + easing thuần, không thêm thư viện animation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CAMERA,
  LAYER_IDS,
  RISE_PEAK_HEIGHT,
  RISE_SETTLE_HEIGHT,
} from '../utils/mapTheme';
import { clamp01, easeInOutCubic, easeOutCubic, getCentroid } from '../utils/geoUtils';

export const STAGGER_STEP_MS = 55;
export const RISE_DURATION_MS = 900;
export const RISE_TOTAL_MS = 1700;
export const SETTLE_DURATION_MS = 650;
/**
 * Phải KHỚP với RISE_TOTAL_MS: pha settle gọi map.setPitch() mỗi frame, và
 * setPitch huỷ mọi animation camera đang chạy. Nếu easeTo còn dở khi settle bắt
 * đầu thì zoom bị đóng băng giữa đường, không bao giờ tới CAMERA.overview.
 */
export const CAMERA_INTRO_MS = RISE_TOTAL_MS;
/**
 * Lưới an toàn: nếu 'idle' không bao giờ bắn (mất WebGL, endpoint tile chết,
 * style lỗi) thì sau khoảng này ta ép về trạng thái an vị để phần chrome của
 * trang không bị kẹt vĩnh viễn sau màn che.
 */
export const WATCHDOG_MS = 4500;

/**
 * Tính độ trễ (ms) cho từng thửa: thửa có y lớn nhất trên màn hình
 * (gần đáy = gần camera nhất) nhô lên trước. Đúng với mọi bearing vì
 * ta sắp xếp theo toạ độ ĐÃ chiếu lên màn hình.
 *
 * @param {Array<{ index:number, y:number }>} projectedPoints
 * @param {number} step ms giữa 2 thửa liên tiếp
 * @returns {number[]} delay theo thứ tự index gốc của feature
 */
export function computeStaggerDelays(projectedPoints, step = STAGGER_STEP_MS) {
  const points = Array.isArray(projectedPoints) ? projectedPoints : [];
  const delays = new Array(points.length).fill(0);

  points
    .map((p, i) => ({
      index: Number.isInteger(p?.index) ? p.index : i,
      y: Number.isFinite(p?.y) ? p.y : 0,
    }))
    .sort((a, b) => b.y - a.y)
    .forEach((p, order) => {
      delays[p.index] = order * step;
    });

  return delays;
}

/**
 * Chiều cao khối tại thời điểm `elapsed` cho 1 thửa có độ trễ `delay`.
 * Bị kẹp trong [0, RISE_PEAK_HEIGHT] và không bao giờ giảm theo thời gian.
 */
export function heightAtTime(elapsed, delay, peak = RISE_PEAK_HEIGHT, duration = RISE_DURATION_MS) {
  const progress = clamp01((elapsed - delay) / duration);
  return peak * easeOutCubic(progress);
}

/** Chiều cao trong pha hạ xuống (peak -> settle) */
export function settleHeightAtTime(elapsed, duration = SETTLE_DURATION_MS) {
  const t = easeInOutCubic(clamp01(elapsed / duration));
  return RISE_PEAK_HEIGHT + (RISE_SETTLE_HEIGHT - RISE_PEAK_HEIGHT) * t;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Throttle setData xuống ~30fps trên máy yếu để đỡ GPU/CPU */
function frameBudgetMs() {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4) {
    return 1000 / 30;
  }
  return 0;
}

/**
 * @param {{ map: object, plotsData: object, workingData: object, enabled: boolean,
 *           reducedMotion?: boolean, skipRise?: boolean, targetPitch?: number }} config
 * @returns {{ phase: 'waiting'|'rising'|'settling'|'done', skip: Function }}
 */
export default function useMapIntroAnimation({
  map,
  plotsData,
  workingData,
  enabled = true,
  skipRise = false,
  targetPitch = CAMERA.settled.pitch,
  bounds = null,
  center = null,
}) {
  const [phase, setPhase] = useState('waiting');
  const rafRef = useRef(null);
  const cancelledRef = useRef(false);
  const lastPushRef = useRef(0);
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const centerRef = useRef(center);
  centerRef.current = center;

  const phaseRef = useRef('waiting');
  const setPhaseSafe = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  // Ghi chiều cao vào bản sao làm việc rồi đẩy lên source
  const pushHeights = useCallback(
    (heights, force = false) => {
      if (!map || !workingData) return;
      const source = map.getSource?.(LAYER_IDS.plotsSource);
      if (!source || typeof source.setData !== 'function') return;

      const budget = frameBudgetMs();
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (!force && budget > 0 && now - lastPushRef.current < budget) return;
      lastPushRef.current = now;

      workingData.features.forEach((f, i) => {
        f.properties.riseHeight = heights[i];
      });
      source.setData(workingData);
    },
    [map, workingData]
  );

  /** Nhảy thẳng tới trạng thái đã an vị (dùng cho reduced-motion và khi user bấm sớm) */
  const skip = useCallback(() => {
    cancelledRef.current = true;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!map || !workingData) {
      setPhaseSafe('done');
      return;
    }

    pushHeights(workingData.features.map(() => RISE_SETTLE_HEIGHT), true);

    if (typeof map.stop === 'function') map.stop();
    if (typeof map.fitBounds === 'function') {
      const activeBounds = boundsRef.current || CAMERA.bounds;
      map.fitBounds(activeBounds, {
        padding: CAMERA.padding,
        bearing: CAMERA.settled.bearing,
        pitch: targetPitch,
        duration: 0,
      });
    }
    setPhaseSafe('done');
  }, [map, workingData, pushHeights, setPhaseSafe, targetPitch]);

  // Giữ skip trong ref để watchdog gọi được mà không phải thêm dep cho effect
  const skipRef = useRef(skip);
  useEffect(() => {
    skipRef.current = skip;
  }, [skip]);

  useEffect(() => {
    if (!enabled || !map || !workingData) return undefined;
    if (workingData.features.length === 0) {
      setPhaseSafe('done');
      return undefined;
    }

    cancelledRef.current = false;
    const features = workingData.features;
    const count = features.length;
    const reduced = prefersReducedMotion();

    // Reduced motion hoặc mobile: không diễn pha nhô lên, vào thẳng góc tổng quan
    if (reduced || skipRise) {
      const run = () => {
        if (cancelledRef.current) return;
        pushHeights(features.map(() => RISE_SETTLE_HEIGHT), true);
        if (typeof map.fitBounds === 'function') {
          const activeBounds = boundsRef.current || CAMERA.bounds;
          map.fitBounds(activeBounds, {
            padding: CAMERA.padding,
            bearing: CAMERA.settled.bearing,
            pitch: targetPitch,
            duration: 0,
          });
        }
        setPhaseSafe('done');
      };

      let ranOnce = false;
      const runOnce = () => {
        if (ranOnce || cancelledRef.current) return;
        ranOnce = true;
        map.off?.('idle', runOnce);
        run();
      };

      if (map.loaded?.()) {
        runOnce();
        return () => {
          cancelledRef.current = true;
        };
      }

      map.once?.('idle', runOnce);
      // Cùng lý do như nhánh chính: 'idle' có thể không bao giờ bắn thêm, nên
      // không được để nhánh này treo tới hết watchdog mới hiện bản đồ.
      const reducedKick = setTimeout(runOnce, 600);
      const reducedWatchdog = setTimeout(runOnce, WATCHDOG_MS);

      return () => {
        cancelledRef.current = true;
        clearTimeout(reducedKick);
        clearTimeout(reducedWatchdog);
        map.off?.('idle', runOnce);
      };
    }

    let startTime = 0;
    let delays = [];

    const startSettle = () => {
      if (cancelledRef.current) return;
      setPhaseSafe('settling');

      const settleStart = performance.now();
      const startPitch = typeof map.getPitch === 'function' ? map.getPitch() : CAMERA.overview.pitch;

      const settleFrame = (now) => {
        if (cancelledRef.current) return;
        const elapsed = now - settleStart;
        const t = clamp01(elapsed / SETTLE_DURATION_MS);
        const h = settleHeightAtTime(elapsed);

        pushHeights(features.map(() => h), t >= 1);

        if (typeof map.setPitch === 'function') {
          map.setPitch(startPitch + (targetPitch - startPitch) * easeInOutCubic(t));
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(settleFrame);
        } else {
          rafRef.current = null;
          setPhaseSafe('done');
        }
      };

      rafRef.current = requestAnimationFrame(settleFrame);
    };

    const startRise = () => {
      if (cancelledRef.current) return;

      // Chiếu tâm từng thửa lên màn hình để biết thửa nào gần camera nhất
      const projected = features.map((f, index) => {
        let y = 0;
        try {
          const point = map.project?.(getCentroid(f));
          if (point && Number.isFinite(point.y)) y = point.y;
        } catch {
          y = 0;
        }
        return { index, y };
      });

      delays = computeStaggerDelays(projected);
      setPhaseSafe('rising');

      // Camera nghiêng dần từ gần-top-down về góc tổng quan
      if (typeof map.easeTo === 'function') {
        const easeOpts = {
          zoom: CAMERA.overview.zoom,
          pitch: CAMERA.overview.pitch,
          bearing: CAMERA.overview.bearing,
          duration: CAMERA_INTRO_MS,
          easing: easeInOutCubic,
          essential: true,
        };
        if (centerRef.current) {
          easeOpts.center = centerRef.current;
        }
        map.easeTo(easeOpts);
      }

      startTime = performance.now();

      const riseFrame = (now) => {
        if (cancelledRef.current) return;
        const elapsed = now - startTime;
        const done = elapsed >= RISE_TOTAL_MS;

        pushHeights(
          features.map((_, i) => heightAtTime(elapsed, delays[i])),
          done
        );

        if (!done) {
          rafRef.current = requestAnimationFrame(riseFrame);
        } else {
          rafRef.current = null;
          startSettle();
        }
      };

      rafRef.current = requestAnimationFrame(riseFrame);
    };

    // Đặt camera ở vị trí mở màn (cao, gần top-down) rồi chờ tile tải xong
    if (typeof map.jumpTo === 'function') {
      const jumpOpts = {
        zoom: CAMERA.intro.zoom,
        pitch: CAMERA.intro.pitch,
        bearing: CAMERA.intro.bearing,
      };
      if (centerRef.current) {
        jumpOpts.center = centerRef.current;
      }
      map.jumpTo(jumpOpts);
    }
    pushHeights(features.map(() => 0), true);

    // Khởi động pha nhô lên ĐÚNG MỘT LẦN, bất kể tín hiệu nào tới trước.
    //
    // KHÔNG được chỉ dựa vào 'idle': bản đồ đã được khởi tạo sẵn ở đúng camera
    // mở màn, nên jumpTo ở trên không làm camera thay đổi -> không có tile mới
    // -> map không vẽ lại -> 'idle' KHÔNG BAO GIỜ bắn thêm lần nào. Trước đây
    // đó chính là lý do camera đứng mãi ở preset intro và 16 khối giữ chiều
    // cao 0 (không thấy gì trên bản đồ).
    let started = false;
    let kickTimer = null;
    const begin = () => {
      if (started || cancelledRef.current) return;
      started = true;
      if (kickTimer !== null) clearTimeout(kickTimer);
      map.off?.('idle', begin);
      startRise();
    };

    // Tile của khu đất đã nằm trong cache ngay từ lúc khởi tạo thì chạy luôn
    const tilesAlreadyReady =
      map.loaded?.() === true &&
      (typeof map.areTilesLoaded !== 'function' || map.areTilesLoaded() === true);

    map.once?.('idle', begin);
    // Mồi dự phòng: 'idle' có thể đã bắn xong trước khi effect này kịp gắn
    // listener, hoặc không bao giờ bắn vì camera không đổi.
    kickTimer = setTimeout(begin, tilesAlreadyReady ? 0 : 600);

    // Lưới an toàn + sự cố WebGL: ép về trạng thái an vị để chrome của trang
    // không bị kẹt sau màn che khi pha nhô lên không thể bắt đầu.
    const forceSettled = () => {
      if (cancelledRef.current || phaseRef.current !== 'waiting') return;
      started = true;
      if (kickTimer !== null) clearTimeout(kickTimer);
      map.off?.('idle', begin);
      skipRef.current?.();
    };

    const watchdog = setTimeout(forceSettled, WATCHDOG_MS);
    map.on?.('webglcontextlost', forceSettled);

    return () => {
      cancelledRef.current = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      clearTimeout(kickTimer);
      clearTimeout(watchdog);
      map.off?.('idle', begin);
      map.off?.('webglcontextlost', forceSettled);
    };
  }, [enabled, map, workingData, plotsData, pushHeights, setPhaseSafe, skipRise, targetPitch]);

  return { phase, skip };
}
