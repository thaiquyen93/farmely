/**
 * GEO UTILS — Các hàm hình học thuần (pure) dùng cho bản đồ Marketplace.
 *
 * Không phụ thuộc MapLibre hay DOM nên có thể unit-test trực tiếp.
 * Mọi toạ độ ở dạng GeoJSON [lng, lat].
 */

// Lấy ring ngoài cùng của 1 Polygon Feature (hoặc chính mảng toạ độ truyền vào)
function extractOuterRing(feature) {
  if (!feature) return [];
  if (Array.isArray(feature)) return feature;

  const geometry = feature.geometry || feature;
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];

  // Polygon -> coordinates[0] là ring ngoài. Nếu đã là ring thì dùng luôn.
  const first = coordinates[0];
  if (Array.isArray(first) && typeof first[0] === 'number') return coordinates;
  return Array.isArray(first) ? first : [];
}

function isSamePosition(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

/**
 * Trả về danh sách các góc PHÂN BIỆT của ring, bỏ điểm đóng bị lặp lại.
 * Hoạt động với cả ring đã đóng (điểm cuối === điểm đầu) và ring mở.
 */
export function getRingCorners(feature) {
  const ring = extractOuterRing(feature);
  if (ring.length === 0) return [];

  const corners = ring.slice();
  while (corners.length > 1 && isSamePosition(corners[0], corners[corners.length - 1])) {
    corners.pop();
  }
  return corners;
}

/**
 * Tâm hình học thực sự (centroid) của polygon theo công thức diện tích có dấu.
 * Nếu diện tích suy biến về 0 thì fallback về trung bình cộng các góc.
 */
export function getCentroid(feature) {
  const corners = getRingCorners(feature);
  if (corners.length === 0) return [106.345, 10.69];
  if (corners.length < 3) {
    return [
      corners.reduce((s, p) => s + p[0], 0) / corners.length,
      corners.reduce((s, p) => s + p[1], 0) / corners.length,
    ];
  }

  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (let i = 0; i < corners.length; i += 1) {
    const [x0, y0] = corners[i];
    const [x1, y1] = corners[(i + 1) % corners.length];
    const cross = x0 * y1 - x1 * y0;
    twiceArea += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }

  if (twiceArea === 0) {
    return [
      corners.reduce((s, p) => s + p[0], 0) / corners.length,
      corners.reduce((s, p) => s + p[1], 0) / corners.length,
    ];
  }

  const factor = 1 / (3 * twiceArea);
  return [x * factor, y * factor];
}

/** Hộp bao (bounding box) dạng [[minLng, minLat], [maxLng, maxLat]] */
export function getFeatureBBox(feature) {
  const corners = getRingCorners(feature);
  if (corners.length === 0) {
    return [
      [106.342, 10.686],
      [106.352, 10.696],
    ];
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  corners.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/** Kẹp giá trị vào khoảng [0, 1] */
export function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/** Easing giảm dần — nhanh ở đầu, êm ở cuối */
export function easeOutCubic(t) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

/** Easing vào-ra mượt hai đầu */
export function easeInOutCubic(t) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function closeRing(ring) {
  const out = ring.slice();
  if (out.length > 0 && !isSamePosition(out[0], out[out.length - 1])) {
    out.push([out[0][0], out[0][1]]);
  }
  return out;
}

/** Diện tích có dấu của 1 ring: > 0 là ngược chiều kim đồng hồ (CCW) */
function signedArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[(i + 1) % ring.length];
    area += x0 * y1 - x1 * y0;
  }
  return area / 2;
}

function orientRing(ring, wantCounterClockwise) {
  const distinct = getRingCorners(ring);
  const isCCW = signedArea(distinct) > 0;
  const oriented = isCCW === wantCounterClockwise ? distinct : distinct.slice().reverse();
  return closeRing(oriented);
}

/**
 * Tạo mặt nạ (mask) phủ toàn thế giới với 1 "lỗ" đúng bằng ranh giới trang trại,
 * dùng để làm tối mọi thứ bên ngoài khu đất.
 *
 * Theo RFC 7946: ring ngoài ngược chiều kim đồng hồ (CCW), ring lỗ cùng chiều (CW).
 */
export function buildWorldMaskWithHole(ringCoords) {
  const world = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
  ];

  const outer = orientRing(world, true);
  const hole = orientRing(ringCoords || [], false);

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: hole.length > 3 ? [outer, hole] : [outer],
    },
  };
}

/** Hướng của 1 ring (export để test winding) */
export function getRingWinding(ring) {
  return signedArea(getRingCorners(ring)) > 0 ? 'ccw' : 'cw';
}
