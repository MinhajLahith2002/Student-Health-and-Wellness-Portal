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
  rescheduleAppointment,
  checkInAppointment,
  updateConsultation,
  updateAppointmentCompat,
  getDoctorAvailability,
  getDoctorQueue,
  getDoctorPatients,
  getDoctorPatientById
} = appointmentController;

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// Public routes
router.get('/availability/:doctorId', getDoctorAvailability);

// Protected routes
router.get('/', protect, getAppointments);
router.get('/queue', protect, authorize('doctor'), getDoctorQueue);
router.get('/patients', protect, authorize('doctor'), getDoctorPatients);
router.get('/patients/:studentId', protect, authorize('doctor'), getDoctorPatientById);
router.get('/:id', protect, getAppointmentById);
router.post('/', protect, authorize('student'), bookAppointment);
router.put('/:id', protect, updateAppointmentCompat);
router.put('/:id/status', protect, updateAppointmentStatus);
router.put('/:id/reschedule', protect, rescheduleAppointment);
router.put('/:id/checkin', protect, authorize('student'), checkInAppointment);
router.put('/:id/check-in', protect, authorize('student'), checkInAppointment);
router.put('/:id/consultation', protect, authorize('doctor'), updateConsultation);

export default router;
