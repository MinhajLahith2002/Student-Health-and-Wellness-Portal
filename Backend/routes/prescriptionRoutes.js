import { Router } from 'express';
const router = Router();

import prescriptionController from '../controllers/prescriptionController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

const {
  getPrescriptions,
  uploadPrescription,
  getPrescriptionReview,
  verifyPrescription,
  getPrescriptionById,
  createPrescription
} = prescriptionController;

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;
const { upload } = uploadMiddleware;

// Protected routes
router.get('/', protect, getPrescriptions);
router.get('/:id/review', protect, authorize('pharmacist'), getPrescriptionReview);
router.get('/:id', protect, getPrescriptionById);
router.post('/', protect, authorize('doctor'), createPrescription);
router.post('/upload', protect, authorize('student'), upload.single('prescription'), uploadPrescription);
router.put('/:id/verify', protect, authorize('pharmacist'), verifyPrescription);

export default router;
