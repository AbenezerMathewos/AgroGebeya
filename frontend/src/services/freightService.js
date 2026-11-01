import api from './api';

export const freightService = {
  getAll: (params) => api.get('/freight', { params }).then((res) => res.data),
  getMyTrips: () => api.get('/freight/my').then((res) => res.data),
  create: (data) => api.post('/freight', data).then((res) => res.data),
  book: (id, quintals) => api.patch(`/freight/${id}/book`, { quintals }).then((res) => res.data),
  updateStatus: (id, status) => api.patch(`/freight/${id}/status`, { status }).then((res) => res.data),
  deleteTrip: (id) => api.delete(`/freight/${id}`).then((res) => res.data),
};
