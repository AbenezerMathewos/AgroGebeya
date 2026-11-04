import api from './api';

export const chatService = {
  startConversation: (productId) => api.post('/chat/conversations', { productId }).then((res) => res.data),
  startDirectConversation: (recipientId, initialMessage, productId) =>
    api.post('/chat/direct', { recipientId, initialMessage, productId }).then((res) => res.data),
  getContacts: () => api.get('/chat/contacts').then((res) => res.data),
  getConversations: () => api.get('/chat/conversations').then((res) => res.data),
  getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`).then((res) => res.data),
  sendMessage: (conversationId, text) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { text }).then((res) => res.data),
};
