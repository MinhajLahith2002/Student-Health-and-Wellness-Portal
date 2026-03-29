import { Router } from 'express';
const router = Router();

import mentalHealthController from '../controllers/mentalHealthController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const {
  getMoodLogs,
  createMoodLog,
  updateMoodLog,
  deleteMoodLog,
  getMoodStats,
  getMentalHealthResources
} = mentalHealthController;

const { protect } = authMiddleware;

// Public routes
router.get('/resources', getMentalHealthResources);

// Protected routes
router.get('/moods', protect, getMoodLogs);
router.get('/moods/stats', protect, getMoodStats);
router.post('/moods', protect, createMoodLog);
router.put('/moods/:id', protect, updateMoodLog);
router.delete('/moods/:id', protect, deleteMoodLog);

export default router;
