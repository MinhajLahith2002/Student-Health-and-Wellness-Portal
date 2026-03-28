import { randomBytes } from 'crypto';

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const generateRandomString = (length = 10) => {
  return randomBytes(length).toString('hex').substring(0, length);
};

/**
 * Generate order ID
 * @param {number} count - Order count
 * @returns {string} Order ID
 */
const generateOrderId = (count) => {
  const prefix = 'ORD';
  const paddedCount = String(count).padStart(5, '0');
  return `${prefix}-${paddedCount}`;
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type (full, short, time)
 * @returns {string} Formatted date
 */
const formatDate = (date, format = 'full') => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return 'Invalid date';
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'time':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case 'full':
    default:
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Calculate average rating
 * @param {Array} ratings - Array of ratings
 * @returns {number} Average rating
 */
const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return sum / ratings.length;
};

/**
 * Calculate health score based on various metrics
 * @param {Object} metrics - Health metrics
 * @returns {number} Health score (0-100)
 */
const calculateHealthScore = (metrics) => {
  const { moodScore, activityLevel, sleepHours, stressLevel } = metrics;
  
  let score = 0;
  
  // Mood score (max 30)
  if (moodScore) score += (moodScore / 10) * 30;
  
  // Activity level (max 25)
  if (activityLevel) score += (activityLevel / 10) * 25;
  
  // Sleep hours (max 25)
  if (sleepHours) {
    if (sleepHours >= 7 && sleepHours <= 9) score += 25;
    else if (sleepHours >= 5 && sleepHours < 7) score += 15;
    else if (sleepHours > 9) score += 10;
    else score += 5;
  }
  
  // Stress level (max 20)
  if (stressLevel) {
    score += ((10 - stressLevel) / 10) * 20;
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * Pagination helper
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
const paginate = (page = 1, limit = 20, total = 0) => {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit)));
  const totalPages = Math.ceil(total / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;
  
  return {
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems: total,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    skip
  };
};

/**
 * Extract initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 characters)
 */
const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
const truncateText = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export default {
  generateRandomString,
  generateOrderId,
  formatCurrency,
  formatDate,
  calculateAge,
  calculateAverageRating,
  calculateHealthScore,
  paginate,
  getInitials,
  truncateText,
  deepClone,
  sleep
};