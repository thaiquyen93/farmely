import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactDOM from 'react-dom/client';
import useMapIntroAnimation, {
  WATCHDOG_MS,
  CAMERA_INTRO_MS,
  RISE_TOTAL_MS,
} from './useMapIntroAnimation';
import { CAMERA, RISE_SETTLE_HEIGHT } from '../utils/mapTheme';
import { createWorkingPlotsData } from '../components/marketplace/map/mapLayers';
import { FARMS_GEOJSON_DATA } from '../data/marketplaceGisData';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Bản đồ giả KHÔNG BAO GIỜ bắn 'idle'.
 *
 * Đây là kịch bản BÌNH THƯỜNG, không phải sự cố: bản đồ được khởi tạo sẵn ở
 * đúng camera mở màn, nên jumpTo() của hook không làm camera đổi -> không có
 * tile mới -> maplibre không vẽ lại -> 'idle' không bao giờ bắn thêm lần nào.
 *
 * Trước đây pha nhô lên CHỈ được kích từ 'idle', nên trong trường hợp này
 * camera đứng mãi ở preset intro (zoom 13.5, pitch 0) và 16 khối giữ chiều cao
 * 0 — tức là bản đồ trông như trống không. Các test dưới đây chốt lại rằng pha
 * nhô lên phải tự khởi động được mà không cần 'idle'.
 */
function createNeverIdleMap() {
  const listeners = new Map();
  const setDataCalls = [];
  const fitBoundsCalls = [];
  const easeToCalls = [];

  return {
    setDataCalls,
    fitBoundsCalls,
    easeToCalls,
    listeners,
    loaded: () => false,
    once: (event, cb) => listeners.set(event, cb),
    on: (event, cb) => listeners.set(event, cb),
    off: (event) => listeners.delete(event),
    jumpTo: () => {},
    stop: () => {},
    getPitch: () => 0,
    setPitch: () => {},
    easeTo: (opts) => easeToCalls.push(opts),
    project: () => ({ x: 0, y: 0 }),
    getSource: () => ({ setData: (d) => setDataCalls.push(d) }),
    fitBounds: (bounds, opts) => fitBoundsCalls.push({ bounds, opts }),
  };
}

function Harness({ phaseRef, ...props }) {
  const { phase } = useMapIntroAnimation(props);
  phaseRef.current = phase;
  return null;
}

let container;
let root;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  vi.useRealTimers();
});

function render(props) {
  const phaseRef = React.createRef();
  root = ReactDOM.createRoot(container);
  act(() => {
    root.render(<Harness phaseRef={phaseRef} {...props} />);
  });
  return phaseRef;
}

describe('useMapIntroAnimation watchdog', () => {
  it('chua chay pha nho len ngay lap tuc (van o waiting truoc moi kick)', () => {
    const map = createNeverIdleMap();
    const phaseRef = render({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA, 0),
      enabled: true,
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(phaseRef.current).toBe('waiting');
  });

  it("REGRESSION: pha nho len van khoi dong khi 'idle' khong bao gio ban", () => {
    const map = createNeverIdleMap();
    const workingData = createWorkingPlotsData(FARMS_GEOJSON_DATA, 0);
    const phaseRef = render({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData,
      enabled: true,
    });

    // Khong he co su kien 'idle' nao duoc ban ra o day.
    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Truoc khi sua, phase se ket mai o 'waiting'.
    expect(phaseRef.current).toBe('rising');
  });

  it('REGRESSION: camera duoc lenh bay tu preset intro sang overview', () => {
    const map = createNeverIdleMap();
    const phaseRef = render({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA, 0),
      enabled: true,
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(phaseRef.current).toBe('rising');
    // Day la assertion ma bo test cu thieu: khong ai kiem camera co thuc su
    // roi khoi preset intro hay khong, nen bug di thang ra production.
    expect(map.easeToCalls.length).toBe(1);
    const cam = map.easeToCalls[0];
    expect(cam.zoom).toBe(CAMERA.overview.zoom);
    expect(cam.pitch).toBe(CAMERA.overview.pitch);
    expect(cam.zoom).not.toBe(CAMERA.intro.zoom);
    expect(cam.pitch).not.toBe(CAMERA.intro.pitch);
  });

  it('CAMERA_INTRO_MS khong duoc dai hon pha nho len', () => {
    // settle goi map.setPitch() moi frame, ma setPitch huy animation camera
    // dang chay. Neu easeTo con do khi settle bat dau thi zoom bi dong bang
    // giua duong va khong bao gio tien toi CAMERA.overview.
    expect(CAMERA_INTRO_MS).toBeLessThanOrEqual(RISE_TOTAL_MS);
  });

  it('degrades to the settled state when the WebGL context is lost', () => {
    const map = createNeverIdleMap();
    const workingData = createWorkingPlotsData(FARMS_GEOJSON_DATA, 0);
    const phaseRef = render({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData,
      enabled: true,
    });

    act(() => {
      map.listeners.get('webglcontextlost')?.();
    });

    expect(phaseRef.current).toBe('done');
    workingData.features.forEach((f) =>
      expect(f.properties.riseHeight).toBe(RISE_SETTLE_HEIGHT)
    );
  });

  it('also covers the reduced-motion / compact branch that waits on idle', () => {
    const map = createNeverIdleMap();
    const workingData = createWorkingPlotsData(FARMS_GEOJSON_DATA, 0);
    const phaseRef = render({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData,
      enabled: true,
      skipRise: true,
    });

    expect(phaseRef.current).toBe('waiting');
    act(() => {
      vi.advanceTimersByTime(WATCHDOG_MS + 50);
    });
    expect(phaseRef.current).toBe('done');
    expect(map.fitBoundsCalls.length).toBeGreaterThan(0);
  });

  it('clears its timers on unmount without touching the map again', () => {
    const map = createNeverIdleMap();
    render({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA, 0),
      enabled: true,
    });

    act(() => root.unmount());
    root = null;
    const callsAfterUnmount = map.fitBoundsCalls.length;

    act(() => {
      vi.advanceTimersByTime(WATCHDOG_MS * 2);
    });
    expect(map.fitBoundsCalls.length).toBe(callsAfterUnmount);
    expect(map.listeners.has('idle')).toBe(false);
  });
});
