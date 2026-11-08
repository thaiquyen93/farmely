import { describe, expect, it } from 'vitest';
import { buildExpertInboxEntries } from './expertInboxGroups';

describe('Expert inbox grouping', () => {
  it('shows one customer row while keeping each plot conversation separate', () => {
    const entries = buildExpertInboxEntries([
      { id: 'CONS-RENTAL-73', role: 'customer', participantOneId: 1, customerName: 'Lô Thái Quyền', rentalStatus: 'RENTED', rentalId: 73, plotCode: 'P-17', messages: [{ id: 7, text: 'P-17', sender: 'customer' }] },
      { id: 'CONS-RENTAL-74', role: 'customer', participantOneId: 1, customerName: 'Lô Thái Quyền', rentalStatus: 'RENTED', rentalId: 74, plotCode: 'P-04', messages: [{ id: 8, text: 'P-04', sender: 'customer' }] },
      { id: 'CONS-RENTAL-3', role: 'customer', participantOneId: 3, customerName: 'Tạ Nguyễn Khôi Nguyên', rentalStatus: 'RENTED', rentalId: 3, plotCode: 'P-03', messages: [] }
    ]);

    expect(entries).toHaveLength(2);
    const quyen = entries.find((entry) => entry.id === 'customer:1');
    expect(quyen.threads.map((thread) => thread.rentalId)).toEqual([73, 74]);
    expect(quyen.messages.map((message) => [message.text, message.plotCode])).toEqual([['P-17', 'P-17'], ['P-04', 'P-04']]);
  });
});
