import axios from 'axios';

export const TOKEN_KEY = 'tripmate_token';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// ── Request interceptor — inject JWT on every request ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code   = error.response?.data?.code;

    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Dispatch custom event so App.jsx can redirect via React Router
      // without triggering a full page reload
      window.dispatchEvent(new CustomEvent('auth:logout', {
        detail: { from: window.location.pathname },
      }));
    }

    const message =
      error.response?.data?.error   ||
      error.response?.data?.errors?.[0] ||
      error.message                  ||
      'Something went wrong.';

    return Promise.reject({ message, status, code });
  }
);

export default api;
