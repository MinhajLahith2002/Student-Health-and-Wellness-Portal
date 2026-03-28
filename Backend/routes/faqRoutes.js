import { Router } from 'express';
const router = Router();

import faqController from '../controllers/faqController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const { getFAQs, createFAQ, updateFAQ, deleteFAQ } = faqController;
const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// Public routes
router.get('/', getFAQs);

// Admin only routes
router.post('/', protect, authorize('admin'), createFAQ);
router.put('/:id', protect, authorize('admin'), updateFAQ);
router.delete('/:id', protect, authorize('admin'), deleteFAQ);

export default router;
