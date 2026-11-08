import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeService, useServiceStore } from './serviceStore';

afterEach(() => {
  vi.unstubAllGlobals();
  useServiceStore.setState({ services: [], loading: false, loaded: false, error: '' });
});

describe('serviceStore database synchronization', () => {
  it('maps the database service contract without mock pricing', () => {
    const service = normalizeService({
      serviceId: 15,
      serviceCode: 'S15',
      serviceName: 'Gói chăm sóc toàn vụ',
      serviceType: 'FULL',
      price: 1800000,
      unit: 'vụ/luống',
      description: 'Trọn gói Assisted-growing',
      status: 'ACTIVE'
    });

    expect(service.id).toBe('S15');
    expect(service.price).toBe(1800000);
    expect(service.customerCategory).toBe('FULL');
    expect(service.active).toBe(true);
  });

  it('loads services from /api/services', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: [{
        serviceId: 1,
        serviceCode: 'S01',
        serviceName: 'Tưới nước bổ sung',
        serviceType: 'A_LA_CARTE',
        price: 25000,
        unit: 'lần/luống',
        description: 'Tưới theo thông số',
        status: 'ACTIVE'
      }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    const services = await useServiceStore.getState().loadServices(true);
    expect(fetch).toHaveBeenCalledWith('/api/services', expect.any(Object));
    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({ id: 'S01', price: 25000, active: true });
  });
});
