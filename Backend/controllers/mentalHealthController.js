// controllers/mentalHealthController.js

import MoodLog from '../models/MoodLog.js';
import Resource from '../models/Resource.js';

// @desc    Get mood logs
// @route   GET /api/mental-health/moods
// @access  Private
const getMoodLogs = async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    const query = { userId: req.user.id };

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const moods = await MoodLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit, 10));

    res.json(moods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create mood log
// @route   POST /api/mental-health/moods
// @access  Private
const createMoodLog = async (req, res) => {
  try {
    const { mood, moodScore, notes, factors } = req.body;

    const moodLog = await MoodLog.create({
      userId: req.user.id,
      mood,
      moodScore,
      notes,
      factors,
      date: new Date()
    });

    res.status(201).json(moodLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get mood statistics
// @route   GET /api/mental-health/moods/stats
// @access  Private
const getMoodStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moodLogs = await MoodLog.find({
      userId: req.user.id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    const averageMood =
      moodLogs.length > 0
        ? moodLogs.reduce((sum, log) => sum + (log.moodScore || 0), 0) / moodLogs.length
        : 0;

    const moodCounts = moodLogs.reduce((acc, log) => {
      acc[log.mood] = (acc[log.mood] || 0) + 1;
      return acc;
    }, {});

    res.json({
      averageMood,
      totalLogs: moodLogs.length,
      moodDistribution: moodCounts,
      logs: moodLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get mental health resources
// @route   GET /api/mental-health/resources
// @access  Public
const getMentalHealthResources = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const query = { category: 'Mental Health', status: 'Published' };

    if (category && category !== 'All') query.subCategory = category;

    const resources = await Resource.find(query)
      .sort({ views: -1, createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getMoodLogs,
  createMoodLog,
  getMoodStats,
  getMentalHealthResources
};
