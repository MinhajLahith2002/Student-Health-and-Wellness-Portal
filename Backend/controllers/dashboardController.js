import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import CounselingSession from '../models/CounselingSession.js';
import Medicine from '../models/Medicine.js';
import MoodLog from '../models/MoodLog.js';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';

const getStudentDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const parsedLimit = 5;

    const [
      upcomingAppointments,
      upcomingCounselingSessions,
      recentOrders,
      recentPrescriptions,
      moodTrends,
      healthScore
    ] = await Promise.all([
      Appointment.find({
        studentId: req.user.id,
        date: { $gte: today },
        status: { $in: ['Confirmed', 'Ready', 'In Progress'] }
      })
        .sort({ date: 1, time: 1 })
        .limit(parsedLimit),

      CounselingSession.find({
        studentId: req.user.id,
        date: { $gte: today },
        status: { $in: ['Confirmed', 'Ready', 'In Progress'] }
      })
        .sort({ date: 1, time: 1 })
        .limit(parsedLimit),

      Order.find({ studentId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(parsedLimit),

      Prescription.find({ studentId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(parsedLimit),

      MoodLog.find({
        userId: req.user.id,
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: 1 }),

      Promise.resolve(85)
    ]);

    const avgMood =
      moodTrends.length > 0
        ? moodTrends.reduce((sum, mood) => sum + (mood.moodScore || 0), 0) / moodTrends.length
        : 0;

    res.json({
      upcomingAppointments,
      upcomingCounselingSessions,
      recentOrders,
      recentPrescriptions,
      moodTrends: {
        data: moodTrends.map((mood) => ({ date: mood.date, mood: mood.moodScore || 5 })),
        averageMood: avgMood.toFixed(1)
      },
      healthScore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      totalPatients,
      activeSchedules
    ] = await Promise.all([
      Appointment.find({
        doctorId: req.user.id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['Confirmed', 'Ready', 'In Progress'] }
      })
        .sort({ time: 1 }),

      Appointment.countDocuments({
        doctorId: req.user.id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['Confirmed', 'Ready'] }
      }),

      Prescription.countDocuments({ doctorId: req.user.id, status: 'Pending' }),

      Appointment.countDocuments({
        doctorId: req.user.id,
        date: { $gte: today, $lt: tomorrow },
        status: 'Completed'
      }),

      Appointment.distinct('studentId', { doctorId: req.user.id }).then((patients) => patients.length),

      Availability.countDocuments({ providerId: req.user.id, status: 'Active' })
    ]);

    res.json({
      todayAppointments,
      stats: {
        queue: queuePatients,
        pendingPrescriptions,
        completedToday,
        totalPatients,
        activeSchedules
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCounselorDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      upcomingSessions,
      activeStudents,
      pendingNotes,
      assignedResources,
      pendingFollowUps
    ] = await Promise.all([
      CounselingSession.find({
        counselorId: req.user.id,
        date: { $gte: today },
        status: { $in: ['Confirmed', 'Ready', 'In Progress'] }
      })
        .select('studentName date time type status')
        .sort({ date: 1, time: 1 })
        .limit(6)
        .lean(),

      CounselingSession.distinct('studentId', { counselorId: req.user.id }).then((students) => students.length),

      CounselingSession.countDocuments({
        counselorId: req.user.id,
        status: 'Completed',
        $or: [
          { confidentialNotes: { $in: ['', null] } },
          { sharedSummary: { $in: ['', null] } }
        ]
      }),

      CounselingSession.aggregate([
        { $match: { counselorId: req.user._id } },
        { $project: { resourceCount: { $size: '$assignedResources' } } },
        { $group: { _id: null, total: { $sum: '$resourceCount' } } }
      ]).then((result) => result[0]?.total || 0),

      CounselingSession.countDocuments({
        counselorId: req.user.id,
        followUpRecommended: true,
        status: { $ne: 'Cancelled' }
      })
    ]);

    res.json({
      upcomingSessions,
      stats: {
        activeStudents,
        pendingNotes,
        assignedResources,
        pendingFollowUps
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPharmacistDashboard = async (req, res) => {
  try {
    const medicineLowStockPromise = typeof Medicine !== 'undefined'
      ? Medicine.find({ stock: { $lte: 5 } }).limit(50)
      : Promise.resolve([]);

    const [pendingPrescriptions, ordersToProcess, lowStockItems, recentOrders] =
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
        pendingPrescriptions,
        ordersToProcess,
        lowStockCount: Array.isArray(lowStockItems) ? lowStockItems.length : 0
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAppointments,
      totalOrders,
      revenueAggregation,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Promise.resolve([])
    ]);

    const revenue = Array.isArray(revenueAggregation) && revenueAggregation.length > 0
      ? revenueAggregation[0].total
      : 0;

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
  getCounselorDashboard,
  getPharmacistDashboard,
  getAdminDashboard
};
