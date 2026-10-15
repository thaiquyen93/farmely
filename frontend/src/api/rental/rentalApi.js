/**
 * Rental Service API client — Hợp đồng thuê đất & Giữ chỗ 15 phút (Subsystem 3).
 * Đi qua Vite proxy `/api` -> API Gateway (8080) -> rental-service (8084).
 */

async function request(method, url, body) {
  const token = localStorage.getItem('farmely_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (netErr) {
    console.error('Network error calling rentalApi:', netErr);
    throw new Error('Không thể kết nối đến máy chủ hợp đồng. Hãy kiểm tra API Gateway (8080) và rental-service (8084).');
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* body rỗng */
  }

  if (!res.ok || json?.success === false) {
    const fieldErrors = json?.data && typeof json.data === 'object' && !Array.isArray(json.data)
      ? Object.values(json.data).join(' · ')
      : '';
    const msg = fieldErrors || json?.message || `Lỗi máy chủ (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.fields = json?.data;
    throw err;
  }

  return json?.data;
}

const qs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const rentalApi = {
  /**
   * Tạo đơn giữ chỗ (Reservation) tạm thời trong 15 phút (BR08)
   * @param {{ renterId: number, items: Array<{ plotId: number, varietyId: number, serviceId?: number, startDate: string, endDate: string }> }} payload
   */
  createReservation: (payload) => request('POST', '/api/contracts/reservations', payload),

  /**
   * Cộng thời gian ân hạn 10 phút khi vào bước thanh toán (BR08)
   * @param {number} contractId
   */
  extendGracePeriod: (contractId) => request('POST', `/api/contracts/${contractId}/grace-period`),

  /**
   * Kích hoạt hợp đồng sau khi thanh toán 100% trọn gói (BR09)
   * @param {number} contractId
   */
  activateContract: (contractId) => request('POST', `/api/contracts/${contractId}/activate`),

  /**
   * Hủy hợp đồng chưa thanh toán
   * @param {number} contractId
   */
  cancelContract: (contractId) => request('POST', `/api/contracts/${contractId}/cancel`),

  /**
   * Xem chi tiết hợp đồng theo ID kèm danh sách thửa đất
   * @param {number} contractId
   */
  getContract: (contractId) => request('GET', `/api/contracts/${contractId}`),

  /**
   * Tra cứu hợp đồng theo mã hợp đồng (ví dụ: HD-1729000000000-123)
   * @param {string} contractNumber
   */
  getContractByNumber: (contractNumber) => request('GET', `/api/contracts/number/${contractNumber}`),

  /**
   * Lấy danh sách hợp đồng (lọc theo khách hàng hoặc trạng thái)
   * @param {{ renterId?: number, status?: string }} params
   */
  listContracts: (params) => request('GET', `/api/contracts${qs(params)}`)
};
