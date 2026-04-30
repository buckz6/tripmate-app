import api, { TOKEN_KEY } from './axios';

const authService = {
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  // Decode JWT payload without a library — returns null if invalid/expired
  getTokenPayload: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => authService.getTokenPayload() !== null,
};

export default authService;
