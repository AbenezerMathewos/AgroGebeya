import api from './api';
export const marketPriceService = {
  getAll: (params) => api.get('/market-prices', { params }).then((res) => res.data),
  getArbitrage: () => api.get('/market-prices/arbitrage').then((res) => res.data),
  predictPrice: (crop, params = {}) => api.get(`/market-prices/predict/${encodeURIComponent(crop)}`, { params }).then((res) => res.data),
  create: (data) => api.post('/market-prices', data).then((res) => res.data),
  remove: (id) => api.delete(`/market-prices/${id}`).then((res) => res.data),
};

