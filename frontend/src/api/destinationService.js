import api from './axios';

const destinationService = {
  // GET /destinations?limit=&offset=
  getAll: async ({ limit = 10, offset = 0 } = {}) => {
    const { data } = await api.get('/destinations', { params: { limit, offset } });
    return data;
  },

  // GET /destinations/:id
  getOne: async (id) => {
    const { data } = await api.get(`/destinations/${id}`);
    return data.destination;
  },

  // GET /destinations/search?q=&limit=&offset=
  search: async (q, { limit = 10, offset = 0 } = {}) => {
    const { data } = await api.get('/destinations/search', { params: { q, limit, offset } });
    return data;
  },
};

export default destinationService;
