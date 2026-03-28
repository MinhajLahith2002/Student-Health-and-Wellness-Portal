import jwt from 'jsonwebtoken';

const { sign, verify, decode } = jwt;

/**
 * Generate JWT token for user authentication
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'campushealth',
      audience: 'campushealth-users'
    }
  );
};

/**
 * Generate refresh token (optional)
 * @param {string} id - User ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (id) => {
  return sign(
    { id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: '30d',
      issuer: 'campushealth',
      audience: 'campushealth-users'
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  return decode(token);
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken
};