import { Router } from 'express';
const router = Router();

import appointmentController from '../controllers/appointmentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const {
  getAppointments,
  getAppointmentById,
  bookAppointment,
  updateAppointmentStatus,
  getDoctorAvailability,
  getDoctorQueue
} = appointmentController;

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// Public routes
router.get('/availability/:doctorId', getDoctorAvailability);

// Protected routes
router.get('/', protect, getAppointments);
router.get('/queue', protect, authorize('doctor'), getDoctorQueue);
router.get('/:id', protect, getAppointmentById);
router.post('/', protect, authorize('student'), bookAppointment);
router.put('/:id/status', protect, updateAppointmentStatus);

export default router;
