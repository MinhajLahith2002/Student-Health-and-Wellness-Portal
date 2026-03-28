import { Router } from 'express';
const router = Router();

import adminController from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const { getDashboardStats, getSettings, updateSettings, getSystemLogs } = adminController;
const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/logs', getSystemLogs);

export default router;
