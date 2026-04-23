import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import CounselingSession from '../models/CounselingSession.js';
import Medicine from '../models/Medicine.js';
import MoodLog from '../models/MoodLog.js';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { isDateTimeInPast } from '../utils/timeSlots.js';
import {
  COUNSELING_ACTIVE_SLOT_STATUSES,
  COUNSELING_UPCOMING_SESSION_STATUSES,
  syncCounselingNoShows
} from '../utils/counselingSessions.js';

const COUNSELING_PENDING_STATUSES = ['Pending', 'Confirmed', 'Ready', 'In Progress'];
const COUNSELING_COMPLETED_STATUSES = ['Completed'];
const COUNSELING_TREND_PENDING_THRESHOLD = 8;
const DOCTOR_DASHBOARD_PROFILE_FIELDS = 'name email studentId profileImage allergies medicalHistory bloodType dateOfBirth gender';
const DOCTOR_DASHBOARD_ACTIVE_STATUSES = ['Pending', 'Confirmed', 'Ready', 'In Progress'];

function toDashboardStudentProfile(student) {
  if (!student || typeof student !== 'object') return null;

  return {
    _id: student._id,
    name: student.name || '',
    email: student.email || '',
    studentId: student.studentId || '',
    profileImage: student.profileImage || '',
    allergies: Array.isArray(student.allergies) ? student.allergies : [],
    medicalHistory: Array.isArray(student.medicalHistory) ? student.medicalHistory : [],
    bloodType: student.bloodType || null,
    dateOfBirth: student.dateOfBirth || null,
    gender: student.gender || null
  };
}

function toDashboardAppointment(appointment) {
  const studentProfile = toDashboardStudentProfile(appointment.studentId);

  return {
    ...appointment,
    studentName: appointment.studentName || studentProfile?.name || 'Student',
    studentProfile
  };
}

function buildPatientRecords(appointments = [], todayBoundary) {
  const patientMap = new Map();

  appointments.forEach((appointment) => {
    const student = toDashboardStudentProfile(appointment.studentId);
    if (!student?._id) return;

    const key = student._id.toString();
    const existing = patientMap.get(key) || {
      _id: student._id,
      name: student.name || appointment.studentName || 'Student',
      email: student.email || '',
      studentId: student.studentId || '',
      profileImage: student.profileImage || '',
      allergies: student.allergies,
      medicalHistory: student.medicalHistory,
      bloodType: student.bloodType,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      totalVisits: 0,
      lastVisit: null,
      nextVisit: null,
      recentAppointments: []
    };

    existing.totalVisits += 1;
    existing.recentAppointments.push({
      _id: appointment._id,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      symptoms: appointment.symptoms || '',
      notes: appointment.notes || '',
      diagnosis: appointment.diagnosis || ''
    });

    const appointmentDate = new Date(appointment.date);
    const isPastOrToday = appointmentDate < todayBoundary;
    const isUpcoming = appointmentDate >= todayBoundary && DOCTOR_DASHBOARD_ACTIVE_STATUSES.includes(appointment.status);

    if (isPastOrToday && !existing.lastVisit) {
      existing.lastVisit = appointment.date;
    }

    if (isUpcoming) {
      if (!existing.nextVisit || appointmentDate < new Date(existing.nextVisit)) {
        existing.nextVisit = appointment.date;
      }
    }

    patientMap.set(key, existing);
  });

  return [...patientMap.values()].map((patient) => ({
    ...patient,
    recentAppointments: patient.recentAppointments.slice(0, 3)
  }));
}

function normalizeTrendDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTrendRangeDefaults(range) {
  switch (range) {
    case '14d':
      return { steps: 14, defaultGroupBy: 'day' };
    case '12m':
      return { steps: 12, defaultGroupBy: 'month' };
    case '8w':
    default:
      return { steps: 8, defaultGroupBy: 'week' };
  }
}

function startOfWeek(dateValue) {
  const date = normalizeTrendDate(dateValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function startOfMonth(dateValue) {
  const date = normalizeTrendDate(dateValue);
  date.setDate(1);
  return date;
}

function addDays(dateValue, amount) {
  const next = normalizeTrendDate(dateValue);
  next.setDate(next.getDate() + amount);
  return next;
}

function addWeeks(dateValue, amount) {
  return addDays(dateValue, amount * 7);
}

function addMonths(dateValue, amount) {
  const next = normalizeTrendDate(dateValue);
  next.setMonth(next.getMonth() + amount, 1);
  return next;
}

function formatShortMonthDay(dateValue, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone
  }).format(dateValue);
}

function formatShortMonth(dateValue, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone
  }).format(dateValue);
}

function formatLocalIsoDate(dateValue) {
  const date = normalizeTrendDate(dateValue);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function createTrendPeriods({ range, groupBy, timeZone, from, to }) {
  const today = normalizeTrendDate(new Date());

  if (from && to) {
    const periods = [];
    let cursor;
    let periodEnd;
    let endBoundary;

    if (groupBy === 'month') {
      cursor = startOfMonth(from);
      endBoundary = addMonths(startOfMonth(to), 1);
    } else if (groupBy === 'week') {
      cursor = startOfWeek(from);
      endBoundary = addWeeks(startOfWeek(to), 1);
    } else {
      cursor = normalizeTrendDate(from);
      endBoundary = addDays(normalizeTrendDate(to), 1);
    }

    while (cursor < endBoundary) {
      if (groupBy === 'month') {
        periodEnd = addMonths(cursor, 1);
      } else if (groupBy === 'week') {
        periodEnd = addWeeks(cursor, 1);
      } else {
        periodEnd = addDays(cursor, 1);
      }

      const label = groupBy === 'month'
        ? formatShortMonth(cursor, timeZone)
        : groupBy === 'week'
          ? `${formatShortMonthDay(cursor, timeZone)}-${formatShortMonthDay(addDays(periodEnd, -1), timeZone)}`
          : formatShortMonthDay(cursor, timeZone);

      periods.push({
        key: cursor.toISOString(),
        start: cursor,
        end: periodEnd,
        periodLabel: label,
        isCurrentPeriod: today >= cursor && today < periodEnd
      });

      cursor = periodEnd;
    }

    return periods;
  }

  const { steps } = getTrendRangeDefaults(range);
  const periods = [];

  if (groupBy === 'month') {
    const currentStart = startOfMonth(today);
    for (let index = steps - 1; index >= 0; index -= 1) {
      const start = addMonths(currentStart, -index);
      const end = addMonths(start, 1);
      periods.push({
        key: start.toISOString(),
        start,
        end,
        periodLabel: formatShortMonth(start, timeZone),
        isCurrentPeriod: index === 0
      });
    }
    return periods;
  }

  if (groupBy === 'week') {
    const currentStart = startOfWeek(today);
    for (let index = steps - 1; index >= 0; index -= 1) {
      const start = addWeeks(currentStart, -index);
      const end = addWeeks(start, 1);
      periods.push({
        key: start.toISOString(),
        start,
        end,
        periodLabel: `${formatShortMonthDay(start, timeZone)}-${formatShortMonthDay(addDays(end, -1), timeZone)}`,
        isCurrentPeriod: index === 0
      });
    }
    return periods;
  }

  const currentStart = normalizeTrendDate(today);
  for (let index = steps - 1; index >= 0; index -= 1) {
    const start = addDays(currentStart, -index);
    const end = addDays(start, 1);
    periods.push({
      key: start.toISOString(),
      start,
      end,
      periodLabel: formatShortMonthDay(start, timeZone),
      isCurrentPeriod: index === 0
    });
  }

  return periods;
}

function getTrendPointStatusBucket(status) {
  if (COUNSELING_COMPLETED_STATUSES.includes(status)) return 'completedSessions';
  if (COUNSELING_PENDING_STATUSES.includes(status)) return 'pendingSessions';
  return '';
}

const getStudentDashboard = async (req, res) => {
  try {
    await syncCounselingNoShows({ studentId: req.user.id });

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
        status: { $in: COUNSELING_UPCOMING_SESSION_STATUSES }
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
      })
        .select('date moodScore')
        .sort({ date: 1 })
        .lean(),

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
    const twoWeeksFromToday = new Date(today);
    twoWeeksFromToday.setDate(twoWeeksFromToday.getDate() + 14);

    const [
      todayAppointments,
      upcomingAppointments,
      patientHistory,
      queuePatients,
      pendingPrescriptions,
      completedToday,
      activeSchedules
    ] = await Promise.all([
      Appointment.find({
        doctorId: req.user.id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['Confirmed', 'Ready', 'In Progress'] }
      })
        .select('studentId studentName date time type status symptoms notes diagnosis')
        .populate('studentId', DOCTOR_DASHBOARD_PROFILE_FIELDS)
        .sort({ time: 1 })
        .lean(),

      Appointment.find({
        doctorId: req.user.id,
        date: { $gte: tomorrow, $lt: twoWeeksFromToday },
        status: { $in: DOCTOR_DASHBOARD_ACTIVE_STATUSES }
      })
        .select('studentId studentName date time type status symptoms notes diagnosis')
        .populate('studentId', DOCTOR_DASHBOARD_PROFILE_FIELDS)
        .sort({ date: 1, time: 1 })
        .lean(),

      Appointment.find({
        doctorId: req.user.id
      })
        .select('studentId studentName date time type status symptoms notes diagnosis')
        .populate('studentId', DOCTOR_DASHBOARD_PROFILE_FIELDS)
        .sort({ date: -1, time: -1 })
        .lean(),

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

      Availability.countDocuments({ providerId: req.user.id, status: 'Active' })
    ]);

    const patientRecords = buildPatientRecords(patientHistory, tomorrow);

    res.json({
      todayAppointments: todayAppointments.map(toDashboardAppointment),
      upcomingAppointments: upcomingAppointments.map(toDashboardAppointment),
      patientRecords,
      stats: {
        queue: queuePatients,
        pendingPrescriptions,
        completedToday,
        totalPatients: patientRecords.length,
        activeSchedules
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCounselorDashboard = async (req, res) => {
  try {
    await syncCounselingNoShows({ counselorId: req.user.id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counselorEntries = await Availability.find({
      providerId: req.user.id,
      role: 'counselor',
      status: 'Active',
      isUnavailable: false,
      date: { $gte: today, $ne: null }
    }).select('_id date startTime');

    const futureCounselorEntries = counselorEntries.filter((entry) => (
      !isDateTimeInPast(entry.date, entry.startTime)
    ));

    const bookedSlotIds = futureCounselorEntries.length > 0
      ? await CounselingSession.distinct('availabilityEntryId', {
        availabilityEntryId: { $in: futureCounselorEntries.map((entry) => entry._id) },
        status: { $in: COUNSELING_ACTIVE_SLOT_STATUSES }
      })
      : [];

    const openSlots = Math.max(0, futureCounselorEntries.length - bookedSlotIds.length);

    const [
      upcomingSessions,
      activeStudents,
      pendingNotes,
      noShows,
      assignedResources,
      pendingFollowUps
    ] = await Promise.all([
      CounselingSession.find({
        counselorId: req.user.id,
        date: { $gte: today },
        status: { $in: COUNSELING_UPCOMING_SESSION_STATUSES }
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

      CounselingSession.countDocuments({
        counselorId: req.user.id,
        status: 'No Show'
      }),

      CounselingSession.aggregate([
        { $match: { counselorId: req.user._id } },
        { $project: { resourceCount: { $size: '$assignedResources' } } },
        { $group: { _id: null, total: { $sum: '$resourceCount' } } }
      ]).then((result) => result[0]?.total || 0),

      CounselingSession.countDocuments({
        counselorId: req.user.id,
        followUpRecommended: true,
        status: { $nin: ['Cancelled', 'No Show'] }
      })
    ]);

    res.json({
      upcomingSessions,
      stats: {
        activeStudents,
        pendingNotes,
        noShows,
        assignedResources,
        pendingFollowUps,
        openSlots
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCounselorSessionTrends = async (req, res) => {
  try {
    await syncCounselingNoShows({ counselorId: req.user.id });

    const range = ['14d', '8w', '12m'].includes(req.query.range) ? req.query.range : '8w';
    const defaults = getTrendRangeDefaults(range);
    const groupBy = ['day', 'week', 'month'].includes(req.query.groupBy)
      ? req.query.groupBy
      : defaults.defaultGroupBy;
    const timeZone = `${req.query.timezone || 'UTC'}`.trim() || 'UTC';
    const customFrom = req.query.from ? normalizeTrendDate(req.query.from) : null;
    const customTo = req.query.to ? normalizeTrendDate(req.query.to) : null;

    const periods = createTrendPeriods({
      range,
      groupBy,
      timeZone,
      from: customFrom,
      to: customTo
    });

    if (!periods.length) {
      return res.json({
        range,
        groupBy,
        generatedAt: new Date().toISOString(),
        summary: {
          completedTotal: 0,
          pendingTotal: 0,
          pendingAttentionThreshold: COUNSELING_TREND_PENDING_THRESHOLD
        },
        points: []
      });
    }

    const overallStart = periods[0].start;
    const overallEnd = periods[periods.length - 1].end;

    const sessions = await CounselingSession.find({
      counselorId: req.user.id,
      date: { $gte: overallStart, $lt: overallEnd },
      status: { $nin: ['Cancelled', 'No Show'] }
    })
      .select('date status')
      .lean();

    const points = periods.map((period) => ({
      periodStart: formatLocalIsoDate(period.start),
      periodEnd: formatLocalIsoDate(addDays(period.end, -1)),
      periodLabel: period.periodLabel,
      completedSessions: 0,
      pendingSessions: 0,
      isCurrentPeriod: period.isCurrentPeriod
    }));

    sessions.forEach((session) => {
      const bucket = getTrendPointStatusBucket(session.status);
      if (!bucket) return;

      const sessionDate = normalizeTrendDate(session.date);
      const pointIndex = periods.findIndex((period) => (
        sessionDate >= period.start && sessionDate < period.end
      ));

      if (pointIndex >= 0) {
        points[pointIndex][bucket] += 1;
      }
    });

    const summary = points.reduce((accumulator, point) => ({
      completedTotal: accumulator.completedTotal + point.completedSessions,
      pendingTotal: accumulator.pendingTotal + point.pendingSessions,
      pendingAttentionThreshold: COUNSELING_TREND_PENDING_THRESHOLD
    }), {
      completedTotal: 0,
      pendingTotal: 0,
      pendingAttentionThreshold: COUNSELING_TREND_PENDING_THRESHOLD
    });

    res.json({
      range,
      groupBy,
      generatedAt: new Date().toISOString(),
      summary,
      points
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
  getCounselorSessionTrends,
  getPharmacistDashboard,
  getAdminDashboard
};
