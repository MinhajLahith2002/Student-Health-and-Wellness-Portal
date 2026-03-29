import CounselingSession from '../models/CounselingSession.js';
import Notification from '../models/Notification.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import { getAvailabilityForProvider } from '../services/availabilityService.js';
import { isDateTimeInPast, normalizeDateOnly } from '../utils/timeSlots.js';

function createDemoMeetingLink(prefix, id) {
  return `https://campushealth.local/${prefix}/${id}`;
}

function serializeSession(session, viewerRole) {
  const data = session.toObject ? session.toObject() : { ...session };
  if (viewerRole !== 'counselor') {
    delete data.confidentialNotes;
  }
  return data;
}

function createListQuery(req) {
  const query = {};

  if (req.user.role === 'student') {
    query.studentId = req.user.id;
  } else if (req.user.role === 'counselor') {
    query.counselorId = req.user.id;
  }

  if (req.query.status && req.query.status !== 'All') {
    query.status = req.query.status;
  }

  return query;
}

async function findAuthorizedSession(req, populateResources = false) {
  const query = { _id: req.params.id };
  const sessionQuery = CounselingSession.findOne(query);

  if (populateResources) {
    sessionQuery.populate('assignedResources', 'title type category description coverImage videoUrl readTime duration');
  }

  const session = await sessionQuery;

  if (!session) {
    return { error: { status: 404, message: 'Session not found' } };
  }

  if (req.user.role === 'student' && session.studentId.toString() !== req.user.id) {
    return { error: { status: 403, message: 'Unauthorized' } };
  }

  if (req.user.role === 'counselor' && session.counselorId.toString() !== req.user.id) {
    return { error: { status: 403, message: 'Unauthorized' } };
  }

  return { session };
}

// @desc    Get counseling sessions
// @route   GET /api/counseling/sessions
// @access  Private
const getCounselingSessions = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const query = createListQuery(req);

    const sessions = await CounselingSession.find(query)
      .populate('assignedResources', 'title type category coverImage')
      .sort({ date: 1, time: 1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await CounselingSession.countDocuments(query);

    res.json({
      sessions: sessions.map((session) => serializeSession(session, req.user.role)),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get counseling session by ID
// @route   GET /api/counseling/sessions/:id
// @access  Private
const getCounselingSessionById = async (req, res) => {
  try {
    const result = await findAuthorizedSession(req, true);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    res.json(serializeSession(result.session, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create counseling session
// @route   POST /api/counseling/sessions
// @access  Private/Student
const createCounselingSession = async (req, res) => {
  try {
    const { counselorId, date, time, type, urgency, reason } = req.body;

    if (!counselorId || !date || !time || !type || !reason?.trim()) {
      return res.status(400).json({ message: 'Counselor, date, time, type, and reason are required' });
    }

    const counselor = await User.findById(counselorId);
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    if (isDateTimeInPast(date, time)) {
      return res.status(400).json({ message: 'Counseling sessions must be booked for a future time slot' });
    }

    const availability = await getAvailabilityForProvider({
      providerId: counselorId,
      role: 'counselor',
      date
    });

    if (!availability.availableSlots.includes(time)) {
      return res.status(400).json({ message: 'Selected time slot is unavailable' });
    }

    const student = await User.findById(req.user.id).select('name');

    const session = await CounselingSession.create({
      studentId: req.user.id,
      counselorId,
      studentName: student?.name || req.user.name,
      counselorName: counselor.name,
      counselorSpecialty: counselor.specialty || 'Counselor',
      counselorImage: counselor.profileImage,
      date: normalizeDateOnly(date),
      time,
      type,
      urgency: urgency || 'Medium',
      reason: reason.trim(),
      meetingLink: type === 'Video Call' ? createDemoMeetingLink('counseling', Date.now()) : null,
      location: type === 'In-Person' ? 'Campus Wellness Center' : null,
      status: 'Confirmed'
    });

    await Notification.create({
      title: 'New Counseling Session',
      message: `${student?.name || req.user.name} booked a counseling session on ${session.date.toLocaleDateString()} at ${session.time}.`,
      type: 'appointment',
      target: 'Specific User',
      targetUsers: [counselorId],
      recipients: [counselorId],
      link: `/counselor/sessions/${session._id}`,
      createdBy: req.user.id,
      status: 'Sent',
      sentAt: Date.now()
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule counseling session
// @route   PUT /api/counseling/sessions/:id/reschedule
// @access  Private
const rescheduleCounselingSession = async (req, res) => {
  try {
    const { date, time, type } = req.body;
    const result = await findAuthorizedSession(req);

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    if (['Completed', 'Cancelled'].includes(session.status)) {
      return res.status(400).json({ message: 'This session can no longer be rescheduled' });
    }

    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    if (isDateTimeInPast(date, time)) {
      return res.status(400).json({ message: 'Counseling sessions must be rescheduled to a future time slot' });
    }

    const availability = await getAvailabilityForProvider({
      providerId: session.counselorId,
      role: 'counselor',
      date,
      excludeId: session._id
    });

    if (!availability.availableSlots.includes(time)) {
      return res.status(400).json({ message: 'Selected time slot is unavailable' });
    }

    session.date = normalizeDateOnly(date);
    session.time = time;
    session.type = type || session.type;
    session.status = 'Confirmed';
    session.meetingLink = session.type === 'Video Call' ? createDemoMeetingLink('counseling', session._id) : null;
    session.location = session.type === 'In-Person' ? 'Campus Wellness Center' : null;

    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update counseling session status
// @route   PUT /api/counseling/sessions/:id/status
// @access  Private
const updateCounselingSessionStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const result = await findAuthorizedSession(req);

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    const studentStatuses = ['Ready', 'Cancelled'];
    const counselorStatuses = ['Confirmed', 'In Progress', 'Completed', 'Cancelled'];

    if (req.user.role === 'student' && !studentStatuses.includes(status)) {
      return res.status(403).json({ message: 'Students can only check in or cancel sessions' });
    }

    if (req.user.role === 'counselor' && !counselorStatuses.includes(status)) {
      return res.status(403).json({ message: 'Invalid status transition for counselor' });
    }

    if (req.user.role === 'student' && status === 'Ready') {
      const today = normalizeDateOnly(new Date());
      if (normalizeDateOnly(session.date).getTime() !== today.getTime()) {
        return res.status(400).json({ message: 'Sessions can only be checked in on the scheduled date' });
      }
    }

    session.status = status;

    if (status === 'Ready') {
      session.checkInAt = new Date();
    }

    if (status === 'Cancelled') {
      session.cancelledAt = new Date();
      session.cancelledBy = req.user.role;
      session.cancellationReason = cancellationReason || '';
    }

    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update counselor notes and assigned resources
// @route   PUT /api/counseling/sessions/:id/notes
// @access  Private/Counselor
const updateCounselingSessionNotes = async (req, res) => {
  try {
    const result = await findAuthorizedSession(req);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ message: 'Only counselors can update confidential notes' });
    }

    const {
      confidentialNotes,
      sharedSummary,
      actionPlan,
      assignedResources,
      assignedResourceMessage,
      followUpRecommended,
      followUpDate
    } = req.body;

    if (Array.isArray(assignedResources) && assignedResources.length > 0) {
      const validResources = await Resource.find({ _id: { $in: assignedResources } }).select('_id');
      session.assignedResources = validResources.map((resource) => resource._id);
    } else if (Array.isArray(assignedResources)) {
      session.assignedResources = [];
    }

    session.confidentialNotes = confidentialNotes ?? session.confidentialNotes;
    session.sharedSummary = sharedSummary ?? session.sharedSummary;
    session.actionPlan = actionPlan ?? session.actionPlan;
    session.assignedResourceMessage = assignedResourceMessage ?? session.assignedResourceMessage;
    session.followUpRecommended = followUpRecommended ?? session.followUpRecommended;
    if (followUpRecommended === false) {
      session.followUpDate = null;
    } else if (followUpDate !== undefined) {
      if (followUpDate) {
        const normalizedFollowUpDate = normalizeDateOnly(followUpDate);
        const normalizedToday = normalizeDateOnly(new Date());
        const normalizedSessionDate = normalizeDateOnly(session.date);
        const minimumFollowUpDate = normalizedSessionDate > normalizedToday ? normalizedSessionDate : normalizedToday;

        if (normalizedFollowUpDate < minimumFollowUpDate) {
          return res.status(400).json({
            message: `Follow-up date must be on or after ${minimumFollowUpDate.toISOString().slice(0, 10)}`
          });
        }

        session.followUpDate = normalizedFollowUpDate;
      } else {
        session.followUpDate = null;
      }
    }

    await session.save();
    await session.populate('assignedResources', 'title type category coverImage');

    res.json(serializeSession(session, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getCounselingSessions,
  getCounselingSessionById,
  createCounselingSession,
  rescheduleCounselingSession,
  updateCounselingSessionStatus,
  updateCounselingSessionNotes
};
