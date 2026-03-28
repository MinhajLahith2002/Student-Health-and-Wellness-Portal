import { v2 as cloudinary } from 'cloudinary';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Cloudinary configuration
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: process.env.NODE_ENV === 'production'
  });
  
  logger.info('Cloudinary configured successfully');
};

/**
 * Upload file to Cloudinary with error handling
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'campushealth',
      width: options.width || 1000,
      height: options.height || 1000,
      crop: options.crop || 'limit',
      quality: options.quality || 'auto',
      format: options.format,
      allowed_formats: options.allowedFormats || ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
      transformation: options.transformation,
      ...options
    });
    
    // Remove local file after successful upload
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    
    return result;
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    
    // Clean up local file on error
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of file paths
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Upload results
 */
const uploadMultipleToCloudinary = async (files, options = {}) => {
  const uploadPromises = files.map(file => uploadToCloudinary(file, options));
  return Promise.all(uploadPromises);
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Delete result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      logger.info(`File deleted from Cloudinary: ${publicId}`);
    } else {
      logger.warn(`File deletion failed for: ${publicId}`, result);
    }
    
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Get optimized URL for image
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
const getOptimizedImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    crop: options.crop || 'limit',
    width: options.width,
    height: options.height,
    ...options
  });
};

/**
 * Get thumbnail URL
 * @param {string} publicId - Cloudinary public ID
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} Thumbnail URL
 */
const getThumbnailUrl = (publicId, width = 200, height = 200) => {
  return getOptimizedImageUrl(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'face'
  });
};

/**
 * Upload types with specific configurations
 */
const uploadConfigs = {
  prescription: {
    folder: 'prescriptions',
    width: 1500,
    height: 2000,
    crop: 'limit',
    allowedFormats: ['jpg', 'png', 'jpeg', 'pdf']
  },
  medicine: {
    folder: 'medicines',
    width: 500,
    height: 500,
    crop: 'fill',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp']
  },
  profile: {
    folder: 'profiles',
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    allowedFormats: ['jpg', 'png', 'jpeg']
  },
  resource: {
    folder: 'resources',
    width: 1200,
    height: 800,
    crop: 'fill',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp']
  },
  event: {
    folder: 'events',
    width: 1200,
    height: 800,
    crop: 'fill',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp']
  },
  general: {
    folder: 'uploads',
    width: 1000,
    height: 1000,
    crop: 'limit',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp', 'pdf']
  }
};

/**
 * Upload file with specific type configuration
 * @param {string} filePath - Local file path
 * @param {string} type - Upload type (prescription, medicine, profile, etc.)
 * @returns {Promise<Object>} Upload result
 */
const uploadByType = async (filePath, type = 'general') => {
  const config = uploadConfigs[type] || uploadConfigs.general;
  return uploadToCloudinary(filePath, config);
};

/**
 * Check Cloudinary connection
 * @returns {Promise<boolean>} Connection status
 */
const checkCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    return result.status === 'ok';
  } catch (error) {
    logger.error('Cloudinary connection check failed:', error);
    return false;
  }
};

/**
 * Get Cloudinary usage statistics
 * @returns {Promise<Object>} Usage stats
 */
const getCloudinaryUsage = async () => {
  try {
    const usage = await cloudinary.api.usage();
    return {
      usage: usage,
      storage: usage.storage,
      bandwidth: usage.bandwidth,
      requests: usage.requests,
      resources: usage.resources
    };
  } catch (error) {
    logger.error('Failed to get Cloudinary usage:', error);
    return null;
  }
};

export default {
  configureCloudinary,
  cloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  getThumbnailUrl,
  uploadByType,
  uploadConfigs,
  checkCloudinaryConnection,
  getCloudinaryUsage
};