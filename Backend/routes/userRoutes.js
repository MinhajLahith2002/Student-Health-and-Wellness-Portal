import { Router } from 'express';
const router = Router();

import userController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

const {
  getUsers,
  getUserById,
  getUserProfile,
  getProviders,
  getProviderById,
  updateProfile,
  updateUser,
  deleteUser,
  uploadProfileImage
} = userController;

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;
const { upload } = uploadMiddleware;

// Protected routes
router.get('/profile', protect, getUserProfile);
router.get('/me', protect, getUserProfile);
router.get('/providers', protect, getProviders);
router.get('/providers/:id', protect, getProviderById);
router.put('/profile', protect, updateProfile);
router.post('/upload-image', protect, upload.single('image'), uploadProfileImage);

// Admin only routes
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;
