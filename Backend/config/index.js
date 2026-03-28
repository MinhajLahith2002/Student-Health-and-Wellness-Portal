import dbConfig from './database';
import { configureCloudinary } from './cloudinary.js';
import { logger } from '../utils/logger.js';

/**
 * Load all configurations
 */
const loadConfigurations = () => {
  // Validate required environment variables
  const requiredEnvVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'MONGODB_URI'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is too short. Use a stronger secret for production.');
  }
  
  // Configure Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    configureCloudinary();
  } else {
    logger.warn('Cloudinary configuration missing. File upload will not work.');
  }
  
  logger.info(`Configuration loaded for ${process.env.NODE_ENV} environment`);
};

export default {
  loadConfigurations,
  dbConfig,
  cloudinaryConfig
};