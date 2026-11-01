const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let io;

// Wires up Socket.IO on top of the existing HTTP server, authenticating each
// connection with the same JWT used for the REST API (sent as socket.handshake.auth.token).
function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not authorized, no token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Not authorized, user no longer exists'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Not authorized, invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // A private room per user powers the notification bell
    socket.join(`user:${socket.user._id}`);

    socket.on('conversation:join', (conversationId) => {
      if (conversationId) socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { init, getIO };
