/**
 * MAP THEME — Nguồn sự thật duy nhất cho màu sắc, id layer và preset camera
 * của bản đồ Marketplace.
 *
 * Dữ liệu GIS lưu `status` ở dạng NHÃN tiếng Việt ('Đang trống') nhưng phần
 * còn lại của app lại so sánh bằng KEY ('AVAILABLE'). getStatusConfig chuẩn hoá
 * cả hai dạng và luôn trả về một entry an toàn.
 */

import { GIS_STATUSES } from '../data/marketplaceGisData';

export const FALLBACK_STATUS_KEY = 'MAINTENANCE';

// Bảng tra cứu: nhãn-đã-chuẩn-hoá / key-đã-chuẩn-hoá -> entry GIS_STATUSES
const STATUS_LOOKUP = (() => {
  const lookup = new Map();
  Object.values(GIS_STATUSES).forEach((entry) => {
    lookup.set(normalizeStatusToken(entry.key), entry);
    lookup.set(normalizeStatusToken(entry.label), entry);
  });
  return lookup;
})();

function normalizeStatusToken(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Chuẩn hoá nhãn / key / giá trị rác -> 1 entry GIS_STATUSES.
 * Không bao giờ throw; giá trị không nhận diện được trả về fallback.
 */
export function getStatusConfig(status) {
  const token = normalizeStatusToken(status);
  if (token && STATUS_LOOKUP.has(token)) {
    return STATUS_LOOKUP.get(token);
  }
  return GIS_STATUSES[FALLBACK_STATUS_KEY];
}

/** Trạng thái này có phải "đang trống" (có thể thuê) không */
export function isAvailableStatus(status) {
  return getStatusConfig(status).key === 'AVAILABLE';
}

/** Tất cả id source & layer của bản đồ, tập trung một chỗ */
export const LAYER_IDS = {
  // sources
  satelliteSource: 'satellite-tiles',
  farmBoundarySource: 'farm-boundary',
  plotsSource: 'plots',
  farmDimSource: 'farm-dim-outside-src',
  // layers
  satellite: 'satellite',
  farmBoundaryLine: 'farm-boundary-line',
  plotsExtrusion: 'plots-extrusion',
  plotsFill: 'plots-fill',
  plotsFillHover: 'plots-fill-hover',
  plotsOutlineSoft: 'plots-outline-soft',
  plotsOutline: 'plots-outline',
  plotsDim: 'plots-dim',
  plotsSelectedGlow: 'plots-selected-glow',
  plotsSelectedBorder: 'plots-selected-border',
  plotsSelectedFill: 'plots-selected-fill',
  farmDimOutside: 'farm-dim-outside',
};

// Chiều cao khối 3D (mét)
export const RISE_PEAK_HEIGHT = 26;
export const RISE_SETTLE_HEIGHT = 4;
export const SELECTED_HEIGHT = 14;

/** Chuỗi dasharray tạo hiệu ứng "marching ants" khi bước qua từng frame */
export const DASH_SEQUENCE = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

/** Lấy dasharray tại frame thứ n (cyclic) */
export function dashSequenceAt(frame) {
  const n = Number.isFinite(frame) ? Math.floor(frame) : 0;
  const len = DASH_SEQUENCE.length;
  const idx = ((n % len) + len) % len;
  return DASH_SEQUENCE[idx];
}

/** Khung bao quát toàn bộ 16 thửa + 4 mốc GPS (trước đây bị lặp 3 nơi) */
export const OVERVIEW_BOUNDS = [
  [106.343656, 10.680931],
  [106.356997, 10.694331],
];

// left: sidebar chiếm left-6 (24px) + w-84 (336px) = 360px -> chừa thêm khoảng thở.
// right: drawer chiếm lg:right-4 (16px) + 370px = 386px.
export const OVERVIEW_PADDING = { top: 90, bottom: 60, left: 384, right: 404 };

export const FOCUS_PADDING = { top: 110, bottom: 90, left: 392, right: 420 };

/** Các preset camera của màn hình Marketplace */
export const CAMERA = {
  intro: { zoom: 13.5, pitch: 0, bearing: -8 },
  overview: { zoom: 15.1, pitch: 50, bearing: -8 },
  settled: { pitch: 40, bearing: -8 },
  focused: { pitch: 45, bearing: -8, maxZoom: 17.5 },
  bounds: OVERVIEW_BOUNDS,
  padding: OVERVIEW_PADDING,
};

/** Pitch rút gọn cho mobile (dưới breakpoint lg) để đỡ GPU */
export const MOBILE_PITCH = 25;

/**
 * Biểu thức MapLibre ['match', ...] phủ cả 4 trạng thái theo CẢ nhãn lẫn key.
 * @param {string} property tên thuộc tính trong GIS_STATUSES (vd 'color', 'fillColor')
 */
export function buildStatusColorExpression(property = 'color') {
  const expression = ['match', ['get', 'status']];

  Object.values(GIS_STATUSES).forEach((entry) => {
    expression.push(entry.key, entry[property]);
    expression.push(entry.label, entry[property]);
  });

  expression.push(GIS_STATUSES[FALLBACK_STATUS_KEY][property]);
  return expression;
}
