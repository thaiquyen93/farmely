/**
 * Site Visit Service - Đặt lịch tham quan khảo sát thửa đất (SCR-PUB-05 / Table site_visits)
 * Tích hợp trực tiếp SQL Server isp392_agritech
 */

const LOCAL_STORAGE_KEY = 'farmely_site_visits_fallback';

export const siteVisitsService = {
  // Lấy danh sách lịch tham quan từ Database
  async getAll() {
    try {
      const res = await fetch('/api/site-visits');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('API /api/site-visits error, fallbacking to cache:', err);
    }
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  },

  // Tạo mới lịch hẹn tham quan vào Database
  async create(bookingData) {
    try {
      const res = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      if (res.ok) {
        const result = await res.json();
        return result.data;
      }
    } catch (err) {
      console.warn('API /api/site-visits create error:', err);
    }

    // Client fallback if offline
    const fallbackItem = {
      visit_id: Date.now(),
      ...bookingData,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    const current = await this.getAll();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([fallbackItem, ...current]));
    return fallbackItem;
  },

  // Admin xác nhận lịch hẹn (status -> CONFIRMED)
  async confirm(visitId) {
    try {
      const res = await fetch(`/api/site-visits/${visitId}/confirm`, {
        method: 'POST'
      });
      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.warn('API /api/site-visits confirm error:', err);
    }

    // Fallback cache update
    const current = await this.getAll();
    const updated = current.map(v => v.visit_id === visitId ? { ...v, status: 'CONFIRMED' } : v);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  }
};
