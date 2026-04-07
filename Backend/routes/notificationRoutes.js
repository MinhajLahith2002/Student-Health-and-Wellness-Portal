import { Router } from 'express';
const router = Router();

import notificationController from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  updateNotification,
  deleteNotification
} = notificationController;

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// Protected routes
router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

// Admin only routes
router.post('/', protect, authorize('admin'), createNotification);
router.put('/:id', protect, authorize('admin'), updateNotification);
router.delete('/:id', protect, authorize('admin'), deleteNotification);

export default router;
