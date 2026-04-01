// utils/logger.js
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length > 0) log += `\n${JSON.stringify(meta, null, 2)}`;
    return log;
  })
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

const preferredLogDir = process.env.LOG_DIR
  ? path.resolve(process.cwd(), process.env.LOG_DIR)
  : path.join(__dirname, '../../logs');

try {
  if (!process.env.VERCEL) {
    if (!fs.existsSync(preferredLogDir)) {
      fs.mkdirSync(preferredLogDir, { recursive: true });
    }

    transports.push(
      new winston.transports.File({
        filename: path.join(preferredLogDir, 'combined.log'),
        maxsize: 5242880,
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join(preferredLogDir, 'error.log'),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5
      })
    );
  }
} catch (error) {
  console.warn(`File logging disabled: ${error.message}`);
}
// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports
});

// Morgan stream
export const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper functions
export const logRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?._id
    };
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request warning', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  next();
};

export const logError = (error, context = '') => {
  logger.error(`${context}: ${error.message}`, { stack: error.stack, context });
};
export const logInfo = (message, meta = {}) => logger.info(message, meta);
export const logWarning = (message, meta = {}) => logger.warn(message, meta);
export const logDebug = (message, meta = {}) => logger.debug(message, meta);
export const logAudit = (data) => {
  logger.info('Audit Log', { type: 'audit', ...data });
};
