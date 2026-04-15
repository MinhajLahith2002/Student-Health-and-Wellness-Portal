// utils/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

let io;

function isAllowedSocketOrigin(origin = '') {
  if (!origin) return true;

  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS
  ]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function isConversationParticipant(conversation, userId) {
  return conversation?.participants?.some((participantId) => participantId?.toString() === userId?.toString());
}

/**
 * Initialize Socket.IO
 * @param {Object} server - HTTP server instance
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (isAllowedSocketOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Socket CORS blocked for origin: ${origin || 'unknown'}`));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user.id})`);

    socket.join(`user:${socket.user.id}`);

    socket.on('join-conversation', async (conversationId) => {
      const conversation = await Conversation.findById(conversationId);
      if (conversation && isConversationParticipant(conversation, socket.user.id)) {
        socket.join(`conversation:${conversationId}`);
        socket.emit('joined-conversation', conversationId);
      }
    });

    socket.on('send-message', async ({ conversationId, text }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !isConversationParticipant(conversation, socket.user.id)) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const message = {
          sender: socket.user.id,
          text,
          createdAt: new Date()
        };

        conversation.messages.push(message);
        conversation.lastMessage = { text, sender: socket.user.id, createdAt: new Date() };
        conversation.updatedAt = new Date();

        await conversation.save();

        const populatedMessage = await Conversation.populate(message, {
          path: 'sender',
          select: 'name profileImage role'
        });

        io.to(`conversation:${conversationId}`).emit('new-message', {
          conversationId,
          message: populatedMessage
        });

        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.user.id) {
            io.to(`user:${participantId}`).emit('unread-message', {
              conversationId,
              from: socket.user.name
            });
          }
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.user.id,
        name: socket.user.name,
        isTyping
      });
    });

    socket.on('mark-read', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation && isConversationParticipant(conversation, socket.user.id)) {
          let updated = false;
          conversation.messages.forEach((message) => {
            if (message.sender.toString() !== socket.user.id && !message.read) {
              message.read = true;
              message.readAt = new Date();
              updated = true;
            }
          });

          if (updated) {
            await conversation.save();
            io.to(`conversation:${conversationId}`).emit('messages-read', {
              conversationId,
              readBy: socket.user.id
            });
          }
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('join-appointment', (appointmentId) => {
      socket.join(`appointment:${appointmentId}`);
    });

    socket.on('appointment:subscribe', (appointmentId) => {
      socket.join(`appointment:${appointmentId}`);
      socket.emit('subscribe:success', { appointmentId });
    });

    socket.on('appointment:unsubscribe', (appointmentId) => {
      socket.leave(`appointment:${appointmentId}`);
    });

    socket.on('queue:subscribe', (doctorId) => {
      socket.join(`queue:${doctorId}`);
      socket.emit('subscribe:success', { doctorId });
    });

    socket.on('queue:unsubscribe', (doctorId) => {
      socket.leave(`queue:${doctorId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export const emitAppointmentUpdate = (appointmentId, data) => {
  if (!io) return;

  io.to(`appointment:${appointmentId}`).emit(`appointment:${appointmentId}:updated`, {
    appointmentId,
    ...data,
    timestamp: new Date()
  });
};

export const emitQueueUpdate = (doctorId, data) => {
  if (!io) return;

  io.to(`queue:${doctorId}`).emit(`queue:${doctorId}:updated`, {
    ...data,
    timestamp: new Date()
  });
};

export const emitQueuePosition = (appointmentId, data) => {
  if (!io) return;

  io.to(`appointment:${appointmentId}`).emit(`queue:${appointmentId}:position`, {
    ...data,
    timestamp: new Date()
  });
};

export const emitNotification = (userId, notification) => {
  if (!io) return;

  io.to(`user:${userId}`).emit('notification:new', {
    ...notification,
    timestamp: new Date()
  });
};

export const emitAvailabilityUpdate = (data) => {
  if (!io) return;

  io.emit('availability:updated', {
    ...data,
    timestamp: new Date()
  });
};

export const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

export const emitToConversation = (conversationId, event, data) => {
  if (io) io.to(`conversation:${conversationId}`).emit(event, data);
};

export const emitToAppointment = (appointmentId, event, data) => {
  if (io) io.to(`appointment:${appointmentId}`).emit(event, data);
};

export const broadcastSystemNotification = (event, data) => {
  if (io) io.emit(event, data);
};
