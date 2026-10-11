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
  isAuthenticated: !!localStorage.getItem('farmely_user'),

  login: (email, password) => {
    // Check against demo accounts or accept valid format
    const found = DEMO_ACCOUNTS.find(acc => acc.email.toLowerCase() === email.toLowerCase());
    if (found) {
      localStorage.setItem('farmely_user', JSON.stringify(found));
      set({ user: found, isAuthenticated: true });
      return { success: true, user: found };
    }

    // Default customer login fallback for custom credentials
    const customUser = {
      id: "USR-" + Math.floor(1000 + Math.random() * 9000),
      fullName: email.split('@')[0],
      email: email,
      role: "CUSTOMER",
      phone: "0909999888",
      roleTitle: "Khách hàng thuê đất",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
    };
    localStorage.setItem('farmely_user', JSON.stringify(customUser));
    set({ user: customUser, isAuthenticated: true });
    return { success: true, user: customUser };
  },

  register: (userData) => {
    const newUser = {
      id: "USR-" + Math.floor(1000 + Math.random() * 9000),
      fullName: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      role: "CUSTOMER",
      roleTitle: "Khách hàng thuê đất",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
    };
    localStorage.setItem('farmely_user', JSON.stringify(newUser));
    set({ user: newUser, isAuthenticated: true });
    return { success: true, user: newUser };
  },

  logout: () => {
    localStorage.removeItem('farmely_user');
    set({ user: null, isAuthenticated: false });
  },

  switchRole: (role) => {
    const target = DEMO_ACCOUNTS.find(acc => acc.role === role);
    if (target) {
      localStorage.setItem('farmely_user', JSON.stringify(target));
      set({ user: target, isAuthenticated: true });
    }
  }
}));
