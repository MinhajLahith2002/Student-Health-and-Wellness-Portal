import 'dotenv/config';
import express, { json, urlencoded, static as expressStatic } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initializeSocket } from './utils/socket.js';
import * as loggerModule from './utils/logger.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/database.js';
import User from './models/User.js';
import Medicine from './models/Medicine.js';
import FAQ from './models/FAQ.js';
import Settings from './models/Settings.js';
import Order from './models/Order.js';
import Prescription from './models/Prescription.js';
import seedData from './config/seedData.js';

const { logger, morganStream } = loggerModule;
const { seedDatabase } = seedData;


// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
const app = express();

// Connect to DB and seed default data
connectDB().then(async () => {
  try {
    await seedDatabase({ User, Medicine, FAQ, Settings, Order, Prescription });
    logger.info('✅ Database seeded (default users and demo data ready)');
  } catch (err) {
    logger.warn('Seed skipped or failed:', err.message);
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "ws://localhost:5173",
        "ws://localhost:5000",
        "wss://*.campushealth.edu"
      ]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// Static files
app.use('/uploads', expressStatic(join(__dirname, 'uploads')));
app.use('/public', expressStatic(join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id
  });
  next();
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api', routes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = join(__dirname, '../frontend/dist');
  app.use(expressStatic(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(join(frontendPath, 'index.html'));
  });
}

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Create HTTP server
const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    const mongoose = await import('mongoose');
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

// Start server with automatic port fallback when default port is busy.
const startServer = (port, attempt = 0) => {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempt < 10) {
      const nextPort = port + 1;
      logger.warn(`Port ${port} is already in use. Retrying on port ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }

    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`API URL: http://localhost:${port}/api`);
    logger.info('WebSocket ready for connections');
  });
};

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer(DEFAULT_PORT);
}

export { app, server, io };