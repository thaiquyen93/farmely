import { describe, expect, it } from 'vitest';
import { buildDemoProcessPlot } from './demoProcessPlot';
import { resolveStandardCropProcess } from '../../services/cropStandardProcess';

describe('demo day for a scheduled season', () => {
  const plot = { crop: 'Cà chua', currentDay: 0, totalDays: 80, startDate: '2099-01-01' };
  const season = { status: 'SCHEDULED', currentDay: 0, totalDays: 80 };

  it('shows Day 1 after start and after loading saved API state', () => {
    const saved = { seasonKey: 'SEASON-1', currentDay: 1 };
    const processPlot = buildDemoProcessPlot(plot, season, saved, 'SEASON-1', false);
    const process = resolveStandardCropProcess(processPlot);
    expect(process.isNotStarted).toBe(false);
    expect(process.currentDay).toBe(1);
    expect(processPlot.startDate).not.toBe(plot.startDate);
  });

  it('keeps a different season scheduled', () => {
    const saved = { seasonKey: 'SEASON-2', currentDay: 1 };
    const processPlot = buildDemoProcessPlot(plot, season, saved, 'SEASON-1', false);
    expect(resolveStandardCropProcess(processPlot).isNotStarted).toBe(true);
  });
});
