/**
 * Farm Service API client — nông trại (lands) & thửa đất (plots).
 * Đi qua Vite proxy `/api` -> API Gateway (8080) -> farm-service (8082).
 *
 * Mọi hàm trả về `data` của ApiResponse; khi lỗi thì ném Error có `.message`
 * là thông điệp tiếng Việt của server (vd: "Ranh giới đang chồng lấn lên thửa: P-02").
 */

async function request(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('Không kết nối được máy chủ. Hãy kiểm tra API Gateway (8080) và farm-service (8082) đang chạy.');
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
    const err = new Error(fieldErrors || json?.message || `Lỗi máy chủ (${res.status})`);
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

export const PLOT_STATUS_OPTIONS = [
  { value: 'AVAIL', label: 'AVAILABLE — Sẵn sàng cho thuê', badge: 'AVAILABLE' },
  { value: 'RENT', label: 'RENTED — Đang được thuê', badge: 'RENTED' },
  { value: 'MAINT', label: 'MAINTENANCE — Nghỉ đất / bảo trì', badge: 'MAINTENANCE' }
];
export const plotStatusBadge = (s) => PLOT_STATUS_OPTIONS.find((o) => o.value === s)?.badge || s;

export const farmApi = {
  listLands: (search) => request('GET', `/api/lands${qs({ search })}`),
  getLand: (id) => request('GET', `/api/lands/${id}`),
  createLand: (body) => request('POST', '/api/lands', body),
  updateLand: (id, body) => request('PUT', `/api/lands/${id}`, body),
  deleteLand: (id) => request('DELETE', `/api/lands/${id}`),

  listPlots: (params) => request('GET', `/api/plots${qs(params)}`),
  getPlot: (id) => request('GET', `/api/plots/${id}`),
  createPlot: (body) => request('POST', '/api/plots', body),
  updatePlot: (id, body) => request('PUT', `/api/plots/${id}`, body),
  deletePlot: (id) => request('DELETE', `/api/plots/${id}`)
};
