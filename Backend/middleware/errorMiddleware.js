import AuditLog from '../models/AuditLog.js';

// Not Found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Error handler middleware
export const errorHandler = async (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errorType = 'Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'Validation Error';
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    errorType = 'Duplicate Error';
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists. Please use a different value.`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    errorType = 'Not Found';
    message = `Resource not found with id: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorType = 'Authentication Error';
    message = 'Invalid token. Please login again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = 'Authentication Error';
    message = 'Token expired. Please login again.';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    errorType = 'File Error';
    message = 'File size too large. Maximum size is 10MB.';
  }

  if (err.message === 'Only images and PDF files are allowed') {
    statusCode = 400;
    errorType = 'File Error';
    message = err.message;
  }

  // Log error to audit log for server errors
  if (statusCode >= 500) {
    try {
      await AuditLog.create({
        userId: req.user?._id || null,
        userName: req.user?.name || 'System',
        action: 'Error Occurred',
        module: 'System',
        details: `${err.stack || message}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        level: 'error'
      });
    } catch (auditError) {
      console.error('Failed to log error to AuditLog:', auditError.message);
    }
  }

  // Development vs Production response
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: errorType,
      message,
      stack: err.stack,
      statusCode
    });
  } else {
    res.status(statusCode).json({
      success: false,
      error: errorType,
      message,
      statusCode
    });
  }
};

export default { notFound, errorHandler };
