import { Router } from 'express';
const router = Router();

import pharmacyController from '../controllers/pharmacyController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const { getPharmacies, getPharmacyById, updatePharmacyQueue } = pharmacyController;
const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

// Public routes
router.get('/', getPharmacies);
router.get('/:id', getPharmacyById);

// Protected routes
router.put('/:id/queue', protect, authorize('pharmacist'), updatePharmacyQueue);

export default router;
