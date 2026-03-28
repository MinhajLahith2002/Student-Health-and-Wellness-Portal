// middleware/roleMiddleware.js

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user is student
export const isStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required.'
    });
  }
  next();
};

// Check if user is doctor
export const isDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor role required.'
    });
  }
  next();
};

// Check if user is pharmacist
export const isPharmacist = (req, res, next) => {
  if (!req.user || req.user.role !== 'pharmacist') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Pharmacist role required.'
    });
  }
  next();
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Check if user is staff (doctor, pharmacist, or admin)
export const isStaff = (req, res, next) => {
  if (!req.user || !['doctor', 'pharmacist', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff role required.'
    });
  }
  next();
};

// Check if user is owner of resource or admin
export const isOwnerOrAdmin = (resourceIdField) => {
  return async (req, res, next) => {
    try {
      if (!req.model) {
        return res.status(500).json({ message: 'Model not provided on request (req.model)' });
      }

      const resource = await req.model.findById(req.params.id);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      const isOwner = resource[resourceIdField]?.toString() === req.user?.id;
      const isAdminRole = req.user?.role === 'admin';

      if (!isOwner && !isAdminRole) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

// Default export for compatibility with existing imports that expect a default object
export default {
  authorize,
  isStudent,
  isDoctor,
  isPharmacist,
  isAdmin,
  isStaff,
  isOwnerOrAdmin
};
