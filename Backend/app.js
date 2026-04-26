import 'dotenv/config';
import express, { json, urlencoded, static as expressStatic } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import * as loggerModule from './utils/logger.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { UPLOAD_ROOT } from './middleware/uploadMiddleware.js';
import connectDB from './config/database.js';
import User from './models/User.js';
import Medicine from './models/Medicine.js';
import FAQ from './models/FAQ.js';
import Resource from './models/Resource.js';
import Settings from './models/Settings.js';
import Order from './models/Order.js';
import Prescription from './models/Prescription.js';
import Pharmacy from './models/Pharmacy.js';
import Availability from './models/Availability.js';
import Appointment from './models/Appointment.js';
import CounselingSession from './models/CounselingSession.js';
import MoodLog from './models/MoodLog.js';
import seedData from './config/seedData.js';

const { logger, morganStream } = loggerModule;
const { seedDatabase, ensureCoreAccessUsers } = seedData;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
let initializationPromise;

const shouldAutoSeedDatabase = () => {
  const rawValue = `${process.env.ENABLE_AUTO_SEED ?? ''}`.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(rawValue);
};

const parseOriginList = (...values) =>
  values
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean);

const isLocalDevelopmentOrigin = (origin = '') => (
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
);

const allowedOrigins = new Set([
  ...parseOriginList(
    process.env.ALLOWED_ORIGINS,
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'https://student-health-and-wellness-portal.vercel.app',
    'https://student-health-and-wellness-portal-five.vercel.app'
  )
]);

const isAllowedOrigin = (origin = '') => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  if (!isProduction && isLocalDevelopmentOrigin(origin)) return true;

  return /^https:\/\/student-health-and-wellness-portal(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
};

const initializeDatabase = async () => {
  await connectDB();

  if (shouldAutoSeedDatabase()) {
    try {
      await seedDatabase({
        User,
        Medicine,
        FAQ,
        Resource,
        Settings,
        Order,
        Prescription,
        Pharmacy,
        Availability,
        Appointment,
        CounselingSession,
        MoodLog
      });
      logger.info('Database seeded (default users and demo data ready)');
    } catch (err) {
      logger.warn('Seed skipped or failed:', err.message);
    }
  } else {
    try {
      await ensureCoreAccessUsers({ User });
      logger.info('Core auth accounts verified (demo data remains disabled)');
    } catch (err) {
      logger.warn('Core auth account sync failed:', err.message);
    }
    logger.info('Automatic demo-data seeding is disabled for this server start');
  }
};

const ensureInitialized = async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = initializeDatabase().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }

  return initializationPromise;
};

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: [
        "'self'",
        'http://localhost:5000',
        'http://localhost:5001',
        'http://localhost:*',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:*',
        'ws://localhost:5173',
        'ws://localhost:*',
        'ws://localhost:5000',
        'ws://127.0.0.1:*',
        'wss://*.campushealth.edu'
      ]
    }
  }
}));

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin || 'unknown'}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

if (isProduction) {
  app.use('/api', limiter);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 100,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});

if (isProduction) {
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: morganStream }));
}

app.use('/uploads', expressStatic(UPLOAD_ROOT));
app.use('/assets', expressStatic(join(__dirname, 'assets')));
app.use('/public', expressStatic(join(__dirname, 'public')));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.get('/', (req, res, next) => {
  if (isProduction) {
    return next();
  }

  res.json({
    message: 'Student Health and Wellness backend is running.',
    health: '/api/health'
  });
});

app.use('/api', async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api', routes);

if (isProduction) {
  const frontendPath = join(__dirname, '../Frontend/dist');

  if (existsSync(frontendPath)) {
    app.use(expressStatic(frontendPath));

    app.get(/.*/, (req, res) => {
      res.sendFile(join(frontendPath, 'index.html'));
    });
  } else {
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }

      res.status(200).json({
        message: 'Backend deployed successfully.',
        health: '/api/health'
      });
    });
  }
}

app.use(notFound);
app.use(errorHandler);

export default app;
export { app, ensureInitialized };
