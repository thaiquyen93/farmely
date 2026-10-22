import { create } from 'zustand';

// Default mock demo users for quick role switching & testing
export const DEMO_ACCOUNTS = [
  {
    id: "USR-001",
    userId: 1,
    fullName: "Lô Thái Quyền",
    email: "customer@farmely.vn",
    role: "CUSTOMER",
    phone: "0901234567",
    roleTitle: "Khách hàng thuê đất",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "USR-002",
    userId: 2,
    fullName: "ThS. Nguyễn Hoàng Nam",
    email: "expert@farmely.vn",
    role: "EXPERT",
    phone: "0912345678",
    roleTitle: "Chuyên gia nông nghiệp (CGNN)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "USR-003",
    userId: 3,
    fullName: "Trần Văn Lực",
    email: "worker@farmely.vn",
    role: "STAFF",
    phone: "0923456789",
    roleTitle: "Nhân viên lao động (STAFF)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "USR-004",
    userId: 4,
    fullName: "Ban Quản Trị Farmely",
    email: "admin@farmely.vn",
    role: "ADMIN",
    phone: "0934567890",
    roleTitle: "Quản trị viên hệ thống (Admin)",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
  }
];

const ROLE_TITLES = {
  CUSTOMER: 'Khách hàng thuê đất',
  EXPERT: 'Chuyên gia nông nghiệp (CGNN)',
  STAFF: 'Chuyên viên lao động hiện trường (CVLĐ)',
  ADMIN: 'Quản trị viên hệ thống (Admin)'
};

const normalizeUser = (user, token) => {
  if (!user) return null;
  const role = (user?.role === 'FIELD_WORKER' || user?.role === 'worker') ? 'STAFF' : user?.role;
  return {
    ...user,
    id: user?.id || (user?.userId ? `USR-${user.userId}` : undefined),
    userId: user?.userId || (typeof user?.id === 'number' ? user.id : undefined),
    phone: user?.phone || user?.phoneNumber || '',
    address: user?.address || '',
    role,
    roleTitle: ROLE_TITLES[role] || role,
    avatar: user?.avatar || (
      role === 'ADMIN' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
      : role === 'EXPERT' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
      : role === 'STAFF' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    ),
    token: token || user?.token
  };
};

const readAuth = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('farmely_auth') || 'null');
    if (auth?.token && auth?.user) return auth;
    const user = JSON.parse(localStorage.getItem('farmely_user') || 'null');
    const token = localStorage.getItem('farmely_token') || null;
    if (user) return { token, user: normalizeUser(user, token) };
    return null;
  } catch {
    return null;
  }
};

const persistAuth = (auth) => {
  localStorage.setItem('farmely_auth', JSON.stringify(auth));
  localStorage.setItem('farmely_user', JSON.stringify(auth.user));
  if (auth.token) localStorage.setItem('farmely_token', auth.token);
};

const initialAuth = readAuth();

export const useAuthStore = create((set, get) => ({
  user: initialAuth?.user || null,
  token: initialAuth?.token || null,
  isAuthenticated: Boolean(initialAuth?.user),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const resData = await response.json();
      if (response.ok && resData && resData.success && resData.data) {
        const data = resData.data;
        const rawUser = data.user || data.dbUser;
        const user = normalizeUser(rawUser, data.token);
        persistAuth({ token: data.token, expiresIn: data.expiresIn, user });
        set({ user, token: data.token, isAuthenticated: true, isLoading: false });
        return { success: true, user };
      }
      // Fallback cho tài khoản demo kiểm thử nếu mật khẩu DB không khớp
      const demoAcc = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
      if (demoAcc) {
        const fallbackToken = 'demo-token-' + demoAcc.id;
        const normalized = normalizeUser(demoAcc, fallbackToken);
        persistAuth({ token: fallbackToken, user: normalized });
        set({ user: normalized, token: fallbackToken, isAuthenticated: true, isLoading: false });
        return { success: true, user: normalized };
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return { success: false, message: resData?.message || 'Email hoặc mật khẩu không chính xác.' };
    } catch (error) {
      // Fallback cho tài khoản demo khi Identity Service offline
      const demoAcc = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
      if (demoAcc) {
        const fallbackToken = 'demo-token-' + demoAcc.id;
        const normalized = normalizeUser(demoAcc, fallbackToken);
        persistAuth({ token: fallbackToken, user: normalized });
        set({ user: normalized, token: fallbackToken, isAuthenticated: true, isLoading: false });
        return { success: true, user: normalized };
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return { success: false, message: error.message || 'Không thể kết nối đến máy chủ xác thực.' };
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: userData.fullName,
          email: userData.email,
          phoneNumber: userData.phone,
          password: userData.password || '123456'
        })
      });
      const resData = await response.json();
      if (response.ok && resData && resData.success && resData.data) {
        const data = resData.data;
        const dbUser = normalizeUser(data.user || data, data.token);
        persistAuth({ token: data.token, expiresIn: data.expiresIn, user: dbUser });
        set({ user: dbUser, token: data.token, isAuthenticated: true });
        return { success: true, user: dbUser, message: resData.message || 'Đăng ký thành công.' };
      }
      return { success: false, message: resData?.message || 'Đăng ký thất bại. Vui lòng thử lại.' };
    } catch (err) {
      return { success: false, message: err.message || 'Lỗi kết nối máy chủ khi đăng ký.' };
    }
  },

  refreshUser: async () => {
    const auth = readAuth();
    if (!auth?.token) return null;
    if (auth.token.startsWith('demo-token-')) {
      return auth.user;
    }
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(auth.token ? { 'Authorization': `Bearer ${auth.token}` } : {})
        }
      });
      if (response.ok) {
        const resData = await response.json();
        const dbUser = resData?.data?.user || resData?.data;
        if (dbUser) {
          const user = normalizeUser(dbUser, auth.token);
          persistAuth({ ...auth, user });
          set({ user, isAuthenticated: true });
          return user;
        }
      }
      return auth.user;
    } catch (error) {
      if (error.status === 401 && !auth.token.startsWith('farmely-jwt-token-') && !auth.token.startsWith('demo-token-')) {
        console.warn('Session refresh returned 401:', error.message);
      }
      return auth.user;
    }
  },

  logout: () => {
    localStorage.removeItem('farmely_token');
    localStorage.removeItem('farmely_user');
    localStorage.removeItem('farmely_auth');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  updateUser: (changes) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...changes };
    localStorage.setItem('farmely_user', JSON.stringify(updated));
    const auth = readAuth();
    if (auth) persistAuth({ ...auth, user: updated });
    set({ user: updated, isAuthenticated: true });
  },

  switchRole: async (role) => {
    const target = DEMO_ACCOUNTS.find(acc => acc.role === role);
    if (target) {
      const normalized = normalizeUser(target, 'demo-token-' + target.id);
      persistAuth({ token: 'demo-token-' + target.id, user: normalized });
      set({ user: normalized, isAuthenticated: true });
    }
    const roleEmailMap = {
      CUSTOMER: 'customer@farmely.vn',
      EXPERT: 'expert@farmely.vn',
      STAFF: 'worker@farmely.vn',
      ADMIN: 'admin@farmely.vn'
    };
    const email = roleEmailMap[role] || 'customer@farmely.vn';
    return await get().login(email, 'Password@123').catch(() => ({ success: true, user: target }));
  }
}));
