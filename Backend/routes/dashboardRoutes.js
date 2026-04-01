import { Router } from 'express';
const router = Router();

import dashboardController from '../controllers/dashboardController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const {
  getStudentDashboard,
  getDoctorDashboard,
  getCounselorDashboard,
  getPharmacistDashboard,
  getAdminDashboard
} = dashboardController;

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// Role-specific dashboard routes
router.get('/student', protect, authorize('student'), getStudentDashboard);
router.get('/doctor', protect, authorize('doctor'), getDoctorDashboard);
router.get('/counselor', protect, authorize('counselor'), getCounselorDashboard);
router.get('/pharmacist', protect, authorize('pharmacist'), getPharmacistDashboard);
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

export default router;
