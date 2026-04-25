import 'dotenv/config';
import { createServer } from 'http';
import mongoose from 'mongoose';
import app, { ensureInitialized } from './app.js';
import { initializeSocket } from './utils/socket.js';
import * as loggerModule from './utils/logger.js';

const { logger } = loggerModule;
const isVercel = Boolean(process.env.VERCEL);
const DEFAULT_PORT = Number(process.env.PORT) || 5001;
const server = isVercel ? null : createServer(app);
const io = server ? initializeSocket(server) : null;

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const gracefulShutdown = () => {
  if (!server) {
    return;
  }

  logger.info('Received shutdown signal, closing server...');

  server.close(async () => {
    logger.info('HTTP server closed');
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const startServer = (port) => {
  if (!server) {
    return;
  }

  const handleListening = () => {
    server.off('error', handleError);
    server.off('listening', handleListening);
    const activePort = server.address()?.port || port;
    logger.info(`Server running on port ${activePort}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`API URL: http://localhost:${activePort}/api`);
    logger.info('WebSocket ready for connections');
  };

  const handleError = (error) => {
    server.off('error', handleError);
    server.off('listening', handleListening);
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use. Stop the other backend process and restart so the API stays on one stable URL.`);
      process.exit(1);
      return;
    }

    logger.error('Uncaught Exception:', error);
    process.exit(1);
  };

  server.once('listening', handleListening);
  server.once('error', handleError);
  server.listen(port);
};

if (!isVercel) {
  ensureInitialized()
    .then(() => startServer(DEFAULT_PORT))
    .catch((error) => {
      logger.error('Failed to initialize server:', error);
      process.exit(1);
    });
}

export default app;
export { app, server, io };
