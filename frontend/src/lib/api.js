// Thin API client.
// Dev: Vite proxies /api -> http://localhost:4000.
// Prod: set VITE_API_URL to the backend origin (e.g. https://mshelphub-api.onrender.com).
export const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const BASE = API_BASE;

function userToken() {
  return localStorage.getItem('urban_token') || '';
}

async function req(path, { method = 'GET', body, token, auth } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (auth && userToken()) headers.Authorization = `Bearer ${userToken()}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // public
  listServices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/services${qs ? `?${qs}` : ''}`);
  },
  getService: (slug) => req(`/services/${slug}`),
  createRequest: (payload) => req('/requests', { method: 'POST', body: payload, auth: true }),
  trackRequest: (code) => req(`/requests/${code}`),

  // user auth + dashboard
  auth: {
    signup: (payload) => req('/auth/signup', { method: 'POST', body: payload }),
    login: (phone, password) => req('/auth/login', { method: 'POST', body: { phone, password } }),
    me: () => req('/auth/me', { auth: true }),
    myRequests: () => req('/auth/me/requests', { auth: true }),
  },

  // admin (token required)
  admin: {
    stats: (token) => req('/admin/stats', { token }),
    requests: (token, status) => req(`/admin/requests${status ? `?status=${status}` : ''}`, { token }),
    staff: (token, serviceId) => req(`/admin/staff${serviceId ? `?serviceId=${serviceId}` : ''}`, { token }),
    createStaff: (token, payload) => req('/admin/staff', { method: 'POST', token, body: payload }),
    updateStaff: (token, id, payload) => req(`/admin/staff/${id}`, { method: 'PATCH', token, body: payload }),
    deleteStaff: (token, id) => req(`/admin/staff/${id}`, { method: 'DELETE', token }),
    accept: (token, id) => req(`/admin/requests/${id}/accept`, { method: 'POST', token }),
    assign: (token, id, staffId) => req(`/admin/requests/${id}/assign`, { method: 'POST', token, body: { staffId } }),
    start: (token, id) => req(`/admin/requests/${id}/start`, { method: 'POST', token }),
    complete: (token, id) => req(`/admin/requests/${id}/complete`, { method: 'POST', token }),
    cancel: (token, id) => req(`/admin/requests/${id}/cancel`, { method: 'POST', token }),
  },
};
