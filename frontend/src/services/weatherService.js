import api from './api';

export const weatherService = {
  getForecast: async (region) => {
    const response = await api.get('/weather', { params: { region } });
    return response.data;
  },
};
