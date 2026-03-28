/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with score and message
 */
const validatePasswordStrength = (password) => {
  let score = 0;
  const messages = [];

  if (!password) {
    return { score: 0, isValid: false, messages: ['Password is required'] };
  }

  if (password.length >= 8) {
    score++;
  } else {
    messages.push('Password must be at least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    messages.push('Password must contain at least one uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    messages.push('Password must contain at least one lowercase letter');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    messages.push('Password must contain at least one number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    messages.push('Password must contain at least one special character');
  }

  const isValid = score >= 4;
  const strength = score === 5 ? 'strong' : score >= 3 ? 'medium' : 'weak';

  return {
    score,
    isValid,
    strength,
    messages
  };
};

/**
 * Validate blood type
 * @param {string} bloodType - Blood type to validate
 * @returns {boolean} Is valid blood type
 */
const isValidBloodType = (bloodType) => {
  const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return validTypes.includes(bloodType);
};

/**
 * Validate date (ISO format)
 * @param {string} date - Date to validate
 * @returns {boolean} Is valid date
 */
const isValidDate = (date) => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

/**
 * Validate future date
 * @param {string} date - Date to validate
 * @returns {boolean} Is future date
 */
const isFutureDate = (date) => {
  const parsedDate = new Date(date);
  return parsedDate > new Date();
};

/**
 * Validate time slot format (HH:MM AM/PM)
 * @param {string} time - Time to validate
 * @returns {boolean} Is valid time slot
 */
const isValidTimeSlot = (time) => {
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
  return timeRegex.test(time);
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} Is valid ObjectId
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 500);
};

/**
 * Sanitize HTML content
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 */
const sanitizeHtml = (html) => {
  if (!html) return '';
  // Simple HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/javascript:/gi, '');
};

module.exports = {
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
  isValidBloodType,
  isValidDate,
  isFutureDate,
  isValidTimeSlot,
  isValidObjectId,
  sanitizeString,
  sanitizeHtml
};