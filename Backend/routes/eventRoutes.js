import { Router } from 'express';
const router = Router();

import eventController from '../controllers/eventController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

const { getEvents, createEvent, updateEvent, deleteEvent } = eventController;
const { protect } = authMiddleware;
const { authorize } = roleMiddleware;
const { upload } = uploadMiddleware;

// Public routes
router.get('/', getEvents);

// Admin only routes
router.post('/', protect, authorize('admin'), upload.single('image'), createEvent);
router.put('/:id', protect, authorize('admin'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);

export default router;
