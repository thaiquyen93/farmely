import { beforeEach, describe, expect, it } from 'vitest';
import { getStoredThreads, updateThreadRentalInStorage } from './chatStorage';

describe('plot inbox synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps separate plot conversations for one customer renting multiple plots', () => {
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
    expect(second.thread.id).toBe('CONS-102');
    expect(getStoredThreads().filter((thread) => thread.customerName === 'Nguyễn An')).toHaveLength(2);
    expect(getStoredThreads().find((thread) => thread.id === 'CONS-102')).toMatchObject({ rentalId: 102, plotCode: 'P-02' });
  });
});
