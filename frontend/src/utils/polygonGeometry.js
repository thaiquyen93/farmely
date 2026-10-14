/**
 * Hình học đa giác phía client — cùng quy tắc với backend
 * (farm-service: com.farmely.farm.geo.PolygonGeometry) để bản đồ báo lỗi ngay khi vẽ.
 * Server vẫn là nơi kiểm tra cuối cùng.
 *
 * Mỗi điểm là [lng, lat] (WGS84). Ring là danh sách đỉnh MỞ (không lặp điểm đầu ở cuối).
 */

export const EARTH_RADIUS_M = 6378137;
const EPS = 1e-7;
const rad = (d) => (d * Math.PI) / 180;

/** Bỏ điểm trùng liên tiếp và điểm đóng; không ném lỗi */
export function cleanRing(ring = []) {
  const out = [];
  for (const p of ring) {
    if (!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    const last = out[out.length - 1];
    if (!last || !samePoint(last, p)) out.push([p[0], p[1]]);
  }
  if (out.length > 1 && samePoint(out[0], out[out.length - 1])) out.pop();
  return out;
}

export function samePoint(a, b) {
  return Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;
}

/** Diện tích m² (công thức cầu, giống turf.js / backend) */
export function areaM2(ring) {
  const n = ring?.length || 0;
  if (n < 3) return 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    total += rad(p2[0] - p1[0]) * (2 + Math.sin(rad(p1[1])) + Math.sin(rad(p2[1])));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

/** Khoảng cách haversine (m) */
export function distanceM(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function perimeterM(ring, closed = true) {
  const n = ring?.length || 0;
  let total = 0;
  for (let i = 0; i < n - (closed ? 0 : 1); i++) total += distanceM(ring[i], ring[(i + 1) % n]);
  return n < 2 ? 0 : total;
}

const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
function orient(o, a, b) {
  const len = Math.hypot(a[0] - o[0], a[1] - o[1]);
  const d = len === 0 ? 0 : cross(o, a, b) / len;
  return d > EPS ? 1 : d < -EPS ? -1 : 0;
}
const onSegment = (p, a, b) =>
  Math.min(a[0], b[0]) - EPS <= p[0] && p[0] <= Math.max(a[0], b[0]) + EPS &&
  Math.min(a[1], b[1]) - EPS <= p[1] && p[1] <= Math.max(a[1], b[1]) + EPS;

function segmentsTouch(a1, a2, b1, b2) {
  const o1 = orient(a1, a2, b1), o2 = orient(a1, a2, b2), o3 = orient(b1, b2, a1), o4 = orient(b1, b2, a2);
  if (o1 !== o2 && o3 !== o4 && o1 && o2 && o3 && o4) return true;
  return (o1 === 0 && onSegment(b1, a1, a2)) || (o2 === 0 && onSegment(b2, a1, a2)) ||
    (o3 === 0 && onSegment(a1, b1, b2)) || (o4 === 0 && onSegment(a2, b1, b2));
}
const properCross = (a1, a2, b1, b2) =>
  orient(a1, a2, b1) * orient(a1, a2, b2) < 0 && orient(b1, b2, a1) * orient(b1, b2, a2) < 0;

/** Không có hai cạnh không kề nhau nào cắt/chạm nhau */
export function isSimple(ring) {
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (segmentsTouch(ring[i], ring[(i + 1) % n], ring[j], ring[(j + 1) % n])) return false;
    }
  }
  return true;
}

function anyProperCrossing(a, b) {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (properCross(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
    }
  }
  return false;
}

function onBoundary(p, ring) {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (orient(a, b, p) === 0 && onSegment(p, a, b)) return true;
  }
  return false;
}

function pointInRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const strictlyInside = (p, ring) => !onBoundary(p, ring) && pointInRing(p, ring);

/** Điểm chắc chắn nằm trong đa giác (đúng cả với đa giác lõm) — dùng đặt nhãn */
export function interiorPoint(ring) {
  const c = [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
  if (strictlyInside(c, ring)) return c;
  const xs = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > c[1] !== yj > c[1]) xs.push(((xj - xi) * (c[1] - yi)) / (yj - yi) + xi);
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    const m = [(xs[k] + xs[k + 1]) / 2, c[1]];
    if (strictlyInside(m, ring)) return m;
  }
  return ring[0];
}

/** inner nằm trọn trong outer (chạm hàng rào vẫn tính là trong) */
export function contains(outer, inner) {
  if (anyProperCrossing(outer, inner)) return false;
  if (inner.some((p) => !onBoundary(p, outer) && !pointInRing(p, outer))) return false;
  const s = interiorPoint(inner);
  return onBoundary(s, outer) || pointInRing(s, outer);
}

function bbox(ring) {
  return ring.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
}
export function ringBounds(ring) {
  const b = bbox(ring);
  return [[b[0], b[1]], [b[2], b[3]]];
}

/** Hai vùng có phần diện tích chung (chỉ chạm cạnh/đỉnh thì không tính) */
export function overlaps(a, b) {
  const ba = bbox(a);
  const bb = bbox(b);
  if (ba[0] > bb[2] + EPS || bb[0] > ba[2] + EPS || ba[1] > bb[3] + EPS || bb[1] > ba[3] + EPS) return false;
  if (anyProperCrossing(a, b)) return true;
  if (a.some((p) => strictlyInside(p, b)) || b.some((p) => strictlyInside(p, a))) return true;
  return strictlyInside(interiorPoint(a), b) || strictlyInside(interiorPoint(b), a);
}

/**
 * Kiểm tra 1 ring trong ngữ cảnh: nằm trong `outer` (nếu có), không đè lên `others`.
 * @returns {{ ok: boolean, errors: string[], areaM2: number }}
 */
export function validateRing(ring, { outer = null, outerName = 'nông trại', others = [], mustContain = [] } = {}) {
  const r = cleanRing(ring);
  const errors = [];
  if (r.length < 3) return { ok: false, errors: ['Cần ít nhất 3 đỉnh để tạo thành một vùng.'], areaM2: 0 };
  if (!isSimple(r)) errors.push('Các cạnh đang cắt nhau. Hãy kéo lại đỉnh để vùng không tự cắt.');
  const area = areaM2(r);
  if (area < 1) errors.push('Diện tích quá nhỏ (dưới 1 m²).');
  if (!errors.length && outer && cleanRing(outer).length >= 3 && !contains(cleanRing(outer), r)) {
    errors.push(`Vùng vẽ đang lòi ra ngoài ranh giới ${outerName}.`);
  }
  if (!errors.length) {
    const clashes = others.filter((o) => o?.ring && cleanRing(o.ring).length >= 3 && overlaps(r, cleanRing(o.ring))).map((o) => o.label);
    if (clashes.length) errors.push(`Đang đè lên thửa: ${clashes.join(', ')}. Hai thửa chỉ được chạm chung bờ.`);
  }
  if (!errors.length) {
    const left = mustContain.filter((o) => o?.ring && cleanRing(o.ring).length >= 3 && !contains(r, cleanRing(o.ring))).map((o) => o.label);
    if (left.length) errors.push(`Các thửa sau sẽ nằm ngoài ranh giới mới: ${left.join(', ')}.`);
  }
  return { ok: errors.length === 0, errors, areaM2: area };
}

/** 12 345.6 m² -> "12.346 m² (1,23 ha)" */
export function formatArea(m2) {
  if (!Number.isFinite(m2) || m2 <= 0) return '—';
  const sqm = `${Math.round(m2).toLocaleString('vi-VN')} m²`;
  return m2 >= 10000 ? `${sqm} (${(m2 / 10000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ha)` : sqm;
}

export function formatLength(m) {
  if (!Number.isFinite(m) || m <= 0) return '—';
  return m >= 1000 ? `${(m / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} km` : `${Math.round(m).toLocaleString('vi-VN')} m`;
}

/** "10.6876, 106.3502" hoặc "10.6876° N, 106.3502° E" -> [lng, lat] | null */
export function parseLatLng(text) {
  const nums = String(text || '').match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  let lat = parseFloat(nums[0]);
  let lng = parseFloat(nums[1]);
  if (/\bS\b/i.test(text)) lat = -Math.abs(lat);
  if (/\bW\b/i.test(text)) lng = -Math.abs(lng);
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) [lat, lng] = [lng, lat];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lng, lat];
}

// ─────────────────────── Nhập toạ độ GPS cho ranh giới nông trại ───────────────────────

const HEMI = { N: 1, S: -1, E: 1, W: -1, B: 1, Đ: 1, Ð: 1, T: -1 }; // B=Bắc, Đ=Đông, T=Tây (N/S/E/W chuẩn)

/** "10°41'22.19\"N" | "10 41 22.19 N" | "10.689497" -> số độ thập phân, hoặc null */
function parseAngle(part) {
  const s = String(part).trim().toUpperCase().replace(/[’′]/g, "'").replace(/[”″]/g, '"').replace(/''/g, '"');
  const hemi = (s.match(/[NSEWBĐÐT]\s*$/) || s.match(/^[NSEWBĐÐT]/) || [])[0]?.trim();
  const nums = (s.match(/-?\d+(?:[.,]\d+)?/g) || []).map((n) => parseFloat(n.replace(',', '.')));
  if (!nums.length || nums.length > 3) return null;
  const [d, m = 0, sec = 0] = nums;
  if (m < 0 || m >= 60 || sec < 0 || sec >= 60) return null;
  let v = Math.abs(d) + m / 60 + sec / 3600;
  if (d < 0) v = -v;
  if (hemi) v = Math.abs(v) * HEMI[hemi];
  return { value: v, hemi };
}

/**
 * 1 dòng toạ độ -> { point: [lng, lat] } hoặc { error }.
 * Chấp nhận: "10.689497, 106.343656" · "10°41'22.19\"N 106°20'37.16\"E" · "10 41 22.19 N, 106 20 37.16 E".
 * Không có ký hiệu N/E thì hiểu là "vĩ độ, kinh độ" (thứ tự của Google Maps).
 */
export function parseGpsPoint(text) {
  const raw = String(text || '').trim();
  if (!raw) return { error: 'Dòng trống' };
  let parts;
  if (/[°'"NSEWBĐÐT]/i.test(raw) && /[NSEWBĐÐT]/i.test(raw)) {
    // tách sau ký hiệu bán cầu đầu tiên: "...N 106..." hoặc "...N, 106..."
    const m = raw.match(/^(.*?[NSBnsb])\s*[,;]?\s*(.+)$/) || raw.match(/^(.*?[EWĐÐTewđt])\s*[,;]?\s*(.+)$/);
    parts = m ? [m[1], m[2]] : raw.split(/[,;]/);
  } else {
    parts = raw.split(/[,;\t]|\s+(?=-?\d)/).filter((x) => x.trim());
    if (parts.length > 2) {
      // "10 41 22 106 20 37" không rõ ràng -> từ chối
      return { error: 'Không rõ đâu là vĩ độ, đâu là kinh độ. Hãy ngăn cách bằng dấu phẩy.' };
    }
  }
  if (parts.length !== 2) return { error: 'Cần đúng 2 giá trị: vĩ độ và kinh độ.' };
  const a = parseAngle(parts[0]);
  const b = parseAngle(parts[1]);
  if (!a || !b) return { error: 'Không đọc được toạ độ. Ví dụ đúng: 10.689497, 106.343656' };
  let lat = a.value;
  let lng = b.value;
  // có ký hiệu E/W ở phần đầu -> người dùng ghi kinh độ trước
  if (a.hemi && /[EWĐÐT]/.test(a.hemi)) [lat, lng] = [b.value, a.value];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { error: 'Vĩ độ phải trong ±90°, kinh độ trong ±180°.' };
  return { point: [lng, lat] };
}

/** Điểm p [lng, lat] nằm trong (hoặc trên biên) đa giác */
export function pointInPolygon(p, ring) {
  const r = cleanRing(ring);
  if (!p || r.length < 3) return false;
  return onBoundary(p, r) || pointInRing(p, r);
}
