import { describe, it, expect } from 'vitest';
import {
  computeStaggerDelays,
  heightAtTime,
  settleHeightAtTime,
  STAGGER_STEP_MS,
  RISE_DURATION_MS,
  SETTLE_DURATION_MS,
} from './useMapIntroAnimation';
import { RISE_PEAK_HEIGHT, RISE_SETTLE_HEIGHT } from '../utils/mapTheme';

describe('computeStaggerDelays', () => {
  it('gives the nearest plot (largest screen y) the smallest delay', () => {
    const delays = computeStaggerDelays([
      { index: 0, y: 100 },
      { index: 1, y: 500 },
      { index: 2, y: 300 },
    ]);
    // y=500 is nearest the bottom of the screen => rises first
    expect(delays[1]).toBe(0);
    expect(delays[2]).toBe(STAGGER_STEP_MS);
    expect(delays[0]).toBe(STAGGER_STEP_MS * 2);
  });

  it('never produces a negative delay', () => {
    const delays = computeStaggerDelays(
      Array.from({ length: 13 }, (_, i) => ({ index: i, y: -i * 37 }))
    );
    delays.forEach((d) => expect(d).toBeGreaterThanOrEqual(0));
  });

  it('spans count x step across the whole collection', () => {
    const count = 13;
    const delays = computeStaggerDelays(
      Array.from({ length: count }, (_, i) => ({ index: i, y: i * 10 }))
    );
    expect(delays).toHaveLength(count);
    expect(Math.min(...delays)).toBe(0);
    expect(Math.max(...delays)).toBe((count - 1) * STAGGER_STEP_MS);
    expect(new Set(delays).size).toBe(count);
  });

  it('tolerates missing or malformed input', () => {
    expect(computeStaggerDelays([])).toEqual([]);
    expect(computeStaggerDelays(undefined)).toEqual([]);
    expect(computeStaggerDelays([{}, {}])).toHaveLength(2);
  });

  it('accepts a custom step', () => {
    const delays = computeStaggerDelays([{ index: 0, y: 1 }, { index: 1, y: 2 }], 100);
    expect(delays[1]).toBe(0);
    expect(delays[0]).toBe(100);
  });
});

describe('heightAtTime', () => {
  it('starts flat on the ground', () => {
    expect(heightAtTime(0, 0)).toBe(0);
    expect(heightAtTime(0, 220)).toBe(0);
  });

  it('reaches exactly the peak once the plot finishes its rise', () => {
    expect(heightAtTime(RISE_DURATION_MS, 0)).toBe(RISE_PEAK_HEIGHT);
    expect(heightAtTime(RISE_DURATION_MS + 300, 300)).toBe(RISE_PEAK_HEIGHT);
  });

  it('is clamped at the peak and never exceeds it', () => {
    [2000, 5000, 100000].forEach((t) => {
      expect(heightAtTime(t, 0)).toBeLessThanOrEqual(RISE_PEAK_HEIGHT);
    });
    expect(heightAtTime(100000, 0)).toBe(RISE_PEAK_HEIGHT);
  });

  it('is monotonically non-decreasing across a sampled grid', () => {
    const delay = 165;
    let prev = -Infinity;
    for (let t = 0; t <= 1700; t += 25) {
      const h = heightAtTime(t, delay);
      expect(h).toBeGreaterThanOrEqual(prev);
      prev = h;
    }
  });

  it('stays at zero while the plot is still waiting for its turn', () => {
    expect(heightAtTime(100, 400)).toBe(0);
    expect(heightAtTime(399, 400)).toBe(0);
    expect(heightAtTime(500, 400)).toBeGreaterThan(0);
  });
});

describe('settleHeightAtTime', () => {
  it('eases from the peak down to the working thickness', () => {
    expect(settleHeightAtTime(0)).toBe(RISE_PEAK_HEIGHT);
    expect(settleHeightAtTime(SETTLE_DURATION_MS)).toBe(RISE_SETTLE_HEIGHT);
  });

  it('is monotonically non-increasing', () => {
    let prev = Infinity;
    for (let t = 0; t <= SETTLE_DURATION_MS; t += 10) {
      const h = settleHeightAtTime(t);
      expect(h).toBeLessThanOrEqual(prev);
      prev = h;
    }
  });

  it('clamps past the end of the settle window', () => {
    expect(settleHeightAtTime(99999)).toBe(RISE_SETTLE_HEIGHT);
  });
});
