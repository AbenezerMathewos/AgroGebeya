import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats').then((res) => res.data),
  getUsers: () => api.get('/admin/users').then((res) => res.data),
  getProducts: () => api.get('/admin/products').then((res) => res.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((res) => res.data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`).then((res) => res.data),
};
