import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const { verify } = jwt;

// Protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact admin.' });

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token' });
      if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
      throw error;
    }
  } catch (error) {
    await AuditLog.create({
      userId: null,
      userName: 'Unknown',
      action: 'Failed Authentication',
      module: 'Auth',
      details: error.message,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'warning'
    });

    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

export default { protect, optionalAuth };
