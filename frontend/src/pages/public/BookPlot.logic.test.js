import { describe, expect, it } from 'vitest';
import {
  addMonths,
  dedupeSelectedPlots,
  getBookingValidationError,
  getEarliestCultivationDate,
  getLatestCultivationDate,
  getPlotSelectionKey,
  getRentalEndDate,
  validateCultivationStartDate
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
});
