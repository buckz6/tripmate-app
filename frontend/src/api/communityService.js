import api from './axios';

const communityService = {
  // GET /community?limit=&offset=
  getAll: async ({ limit = 20, offset = 0 } = {}) => {
    const { data } = await api.get('/community', { params: { limit, offset } });
    return data; // { journals, total, limit, offset }
  },

  // GET /community/search?q=&limit=&offset=
  search: async (q, { limit = 10, offset = 0 } = {}) => {
    const { data } = await api.get('/community/search', { params: { q, limit, offset } });
    return data; // { journals, total, limit, offset }
  },

  // POST /api/community/like/:journalId
  toggleLike: async (journalId) => {
    const { data } = await api.post(`/api/community/like/${journalId}`);
    return data; // { liked: boolean, like_count: number }
  },
};

export default communityService;
