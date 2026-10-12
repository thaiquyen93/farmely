import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactDOM from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom không có WebGL nên maplibre thật sẽ ném lỗi. Mock lại để điều khiển
// chính xác hai kịch bản hỏng mà chrome của trang từng bị kẹt vì chúng.
const mapBehaviour = { throwOnConstruct: false, fireLoad: false, canvas: null };

vi.mock('maplibre-gl', () => {
  class Map {
    constructor() {
      if (mapBehaviour.throwOnConstruct) {
        throw new Error('WebGL not supported');
      }
      this.handlers = new Map_();
      // Canvas giả có đủ addEventListener để test được webglcontextlost
      this.canvas = document.createElement('canvas');
      mapBehaviour.canvas = this.canvas;
    }
    on(event, a, b) {
      if (event === 'load' && mapBehaviour.fireLoad) (b || a)();
    }
    once() {}
    off() {}
    remove() {}
    getCanvas() {
      return this.canvas;
    }
  }
  class Map_ extends global.Map {}
  class Marker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {
      return this;
    }
  }
  return { Map, Marker };
});

const { default: MarketplaceInteractiveMap } = await import('./MarketplaceInteractiveMap');
const { FARMS_GEOJSON_DATA } = await import('../../data/marketplaceGisData');

let container;
let root;

beforeEach(() => {
  mapBehaviour.throwOnConstruct = false;
  mapBehaviour.fireLoad = false;
  mapBehaviour.canvas = null;
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  vi.useRealTimers();
});

function render(onPhaseChange) {
  root = ReactDOM.createRoot(container);
  act(() => {
    root.render(
      <MarketplaceInteractiveMap
        plotsData={FARMS_GEOJSON_DATA}
        selectedPlot={FARMS_GEOJSON_DATA.features[0].properties}
        onPhaseChange={onPhaseChange}
      />
    );
  });
}

describe('MarketplaceInteractiveMap degradation', () => {
  it("reports 'done' and tháo màn che khi không khởi tạo được bản đồ (không có WebGL)", () => {
    mapBehaviour.throwOnConstruct = true;
    const onPhaseChange = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(onPhaseChange);
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onPhaseChange).toHaveBeenLastCalledWith('done');
    expect(container.querySelector('[role="status"]')).toBeNull();
    errorSpy.mockRestore();
  });

  it("reports 'done' sau watchdog khi sự kiện 'load' không bao giờ bắn", () => {
    const onPhaseChange = vi.fn();
    render(onPhaseChange);

    // Màn che vẫn còn trong lúc chờ
    expect(onPhaseChange).toHaveBeenLastCalledWith('waiting');
    expect(container.querySelector('[role="status"]')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(onPhaseChange).toHaveBeenLastCalledWith('done');
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("reports 'done' khi WebGL context bị mất giữa đường", () => {
    const onPhaseChange = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(onPhaseChange);

    expect(onPhaseChange).toHaveBeenLastCalledWith('waiting');

    act(() => {
      mapBehaviour.canvas.dispatchEvent(new window.Event('webglcontextlost'));
    });

    expect(onPhaseChange).toHaveBeenLastCalledWith('done');
    errorSpy.mockRestore();
  });
});
