import { describe, it, expect } from 'vitest';
import {
  getStatusConfig,
  isAvailableStatus,
  buildStatusColorExpression,
  dashSequenceAt,
  DASH_SEQUENCE,
  LAYER_IDS,
  CAMERA,
  RISE_PEAK_HEIGHT,
  RISE_SETTLE_HEIGHT,
  SELECTED_HEIGHT,
} from './mapTheme';
import { GIS_STATUSES } from '../data/marketplaceGisData';

describe('getStatusConfig', () => {
  it('maps the Vietnamese label and the key to the SAME entry', () => {
    expect(getStatusConfig('Đang trống')).toBe(getStatusConfig('AVAILABLE'));
    expect(getStatusConfig('Đã thuê')).toBe(getStatusConfig('RENTED'));
    expect(getStatusConfig('Bảo trì')).toBe(getStatusConfig('MAINTENANCE'));
    expect(getStatusConfig('Sắp có')).toBe(getStatusConfig('UPCOMING'));
  });

  it('is tolerant of case and surrounding whitespace', () => {
    expect(getStatusConfig('  available  ')).toBe(GIS_STATUSES.AVAILABLE);
    expect(getStatusConfig('  Đang   trống ')).toBe(GIS_STATUSES.AVAILABLE);
  });

  it('returns the fallback entry without throwing for bad input', () => {
    const fallback = GIS_STATUSES.MAINTENANCE;
    [null, undefined, '', 'garbage', 0, {}, []].forEach((bad) => {
      expect(() => getStatusConfig(bad)).not.toThrow();
      expect(getStatusConfig(bad)).toBe(fallback);
    });
  });

  it('powers isAvailableStatus for both forms', () => {
    expect(isAvailableStatus('Đang trống')).toBe(true);
    expect(isAvailableStatus('AVAILABLE')).toBe(true);
    expect(isAvailableStatus('Đã thuê')).toBe(false);
    expect(isAvailableStatus(undefined)).toBe(false);
  });
});

describe('buildStatusColorExpression', () => {
  it('is a match expression with paired cases plus a default', () => {
    const expr = buildStatusColorExpression('color');
    expect(expr[0]).toBe('match');
    expect(expr[1]).toEqual(['get', 'status']);

    const cases = expr.slice(2, expr.length - 1);
    expect(cases.length % 2).toBe(0);
    // 4 statuses x (key + label) = 8 cases = 16 entries
    expect(cases).toHaveLength(16);
    expect(typeof expr[expr.length - 1]).toBe('string');
  });

  it('covers every status by both key and label', () => {
    const expr = buildStatusColorExpression('color');
    Object.values(GIS_STATUSES).forEach((entry) => {
      expect(expr).toContain(entry.key);
      expect(expr).toContain(entry.label);
    });
  });

  it('can read any colour property off the status entries', () => {
    const expr = buildStatusColorExpression('fillColor');
    expect(expr).toContain(GIS_STATUSES.AVAILABLE.fillColor);
  });
});

describe('dashSequenceAt', () => {
  it('cycles with the period of DASH_SEQUENCE', () => {
    expect(dashSequenceAt(0)).toBe(DASH_SEQUENCE[0]);
    expect(dashSequenceAt(DASH_SEQUENCE.length)).toBe(DASH_SEQUENCE[0]);
    expect(dashSequenceAt(DASH_SEQUENCE.length + 3)).toBe(DASH_SEQUENCE[3]);
  });

  it('handles negative and non-integer frames safely', () => {
    expect(dashSequenceAt(-1)).toBe(DASH_SEQUENCE[DASH_SEQUENCE.length - 1]);
    expect(dashSequenceAt(2.7)).toBe(DASH_SEQUENCE[2]);
    expect(dashSequenceAt(NaN)).toBe(DASH_SEQUENCE[0]);
  });

  it('only contains numeric dash arrays', () => {
    DASH_SEQUENCE.forEach((dash) => {
      expect(Array.isArray(dash)).toBe(true);
      dash.forEach((n) => expect(Number.isFinite(n)).toBe(true));
    });
  });
});

describe('map constants', () => {
  it('names every layer and source used by the map', () => {
    ['plotsExtrusion', 'farmDimOutside', 'plotsDim', 'plotsSource'].forEach((k) => {
      expect(typeof LAYER_IDS[k]).toBe('string');
    });
    expect(LAYER_IDS.plotsExtrusion).toBe('plots-extrusion');
    expect(LAYER_IDS.farmDimOutside).toBe('farm-dim-outside');
    expect(LAYER_IDS.plotsDim).toBe('plots-dim');
  });

  it('orders the extrusion heights peak > selected > settled', () => {
    expect(RISE_PEAK_HEIGHT).toBeGreaterThan(SELECTED_HEIGHT);
    expect(SELECTED_HEIGHT).toBeGreaterThan(RISE_SETTLE_HEIGHT);
    expect(RISE_SETTLE_HEIGHT).toBeGreaterThan(0);
  });

  it('exposes the single overview bounds + padding', () => {
    expect(CAMERA.bounds).toEqual([
      [106.343656, 10.680931],
      [106.356997, 10.694331],
    ]);
    expect(CAMERA.padding).toEqual({ top: 90, bottom: 60, left: 384, right: 404 });
    // Padding trái phải lớn hơn phần sidebar che (left-6 24px + w-84 336px = 360px),
    // nếu không thửa đất ở mép trái bị khung danh sách đè lên.
    expect(CAMERA.padding.left).toBeGreaterThan(360);
    // Padding phải lớn hơn drawer chi tiết (right-4 16px + 370px = 386px).
    expect(CAMERA.padding.right).toBeGreaterThan(386);
    expect(CAMERA.intro.pitch).toBe(0);
    expect(CAMERA.overview.pitch).toBe(50);
    expect(CAMERA.settled.pitch).toBe(40);
    expect(CAMERA.focused.maxZoom).toBe(17.5);
  });
});
