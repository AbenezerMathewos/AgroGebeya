import api from './api';

export const poolService = {
  getOpenPools: (params) => api.get('/pools', { params }).then((res) => res.data),
  getAllPools: () => api.get('/pools/admin/all').then((res) => res.data),
  getPoolById: (id) => api.get(`/pools/${id}`).then((res) => res.data),
  getMyContributions: () => api.get('/pools/my/contributions').then((res) => res.data),
  create: (data) => api.post('/pools', data).then((res) => res.data),
  contribute: (id, data) => api.post(`/pools/${id}/contribute`, data).then((res) => res.data),
  updateStatus: (id, status) => api.put(`/pools/${id}/status`, { status }).then((res) => res.data),
};
