import api from './api';

export const advisoryService = {
  getAll: (params) => api.get('/advisory', { params }).then((res) => res.data),
  getById: (id) => api.get(`/advisory/${id}`).then((res) => res.data),
  diagnose: (payload) => api.post('/advisory/diagnose', payload).then((res) => res.data),
  create: (payload) => api.post('/advisory', payload).then((res) => res.data),
  chat: (payload) => api.post('/advisory/chat', payload).then((res) => res.data),
};
