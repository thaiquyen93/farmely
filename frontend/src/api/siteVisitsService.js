/**
 * Site Visit Service - Đặt lịch tham quan khảo sát thửa đất (SCR-PUB-05 / Table site_visits)
 * Tích hợp trực tiếp SQL Server isp392_agritech
 */

export const siteVisitsService = {
  // Lấy danh sách lịch tham quan từ Database
  async getAll() {
    const res = await fetch('/api/site-visits');
    if (!res.ok) throw new Error(`Không thể tải lịch tham quan (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  // Tạo mới lịch hẹn tham quan vào Database
  async create(bookingData) {
    const res = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
    if (!res.ok) throw new Error(`Không thể tạo lịch tham quan (${res.status})`);
    const result = await res.json();
    return result.data;
  },

  // Admin xác nhận lịch hẹn (status -> CONFIRMED)
  async confirm(visitId) {
    const res = await fetch(`/api/site-visits/${visitId}/confirm`, {
        method: 'POST'
      });
    if (!res.ok) throw new Error(`Không thể xác nhận lịch tham quan (${res.status})`);
    return true;
  }
};
