import { create } from 'zustand';
import { apiFetch, unwrapData } from '../api/apiClient';

const iconForCode = (code) => {
  if (code === 'S01') return 'droplets';
  if (['S04', 'S05'].includes(code)) return 'layers';
  if (code === 'S14') return 'calendar';
  return 'sprout';
};

export const normalizeService = (service) => {
  const serviceId = Number(service.serviceId);
  const serviceCode = service.serviceCode || `S${String(serviceId).padStart(2, '0')}`;
  const isTemporaryPackage = serviceCode === 'S14';
  const isFullCycle = serviceCode === 'S15';

  return {
    id: serviceCode,
    serviceId,
    serviceCode,
    name: service.serviceName,
    serviceType: service.serviceType,
    category: service.serviceType === 'FULL' ? 'Trọn gói' : 'Dịch vụ một lần',
    customerCategory: isTemporaryPackage ? 'CYCLE' : isFullCycle ? 'FULL' : 'SINGLE',
    price: Number(service.price || 0),
    unit: service.unit || '',
    tag: isTemporaryPackage ? 'Chăm sóc theo tuần' : isFullCycle ? 'Chăm sóc toàn vụ' : 'Dịch vụ lẻ',
    iconKey: iconForCode(serviceCode),
    active: service.status === 'ACTIVE',
    status: service.status,
    description: service.description || '',
    tasks: []
  };
};

export const useServiceStore = create((set, get) => ({
  services: [],
  loading: false,
  loaded: false,
  error: '',

  loadServices: async (force = false) => {
    if (!force && (get().loading || get().loaded)) return get().services;
    set({ loading: true, error: '' });
    try {
      const payload = await apiFetch('/api/services');
      const services = (unwrapData(payload) || []).map(normalizeService);
      set({ services, loading: false, loaded: true });
      return services;
    } catch (error) {
      set({ services: [], loading: false, loaded: false, error: error.message });
      throw error;
    }
  },

  addService: async (service) => {
    const payload = await apiFetch('/api/services', {
      method: 'POST',
      body: JSON.stringify(service)
    });
    const created = normalizeService(unwrapData(payload));
    set((state) => ({ services: [...state.services, created] }));
    return created;
  },

  toggleService: async (serviceId) => {
    const current = get().services.find((service) => service.serviceId === serviceId);
    if (!current) return null;
    const payload = await apiFetch(`/api/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: current.active ? 'INACTIVE' : 'ACTIVE' })
    });
    const updated = normalizeService(unwrapData(payload));
    set((state) => ({
      services: state.services.map((service) => service.serviceId === serviceId ? updated : service)
    }));
    return updated;
  }
}));
