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

    if (!mood) {
      return res.status(400).json({ message: 'Mood is required' });
    }

    if (moodScore !== undefined && (Number(moodScore) < 1 || Number(moodScore) > 10)) {
      return res.status(400).json({ message: 'Mood intensity must be between 1 and 10' });
    }

    if (notes && !notes.trim()) {
      return res.status(400).json({ message: 'Journal entry cannot be empty' });
    }

    const moodLog = await MoodLog.create({
      userId: req.user.id,
      mood,
      moodScore: Number(moodScore) || undefined,
      notes: notes?.trim() || '',
      factors,
      date: new Date()
    });

    res.status(201).json(moodLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update mood log
// @route   PUT /api/mental-health/moods/:id
// @access  Private
const updateMoodLog = async (req, res) => {
  try {
    const { mood, moodScore, notes, factors } = req.body;
    const moodLog = await MoodLog.findOne({ _id: req.params.id, userId: req.user.id });

    if (!moodLog) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    if (!mood) {
      return res.status(400).json({ message: 'Mood is required' });
    }

    if (moodScore !== undefined && (Number(moodScore) < 1 || Number(moodScore) > 10)) {
      return res.status(400).json({ message: 'Mood intensity must be between 1 and 10' });
    }

    if (notes !== undefined && notes && !notes.trim()) {
      return res.status(400).json({ message: 'Journal entry cannot be empty' });
    }

    moodLog.mood = mood;
    moodLog.moodScore = Number(moodScore) || moodLog.moodScore;
    moodLog.notes = notes?.trim() || '';
    moodLog.factors = Array.isArray(factors) ? factors : moodLog.factors;

    await moodLog.save();
    res.json(moodLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete mood log
// @route   DELETE /api/mental-health/moods/:id
// @access  Private
const deleteMoodLog = async (req, res) => {
  try {
    const moodLog = await MoodLog.findOne({ _id: req.params.id, userId: req.user.id });

    if (!moodLog) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    await moodLog.deleteOne();
    res.json({ message: 'Mood entry deleted' });
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
  updateMoodLog,
  deleteMoodLog,
  getMoodStats,
  getMentalHealthResources
};
