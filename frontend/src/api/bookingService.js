import api from './axios';

const bookingService = {
  // GET /bookings
  getAll: async () => {
    const { data } = await api.get('/bookings');
    return data.bookings;
  },

  // GET /bookings/:id
  getOne: async (id) => {
    const { data } = await api.get(`/bookings/${id}`);
    return data.booking;
  },

  // GET /bookings/code/:bookingCode
  getByCode: async (bookingCode) => {
    const { data } = await api.get(`/bookings/code/${bookingCode}`);
    return data.booking;
  },

  // POST /bookings
  // payload: { destination_id, check_in_date, check_out_date, payment_method }
  create: async (payload) => {
    const { data } = await api.post('/bookings', payload);
    return data.booking;
  },

  // PUT /bookings/:id/cancel
  cancel: async (id) => {
    const { data } = await api.put(`/bookings/${id}/cancel`);
    return data;
  },
};

export default bookingService;
