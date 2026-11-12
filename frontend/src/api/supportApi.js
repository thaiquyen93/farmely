import { apiFetch, apiUrl, getStoredAuth } from './apiClient';

const base = '/api/v1/support-tickets';
export const supportApi = {
  list: (filters = {}) => apiFetch(`${base}?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString()}`),
  related: () => apiFetch(`${base}/related`),
  detail: (id) => apiFetch(`${base}/${id}`),
  create: (body) => apiFetch(base, { method: 'POST', body: JSON.stringify(body) }),
  reply: (id, body) => apiFetch(`${base}/${id}/replies`, { method: 'POST', body: JSON.stringify({ body }) }),
  status: (id, status) => apiFetch(`${base}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assign: (id, assigneeId) => apiFetch(`${base}/${id}/assignee`, { method: 'PATCH', body: JSON.stringify({ assigneeId }) }),
  upload: (id, file) => { const form = new FormData(); form.append('file', file); return apiFetch(`${base}/${id}/attachments`, { method: 'POST', body: form }); },
  image: async (id, fileId) => {
    const response = await fetch(apiUrl(`${base}/${id}/attachments/${fileId}`), { headers: { Authorization: `Bearer ${getStoredAuth()?.token || ''}` } });
    if (!response.ok) throw new Error('Không tải được ảnh');
    return URL.createObjectURL(await response.blob());
  }
};
