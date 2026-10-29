import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  normalizePlotCode,
  findPlotByCode,
  loadCartCodes,
  saveCartCodes,
  removeCartCodes,
  buildBookingUrl,
  filterCompatibleCrops,
  fetchCompatibleVarietyIds,
  clearCompatibilityCache,
  CART_STORAGE_KEY,
  CROP_STORAGE_KEY,
  getCropGrowthDays,
  getMinTermMonths,
  getTermLockReason,
  getLeaseTermError,
  getLeaseConfigError,
  normalizeLeaseConfig,
  computePlotLeasePrice,
  getCareFeePerMonth,
  buildCartSummary,
  loadLeaseConfigMap,
  saveLeaseConfigMap,
  loadCropMap,
  formatTermShort
} from './leaseSelection';
import { safeCrops } from '../data/safeCrops';

const crop = (id) => safeCrops.find((c) => c.id === id);
const days = (id) => getCropGrowthDays(crop(id));

describe('getCropGrowthDays', () => {
  it('uses the max number in duration', () => {
    expect(days('CRP-01')).toBe(30);
    expect(days('CRP-02')).toBe(35);
    expect(days('CRP-04')).toBe(85);
    expect(getCropGrowthDays(45)).toBe(45);
    expect(getCropGrowthDays({ minDays: 50 })).toBe(50);
    expect(getCropGrowthDays(null)).toBe(0);
  });
});

describe('BR04 term rules', () => {
  it('getMinTermMonths', () => {
    expect(getMinTermMonths({ growthDays: days('CRP-02'), cultivationMode: 'SELF' })).toBe(1);
    expect(getMinTermMonths({ growthDays: days('CRP-01'), cultivationMode: 'SELF' })).toBe(1);
    expect(getMinTermMonths({ growthDays: days('CRP-04'), cultivationMode: 'SELF' })).toBe(3);
    expect(getMinTermMonths({ growthDays: days('CRP-03'), cultivationMode: 'SELF' })).toBe(3);
    expect(getMinTermMonths({ growthDays: days('CRP-01'), cultivationMode: 'ASSISTED' })).toBe(3);
  });

  it('getTermLockReason', () => {
    expect(getTermLockReason(1, { growthDays: days('CRP-04') })).toBe('BR04');
    expect(getTermLockReason(1, { growthDays: days('CRP-01'), cultivationMode: 'ASSISTED' })).toBe('ASSISTED');
    expect(getTermLockReason(1, { growthDays: days('CRP-04'), cultivationMode: 'ASSISTED' })).toBe('BR04');
    expect(getTermLockReason(3, { growthDays: days('CRP-04') })).toBe('');
  });

  it('getLeaseTermError', () => {
    expect(getLeaseTermError({ termMonths: 2, cultivationMode: 'SELF', growthDays: 30 })).toMatch('không hợp lệ');
    expect(getLeaseTermError({ termMonths: 3, cultivationMode: null, growthDays: 30 })).toMatch('hình thức canh tác');
    expect(getLeaseTermError({ termMonths: 1, cultivationMode: 'SELF', growthDays: days('CRP-09'), varietyName: 'Ớt' })).toContain('tối thiểu 3 tháng');
    expect(getLeaseTermError({ termMonths: 1, cultivationMode: 'SELF', growthDays: days('CRP-02') })).toBe('');
    expect(getLeaseTermError({ termMonths: 1, cultivationMode: 'ASSISTED', growthDays: 30 })).toMatch('Assisted-Growing');
    expect(getLeaseTermError({ termMonths: 12, cultivationMode: 'ASSISTED', growthDays: 85 })).toBe('');
  });

  it('getLeaseConfigError requires a crop', () => {
    expect(getLeaseConfigError({ cultivationMode: 'SELF', termMonths: 3 }, null)).toBe('Vui lòng chọn giống cây trồng cho thửa này.');
    expect(getLeaseConfigError({ cultivationMode: 'SELF', termMonths: 3 }, crop('CRP-04'))).toBe('');
  });
});

describe('normalizeLeaseConfig', () => {
  it('defaults and auto-raises but never lowers', () => {
    expect(normalizeLeaseConfig({})).toEqual({ cropId: '', cultivationMode: null, termMonths: 3 });
    expect(normalizeLeaseConfig({ termMonths: 1 }, crop('CRP-04')).termMonths).toBe(3);
    expect(normalizeLeaseConfig({ termMonths: 1, cultivationMode: 'SELF' }, crop('CRP-01')).termMonths).toBe(1);
    expect(normalizeLeaseConfig({ termMonths: 1, cultivationMode: 'ASSISTED' }, crop('CRP-01')).termMonths).toBe(3);
    expect(normalizeLeaseConfig({ termMonths: 7 }).termMonths).toBe(3);
    expect(normalizeLeaseConfig({ termMonths: 12 }, crop('CRP-04')).termMonths).toBe(12);
    expect(normalizeLeaseConfig({ cultivationMode: 'FOO' }).cultivationMode).toBeNull();
  });
});

describe('per-plot pricing', () => {
  it('computePlotLeasePrice', () => {
    expect(getCareFeePerMonth(1200000)).toBe(600000);
    expect(computePlotLeasePrice({ monthlyRent: 1200000, termMonths: 3, cultivationMode: 'SELF' }))
      .toEqual({ rentTotal: 3600000, careFeePerMonth: 600000, careTotal: 0, total: 3600000 });
    const assisted = computePlotLeasePrice({ monthlyRent: 1200000, termMonths: 6, cultivationMode: 'ASSISTED' });
    expect(assisted.careFeePerMonth).toBe(600000);
    expect(assisted.careTotal).toBe(3600000);
    expect(assisted.total).toBe(10800000);
  });

  it('buildCartSummary sums per-plot totals (user example)', () => {
    const plots = [
      { code: 'P-01', rentalPrice: 1200000 },
      { code: 'P-02', rentalPrice: 1000000 }
    ];
    const configs = {
      'P-01': { cropId: 'CRP-04', cultivationMode: 'ASSISTED', termMonths: 6 },
      'P-02': { cropId: 'CRP-02', cultivationMode: 'SELF', termMonths: 12 }
    };
    const summary = buildCartSummary(plots, configs, crop);
    expect(summary.items.map((i) => i.price.total)).toEqual([10800000, 12000000]);
    expect(summary.total).toBe(22800000);
    expect(summary.configuredCount).toBe(2);
  });

  it('buildCartSummary flags unconfigured plots', () => {
    const summary = buildCartSummary(
      [{ code: 'P-01', rentalPrice: 1000000 }, { code: 'P-02', rentalPrice: 1000000 }],
      { 'P-01': { cropId: 'CRP-04', termMonths: 6 }, 'P-02': { cropId: 'CRP-02', cultivationMode: 'SELF', termMonths: 3 } },
      crop
    );
    expect(summary.items[0].error).not.toBe('');
    expect(summary.items[0].price.total).toBe(6000000);
    expect(summary.configuredCount).toBe(1);
    expect(summary.total).toBe(9000000);
  });

  it('formatTermShort', () => {
    expect(formatTermShort(1)).toBe('1 tháng');
    expect(formatTermShort(3)).toBe('3 tháng · 1 vụ');
    expect(formatTermShort(12)).toBe('12 tháng · 4 vụ');
  });
});

describe('lease config storage', () => {
  beforeEach(() => localStorage.clear());

  it('migrates the legacy crop map', () => {
    localStorage.setItem(CROP_STORAGE_KEY, JSON.stringify({ 'P-04': 'CRP-03' }));
    expect(loadLeaseConfigMap()).toEqual({ 'P-04': { cropId: 'CRP-03' } });
  });

  it('round-trips with normalized keys and derives the crop map', () => {
    saveLeaseConfigMap({ 'p-04': { cropId: 'CRP-03', cultivationMode: 'SELF', termMonths: 6 } });
    expect(loadLeaseConfigMap()).toEqual({ 'P-04': { cropId: 'CRP-03', cultivationMode: 'SELF', termMonths: 6 } });
    expect(loadCropMap()).toEqual({ 'P-04': 'CRP-03' });
  });
});

describe('normalizePlotCode', () => {
  it('trims, strips "plot " prefix and uppercases', () => {
    expect(normalizePlotCode('  plot p-04 ')).toBe('P-04');
    expect(normalizePlotCode(null)).toBe('');
  });
});

describe('findPlotByCode', () => {
  const plots = [
    { code: 'P-08', plot_id: 14 },
    { code: 'P-14', plot_id: 20 }
  ];
  it('matches exactly by code, never by plot_id prefix heuristics', () => {
    expect(findPlotByCode(plots, 'P-14')).toBe(plots[1]);
    expect(findPlotByCode([{ code: 'P-08', plot_id: 14 }], 'P-14')).toBeNull();
  });
  it('falls back to plot_id only for an all-digit value', () => {
    expect(findPlotByCode(plots, '14')).toBe(plots[0]);
  });
});

describe('cart storage', () => {
  beforeEach(() => localStorage.clear());

  it('loads legacy object arrays as normalized, deduped codes', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ id: '4', code: 'P-04' }, { id: 'p-04' }, 'P-05']));
    expect(loadCartCodes()).toEqual(['P-04', 'P-05']);
  });

  it('removes the key when saving an empty cart and supports removal', () => {
    saveCartCodes(['P-04', 'P-05', 'P-04']);
    expect(loadCartCodes()).toEqual(['P-04', 'P-05']);
    removeCartCodes(['P-05']);
    expect(loadCartCodes()).toEqual(['P-04']);
    saveCartCodes([]);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });
});

describe('buildBookingUrl', () => {
  it('routes to the first code and lists all codes', () => {
    expect(buildBookingUrl(['P-08'])).toBe('/marketplace/plot/P-08/book?plots=P-08');
    expect(buildBookingUrl(['P-04', 'P-05'])).toBe('/marketplace/plot/P-04/book?plots=P-04,P-05');
  });
  it('includes cropId, mode, and term in search params when provided', () => {
    expect(
      buildBookingUrl(['P-10'], { cropId: 'CRP-04', cultivationMode: 'ASSISTED', termMonths: 3 })
    ).toBe('/marketplace/plot/P-10/book?plots=P-10&cropId=CRP-04&mode=ASSISTED&term=3');
  });
});

describe('filterCompatibleCrops', () => {
  it('returns all crops with hasData=false when no compatibility data', () => {
    expect(filterCompatibleCrops(safeCrops, [])).toEqual({ crops: safeCrops, hasData: false });
    expect(filterCompatibleCrops(safeCrops, null).hasData).toBe(false);
  });
  it('keeps only compatible varieties', () => {
    const { crops, hasData } = filterCompatibleCrops(safeCrops, [3, 4, 6, 9]);
    expect(hasData).toBe(true);
    expect(crops.map((c) => c.id)).toEqual(['CRP-03', 'CRP-04', 'CRP-06', 'CRP-09']);
  });
});

describe('fetchCompatibleVarietyIds', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearCompatibilityCache();
  });

  it('maps data[].varietyId and memoizes per plot id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [{ varietyId: 3 }, { varietyId: 9 }] })
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchCompatibleVarietyIds(4)).toEqual([3, 9]);
    expect(await fetchCompatibleVarietyIds(4)).toEqual([3, 9]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/plots/4/compatibility');
  });

  it('returns null on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    expect(await fetchCompatibleVarietyIds(5)).toBeNull();
  });
});
