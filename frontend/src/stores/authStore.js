import { create } from 'zustand';
import { apiFetch, unwrapData } from '../api/apiClient';

const ROLE_TITLES = {
  CUSTOMER: 'Khách hàng thuê đất',
  EXPERT: 'Chuyên gia nông nghiệp (CGNN)',
  STAFF: 'Chuyên viên lao động hiện trường (CVLĐ)',
  ADMIN: 'Quản trị viên hệ thống (Admin)'
};

const normalizeUser = (user, token) => {
  const role = user?.role === 'FIELD_WORKER' ? 'STAFF' : user?.role;
  return {
    ...user,
    id: user?.userId,
    phone: user?.phoneNumber,
    role,
    roleTitle: ROLE_TITLES[role] || role,
    token
  };
};

const readAuth = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('farmely_auth') || 'null');
    return auth?.token && auth?.user ? auth : null;
  } catch {
    return null;
  }
};

const persistAuth = (auth) => {
  localStorage.setItem('farmely_auth', JSON.stringify(auth));
  localStorage.setItem('farmely_user', JSON.stringify(auth.user));
};

const initialAuth = readAuth();

export const useAuthStore = create((set, get) => ({
  user: initialAuth?.user || null,
  isAuthenticated: Boolean(initialAuth),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = unwrapData(await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      }));
      const user = normalizeUser(data.user, data.token);
      persistAuth({ token: data.token, expiresIn: data.expiresIn, user });
      set({ user, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return { success: false, message: error.message };
    }
  },

  register: async (userData) => {
    try {
      const payload = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: userData.fullName,
          email: userData.email,
          phoneNumber: userData.phone,
          password: userData.password || 'Farmely@2026'
        })
      });
      const data = unwrapData(payload);
      const dbUser = normalizeUser(data.user, data.token);
      persistAuth({ token: data.token, expiresIn: data.expiresIn, user: dbUser });
      set({ user: dbUser, isAuthenticated: true });
      return { success: true, user: dbUser, message: payload?.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  refreshUser: async () => {
    const auth = readAuth();
    if (!auth?.token) return null;
    try {
      const user = normalizeUser(unwrapData(await apiFetch('/api/auth/me')), auth.token);
      persistAuth({ ...auth, user });
      set({ user, isAuthenticated: true });
      return user;
    } catch (error) {
      if (error.status === 401) get().logout();
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('farmely_user');
    localStorage.removeItem('farmely_auth');
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (changes) => {
    const updated = { ...get().user, ...changes };
    const auth = readAuth();
    persistAuth({ ...auth, user: updated });
    set({ user: updated });
    return updated;
  }
}));
