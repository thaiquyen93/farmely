import { beforeEach, describe, expect, it } from 'vitest';
import { publishHarvestCompleted, subscribeHarvestCompleted } from './harvestSync';

describe('staff to customer harvest sync', () => {
  beforeEach(() => localStorage.clear());

  it('publishes rental, season and task identity and ignores unrelated events', () => {
    const received = [];
    const unsubscribe = subscribeHarvestCompleted((event) => received.push(event));
    publishHarvestCompleted({ rentalId: 3, seasonKey: 'SEASON-2', taskId: 80 });
    const stored = JSON.parse(localStorage.getItem('farmely_harvest_sync'));
    window.dispatchEvent(new StorageEvent('storage', { key: 'farmely_harvest_sync', newValue: JSON.stringify(stored) }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'farmely_harvest_sync', newValue: JSON.stringify({ type: 'OTHER', rentalId: 3 }) }));
    expect(received).toEqual([{ type: 'HARVEST_COMPLETED', rentalId: 3, seasonKey: 'SEASON-2', taskId: 80 }]);
    unsubscribe();
  });
});
