import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1', withCredentials: true });
api.interceptors.request.use((config) => { const token = localStorage.getItem('huru_access_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
let refreshing: Promise<string> | null = null;
api.interceptors.response.use((response) => response, async (error) => {
  const request = error.config;
  if (error.response?.status !== 401 || request?._retried || request?.url?.includes('/auth/refresh')) return Promise.reject(error);
  request._retried = true;
  try {
    refreshing ??= api.post('/auth/refresh').then((r) => r.data.data.accessToken).finally(() => { refreshing = null; });
    const token = await refreshing;
    localStorage.setItem('huru_access_token', token);
    request.headers.Authorization = `Bearer ${token}`;
    return api(request);
  } catch (refreshError) { localStorage.removeItem('huru_access_token'); return Promise.reject(refreshError); }
});
export default api;
