import api from './axios';

const aiService = {
  generatePlan: async (destination, duration, preferences = []) => {
    const { data } = await api.post('/ai/plan', { destination, duration, preferences });
    return data;
  },
};

export default aiService;
