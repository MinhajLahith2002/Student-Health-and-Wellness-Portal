// controllers/notificationController.js

import Notification from '../models/Notification.js';
import User from '../models/User.js';

const ADMIN_NOTIFICATION_SCOPES = new Set(['all', 'admin']);
const TARGET_ROLE_MAP = {
  'All Users': {},
  'All Students': { role: 'student' },
  'All Doctors': { role: 'doctor' },
  'All Pharmacists': { role: 'pharmacist' },
  'All Staff': { role: { $in: ['admin', 'doctor', 'pharmacist', 'counselor'] } }
};

function parsePositiveInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function resolveTargetUsers(target, targetRole) {
  if (target === 'Specific Role') {
    if (!targetRole) {
      throw new Error('Target role is required when using Specific Role');
    }

    const users = await User.find({ role: targetRole, isActive: true }).select('_id');
    return users.map((user) => user._id);
  }

  const mappedQuery = TARGET_ROLE_MAP[target];
  if (!mappedQuery) {
    throw new Error('Unsupported notification target');
  }

  const users = await User.find({ ...mappedQuery, isActive: true }).select('_id');
  return users.map((user) => user._id);
}

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { unreadOnly = false, scope = 'mine' } = req.query;
    const parsedPage = parsePositiveInteger(req.query.page, 1);
    const parsedLimit = parsePositiveInteger(req.query.limit, 20);
    const wantsAdminScope = req.user.role === 'admin' && ADMIN_NOTIFICATION_SCOPES.has(`${scope}`.toLowerCase());
    const query = wantsAdminScope ? {} : { recipients: req.user.id };

    if (unreadOnly === 'true') {
      query.$or = [
        { readBy: { $exists: false } },
        { readBy: { $size: 0 } },
        { 'readBy.user': { $ne: req.user.id } }
      ];
    }

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

    const isRecipient = notification.recipients.some((recipient) => recipient.toString() === req.user.id);
    if (!isRecipient) {
      return res.status(403).json({ message: 'Unauthorized to read this notification' });
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
    const trimmedTitle = `${title || ''}`.trim();
    const trimmedMessage = `${message || ''}`.trim();

    if (!trimmedTitle || !trimmedMessage || !target || !type) {
      return res.status(400).json({ message: 'Title, message, type, and target are required' });
    }

    const targetUsers = await resolveTargetUsers(target, targetRole);
    if (!targetUsers.length) {
      return res.status(400).json({ message: 'No active recipients were found for this notification target' });
    }

    const normalizedSchedule = scheduledFor ? new Date(scheduledFor) : null;
    const status = normalizedSchedule ? 'Scheduled' : 'Sent';

    const notification = await Notification.create({
      title: trimmedTitle,
      message: trimmedMessage,
      type,
      target,
      targetRole: target === 'Specific Role' ? targetRole : null,
      targetUsers,
      recipients: targetUsers,
      status,
      scheduledFor: normalizedSchedule,
      sentAt: normalizedSchedule ? null : new Date(),
      createdBy: req.user.id
    });

    res.status(201).json(notification);
  } catch (error) {
    if (error.message === 'Target role is required when using Specific Role' || error.message === 'Unsupported notification target') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message });
  }
};

// @desc    Update notification (Admin)
// @route   PUT /api/notifications/:id
// @access  Private/Admin
const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const { title, message, type, target, targetRole, scheduledFor } = req.body;
    const trimmedTitle = `${title || ''}`.trim();
    const trimmedMessage = `${message || ''}`.trim();

    if (!trimmedTitle || !trimmedMessage || !target || !type) {
      return res.status(400).json({ message: 'Title, message, type, and target are required' });
    }

    const targetUsers = await resolveTargetUsers(target, targetRole);
    if (!targetUsers.length) {
      return res.status(400).json({ message: 'No active recipients were found for this notification target' });
    }

    const normalizedSchedule = scheduledFor ? new Date(scheduledFor) : null;

    notification.title = trimmedTitle;
    notification.message = trimmedMessage;
    notification.type = type;
    notification.target = target;
    notification.targetRole = target === 'Specific Role' ? targetRole : null;
    notification.targetUsers = targetUsers;
    notification.recipients = targetUsers;
    notification.status = normalizedSchedule ? 'Scheduled' : 'Sent';
    notification.scheduledFor = normalizedSchedule;
    notification.sentAt = normalizedSchedule ? null : new Date();
    notification.updatedAt = new Date();

    await notification.save();
    res.json(notification);
  } catch (error) {
    if (error.message === 'Target role is required when using Specific Role' || error.message === 'Unsupported notification target') {
      return res.status(400).json({ message: error.message });
    }

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
  updateNotification,
  deleteNotification
};
