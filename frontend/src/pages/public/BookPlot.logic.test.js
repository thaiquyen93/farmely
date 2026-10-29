import { describe, expect, it } from 'vitest';
import {
  addMonths,
  dedupeSelectedPlots,
  getBookingValidationError,
  getEarliestCultivationDate,
  getLatestCultivationDate,
  getPlotSelectionKey,
  getRentalEndDate,
  validateCultivationStartDate,
  resolveInitialSelectedPlots
} from './BookPlot';

describe('BookPlot booking rules', () => {
  it('deduplicates plot aliases and keeps distinct plots', () => {
    const plots = [
      { id: 'PLT-HV-01', code: 'P-01' },
      { id: 'P-01', code: 'Plot P-01' },
      { id: 'PLT-HV-02', code: 'P-02' }
    ];

    expect(dedupeSelectedPlots(plots)).toEqual([plots[0], plots[2]]);
    expect(getPlotSelectionKey(plots[0])).toBe('p-01');
  });

  it('blocks checkout until terms are accepted', () => {
    expect(getBookingValidationError({
      acceptedTerms: false,
      selectedMode: 'SELF',
      assistedService: null
    })).toContain('chấp nhận điều khoản');
  });

  it('requires the live S15 service for assisted growing', () => {
    expect(getBookingValidationError({
      acceptedTerms: true,
      selectedMode: 'ASSISTED',
      assistedService: null
    })).toContain('gói chăm sóc toàn vụ');

    expect(getBookingValidationError({
      acceptedTerms: true,
      selectedMode: 'ASSISTED',
      assistedService: { serviceCode: 'S15' }
    })).toBe('');
  });

  it('enforces 5-day minimum lead time and 14-day maximum booking window', () => {
    const fixedNow = new Date('2026-10-15T09:00:00+07:00');
    expect(getEarliestCultivationDate(fixedNow)).toBe('2026-10-20');
    expect(getLatestCultivationDate(fixedNow)).toBe('2026-10-29');
    expect(validateCultivationStartDate('2026-10-19', fixedNow)).toContain('tối thiểu 5 ngày');
    expect(validateCultivationStartDate('2026-10-30', fixedNow)).toContain('tối đa trong vòng 14 ngày');
    expect(validateCultivationStartDate('2026-10-22', fixedNow)).toBe('');
  });

  it('calculates a separate contract period from each plot start date', () => {
    expect(addMonths('2026-10-25', 3)).toBe('2027-01-25');
    expect(getRentalEndDate('2026-10-25', 1, { duration: '40–45 ngày' })).toBe('2026-12-19');
  });

  it('resolves multiple selected plots correctly from URL query ?plots=P-11,P-16', () => {
    const plotsList = [
      { id: '17', plotId: 17, code: 'P-11' },
      { id: '22', plotId: 22, code: 'P-16' },
      { id: '4', plotId: 4, code: 'P-04' }
    ];

    const result = resolveInitialSelectedPlots({
      plotsList,
      plotsQuery: 'P-11,P-16',
      savedPlots: null,
      fallbackId: 'P-11'
    });

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.code)).toEqual(['P-11', 'P-16']);
  });

  it('resolves multiple selected plots correctly from localStorage cart', () => {
    const plotsList = [
      { id: '17', plotId: 17, code: 'P-11' },
      { id: '22', plotId: 22, code: 'P-16' },
      { id: '4', plotId: 4, code: 'P-04' }
    ];

    // Format 1: array of string codes
    const result1 = resolveInitialSelectedPlots({
      plotsList,
      plotsQuery: '',
      savedPlots: JSON.stringify(['P-11', 'P-16']),
      fallbackId: 'P-11'
    });
    expect(result1).toHaveLength(2);
    expect(result1.map((p) => p.code)).toEqual(['P-11', 'P-16']);

    // Format 2: array of objects
    const result2 = resolveInitialSelectedPlots({
      plotsList,
      plotsQuery: '',
      savedPlots: JSON.stringify([{ code: 'P-11' }, { code: 'P-16' }]),
      fallbackId: 'P-11'
    });
    expect(result2).toHaveLength(2);
    expect(result2.map((p) => p.code)).toEqual(['P-11', 'P-16']);
  });

  it('preserves all selected plots when URL only specifies primary plot but cart has 2 plots', () => {
    const plotsList = [
      { id: '4', plotId: 4, code: 'P-04' },
      { id: '5', plotId: 5, code: 'P-05' },
      { id: '6', plotId: 6, code: 'P-06' }
    ];

    const result = resolveInitialSelectedPlots({
      plotsList,
      plotsQuery: 'P-04',
      savedPlots: JSON.stringify(['P-04', 'P-05']),
      fallbackId: 'P-04'
    });
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.code)).toEqual(['P-04', 'P-05']);
  });

  it('matches plot codes even with single digit or different zero padding', () => {
    const plotsList = [
      { id: '4', plotId: 4, code: 'P-04' },
      { id: '5', plotId: 5, code: 'P-05' }
    ];

    const result = resolveInitialSelectedPlots({
      plotsList,
      plotsQuery: 'P-4,P-5',
      savedPlots: null,
      fallbackId: 'P-04'
    });
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.code)).toEqual(['P-04', 'P-05']);
  });
});
