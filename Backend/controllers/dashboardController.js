// controllers/dashboardController.js

import Appointment from '../models/Appointment.js';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import MoodLog from '../models/MoodLog.js';
import Medicine from '../models/Medicine.js'; // optional, used for low stock check if available

// @desc    Get student dashboard data
// @route   GET /api/dashboard/student
// @access  Private/Student
const getStudentDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const parsedLimit = 5;

    const [upcomingAppointments, recentOrders, moodTrends, healthScore] = await Promise.all([
      Appointment.find({
        studentId: req.user.id,
        date: { $gte: today },
        status: { $in: ['Confirmed', 'In Progress'] }
      })
        .sort({ date: 1, time: 1 })
        .limit(parsedLimit),

      Order.find({ studentId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(parsedLimit),

      MoodLog.find({
        userId: req.user.id,
        date: { $gte: thirtyDaysAgo }
      })
        .sort({ date: 1 }),

      // Placeholder for health score calculation; replace with real logic
      Promise.resolve(85)
    ]);

    const avgMood =
      moodTrends.length > 0
        ? moodTrends.reduce((sum, m) => sum + (m.moodScore || 0), 0) / moodTrends.length
        : 0;

    res.json({
      upcomingAppointments,
      recentOrders,
      moodTrends: {
        data: moodTrends.map(m => ({ date: m.date, mood: m.moodScore || 5 })),
        averageMood: avgMood.toFixed(1)
      },
      healthScore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor dashboard data
// @route   GET /api/dashboard/doctor
// @access  Private/Doctor
const getDoctorDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayAppointments,
      queuePatients,
      pendingPrescriptions,
      completedToday,
      totalPatientsCount
    ] = await Promise.all([
      Appointment.find({
        doctorId: req.user.id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['Confirmed', 'In Progress'] }
      }).sort({ time: 1 }),

      Appointment.countDocuments({
        doctorId: req.user.id,
        date: { $gte: today, $lt: tomorrow },
        status: 'Confirmed'
      }),

      Prescription.countDocuments({ doctorId: req.user.id, status: 'Pending' }),

      Appointment.countDocuments({
        doctorId: req.user.id,
        date: { $gte: today, $lt: tomorrow },
        status: 'Completed'
      }),

      Appointment.countDocuments({ doctorId: req.user.id })
    ]);

    res.json({
      todayAppointments,
      stats: {
        queue: queuePatients,
        pendingPrescriptions,
        completedToday,
        totalPatients: totalPatientsCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pharmacist dashboard data
// @route   GET /api/dashboard/pharmacist
// @access  Private/Pharmacist
const getPharmacistDashboard = async (req, res) => {
  try {
    // If Medicine model exists, use it to compute low stock items; otherwise return empty array
    const medicineLowStockPromise = typeof Medicine !== 'undefined'
      ? Medicine.find({ stock: { $lte: 5 } }).limit(50)
      : Promise.resolve([]);

    const [pendingPrescriptionsCount, ordersToProcessCount, lowStockItems, recentOrders] =
      await Promise.all([
        Prescription.countDocuments({ status: 'Pending' }),
        Order.countDocuments({ status: { $in: ['Pending', 'Verified'] } }),
        medicineLowStockPromise,
        Order.find({ status: { $ne: 'Delivered' } })
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

    res.json({
      stats: {
        pendingPrescriptions: pendingPrescriptionsCount,
        ordersToProcess: ordersToProcessCount,
        lowStockCount: Array.isArray(lowStockItems) ? lowStockItems.length : 0
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAppointments,
      totalOrders,
      revenueAggregation,
      recentActivity // placeholder for audit logs or activity feed
    ] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Replace with AuditLog.find(...) if you have an AuditLog model
      Promise.resolve([])
    ]);

    const revenue = Array.isArray(revenueAggregation) && revenueAggregation.length > 0
      ? revenueAggregation[0].total
      : 0;

    // User growth data (last 6 months) using User.aggregate
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalAppointments,
        totalOrders,
        totalRevenue: revenue
      },
      userGrowth,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getStudentDashboard,
  getDoctorDashboard,
  getPharmacistDashboard,
  getAdminDashboard
};
