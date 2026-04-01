import { Router } from 'express';

import availabilityController from '../controllers/availabilityController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

router.get('/me', protect, authorize('doctor', 'counselor'), availabilityController.getMyAvailability);
router.get('/:providerId', protect, availabilityController.getAvailabilityByProvider);
router.post('/', protect, authorize('doctor', 'counselor'), availabilityController.createAvailability);
router.put('/:id', protect, authorize('doctor', 'counselor'), availabilityController.updateAvailability);
router.delete('/:id', protect, authorize('doctor', 'counselor'), availabilityController.deleteAvailability);

export default router;
