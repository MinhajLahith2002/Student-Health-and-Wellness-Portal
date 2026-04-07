import { Router } from 'express';
const router = Router();

import mentalHealthController from '../controllers/mentalHealthController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const {
  getMoodLogs,
  createMoodLog,
  updateMoodLog,
  deleteMoodLog,
  getMoodStats,
  getMentalHealthResources,
  getForumBootstrap,
  updateForumAlias,
  refreshForumAlias,
  createForumThread,
  updateForumThread,
  deleteForumThread,
  createForumReply,
  updateForumReply,
  deleteForumReply,
  reportForumContent
} = mentalHealthController;

const { protect } = authMiddleware;
const { isStudent } = roleMiddleware;

// Public routes
router.get('/resources', getMentalHealthResources);

// Protected routes
router.get('/forum/bootstrap', protect, isStudent, getForumBootstrap);
router.put('/forum/alias', protect, isStudent, updateForumAlias);
router.post('/forum/alias/refresh', protect, isStudent, refreshForumAlias);
router.post('/forum/threads', protect, isStudent, createForumThread);
router.put('/forum/threads/:id', protect, isStudent, updateForumThread);
router.delete('/forum/threads/:id', protect, isStudent, deleteForumThread);
router.post('/forum/threads/:id/replies', protect, isStudent, createForumReply);
router.put('/forum/threads/:threadId/replies/:replyId', protect, isStudent, updateForumReply);
router.delete('/forum/threads/:threadId/replies/:replyId', protect, isStudent, deleteForumReply);
router.post('/forum/reports', protect, isStudent, reportForumContent);

router.get('/moods', protect, isStudent, getMoodLogs);
router.get('/moods/stats', protect, isStudent, getMoodStats);
router.post('/moods', protect, isStudent, createMoodLog);
router.put('/moods/:id', protect, isStudent, updateMoodLog);
router.delete('/moods/:id', protect, isStudent, deleteMoodLog);

export default router;
