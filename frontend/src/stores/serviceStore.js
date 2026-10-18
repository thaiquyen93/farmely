import { create } from 'zustand';
import { defaultServices } from '../data/services';
import { apiFetch, unwrapData } from '../api/apiClient';

const STORAGE_KEY = 'farmely_service_catalog_v1';

const iconForCode = (code) => {
  if (code === 'S01') return 'droplets';
  if (['S04', 'S05'].includes(code)) return 'layers';
  if (code === 'S14') return 'calendar';
  return 'sprout';
};

export const normalizeService = (service) => {
  const serviceId = Number(service.serviceId || service.service_id || 0);
  const serviceCode = service.serviceCode || service.service_code || `S${String(serviceId).padStart(2, '0')}`;
  const isTemporaryPackage = serviceCode === 'S14';
  const isFullCycle = serviceCode === 'S15' || service.serviceType === 'FULL';

  return {
    id: serviceCode,
    serviceId,
    serviceCode,
    name: service.serviceName || service.service_name || service.name || 'Dịch vụ nông nghiệp',
    serviceType: service.serviceType || service.service_type || 'A_LA_CARTE',
    category: (service.serviceType === 'FULL' || isFullCycle) ? 'Trọn gói' : 'Dịch vụ một lần',
    customerCategory: isTemporaryPackage ? 'CYCLE' : isFullCycle ? 'FULL' : 'SINGLE',
    price: Number(service.price || 0),
    unit: service.unit || '/ lần thực hiện',
    tag: isTemporaryPackage ? 'Chăm sóc theo tuần' : isFullCycle ? 'Chăm sóc toàn vụ' : 'Dịch vụ lẻ',
    iconKey: iconForCode(serviceCode),
    active: service.status === 'ACTIVE' || service.isActive !== false || service.active !== false,
    status: service.status || 'ACTIVE',
    description: service.description || '',
    tasks: Array.isArray(service.tasks) ? service.tasks : []
  };
};

const initialServices = defaultServices.map(normalizeService);

export const useServiceStore = create((set, get) => ({
  services: initialServices,
  loading: false,
  loaded: false,
  error: '',

  loadServices: async (force = false) => {
    if (!force && (get().loading || get().loaded)) return get().services;
    set({ loading: true, error: '' });
    try {
      const payload = await apiFetch('/api/services');
      const data = unwrapData(payload);
      const list = Array.isArray(data) ? data : (data?.data || []);
      const services = list.map(normalizeService);
      set({ services, loading: false, loaded: true, error: '' });
      return services;
    } catch (error) {
      set({ loading: false, loaded: false, error: error.message });
      throw error;
    }
  },

  addService: async (service) => {
    try {
      const payload = await apiFetch('/api/services', {
        method: 'POST',
        body: JSON.stringify(service)
      });
      const created = normalizeService(unwrapData(payload));
      set((state) => ({ services: [...state.services, created] }));
      return created;
    } catch {
      const fallback = normalizeService(service);
      set((state) => ({ services: [...state.services, fallback] }));
      return fallback;
    }
  },

  toggleService: async (serviceId) => {
    const current = get().services.find((s) => s.serviceId === serviceId || s.id === serviceId);
    if (!current) return null;
    const nextActive = !current.active;
    try {
      const targetId = current.serviceId || serviceId;
      const payload = await apiFetch(`/api/services/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextActive ? 'ACTIVE' : 'INACTIVE' })
      });
      const updated = normalizeService(unwrapData(payload));
      set((state) => ({
        services: state.services.map((s) => (s.serviceId === targetId || s.id === targetId) ? updated : s)
      }));
      return updated;
    } catch {
      const updated = { ...current, active: nextActive, status: nextActive ? 'ACTIVE' : 'INACTIVE' };
      set((state) => ({
        services: state.services.map((s) => (s.serviceId === current.serviceId || s.id === current.id) ? updated : s)
      }));
      return updated;
    }
  },

  setServices: (services) => set({ services: services.map(normalizeService) })
}));
