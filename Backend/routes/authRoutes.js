import { Router } from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

const { register, login, forgotPassword, resetPassword, changePassword } = authController;

const { protect } = authMiddleware;


// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.put('/change-password', protect, changePassword);

export default router;