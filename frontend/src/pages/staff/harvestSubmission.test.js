import { describe, expect, it, vi } from 'vitest';
import { submitHarvestOnce } from './harvestSubmission';

describe('staff harvest submit', () => {
  it('sends one request during repeated clicks and permits retry after completion', async () => {
    let release;
    const request = vi.fn(() => new Promise((resolve) => { release = resolve; }));
    const inFlight = { current: false };
    const first = submitHarvestOnce(inFlight, request);
    const repeated = submitHarvestOnce(inFlight, request);
    expect(request).toHaveBeenCalledTimes(1);
    expect(await repeated).toBeNull();
    release({ harvestId: 1 });
    expect(await first).toEqual({ harvestId: 1 });
    await submitHarvestOnce(inFlight, () => Promise.resolve({ harvestId: 1 }));
    expect(inFlight.current).toBe(false);
  });
});
