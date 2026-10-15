import { create } from 'zustand';
import { defaultServices } from '../data/services';

const STORAGE_KEY = 'farmely_service_catalog_v1';

const loadServices = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultServices;
  } catch {
    return defaultServices;
  }
};

const persist = (services) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  return services;
};

export const useServiceStore = create((set) => ({
  services: loadServices(),
  addService: (service) => set((state) => ({ services: persist([...state.services, service]) })),
  toggleService: (serviceId) => set((state) => ({
    services: persist(state.services.map((service) => service.id === serviceId ? { ...service, active: !service.active } : service))
  })),
  setServices: (services) => set({ services: persist(services) })
}));

export const fetchServicesFromDb = async () => {
  try {
    const res = await fetch('/api/services');
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json?.data || []);
    if (list.length > 0) {
      const mapped = list.map((s) => ({
        id: `SVC-${String(s.serviceId || s.service_id).padStart(2, '0')}`,
        dbId: s.serviceId || s.service_id,
        name: s.serviceName || s.service_name,
        category: (s.serviceType || s.service_type) === 'COMBO' ? 'Gói combo chu kỳ' : 'Dịch vụ phát sinh',
        price: Number(s.price || 0),
        duration: s.durationDays || 1,
        active: s.isActive !== false,
        tasks: [{ offset: 0, title: `Thực hiện ${s.serviceName || s.service_name}`, assignee: 'STAFF', evidence: true }]
      }));
      useServiceStore.setState({ services: mapped });
      persist(mapped);
    }
  } catch (err) {
    console.error('Failed to load services from DB:', err);
  }
};

if (typeof window !== 'undefined') {
  fetchServicesFromDb();
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      useServiceStore.setState({ services: JSON.parse(event.newValue) });
    } catch {
      // Ignore malformed catalog data and keep the current in-memory state.
    }
  });
}
