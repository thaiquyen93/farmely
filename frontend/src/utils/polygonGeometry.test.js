import { describe, it, expect } from 'vitest';
import {
  areaM2, cleanRing, isSimple, contains, overlaps, validateRing,
  formatArea, parseLatLng, interiorPoint, perimeterM,
  parseGpsPoint, pointInPolygon
} from './polygonGeometry';

const D = 0.001;
const sq = (lng, lat, d = D) => [[lng, lat], [lng + d, lat], [lng + d, lat + d], [lng, lat + d]];

describe('GPS input for land location', () => {
  it('parses decimal "lat, lng" (Google Maps order)', () => {
    expect(parseGpsPoint('10.689497, 106.343656').point).toEqual([106.343656, 10.689497]);
    expect(parseGpsPoint('10.689497 106.343656').point).toEqual([106.343656, 10.689497]);
  });

  it('parses degree-minute-second with hemispheres, matching the existing farm data', () => {
    // FARM_GPS_BOUNDS.topLeft: 10°41'22.19"N 106°20'37.16"E => lat=10.689497, lng=106.343656
    const p = parseGpsPoint(`10°41'22.19"N 106°20'37.16"E`).point;
    expect(p[1]).toBeCloseTo(10.689497, 5);
    expect(p[0]).toBeCloseTo(106.343656, 5);
    expect(parseGpsPoint('10 41 22.19 N, 106 20 37.16 E').point[1]).toBeCloseTo(10.689497, 5);
    expect(parseGpsPoint(`106°20'37.16"E 10°41'22.19"N`).point[1]).toBeCloseTo(10.689497, 5);
    expect(parseGpsPoint(`33°51'S 151°12'E`).point[1]).toBeLessThan(0);
  });

  it('rejects garbage with a readable reason', () => {
    expect(parseGpsPoint('abc').error).toBeTruthy();
    expect(parseGpsPoint('95, 106').error).toMatch(/±90/);
    expect(parseGpsPoint('10').error).toMatch(/2 giá trị/);
  });

  it('pin inside / outside a drawn boundary', () => {
    const land = [[106.35, 10.68], [106.354, 10.68], [106.354, 10.684], [106.35, 10.684]];
    expect(pointInPolygon([106.352, 10.682], land)).toBe(true);
    expect(pointInPolygon([106.35, 10.682], land)).toBe(true);
    expect(pointInPolygon([106.36, 10.682], land)).toBe(false);
    expect(pointInPolygon(null, land)).toBe(false);
  });
});

describe('polygonGeometry (khớp backend PolygonGeometryTest)', () => {
  it('area matches the backend spherical formula', () => {
    const a = areaM2(sq(106.35, 10.68));
    expect(a).toBeGreaterThan(12000);
    expect(a).toBeLessThan(12250);
    // cùng số với API thật đã trả: 12180.54
    expect(Math.round(areaM2(sq(106.3, 10.6)) * 100) / 100).toBeCloseTo(12180.54, 1);
  });

  it('cleans closing point and duplicates', () => {
    expect(cleanRing([[1, 1], [1, 1], [2, 1], [2, 2], [1, 1]])).toEqual([[1, 1], [2, 1], [2, 2]]);
  });

  it('detects self-intersection', () => {
    expect(isSimple(sq(106.35, 10.68))).toBe(true);
    expect(isSimple([[0, 0], [0.001, 0.001], [0.001, 0], [0, 0.001]])).toBe(false);
  });

  it('contains allows touching the fence, rejects sticking out', () => {
    const land = sq(106.35, 10.68, D * 4);
    expect(contains(land, sq(106.351, 10.681))).toBe(true);
    expect(contains(land, sq(106.35, 10.68))).toBe(true);
    expect(contains(land, sq(106.3535, 10.681))).toBe(false);
  });

  it('neighbours sharing an edge or corner do not overlap; real overlaps do', () => {
    const a = sq(106.35, 10.68);
    expect(overlaps(a, sq(106.35 + D, 10.68))).toBe(false);
    expect(overlaps(a, sq(106.35 + D, 10.68 + D))).toBe(false);
    expect(overlaps(a, sq(106.3505, 10.6805))).toBe(true);
    expect(overlaps(a, sq(106.3502, 10.6802, D / 4))).toBe(true);
    expect(overlaps(a, sq(106.35, 10.68))).toBe(true);
  });

  it('interior point of a U shape lies inside it', () => {
    const u = [[0, 0], [0.003, 0], [0.003, 0.003], [0.002, 0.003], [0.002, 0.001], [0.001, 0.001], [0.001, 0.003], [0, 0.003]];
    expect(overlaps(u, sq(0.0012, 0.0015, 0.0005))).toBe(false);
    expect(pointInPolygon(interiorPoint(u), u)).toBe(true);
  });

  it('validateRing explains every problem in Vietnamese', () => {
    expect(validateRing([[0, 0], [1, 1]]).errors[0]).toMatch(/ít nhất 3 đỉnh/);
    const outer = sq(106.35, 10.68, D * 4);
    expect(validateRing(sq(106.3535, 10.681), { outer, outerName: 'Happy Valley' }).errors[0]).toMatch(/lòi ra ngoài ranh giới Happy Valley/);
    const r = validateRing(sq(106.3505, 10.6805), { outer, others: [{ label: 'P-01', ring: sq(106.35, 10.68) }] });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/P-01/);
    expect(validateRing(sq(106.351, 10.681), { outer }).ok).toBe(true);
    const shrunk = validateRing(sq(106.36, 10.69), { mustContain: [{ label: 'P-07', ring: sq(106.35, 10.68) }] });
    expect(shrunk.errors[0]).toMatch(/P-07/);
  });

  it('formats area, perimeter and parses coordinates', () => {
    expect(formatArea(850)).toBe('850 m²');
    expect(formatArea(12180.5)).toBe('12.181 m² (1,22 ha)');
    expect(perimeterM(sq(106.35, 10.68))).toBeGreaterThan(430);
    expect(parseLatLng('10.6876, 106.3502')).toEqual([106.3502, 10.6876]);
    expect(parseLatLng('11.0842° N, 106.5298° E')).toEqual([106.5298, 11.0842]);
    expect(parseLatLng('abc')).toBeNull();
  });
});
