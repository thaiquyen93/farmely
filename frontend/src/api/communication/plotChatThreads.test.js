import { beforeEach, describe, expect, it } from 'vitest';
import { getPlotChatThreadId, upsertPlotChatThread } from './chatStorage';

describe('plot-specific expert chat threads', () => {
  beforeEach(() => localStorage.clear());

  it('creates a stable and distinct chat id for each customer and plot', () => {
    const plot14 = getPlotChatThreadId({ email: 'customer@farmely.vn', userId: 1, plotCode: 'P-14' });
    const plot15 = getPlotChatThreadId({ email: 'customer@farmely.vn', userId: 1, plotCode: 'P-15' });
    expect(plot14).toBe('CONS-customer_farmely_vn-PLOT-P_14');
    expect(plot15).not.toBe(plot14);
  });

  it('keeps each plot channel separate and updates pre-rental threads after booking', () => {
    const id = getPlotChatThreadId({ email: 'customer@farmely.vn', plotCode: 'P-14' });
    upsertPlotChatThread({ threadId: id, customerName: 'Khách A', plotCode: 'P-14', crop: 'Cà chua bi', rentalStatus: 'NOT_RENTED' });
    const rented = upsertPlotChatThread({ threadId: id, customerName: 'Khách A', plotCode: 'P-14', crop: 'Cà chua bi', rentalStatus: 'RENTED' });
    const other = upsertPlotChatThread({ threadId: `${id}-other`, customerName: 'Khách A', plotCode: 'P-15', crop: 'Dưa leo' });
    expect(rented.thread.rentalStatus).toBe('RENTED');
    expect(rented.thread.plotCode).toBe('P-14');
    expect(other.thread.plotCode).toBe('P-15');
    expect(other.thread.crop).toBe('Dưa leo');
  });
});
