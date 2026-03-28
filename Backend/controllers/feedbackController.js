// controllers/feedbackController.js

import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
const submitFeedback = async (req, res) => {
  try {
    const { module, item, rating, comment, isAnonymous } = req.body;

    const feedback = await Feedback.create({
      userId: req.user.id,
      userName: isAnonymous ? 'Anonymous' : req.user.name,
      module,
      item,
      rating,
      comment,
      isAnonymous
    });

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get feedback
// @route   GET /api/feedback
// @access  Private/Admin
const getFeedback = async (req, res) => {
  try {
    const { module, status, sentiment, page = 1, limit = 20 } = req.query;
    const query = {};

    if (module && module !== 'All') query.module = module;
    if (status && status !== 'All') query.status = status;
    if (sentiment && sentiment !== 'All') query.sentiment = sentiment;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const feedback = await Feedback.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Feedback.countDocuments(query);

    res.json({
      feedback,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to feedback
// @route   PUT /api/feedback/:id/respond
// @access  Private/Admin
const respondToFeedback = async (req, res) => {
  try {
    const { response } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        response,
        respondedBy: req.user.id,
        respondedAt: Date.now(),
        status: 'Responded'
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Create notification for user
    await Notification.create({
      title: 'Response to Your Feedback',
      message: `Admin has responded to your feedback about ${feedback.module}`,
      type: 'system',
      target: 'Specific User',
      targetUsers: [feedback.userId],
      recipients: [feedback.userId],
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get feedback stats
// @route   GET /api/feedback/stats
// @access  Private/Admin
const getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
          byModule: { $push: '$module' },
          bySentiment: { $push: '$sentiment' }
        }
      }
    ]);

    res.json(stats[0] || { averageRating: 0, totalFeedback: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  submitFeedback,
  getFeedback,
  respondToFeedback,
  getFeedbackStats
};
