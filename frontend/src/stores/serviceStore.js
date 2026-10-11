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
  }))
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      useServiceStore.setState({ services: JSON.parse(event.newValue) });
    } catch {
      // Ignore malformed catalog data and keep the current in-memory state.
    }
  });
}
