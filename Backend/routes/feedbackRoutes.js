import { Router } from 'express';
const router = Router();

import feedbackController from '../controllers/feedbackController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const { submitFeedback, getFeedback, respondToFeedback, getFeedbackStats } = feedbackController;
const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// Protected routes (all authenticated users can submit)
router.post('/', protect, submitFeedback);

// Admin only routes
router.get('/', protect, authorize('admin'), getFeedback);
router.get('/stats', protect, authorize('admin'), getFeedbackStats);
router.put('/:id/respond', protect, authorize('admin'), respondToFeedback);

export default router;
