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
        set({ user: mappedUser, token, isAuthenticated: true });
        return { success: true, user: mappedUser };
      }

      return {
        success: false,
        message: resData?.message || 'Email hoặc mật khẩu không chính xác.'
      };
    } catch (err) {
      console.error('Lỗi kết nối API đăng nhập:', err);
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
        const { token, user: dbUser } = resData.data;
        const mappedUser = {
          id: `USR-${dbUser.userId}`,
          userId: dbUser.userId,
          fullName: dbUser.fullName,
          email: dbUser.email,
          role: dbUser.role,
          phone: dbUser.phoneNumber || userData.phone,
          address: dbUser.address || '',
          roleTitle: 'Khách hàng thuê đất',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        };
        localStorage.setItem('farmely_token', token);
        localStorage.setItem('farmely_user', JSON.stringify(mappedUser));
        set({ user: mappedUser, token, isAuthenticated: true });
        return { success: true, user: mappedUser, message: resData.message };
      }
      return { success: false, message: resData?.message || 'Đăng ký thất bại' };
    } catch (err) {
      return { success: false, message: 'Lỗi kết nối máy chủ khi đăng ký.' };
    }
  },

  logout: () => {
    localStorage.removeItem('farmely_token');
    localStorage.removeItem('farmely_user');
    set({ user: null, token: null, isAuthenticated: false });
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
