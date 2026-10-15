import { describe, expect, it } from 'vitest';
import { dedupeSelectedPlots, getBookingValidationError, getPlotSelectionKey } from './BookPlot';

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
});
