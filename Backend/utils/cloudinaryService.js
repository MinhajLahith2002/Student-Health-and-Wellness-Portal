// utils/cloudinaryService.js

import { v2 as cloudinary } from 'cloudinary';
import { existsSync, unlinkSync } from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadFile = async (filePath, options = {}) => {
  if (!filePath) throw new Error('filePath is required');

  try {
    const uploadOptions = {
      folder: options.folder || 'campushealth',
      width: options.width,
      height: options.height,
      crop: options.crop,
      quality: options.quality || 'auto',
      resource_type: options.resource_type || 'image',
      allowed_formats: options.allowed_formats,
      gravity: options.gravity,
      ...options
    };

    // Remove undefined keys that Cloudinary may not accept
    Object.keys(uploadOptions).forEach(k => {
      if (uploadOptions[k] === undefined) delete uploadOptions[k];
    });

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Remove local file after upload if it exists
    if (filePath && existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (err) {
        console.warn('Failed to remove local file after upload:', err);
      }
    }

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload prescription image
 * @param {string} filePath - Local file path
 * @returns {Promise<Object>} Upload result
 */
export const uploadPrescription = async (filePath) => {
  return uploadFile(filePath, {
    folder: 'prescriptions',
    width: 1500,
    height: 2000,
    crop: 'limit',
    allowed_formats: ['jpg', 'png', 'pdf'],
    resource_type: 'image'
  });
};

/**
 * Upload medicine image
 * @param {string} filePath - Local file path
 * @returns {Promise<Object>} Upload result
 */
export const uploadMedicineImage = async (filePath) => {
  return uploadFile(filePath, {
    folder: 'medicines',
    width: 500,
    height: 500,
    crop: 'fill',
    resource_type: 'image'
  });
};

/**
 * Upload profile image
 * @param {string} filePath - Local file path
 * @returns {Promise<Object>} Upload result
 */
export const uploadProfileImage = async (filePath) => {
  return uploadFile(filePath, {
    folder: 'profiles',
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    resource_type: 'image'
  });
};

/**
 * Upload resource cover image
 * @param {string} filePath - Local file path
 * @returns {Promise<Object>} Upload result
 */
export const uploadResourceImage = async (filePath) => {
  return uploadFile(filePath, {
    folder: 'resources',
    width: 1200,
    height: 800,
    crop: 'fill',
    resource_type: 'image'
  });
};

/**
 * Upload event image
 * @param {string} filePath - Local file path
 * @returns {Promise<Object>} Upload result
 */
export const uploadEventImage = async (filePath) => {
  return uploadFile(filePath, {
    folder: 'events',
    width: 1200,
    height: 800,
    crop: 'fill',
    resource_type: 'image'
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Optional destroy options
 * @returns {Promise<Object>} Delete result
 */
export const deleteFile = async (publicId, options = {}) => {
  if (!publicId) throw new Error('publicId is required');

  try {
    const result = await cloudinary.uploader.destroy(publicId, options);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get optimized URL for image
 * @param {string} publicId - Cloudinary public ID or URL
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
export const getOptimizedUrl = (publicId, options = {}) => {
  if (!publicId) return '';
  const transformation = {
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
    ...options
  };

  // Remove undefined keys
  Object.keys(transformation).forEach(k => {
    if (transformation[k] === undefined) delete transformation[k];
  });

  try {
    return cloudinary.url(publicId, transformation);
  } catch (err) {
    console.warn('Cloudinary url generation error:', err);
    return publicId;
  }
};

/**
 * Export cloudinary client if callers need direct access
 */
export { cloudinary };

/**
 * Default export for backward compatibility
 */
export default {
  cloudinary,
  uploadFile,
  uploadPrescription,
  uploadMedicineImage,
  uploadProfileImage,
  uploadResourceImage,
  uploadEventImage,
  deleteFile,
  getOptimizedUrl
};