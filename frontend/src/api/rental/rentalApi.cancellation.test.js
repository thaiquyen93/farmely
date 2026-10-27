import { afterEach, describe, expect, it, vi } from 'vitest';
import { rentalApi } from './rentalApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('requestCancellation', () => {
  it('sends the actual contract and customer to the cancellation endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { cancellationId: 42, status: 'PENDING' } })
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await rentalApi.requestCancellation({ contractId: 17, cancelledBy: 3, reason: 'Đổi kế hoạch canh tác' });

    expect(result).toEqual({ cancellationId: 42, status: 'PENDING' });
    expect(fetchMock).toHaveBeenCalledWith('/api/contracts/cancellations', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ contractId: 17, cancelledBy: 3, reason: 'Đổi kế hoạch canh tác' })
    }));
  });

  it('reports a server failure instead of claiming the request succeeded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Đã có yêu cầu hủy đang chờ duyệt' })
    }));

    await expect(rentalApi.requestCancellation({ contractId: 17, cancelledBy: 3, reason: 'Đổi kế hoạch canh tác' }))
      .rejects.toThrow('Đã có yêu cầu hủy đang chờ duyệt');
  });
});
