import { Router } from 'express';
const router = Router();

import resourceController from '../controllers/resourceController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

const { getResources, getManagedResources, getResourceById, getResourceRecommendations, createResource, updateResource, deleteResource } = resourceController;
const { protect, optionalAuth } = authMiddleware;
const { authorize } = roleMiddleware;
const { upload } = uploadMiddleware;

router.get('/manage/mine', protect, authorize('admin', 'counselor'), getManagedResources);

// Public routes
router.get('/', getResources);
router.get('/:id/recommendations', optionalAuth, getResourceRecommendations);
router.get('/:id', optionalAuth, getResourceById);

// Admin and counselor managed routes
router.post('/', protect, authorize('admin', 'counselor'), upload.single('coverImage'), createResource);
router.put('/:id', protect, authorize('admin', 'counselor'), updateResource);
router.delete('/:id', protect, authorize('admin', 'counselor'), deleteResource);

export default router;
