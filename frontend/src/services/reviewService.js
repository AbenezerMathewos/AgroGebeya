import api from './api';

export const reviewService = {
  getForProduct: (productId) => api.get(`/reviews/product/${productId}`).then((res) => res.data),
  getFarmerSummary: (farmerId) => api.get(`/reviews/farmer/${farmerId}/summary`).then((res) => res.data),
  create: (data) => api.post('/reviews', data).then((res) => res.data),
};
