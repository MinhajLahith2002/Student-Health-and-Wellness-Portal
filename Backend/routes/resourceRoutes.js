import { Router } from 'express';
const router = Router();

import resourceController from '../controllers/resourceController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

const { getResources, getResourceById, createResource, updateResource, deleteResource } = resourceController;
const { protect } = authMiddleware;
const { authorize } = roleMiddleware;
const { upload } = uploadMiddleware;

// Public routes
router.get('/', getResources);
router.get('/:id', getResourceById);

// Admin only routes
router.post('/', protect, authorize('admin'), upload.single('coverImage'), createResource);
router.put('/:id', protect, authorize('admin'), updateResource);
router.delete('/:id', protect, authorize('admin'), deleteResource);

export default router;
