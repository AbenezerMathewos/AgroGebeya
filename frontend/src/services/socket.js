import { io } from 'socket.io-client';

// Reuses the same API origin as axios (VITE_API_URL minus the trailing /api)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

let socket = null;

export function connectSocket(token) {
  if (socket) return socket;
  socket = io(SOCKET_ORIGIN, { auth: { token }, autoConnect: true });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
