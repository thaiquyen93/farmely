import { beforeEach, describe, expect, it } from 'vitest';
import { getStoredThreads, updateThreadRentalInStorage } from './chatStorage';

describe('customer and expert chat synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps one conversation for a customer across multiple plots', () => {
    const first = updateThreadRentalInStorage({
      threadId: 'CONS-101',
      rentalId: 101,
      customerName: 'Nguyễn An',
      plotCode: 'P-01',
      crop: 'Cà chua bi'
    });
    const second = updateThreadRentalInStorage({
      threadId: 'CONS-102',
      rentalId: 102,
      customerName: 'Nguyễn An',
      plotCode: 'P-02',
      crop: 'Xà lách Romaine'
    });

    expect(first.thread.id).toBe('CONS-101');
    expect(second.thread.id).toBe('CONS-101');
    expect(getStoredThreads().filter((thread) => thread.customerName === 'Nguyễn An')).toHaveLength(1);
    expect(getStoredThreads().find((thread) => thread.id === 'CONS-101')).not.toHaveProperty('plotCode');
  });
});
