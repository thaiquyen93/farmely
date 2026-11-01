import { afterEach, describe, expect, it } from 'vitest';
import { buildGeoJsonFromDbPlots } from './marketplaceGisData';

describe('buildGeoJsonFromDbPlots', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('uses the server plot status even when legacy local storage marks the plot as recently booked', () => {
    localStorage.setItem('farmely_recently_booked_plots', JSON.stringify(['P-100']));

    const result = buildGeoJsonFromDbPlots([
      {
        plotId: 24,
        plotCode: 'P-100',
        status: 'AVAIL',
        area: 100,
        pricePerPeriod: 1_000_000,
        boundary: [
          [106.34, 10.69],
          [106.35, 10.69],
          [106.35, 10.70],
          [106.34, 10.69]
        ]
      }
    ]);

    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.statusCode).toBe('AVAIL');
    expect(result.features[0].properties.status).toBe('Đang trống');
  });
});
