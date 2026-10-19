import { create } from 'zustand';

// Default mock demo users for quick role switching & testing
export const DEMO_ACCOUNTS = [
  {
    id: "USR-001",
    fullName: "Lô Thái Quyền",
    email: "customer@farmely.vn",
    role: "CUSTOMER",
    phone: "0901234567",
    roleTitle: "Khách hàng thuê đất",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "USR-002",
    fullName: "ThS. Nguyễn Hoàng Nam",
    email: "expert@farmely.vn",
    role: "EXPERT",
    phone: "0912345678",
    roleTitle: "Chuyên gia nông nghiệp (CGNN)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "USR-003",
    fullName: "Trần Văn Lực",
    email: "worker@farmely.vn",
    role: "STAFF",
    phone: "0923456789",
    roleTitle: "Chuyên viên lao động hiện trường (CVLĐ)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "USR-004",
    fullName: "Ban Quản Trị Farmely",
    email: "admin@farmely.vn",
    role: "ADMIN",
    phone: "0934567890",
    roleTitle: "Quản trị viên hệ thống (Admin)",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
  }
];

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('farmely_user')) || null,
  token: localStorage.getItem('farmely_token') || null,
  isAuthenticated: !!localStorage.getItem('farmely_user'),

  login: async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const resData = await response.json();

      if (response.ok && resData && resData.success && resData.data) {
        const { token, user: dbUser } = resData.data;
        const mappedUser = {
          id: `USR-${dbUser.userId}`,
          userId: dbUser.userId,
          fullName: dbUser.fullName,
          email: dbUser.email,
          role: dbUser.role,
          phone: dbUser.phoneNumber || '',
          address: dbUser.address || '',
          roleTitle: dbUser.role === 'ADMIN' ? 'Quản trị viên hệ thống (Admin)'
            : dbUser.role === 'EXPERT' ? 'Chuyên gia nông nghiệp (CGNN)'
            : dbUser.role === 'STAFF' ? 'Chuyên viên lao động hiện trường (CVLĐ)'
            : 'Khách hàng thuê đất',
          avatar: dbUser.role === 'ADMIN' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
            : dbUser.role === 'EXPERT' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
            : dbUser.role === 'STAFF' ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        };

        localStorage.setItem('farmely_token', token);
        localStorage.setItem('farmely_user', JSON.stringify(mappedUser));
        localStorage.setItem('farmely_auth', JSON.stringify({ token, user: mappedUser }));
        set({ user: mappedUser, token, isAuthenticated: true });
        return { success: true, user: mappedUser };
      }

      return {
        success: false,
        message: resData?.message || 'Email hoặc mật khẩu không chính xác.'
      };
    } catch (err) {
      console.error('Lỗi kết nối API đăng nhập:', err);
      // Fallback cho tài khoản demo khi Identity Service offline
      const demoAcc = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
      if (demoAcc) {
        const fallbackToken = 'demo-token-' + demoAcc.id;
        localStorage.setItem('farmely_token', fallbackToken);
        localStorage.setItem('farmely_user', JSON.stringify(demoAcc));
        localStorage.setItem('farmely_auth', JSON.stringify({ token: fallbackToken, user: demoAcc }));
        set({ user: demoAcc, token: fallbackToken, isAuthenticated: true });
        return { success: true, user: demoAcc };
      }
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ xác thực (Identity Service).'
      };
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
        const dbUser = resData.data.user || resData.data;
        const token = resData.data.token || ('farmely_token_' + (dbUser.userId || dbUser.id || Date.now()));
        const resolvedUserId = dbUser.userId || dbUser.id || Date.now();
        const mappedUser = {
          id: `USR-${resolvedUserId}`,
          userId: resolvedUserId,
          fullName: dbUser.fullName || userData.fullName,
          email: dbUser.email || userData.email,
          role: dbUser.role || 'CUSTOMER',
          phone: dbUser.phoneNumber || dbUser.phone || userData.phone || '',
          address: dbUser.address || '',
          roleTitle: 'Khách hàng thuê đất',
          avatar: dbUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        };
        localStorage.setItem('farmely_token', token);
        localStorage.setItem('farmely_user', JSON.stringify(mappedUser));
        localStorage.setItem('farmely_auth', JSON.stringify({ token, user: mappedUser }));
        set({ user: mappedUser, token, isAuthenticated: true });
        return { success: true, user: mappedUser, message: resData.message || 'Đăng ký tài khoản thành công.' };
      }
      return { success: false, message: resData?.message || 'Đăng ký thất bại. Vui lòng thử lại.' };
    } catch (err) {
      console.error('Lỗi gọi API đăng ký:', err);
      return { success: false, message: 'Lỗi kết nối máy chủ khi đăng ký.' };
    }
  },

  refreshUser: async () => {
    const user = get().user;
    if (!user) return null;
    const token = get().token || localStorage.getItem('farmely_token');
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const resData = await response.json();
        const dbUser = resData?.data?.user || resData?.data;
        if (dbUser) {
          const updated = {
            ...user,
            ...dbUser,
            fullName: dbUser.fullName || user.fullName,
            phoneNumber: dbUser.phoneNumber || dbUser.phone || user.phoneNumber || user.phone,
            phone: dbUser.phoneNumber || dbUser.phone || user.phone,
            address: dbUser.address || user.address
          };
          localStorage.setItem('farmely_user', JSON.stringify(updated));
          localStorage.setItem('farmely_auth', JSON.stringify({ token, user: updated }));
          set({ user: updated, isAuthenticated: true });
          return updated;
        }
      }
    } catch {
      // offline / quiet fallback
    }
    return user;
  },

  logout: () => {
    localStorage.removeItem('farmely_token');
    localStorage.removeItem('farmely_user');
    localStorage.removeItem('farmely_auth');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (changes) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...changes };
    localStorage.setItem('farmely_user', JSON.stringify(updated));
    set({ user: updated, isAuthenticated: true });
  },

  switchRole: async (role) => {
    const roleEmailMap = {
      CUSTOMER: 'customer@farmely.vn',
      EXPERT: 'expert@farmely.vn',
      STAFF: 'worker@farmely.vn',
      ADMIN: 'admin@farmely.vn'
    };
    const email = roleEmailMap[role] || 'customer@farmely.vn';
    return await get().login(email, '123456');
  }
}));
