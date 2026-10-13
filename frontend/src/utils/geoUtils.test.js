import { describe, it, expect } from 'vitest';
import {
  getRingCorners,
  getCentroid,
  getFeatureBBox,
  clamp01,
  easeOutCubic,
  easeInOutCubic,
  buildWorldMaskWithHole,
  getRingWinding,
} from './geoUtils';
import { FARMS_GEOJSON_DATA, FARM_GPS_BOUNDS } from '../data/marketplaceGisData';

const features = FARMS_GEOJSON_DATA.features;

describe('getRingCorners', () => {
  it('returns exactly 4 distinct corners for every real plot', () => {
    expect(features).toHaveLength(16);
    features.forEach((f) => {
      expect(getRingCorners(f)).toHaveLength(4);
    });
  });

  it('handles a hand-built OPEN ring without dropping a corner', () => {
    const open = {
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        ],
      },
    };
    expect(getRingCorners(open)).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
  });

  it('returns an empty array for malformed input', () => {
    expect(getRingCorners(null)).toEqual([]);
    expect(getRingCorners({})).toEqual([]);
  });
});

describe('getCentroid', () => {
  it('places every plot centroid strictly inside its own bbox', () => {
    features.forEach((f) => {
      const [lng, lat] = getCentroid(f);
      const [[minLng, minLat], [maxLng, maxLat]] = getFeatureBBox(f);
      expect(lng).toBeGreaterThan(minLng);
      expect(lng).toBeLessThan(maxLng);
      expect(lat).toBeGreaterThan(minLat);
      expect(lat).toBeLessThan(maxLat);
    });
  });

  it('returns the geometric centre of a unit square', () => {
    const square = {
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
            [0, 0],
          ],
        ],
      },
    };
    const [lng, lat] = getCentroid(square);
    expect(lng).toBeCloseTo(1, 10);
    expect(lat).toBeCloseTo(1, 10);
  });

  it('keeps every centroid inside the bbox covering all features', () => {
    const allCorners = features.flatMap((f) => getRingCorners(f));
    const [[minLng, minLat], [maxLng, maxLat]] = getFeatureBBox(allCorners);

    features.forEach((f) => {
      const [lng, lat] = getCentroid(f);
      expect(lng).toBeGreaterThanOrEqual(minLng);
      expect(lng).toBeLessThanOrEqual(maxLng);
      expect(lat).toBeGreaterThanOrEqual(minLat);
      expect(lat).toBeLessThanOrEqual(maxLat);
    });
  });
});

describe('easing helpers', () => {
  const grid = Array.from({ length: 51 }, (_, i) => i / 50);

  it.each([
    ['easeOutCubic', easeOutCubic],
    ['easeInOutCubic', easeInOutCubic],
  ])('%s is anchored at 0 and 1 and monotonic', (_name, fn) => {
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);

    let prev = -Infinity;
    grid.forEach((t) => {
      const v = fn(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    });
  });

  it('clamps out-of-range inputs', () => {
    expect(easeOutCubic(-5)).toBe(0);
    expect(easeOutCubic(5)).toBe(1);
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.3)).toBe(0.3);
    expect(clamp01(NaN)).toBe(0);
  });
});

describe('buildWorldMaskWithHole', () => {
  const mask = buildWorldMaskWithHole(FARM_GPS_BOUNDS.polygon);

  it('produces a Polygon Feature with exactly 2 rings', () => {
    expect(mask.type).toBe('Feature');
    expect(mask.geometry.type).toBe('Polygon');
    expect(mask.geometry.coordinates).toHaveLength(2);
  });

  it('closes both rings', () => {
    mask.geometry.coordinates.forEach((ring) => {
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    });
  });

  it('uses opposite winding: outer CCW, hole CW', () => {
    const [outer, hole] = mask.geometry.coordinates;
    expect(getRingWinding(outer)).toBe('ccw');
    expect(getRingWinding(hole)).toBe('cw');
  });

  it('wraps the whole world in the outer ring', () => {
    const [[minLng, minLat], [maxLng, maxLat]] = getFeatureBBox(
      mask.geometry.coordinates[0]
    );
    expect(minLng).toBe(-180);
    expect(maxLng).toBe(180);
    expect(minLat).toBe(-85);
    expect(maxLat).toBe(85);
  });

  it('contains the farm hole inside the world ring', () => {
    const [[hMinLng, hMinLat], [hMaxLng, hMaxLat]] = getFeatureBBox(
      mask.geometry.coordinates[1]
    );
    expect(hMinLng).toBeGreaterThan(-180);
    expect(hMaxLng).toBeLessThan(180);
    expect(hMinLat).toBeGreaterThan(-85);
    expect(hMaxLat).toBeLessThan(85);
  });

  it('degrades to a single ring when no boundary is supplied', () => {
    expect(buildWorldMaskWithHole([]).geometry.coordinates).toHaveLength(1);
    expect(buildWorldMaskWithHole(null).geometry.coordinates).toHaveLength(1);
  });
});
