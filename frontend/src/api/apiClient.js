const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const getStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('farmely_auth') || 'null');
  } catch {
    return null;
  }
};

export const apiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export async function apiFetch(path, options = {}) {
  const auth = getStoredAuth();
  const headers = new Headers(options.headers || {});

  if (auth?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.message || `Máy chủ trả về HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const unwrapData = (payload) => payload?.data ?? payload;
