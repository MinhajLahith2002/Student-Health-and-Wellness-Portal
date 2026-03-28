// controllers/notificationController.js

import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const query = { recipients: req.user.id };

    if (unreadOnly === 'true') {
      query['readBy.user'] = { $ne: req.user.id };
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const alreadyRead = notification.readBy.some(r => r.user.toString() === req.user.id);
    if (!alreadyRead) {
      notification.readBy.push({ user: req.user.id, readAt: Date.now() });
      await notification.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipients: req.user.id, 'readBy.user': { $ne: req.user.id } },
      { $push: { readBy: { user: req.user.id, readAt: Date.now() } } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create notification (Admin)
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = async (req, res) => {
  try {
    const { title, message, type, target, targetRole, scheduledFor } = req.body;

    let targetUsers = [];

    if (target === 'All Users') {
      const users = await User.find({ isActive: true });
      targetUsers = users.map(u => u._id);
    } else if (target === 'Specific Role') {
      const users = await User.find({ role: targetRole, isActive: true });
      targetUsers = users.map(u => u._id);
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      target,
      targetRole,
      targetUsers,
      recipients: targetUsers,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdBy: req.user.id
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification
};
