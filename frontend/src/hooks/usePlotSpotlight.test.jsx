import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactDOM from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// maplibre-gl needs WebGL, which jsdom has no implementation for.
// Stub only Marker so we can assert the corner brackets are added AND removed.
const markerInstances = [];
vi.mock('maplibre-gl', () => ({
  Marker: class {
    constructor({ element }) {
      this.element = element;
      this.removed = false;
      markerInstances.push(this);
    }
    setLngLat(lngLat) {
      this.lngLat = lngLat;
      return this;
    }
    addTo() {
      this.added = true;
      return this;
    }
    remove() {
      this.removed = true;
      return this;
    }
  },
}));

const { default: usePlotSpotlight } = await import('./usePlotSpotlight');
const { LAYER_IDS, RISE_SETTLE_HEIGHT, SELECTED_HEIGHT, DASH_SEQUENCE, getStatusConfig } =
  await import('../utils/mapTheme');
const { createWorkingPlotsData, DIM_EXTRUSION_COLOR } = await import(
  '../components/marketplace/map/mapLayers'
);
const { FARMS_GEOJSON_DATA } = await import('../data/marketplaceGisData');

/** Bản đồ giả: ghi lại mọi paint property, filter và lệnh camera */
function createFakeMap() {
  const paint = {};
  const filters = {};
  const layers = new Set(Object.values(LAYER_IDS));
  const setDataCalls = [];
  const fitBoundsCalls = [];

  return {
    paint,
    filters,
    setDataCalls,
    fitBoundsCalls,
    getLayer: (id) => (layers.has(id) ? { id } : undefined),
    getSource: (id) =>
      id === LAYER_IDS.plotsSource
        ? { setData: (d) => setDataCalls.push(d) }
        : undefined,
    setPaintProperty: (layer, prop, value) => {
      paint[`${layer}.${prop}`] = value;
    },
    getPaintProperty: (layer, prop) => paint[`${layer}.${prop}`],
    setFilter: (layer, f) => {
      filters[layer] = f;
    },
    fitBounds: (bounds, opts) => fitBoundsCalls.push({ bounds, opts }),
  };
}

function Harness({ hookRef, ...props }) {
  const api = usePlotSpotlight(props);
  hookRef.current = api;
  return null;
}

let container;
let root;

beforeEach(() => {
  markerInstances.length = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
  // Deterministic rAF so animations run to completion synchronously-ish
  vi.stubGlobal('requestAnimationFrame', (cb) => setTimeout(() => cb(performance.now() + 10000), 0));
  vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function renderSpotlight(props) {
  const hookRef = React.createRef();
  root = ReactDOM.createRoot(container);
  await act(async () => {
    root.render(<Harness hookRef={hookRef} {...props} />);
  });
  // let the rAF chains settle
  await act(async () => {
    await new Promise((r) => setTimeout(r, 60));
  });
  return hookRef;
}

describe('usePlotSpotlight (asserted against a fake map)', () => {
  const selectedPlot = FARMS_GEOJSON_DATA.features[0].properties;

  it('raises the selected plot above its neighbours via fill-extrusion-height', async () => {
    const map = createFakeMap();
    const workingData = createWorkingPlotsData(FARMS_GEOJSON_DATA);

    await renderSpotlight({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData,
      selectedPlot,
      isReady: true,
    });

    expect(map.setDataCalls.length).toBeGreaterThan(0);
    const selected = workingData.features.find((f) => f.properties.id === selectedPlot.id);
    const others = workingData.features.filter((f) => f.properties.id !== selectedPlot.id);

    expect(selected.properties.riseHeight).toBeCloseTo(SELECTED_HEIGHT, 5);
    others.forEach((f) => expect(f.properties.riseHeight).toBeCloseTo(RISE_SETTLE_HEIGHT, 5));
    // the selected slab genuinely stands taller
    expect(selected.properties.riseHeight).toBeGreaterThan(others[0].properties.riseHeight);
  });

  it('darkens the world outside the farm AND the non-selected plots with non-zero opacity', async () => {
    const map = createFakeMap();
    await renderSpotlight({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA),
      selectedPlot,
      isReady: true,
    });

    const outside = map.paint[`${LAYER_IDS.farmDimOutside}.fill-opacity`];
    const plotsDim = map.paint[`${LAYER_IDS.plotsDim}.fill-opacity`];

    expect(outside).toBeGreaterThan(0);
    expect(plotsDim).toBeGreaterThan(0);
    expect(outside).toBeCloseTo(0.5, 5);
    // the dim layer excludes the selected plot
    expect(map.filters[LAYER_IDS.plotsDim]).toEqual(['!=', ['get', 'id'], selectedPlot.id]);
  });

  it('frames the plot with fitBounds instead of a hardcoded zoom', async () => {
    const map = createFakeMap();
    await renderSpotlight({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA),
      selectedPlot,
      isReady: true,
    });

    expect(map.fitBoundsCalls).toHaveLength(1);
    const { bounds, opts } = map.fitBoundsCalls[0];
    expect(bounds).toHaveLength(2);
    expect(opts.maxZoom).toBe(17.5);
    expect(opts.padding.right).toBe(420);
    // Thửa được chọn không được lọt vào vùng sidebar che (24px + 336px = 360px)
    expect(opts.padding.left).toBe(392);
    expect(opts.padding.left).toBeGreaterThan(360);
  });

  it('marches the selected border dasharray over time', async () => {
    vi.useFakeTimers();
    const map = createFakeMap();
    const hookRef = React.createRef();
    root = ReactDOM.createRoot(container);

    act(() => {
      root.render(
        <Harness
          hookRef={hookRef}
          map={map}
          plotsData={FARMS_GEOJSON_DATA}
          workingData={createWorkingPlotsData(FARMS_GEOJSON_DATA)}
          selectedPlot={selectedPlot}
          isReady
        />
      );
    });

    const key = `${LAYER_IDS.plotsSelectedBorder}.line-dasharray`;
    act(() => {
      vi.advanceTimersByTime(80);
    });
    const first = map.paint[key];
    expect(first).toBe(DASH_SEQUENCE[1]);

    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(map.paint[key]).toBe(DASH_SEQUENCE[3]);
    expect(map.paint[key]).not.toBe(first);
  });

  it('adds 4 corner brackets + 1 ripple, and removes them all on clear', async () => {
    const map = createFakeMap();
    const hookRef = await renderSpotlight({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA),
      selectedPlot,
      isReady: true,
    });

    // 4 góc vuông + 1 sóng radar ở tâm thửa
    expect(markerInstances).toHaveLength(5);
    const brackets = markerInstances.filter((m) => m.element.querySelector('.animate-bracketIn'));
    const ripples = markerInstances.filter((m) => m.element.querySelector('.animate-ripple'));
    expect(brackets).toHaveLength(4);
    expect(ripples).toHaveLength(1);

    // Sóng radar: animation (có transform) nằm trên vòng CON, không bao giờ trên
    // phần tử marker — MapLibre định vị marker bằng chính transform của nó
    const rippleEl = ripples[0].element;
    expect(rippleEl.className).not.toContain('animate-');
    expect(rippleEl.style.transform).toBe('');
    expect(rippleEl.querySelectorAll('.animate-ripple')).toHaveLength(3);

    brackets.forEach((m) => {
      // Marker element không được mang animation (có transform) — chỉ lớp con
      expect(m.element.className).not.toContain('animate-');
    });

    brackets.forEach((m, i) => {
      expect(m.added).toBe(true);
      // Rotation lives on the inner <svg>: MapLibre overwrites the marker
      // element's own style.transform when it positions the marker.
      expect(m.element.style.transform).toBe('');
      expect(m.element.querySelector('svg').style.transform).toBe(`rotate(${i * 90}deg)`);
      const enter = m.element.querySelector('.animate-bracketIn');
      expect(enter.style.animationDelay).toBe(`${[0, 60, 120, 180][i]}ms`);
    });

    await act(async () => {
      hookRef.current.clear();
      await new Promise((r) => setTimeout(r, 60));
    });

    markerInstances.forEach((m) => expect(m.removed).toBe(true));
  });

  it('clear() undoes the dim and drops every slab back to the settled height', async () => {
    const map = createFakeMap();
    const workingData = createWorkingPlotsData(FARMS_GEOJSON_DATA);
    const hookRef = await renderSpotlight({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData,
      selectedPlot,
      isReady: true,
    });

    await act(async () => {
      hookRef.current.clear();
      await new Promise((r) => setTimeout(r, 60));
    });

    expect(map.paint[`${LAYER_IDS.farmDimOutside}.fill-opacity`]).toBeCloseTo(0, 5);
    expect(map.paint[`${LAYER_IDS.plotsDim}.fill-opacity`]).toBeCloseTo(0, 5);
    workingData.features.forEach((f) =>
      expect(f.properties.riseHeight).toBeCloseTo(RISE_SETTLE_HEIGHT, 5)
    );
  });

  it('does nothing and never throws when the map is not ready yet', async () => {
    const map = createFakeMap();
    await renderSpotlight({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA),
      selectedPlot,
      isReady: false,
    });

    expect(map.fitBoundsCalls).toHaveLength(0);
    expect(markerInstances).toHaveLength(0);
  });

  it('survives a map whose layers do not exist (selecting mid-intro)', async () => {
    const bare = {
      getLayer: () => undefined,
      getSource: () => undefined,
      setPaintProperty: () => {},
      getPaintProperty: () => undefined,
      setFilter: () => {},
      fitBounds: () => {},
    };

    await expect(
      renderSpotlight({
        map: bare,
        plotsData: FARMS_GEOJSON_DATA,
        workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA),
        selectedPlot,
        isReady: true,
      })
    ).resolves.toBeTruthy();
  });
});

describe('selected-plot accent follows the real status', () => {
  const rentedPlot = FARMS_GEOJSON_DATA.features.find(
    (f) => getStatusConfig(f.properties.status).key === 'RENTED'
  )?.properties;

  it('drives glow, border, fill AND the corner brackets from one status entry', async () => {
    expect(rentedPlot).toBeTruthy();
    const map = createFakeMap();
    await renderSpotlight({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA),
      selectedPlot: rentedPlot,
      isReady: true,
    });

    const rented = getStatusConfig('RENTED');
    const available = getStatusConfig('AVAILABLE');

    expect(map.paint[`${LAYER_IDS.plotsSelectedGlow}.line-color`]).toBe(rented.strokeColor);
    expect(map.paint[`${LAYER_IDS.plotsSelectedBorder}.line-color`]).toBe(rented.color);
    expect(map.paint[`${LAYER_IDS.plotsSelectedFill}.fill-color`]).toBe(rented.color);
    expect(map.paint[`${LAYER_IDS.plotsSelectedBorder}.line-color`]).not.toBe(available.color);

    // 4 góc vuông dùng ĐÚNG màu của glow, không còn lệch tông
    markerInstances.forEach((m) =>
      expect(m.element.innerHTML).toContain(rented.strokeColor)
    );
  });

  it('dims the 3D slabs of the non-selected plots through fill-extrusion-color', async () => {
    const map = createFakeMap();
    const selectedPlot = FARMS_GEOJSON_DATA.features[0].properties;
    const hookRef = await renderSpotlight({
      map,
      plotsData: FARMS_GEOJSON_DATA,
      workingData: createWorkingPlotsData(FARMS_GEOJSON_DATA),
      selectedPlot,
      isReady: true,
    });

    const key = `${LAYER_IDS.plotsExtrusion}.fill-extrusion-color`;
    const selectedExpr = map.paint[key];
    expect(selectedExpr[0]).toBe('case');
    expect(selectedExpr[1]).toEqual(['==', ['get', 'id'], selectedPlot.id]);
    expect(selectedExpr.at(-1)).toBe(DIM_EXTRUSION_COLOR);

    await act(async () => {
      hookRef.current.clear();
      await new Promise((r) => setTimeout(r, 60));
    });

    // clear() trả mọi khối về màu trạng thái
    expect(map.paint[key][0]).toBe('match');
  });
});

describe('createWorkingPlotsData', () => {
  it('never mutates the imported FARMS_GEOJSON_DATA', () => {
    const before = JSON.stringify(FARMS_GEOJSON_DATA);
    const copy = createWorkingPlotsData(FARMS_GEOJSON_DATA);
    copy.features.forEach((f) => {
      f.properties.riseHeight = 999;
    });
    expect(JSON.stringify(FARMS_GEOJSON_DATA)).toBe(before);
    FARMS_GEOJSON_DATA.features.forEach((f) =>
      expect(f.properties.riseHeight).toBeUndefined()
    );
  });

  it('seeds riseHeight on every feature', () => {
    const copy = createWorkingPlotsData(FARMS_GEOJSON_DATA);
    expect(copy.features).toHaveLength(FARMS_GEOJSON_DATA.features.length);
    copy.features.forEach((f) =>
      expect(f.properties.riseHeight).toBe(RISE_SETTLE_HEIGHT)
    );
  });
});
