import { plotsData } from './plots';

const STORAGE_KEY = 'farmely_land_polygons_v5';
export const LAND_POLYGONS_CHANGED_EVENT = 'farmely:land-polygons-changed';

// Pixel traces for the 1000 × 687 cleaned farm image. The endpoints below were
// measured on the visible road edges and each cross-edge follows the direction
// of the photographed crop rows instead of using an evenly spaced screen grid.
const toMapPoint = ([x, y]) => [Number((x / 10).toFixed(2)), Number((y / 6.87).toFixed(2))];
const upperRoad = [[85, 86], [151, 99], [215, 112], [304, 131], [390, 149], [480, 168], [588, 190], [683, 210], [794, 233], [955, 267]];
const middleRoadUpper = [[85, 117], [151, 147], [215, 177], [304, 217], [390, 257], [480, 298], [588, 347], [683, 390], [794, 441], [955, 512]];
const middleRoadLower = middleRoadUpper;
const lowerRoad = [[0, 348], [85, 389], [157, 426], [247, 470], [337, 514], [426, 556], [519, 600], [609, 642], [700, 687], [860, 687]];
const cuChiShapes = [
  ...Array.from({ length: 9 }, (_, index) => [upperRoad[index], upperRoad[index + 1], middleRoadUpper[index + 1], middleRoadUpper[index]].map(toMapPoint)),
  ...Array.from({ length: 9 }, (_, index) => [middleRoadLower[index], middleRoadLower[index + 1], lowerRoad[index + 1], lowerRoad[index]].map(toMapPoint)),
];

// Normalized coordinates keep the demo overlays responsive. These are illustrative
// subdivisions; administrators can redraw each plot in the map editor.
export function defaultPolygons(landId) {
  const plots = plotsData.filter(plot => plot.landId === landId);
  if (landId === 'LND-001') return Object.fromEntries(plots.map((plot, index) => [plot.id, cuChiShapes[index]]));
  const columns = Math.max(4, Math.ceil(plots.length / 2));
  return Object.fromEntries(plots.map((plot, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const width = 91 / columns;
    const left = 4 + col * width;
    const top = row === 0 ? 9 + ((index * 7) % 8) : 55 + ((index * 5) % 7);
    const bottom = row === 0 ? 42 + ((index * 3) % 6) : 87 + ((index * 7) % 7);
    const drift = ((index * 7) % 5) - 2;
    return [plot.id, [
      [left + 0.5, top + (index % 3)],
      [left + width - 0.8, top + drift],
      [left + width - 1.5 + (index % 2), bottom - (index % 4)],
      [left + 0.2 - (index % 2), bottom + ((index + 1) % 3)],
    ]];
  }));
}

export function getLandPolygons(landId) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...defaultPolygons(landId), ...(saved[landId] || {}) };
  } catch {
    return defaultPolygons(landId);
  }
}

export function saveLandPolygon(landId, plotId, points) {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  saved[landId] = { ...(saved[landId] || {}), [plotId]: points };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  window.dispatchEvent(new CustomEvent(LAND_POLYGONS_CHANGED_EVENT, {
    detail: { landId, plotId, points },
  }));
}

export const mapCenters = {
  'LND-001': '10.759348,106.531906',
  'LND-002': '10.8251,106.8432',
  'LND-003': '11.7761,108.5639',
};
