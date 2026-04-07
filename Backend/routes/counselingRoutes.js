import { Router } from 'express';

import counselingController from '../controllers/counselingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = Router();

const { protect } = authMiddleware;
const { authorize } = roleMiddleware;

router.get('/counselors', protect, authorize('student', 'counselor', 'admin'), counselingController.getCounselorDirectory);
router.get('/counselors/:counselorId', protect, authorize('student', 'counselor', 'admin'), counselingController.getCounselorProfile);
router.get('/counselors/:counselorId/slots', protect, authorize('student', 'counselor', 'admin'), counselingController.getCounselorSlots);
router.get('/counselors/:counselorId/feedback', protect, authorize('student', 'counselor', 'admin'), counselingController.getCounselorFeedback);
router.get('/workspace', protect, authorize('counselor'), counselingController.getCounselorWorkspace);
router.get('/notes', protect, authorize('counselor'), counselingController.getCounselorNotes);
router.post('/slots', protect, authorize('counselor'), counselingController.createCounselorSlot);
router.patch('/slots/:id', protect, authorize('counselor'), counselingController.updateCounselorSlot);
router.delete('/slots/:id', protect, authorize('counselor'), counselingController.deleteCounselorSlot);
router.get('/sessions', protect, authorize('student', 'counselor', 'admin'), counselingController.getCounselingSessions);
router.get('/sessions/:id', protect, authorize('student', 'counselor', 'admin'), counselingController.getCounselingSessionById);
router.get('/sessions/:id/chat', protect, authorize('student', 'counselor'), counselingController.getCounselingSessionChat);
router.post('/sessions/:id/chat/messages', protect, authorize('student', 'counselor'), counselingController.sendCounselingSessionChatMessage);
router.post('/sessions/:id/chat/read', protect, authorize('student', 'counselor'), counselingController.markCounselingSessionChatRead);
router.post('/sessions', protect, authorize('student'), counselingController.createCounselingSession);
router.put('/sessions/:id/reschedule', protect, authorize('student', 'counselor'), counselingController.rescheduleCounselingSession);
router.put('/sessions/:id/status', protect, authorize('student', 'counselor'), counselingController.updateCounselingSessionStatus);
router.put('/sessions/:id/notes', protect, authorize('counselor'), counselingController.updateCounselingSessionNotes);
router.delete('/sessions/:id', protect, authorize('student', 'counselor'), counselingController.deleteCounselingSession);
router.post('/sessions/:id/feedback', protect, authorize('student'), counselingController.submitCounselingFeedback);

export default router;
