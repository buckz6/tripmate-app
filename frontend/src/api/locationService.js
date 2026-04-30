import api from './axios';

const locationService = {
  // GET /locations
  getAll: async () => {
    const { data } = await api.get('/locations');
    return data.locations;
  },

  // POST /locations
  // payload: { name, latitude, longitude, journal_id? }
  save: async (payload) => {
    const { data } = await api.post('/locations', payload);
    return data.location;
  },

  // DELETE /locations/:id
  remove: async (id) => {
    const { data } = await api.delete(`/locations/${id}`);
    return data;
  },
};

export default locationService;
