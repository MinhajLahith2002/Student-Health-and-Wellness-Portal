import { Router } from 'express';

import counselingController from '../controllers/counselingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

router.get('/sessions', protect, authorize('student', 'counselor', 'admin'), counselingController.getCounselingSessions);
router.get('/sessions/:id', protect, authorize('student', 'counselor', 'admin'), counselingController.getCounselingSessionById);
router.post('/sessions', protect, authorize('student'), counselingController.createCounselingSession);
router.put('/sessions/:id/reschedule', protect, authorize('student', 'counselor'), counselingController.rescheduleCounselingSession);
router.put('/sessions/:id/status', protect, authorize('student', 'counselor'), counselingController.updateCounselingSessionStatus);
router.put('/sessions/:id/notes', protect, authorize('counselor'), counselingController.updateCounselingSessionNotes);

export default router;
