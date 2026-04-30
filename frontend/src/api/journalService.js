import api from './axios';

const journalService = {
  // POST /journals/upload — multipart/form-data
  uploadPhoto: async (file) => {
    const form = new FormData();
    form.append('photo', file);
    const { data } = await api.post('/journals/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data; // { photo_url, filename, size, mimetype }
  },

  // GET /journals/public — no auth required
  getPublic: async ({ limit = 20, offset = 0 } = {}) => {
    const { data } = await api.get('/journals/public', { params: { limit, offset } });
    return data;
  },

  // GET /journals
  getAll: async () => {
    const { data } = await api.get('/journals');
    return data.journals;
  },

  // GET /journals/:id
  getOne: async (id) => {
    const { data } = await api.get(`/journals/${id}`);
    return data.journal;
  },

  // POST /journals
  create: async (payload) => {
    const { data } = await api.post('/journals', payload);
    return data.journal;
  },

  // PUT /journals/:id
  update: async (id, payload) => {
    const { data } = await api.put(`/journals/${id}`, payload);
    return data;
  },

  // DELETE /api/journals/:id
  remove: async (id) => {
    const { data } = await api.delete(`/api/journals/${id}`);
    return data;
  },
};

export default journalService;
