import api from './api';
export const orderService = {
  create: (data) => api.post('/orders', data).then((res) => res.data),
  getMine: () => api.get('/orders/my').then((res) => res.data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then((res) => res.data),
  pay: (id, data) => api.post(`/orders/${id}/pay`, data).then((res) => res.data),
  releaseEscrow: (id) => api.put(`/orders/${id}/release-escrow`).then((res) => res.data),
  initializeChapa: (orderId) => api.post('/orders/pay/chapa/initialize', { orderId }).then((res) => res.data),
};

