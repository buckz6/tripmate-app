import api from './axios';

const profileService = {
  // GET /profile
  get: async () => {
    const { data } = await api.get('/profile');
    return data.user;
  },

  // PUT /profile
  update: async ({ name, email }) => {
    const { data } = await api.put('/profile', { name, email });
    return data.user;
  },

  // PUT /profile/password
  changePassword: async ({ old_password, new_password }) => {
    const { data } = await api.put('/profile/password', { old_password, new_password });
    return data;
  },

  // GET /profile/stats
  getStats: async () => {
    const { data } = await api.get('/profile/stats');
    return data.stats;
  },
};

export default profileService;
