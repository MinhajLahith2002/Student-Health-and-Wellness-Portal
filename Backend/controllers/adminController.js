// controllers/adminController.js

import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import Feedback from '../models/Feedback.js';
import AuditLog from '../models/AuditLog.js';
import Settings from '../models/Settings.js';

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalAppointments, totalOrders, pendingPrescriptions] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      Order.countDocuments(),
      Prescription.countDocuments({ status: 'Pending' })
    ]);

    const recentActivity = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      totalUsers,
      totalAppointments,
      totalOrders,
      pendingPrescriptions,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate(
        { key },
        { key, value, type: typeof value, updatedBy: req.user.id, updatedAt: Date.now() },
        { upsert: true, new: true }
      );
    }

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Settings Updated',
      module: 'Admin',
      details: 'System settings were updated',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getSystemLogs = async (req, res) => {
  try {
    const { level, page = 1, limit = 50 } = req.query;
    const query = {};

    if (level && level !== 'All') query.level = level;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getDashboardStats,
  getSettings,
  updateSettings,
  getSystemLogs
};
