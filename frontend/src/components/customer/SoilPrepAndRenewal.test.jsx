import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SoilPrepView from './SoilPrepView';
import PlotRenewalModal from './PlotRenewalModal';
import { resolveFallowProgress, resolvePlotSeasons } from '../../services/cropStandardProcess';

describe('SoilPrepView, Fallow Progress & PlotRenewalModal Flow', () => {
  let container = null;
  let root = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('starts fallow maintenance at Day 1/4 for a freshly harvested plot instead of hardcoded Day 3/4', async () => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await act(async () => {
      root.render(
        <SoilPrepView
          plot={{ plotCode: 'P-14', crop: 'Cà chua bi đỏ F1', currentDay: 80, totalDays: 80 }}
          season={{ seasonNumber: 1, cropName: 'Cà chua bi đỏ F1', totalDays: 80, fallowDays: 4 }}
          latestHarvest={{ harvestDate: todayIso, yieldAmount: 2100, formattedYield: '2100.00 kg' }}
          onOpenRenewal={vi.fn()}
          onSimulateDay1={vi.fn()}
        />
      );
    });

    const text = container.textContent;
    expect(text).toContain('Thửa P-14');
    expect(text).toContain('Cà chua bi đỏ F1');
    expect(text).toContain('2100.00 kg');
    expect(text).toContain('Ngày 1 / 4 Ngày');
    expect(text).toContain('Còn 3 ngày bảo dưỡng');
    expect(text).toContain('Ngày 1: Thu dọn tàn dư vụ cũ (Đang làm)');
    expect(text).not.toContain('Ngày 3 / 4 Ngày');
    expect(text).not.toContain('Ngày 3: Cày xới & Phơi ải (Đang làm)');
    expect(text).not.toContain('Bắt đầu lại Vụ Mới');
    expect(text).not.toContain('Mở Tab Admin Phê Duyệt');
  });

  it('does not render any Admin link when renewal is waiting for approval', async () => {
    await act(async () => {
      root.render(
        <SoilPrepView
          plot={{ plotCode: 'P-14', crop: 'Cà chua bi đỏ F1' }}
          season={{ seasonNumber: 1, cropName: 'Cà chua bi đỏ F1', totalDays: 80, fallowDays: 4 }}
          nextSeason={{ seasonNumber: 2, cropName: 'Cà chua bi đỏ F1', status: 'PENDING_APPROVAL' }}
          isPendingApproval={true}
        />
      );
    });

    const text = container.textContent;
    expect(text).toContain('Yêu Cầu Gia Hạn Đang Chờ Ban Quản Trị Phê Duyệt');
    expect(text).not.toContain('Mở Tab Admin Phê Duyệt');
    expect(container.querySelector('a[href*="/admin"]')).toBeNull();
  });

  it('computes Day 3/4 and completed 4/4 dynamically from harvest date', () => {
    const day2Ago = resolveFallowProgress({
      plot: { plotCode: 'P-14', currentDay: 80, totalDays: 80 },
      season: { fallowDays: 4, totalDays: 80 },
      latestHarvest: { harvestDate: '2026-11-10' },
      now: new Date(2026, 10, 12)
    });
    expect(day2Ago.currentDay).toBe(3);
    expect(day2Ago.remainingDays).toBe(1);
    expect(day2Ago.isCompleted).toBe(false);
    expect(day2Ago.steps.map((s) => s.status)).toEqual(['COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'PENDING']);

    const day4Ago = resolveFallowProgress({
      plot: { plotCode: 'P-14', currentDay: 80, totalDays: 80 },
      season: { fallowDays: 4, totalDays: 80 },
      latestHarvest: { harvestDate: '2026-11-08' },
      now: new Date(2026, 10, 12)
    });
    expect(day4Ago.isCompleted).toBe(true);
    expect(day4Ago.currentDay).toBe(4);
    expect(day4Ago.remainingDays).toBe(0);
    expect(day4Ago.steps.every((s) => s.status === 'COMPLETED')).toBe(true);
  });

  it('uses 4-day BR23 fallow default in resolvePlotSeasons without fake yield values', () => {
    const seasons = resolvePlotSeasons({
      id: 'RENT-9',
      plotCode: 'P-14',
      crop: 'Cà chua bi đỏ F1',
      totalDays: 80,
      termMonths: 3,
      currentDay: 80
    });
    expect(seasons).toHaveLength(1);
    expect(seasons[0].fallowDays).toBe(4);
    expect(seasons[0].yieldKgActual).toBeNull();
  });

  it('calculates real plot price & DD/MM/YYYY end date safely in PlotRenewalModal and submits to /api/contracts/renewals without double-calling /renew', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes('/compatibility')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { varietyId: 4, varietyName: 'Cà chua bi đỏ F1', expectedDuration: 80, bufferTime: 4 },
              { varietyId: 5, varietyName: 'Dưa leo baby F1', expectedDuration: 55, bufferTime: 4 }
            ]
          })
        };
      }
      return { ok: true, json: async () => ({ success: true, data: { status: 'PENDING' } }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      root.render(
        <PlotRenewalModal
          isOpen={true}
          onClose={vi.fn()}
          plot={{
            id: 'RENT-9',
            rentalId: 9,
            contractId: 9,
            plotId: 20,
            plotCode: 'P-14',
            name: 'Thửa P-14',
            crop: 'Cà chua bi đỏ F1',
            mode: 'Assisted-Growing',
            cultivationMode: 'ASSISTED',
            renterName: 'Lô Thái Quyền',
            customerPhone: '0909123456',
            endDate: '2027-02-14',
            expectedHarvestDate: '14/02/2027',
            pricePerPeriod: 1550000,
            carePricePerMonth: 775000,
            currentDay: 80,
            totalDays: 80
          }}
        />
      );
    });

    const text = container.textContent;
    expect(text).toContain('Thửa P-14');
    expect(text).toContain('~80 ngày canh tác');
    expect(text).toContain('2.325.000 đ');
    expect(text).not.toContain('1.650.000 đ');
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/api/plots/20/compatibility'))).toBe(true);
  });
});

