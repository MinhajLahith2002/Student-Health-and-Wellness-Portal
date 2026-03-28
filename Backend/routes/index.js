import { Router } from 'express';
const router = Router();

// Import all route files
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';
import pharmacyRoutes from './pharmacyRoutes.js';
import orderRoutes from './orderRoutes.js';
import medicineRoutes from './medicineRoutes.js';
import mentalHealthRoutes from './mentalHealthRoutes.js';
import adminRoutes from './adminRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import eventRoutes from './eventRoutes.js';
import faqRoutes from './faqRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

// Register all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/orders', orderRoutes);
router.use('/medicines', medicineRoutes);
router.use('/mental-health', mentalHealthRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/events', eventRoutes);
router.use('/faq', faqRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/resources', resourceRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;