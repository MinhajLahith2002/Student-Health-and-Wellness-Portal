import Availability from '../models/Availability.js';
import Conversation from '../models/Conversation.js';
import CounselingSession from '../models/CounselingSession.js';
import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import { emitToConversation, emitToUser } from '../utils/socket.js';
import {
  buildJitsiEmbedLink,
  buildJitsiMeetingLink,
  getCounselingModeLabel,
  normalizeCounselingMode
} from '../utils/counseling.js';
import {
  getDateRange,
  isDateTimeInPast,
  normalizeDateOnly,
  toDisplayTime,
  toMinutes
} from '../utils/timeSlots.js';

const ACTIVE_SLOT_STATUSES = ['Confirmed', 'Ready', 'In Progress', 'Completed'];
const WORKSPACE_SESSION_STATUSES = ['Confirmed', 'Ready', 'In Progress', 'Completed'];
const MANAGEABLE_SESSION_STATUSES = ['Confirmed', 'Ready', 'In Progress'];
const SESSION_LIST_FIELDS = [
  'availabilityEntryId',
  'studentId',
  'studentName',
  'counselorId',
  'counselorName',
  'counselorSpecialty',
  'counselorImage',
  'date',
  'time',
  'duration',
  'type',
  'mode',
  'urgency',
  'reason',
  'location',
  'status',
  'feedbackSubmitted',
  'cancellationReason',
  'cancelledBy',
  'cancelledAt',
  'followUpRecommended',
  'followUpDate',
  'checkInAt',
  'createdAt',
  'updatedAt'
].join(' ');

function getSessionMode(session) {
  return normalizeCounselingMode(session.mode || session.type);
}

function buildMeetingFields(mode, sessionId) {
  if (normalizeCounselingMode(mode) !== 'video') {
    return {
      meetingLink: null,
      meetingEmbedUrl: null
    };
  }

  return {
    meetingLink: buildJitsiMeetingLink(sessionId),
    meetingEmbedUrl: buildJitsiEmbedLink(sessionId)
  };
}

function getAllowedActions(session, viewerRole) {
  const actions = {
    canJoin: !['Cancelled', 'Completed'].includes(session.status),
    canCheckIn: false,
    canReschedule: false,
    canCancel: false,
    canLeaveFeedback: false,
    canManageNotes: false
  };

  if (viewerRole === 'student') {
    actions.canCheckIn = session.status === 'Confirmed';
    actions.canReschedule = ['Confirmed', 'Ready'].includes(session.status);
    actions.canCancel = ['Confirmed', 'Ready'].includes(session.status);
    actions.canLeaveFeedback = session.status === 'Completed' && !session.feedbackSubmitted;
  }

  if (viewerRole === 'counselor') {
    actions.canReschedule = MANAGEABLE_SESSION_STATUSES.includes(session.status);
    actions.canCancel = MANAGEABLE_SESSION_STATUSES.includes(session.status);
    actions.canManageNotes = true;
  }

  return actions;
}

function serializeSession(session, viewerRole) {
  const data = session.toObject ? session.toObject() : { ...session };
  const mode = getSessionMode(data);
  const meeting = buildMeetingFields(mode, data._id);

  data.mode = mode;
  data.typeLabel = getCounselingModeLabel(mode);
  data.meetingLink = meeting.meetingLink;
  data.meetingEmbedUrl = meeting.meetingEmbedUrl;
  data.allowedActions = getAllowedActions(data, viewerRole);

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

function getSlotEndTime(startTime, duration) {
  const startMinutes = toMinutes(startTime);
  return startMinutes === null ? null : toDisplayTime(startMinutes + duration);
}

function isFutureSlot(entry) {
  return !isDateTimeInPast(entry.date, entry.startTime);
}

function formatSlot(entry, linkedSession = null) {
  const modeLabel = entry.consultationTypes?.[0] || 'Video Call';
  const mode = normalizeCounselingMode(modeLabel);

  return {
    id: entry._id,
    availabilityEntryId: entry._id,
    date: entry.date,
    time: entry.startTime,
    startTime: entry.startTime,
    endTime: entry.endTime,
    duration: entry.slotDuration,
    mode,
    typeLabel: getCounselingModeLabel(mode),
    notes: entry.notes || '',
    status: linkedSession ? linkedSession.status : 'Available',
    sessionId: linkedSession?._id || null,
    counselorId: entry.providerId
  };
}

async function sendCounselingNotification({ createdBy, recipients, title, message, link }) {
  if (!createdBy || !Array.isArray(recipients) || recipients.length === 0) return;

  await Notification.create({
    title,
    message,
    type: 'appointment',
    target: 'Specific User',
    targetUsers: recipients,
    recipients,
    link,
    createdBy,
    status: 'Sent',
    sentAt: Date.now()
  });
}

function isChatSession(session) {
  return normalizeCounselingMode(session?.type || session?.mode) === 'chat';
}

function canUseChat(session) {
  return !['Cancelled', 'Completed'].includes(session?.status);
}

async function getOrCreateCounselingConversation(session) {
  let conversation = await Conversation.findOne({
    counselingSessionId: session._id,
    isActive: true
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [session.studentId, session.counselorId],
      counselingSessionId: session._id,
      isActive: true
    });
  }

  return conversation;
}

async function populateConversation(conversationId) {
  return Conversation.findById(conversationId).populate('messages.sender', 'name profileImage role');
}

async function markConversationRead(conversation, userId) {
  let updated = false;

  conversation.messages.forEach((message) => {
    if (message.sender?.toString() !== userId?.toString() && !message.read) {
      message.read = true;
      message.readAt = new Date();
      updated = true;
    }
  });

  if (updated) {
    conversation.updatedAt = new Date();
    await conversation.save();
  }

  return updated;
}

function serializeConversationMessage(message) {
  return {
    _id: message._id,
    text: message.text,
    read: Boolean(message.read),
    readAt: message.readAt || null,
    createdAt: message.createdAt,
    sender: message.sender && typeof message.sender === 'object'
      ? {
        _id: message.sender._id,
        id: message.sender._id,
        name: message.sender.name,
        role: message.sender.role,
        profileImage: message.sender.profileImage || null
      }
      : {
        _id: message.sender,
        id: message.sender
      }
  };
}

async function findAuthorizedSession(req, populateResources = false) {
  const sessionQuery = CounselingSession.findById(req.params.id);

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

async function findCounselorSlot(slotId, counselorId) {
  return Availability.findOne({
    _id: slotId,
    providerId: counselorId,
    role: 'counselor',
    isUnavailable: false,
    status: 'Active',
    date: { $ne: null }
  });
}

async function isSlotBooked(slotId, excludeSessionId = null) {
  const query = {
    availabilityEntryId: slotId,
    status: { $in: ACTIVE_SLOT_STATUSES }
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  return Boolean(await CounselingSession.findOne(query).select('_id'));
}

function validateSlotPayload({ date, startTime, duration, mode }) {
  if (!date || !startTime) {
    return 'Date and start time are required';
  }

  if (toMinutes(startTime) === null) {
    return 'Start time must be a valid time like 10:00 AM';
  }

  const safeDuration = Number(duration) || 0;
  if (safeDuration < 15 || safeDuration > 120) {
    return 'Slot duration must be between 15 and 120 minutes';
  }

  if (!['video', 'in_person', 'chat'].includes(normalizeCounselingMode(mode))) {
    return 'Mode must be video, in_person, or chat';
  }

  return '';
}

async function clearSessionForCancellation(session, cancelledBy, cancellationReason = '') {
  session.status = 'Cancelled';
  session.cancelledAt = new Date();
  session.cancelledBy = cancelledBy;
  session.cancellationReason = cancellationReason;
  session.checkInAt = null;
  session.confidentialNotes = '';
  session.sharedSummary = '';
  session.actionPlan = '';
  session.assignedResources = [];
  session.assignedResourceMessage = '';
  session.followUpRecommended = false;
  session.followUpDate = null;
  session.feedbackSubmitted = false;
  await session.save();
}

async function getCounselorFeedbackStats(counselorId) {
  const completedSessions = await CounselingSession.find({
    counselorId,
    feedbackSubmitted: true
  })
    .select('_id')
    .lean();

  const items = completedSessions.map((session) => `counseling:${session._id}`);
  if (items.length === 0) {
    return {
      averageRating: '0.0',
      reviewCount: 0,
      recentFeedback: []
    };
  }

  const feedback = await Feedback.find({
    module: 'Counselor',
    item: { $in: items }
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('rating comment userName createdAt item')
    .lean();

  const aggregate = await Feedback.aggregate([
    {
      $match: {
        module: 'Counselor',
        item: { $in: items }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  return {
    averageRating: Number(aggregate[0]?.averageRating || 0).toFixed(1),
    reviewCount: aggregate[0]?.reviewCount || 0,
    recentFeedback: feedback
  };
}

async function getCounselorFeedbackStatsBatch(counselorIds = []) {
  const normalizedIds = counselorIds.map((id) => `${id}`).filter(Boolean);
  if (!normalizedIds.length) {
    return new Map();
  }

  const completedSessions = await CounselingSession.find({
    counselorId: { $in: normalizedIds },
    feedbackSubmitted: true
  })
    .select('_id counselorId')
    .lean();

  const sessionItems = completedSessions.map((session) => `counseling:${session._id}`);
  const sessionByItem = new Map(
    completedSessions.map((session) => [`counseling:${session._id}`, `${session.counselorId}`])
  );

  const statsByCounselor = new Map(
    normalizedIds.map((id) => [id, {
      averageRating: '0.0',
      reviewCount: 0,
      recentFeedback: []
    }])
  );

  if (!sessionItems.length) {
    return statsByCounselor;
  }

  const feedbackEntries = await Feedback.find({
    module: 'Counselor',
    item: { $in: sessionItems }
  })
    .sort({ createdAt: -1 })
    .select('rating comment userName createdAt item')
    .lean();

  const aggregates = new Map();

  feedbackEntries.forEach((entry) => {
    const counselorId = sessionByItem.get(`${entry.item}`);
    if (!counselorId) return;

    if (!aggregates.has(counselorId)) {
      aggregates.set(counselorId, {
        totalRating: 0,
        reviewCount: 0,
        recentFeedback: []
      });
    }

    const aggregate = aggregates.get(counselorId);
    aggregate.totalRating += Number(entry.rating || 0);
    aggregate.reviewCount += 1;

    if (aggregate.recentFeedback.length < 5) {
      aggregate.recentFeedback.push(entry);
    }
  });

  aggregates.forEach((aggregate, counselorId) => {
    statsByCounselor.set(counselorId, {
      averageRating: aggregate.reviewCount ? (aggregate.totalRating / aggregate.reviewCount).toFixed(1) : '0.0',
      reviewCount: aggregate.reviewCount,
      recentFeedback: aggregate.recentFeedback
    });
  });

  return statsByCounselor;
}

async function getOpenCounselorSlots(counselorId, date) {
  const query = {
    providerId: counselorId,
    role: 'counselor',
    isUnavailable: false,
    status: 'Active',
    date: { $ne: null }
  };

  if (date) {
    const { start, end } = getDateRange(date);
    query.date = { $gte: start, $lt: end };
  } else {
    query.date = { $gte: normalizeDateOnly(new Date()) };
  }

  const entries = await Availability.find(query)
    .sort({ date: 1, startTime: 1 })
    .lean();
  const futureEntries = entries.filter(isFutureSlot);

  if (futureEntries.length === 0) {
    return [];
  }

  const activeSessions = await CounselingSession.find({
    availabilityEntryId: { $in: futureEntries.map((entry) => entry._id) },
    status: { $in: ACTIVE_SLOT_STATUSES }
  })
    .select('availabilityEntryId')
    .lean();

  const bookedIds = new Set(activeSessions.map((entry) => entry.availabilityEntryId?.toString()));
  return futureEntries
    .filter((entry) => !bookedIds.has(entry._id.toString()))
    .map((entry) => formatSlot(entry));
}

async function getOpenCounselorSlotsBatch(counselorIds = [], date = null) {
  const normalizedIds = counselorIds.map((id) => `${id}`).filter(Boolean);
  const slotsByCounselor = new Map(normalizedIds.map((id) => [id, []]));

  if (!normalizedIds.length) {
    return slotsByCounselor;
  }

  const query = {
    providerId: { $in: normalizedIds },
    role: 'counselor',
    isUnavailable: false,
    status: 'Active',
    date: { $ne: null }
  };

  if (date) {
    const { start, end } = getDateRange(date);
    query.date = { $gte: start, $lt: end };
  } else {
    query.date = { $gte: normalizeDateOnly(new Date()) };
  }

  const entries = await Availability.find(query)
    .sort({ date: 1, startTime: 1 })
    .lean();

  const futureEntries = entries.filter(isFutureSlot);
  if (!futureEntries.length) {
    return slotsByCounselor;
  }

  const activeSessions = await CounselingSession.find({
    availabilityEntryId: { $in: futureEntries.map((entry) => entry._id) },
    status: { $in: ACTIVE_SLOT_STATUSES }
  })
    .select('availabilityEntryId _id status')
    .lean();

  const linkedSessionBySlotId = new Map(
    activeSessions.map((session) => [`${session.availabilityEntryId}`, session])
  );

  futureEntries.forEach((entry) => {
    if (linkedSessionBySlotId.has(`${entry._id}`)) {
      return;
    }

    const counselorId = `${entry.providerId}`;
    const slots = slotsByCounselor.get(counselorId);
    if (slots) {
      slots.push(formatSlot(entry));
    }
  });

  return slotsByCounselor;
}

const getCounselorDirectory = async (req, res) => {
  try {
    const query = {
      role: 'counselor',
      isActive: true
    };

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { specialty: { $regex: req.query.search, $options: 'i' } },
        { bio: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const counselors = await User.find(query)
      .select('name email role specialty experience bio education profileImage isVerified')
      .sort({ name: 1 })
      .lean();

    const counselorIds = counselors.map((counselor) => counselor._id);
    const [slotsByCounselor, feedbackByCounselor] = await Promise.all([
      getOpenCounselorSlotsBatch(counselorIds),
      getCounselorFeedbackStatsBatch(counselorIds)
    ]);

    const providers = counselors.map((counselor) => {
      const counselorId = `${counselor._id}`;
      const slots = slotsByCounselor.get(counselorId) || [];
      const feedback = feedbackByCounselor.get(counselorId) || {
        averageRating: '0.0',
        reviewCount: 0,
        recentFeedback: []
      };

      return {
        _id: counselor._id,
        name: counselor.name,
        email: counselor.email,
        role: counselor.role,
        specialty: counselor.specialty || 'Counselor',
        experience: counselor.experience || 0,
        bio: counselor.bio || '',
        education: counselor.education || [],
        profileImage: counselor.profileImage || null,
        isVerified: Boolean(counselor.isVerified),
        openSlotCount: slots.length,
        nextOpenSlot: slots[0] || null,
        averageRating: feedback.averageRating,
        reviewCount: feedback.reviewCount
      };
    });

    res.json({ providers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCounselorProfile = async (req, res) => {
  try {
    const counselor = await User.findById(req.params.counselorId)
      .select('name email role specialty experience bio education profileImage isVerified')
      .lean();

    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    const [slots, feedback] = await Promise.all([
      getOpenCounselorSlots(counselor._id),
      getCounselorFeedbackStats(counselor._id)
    ]);

    res.json({
      _id: counselor._id,
      name: counselor.name,
      email: counselor.email,
      role: counselor.role,
      specialty: counselor.specialty || 'Counselor',
      experience: counselor.experience || 0,
      bio: counselor.bio || '',
      education: counselor.education || [],
      profileImage: counselor.profileImage || null,
      isVerified: Boolean(counselor.isVerified),
      openSlotCount: slots.length,
      nextOpenSlot: slots[0] || null,
      averageRating: feedback.averageRating,
      reviewCount: feedback.reviewCount,
      openSlots: slots.slice(0, 8),
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCounselorSlots = async (req, res) => {
  try {
    const counselor = await User.findById(req.params.counselorId).select('role');
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    const slots = await getOpenCounselorSlots(counselor._id, req.query.date);
    res.json({ slots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCounselorFeedback = async (req, res) => {
  try {
    const counselor = await User.findById(req.params.counselorId).select('role');
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    const feedback = await getCounselorFeedbackStats(counselor._id);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCounselingSessions = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const query = createListQuery(req);
    const [sessions, total] = await Promise.all([
      CounselingSession.find(query)
        .select(SESSION_LIST_FIELDS)
        .sort({ date: 1, time: 1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      CounselingSession.countDocuments(query)
    ]);

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

const getCounselorWorkspace = async (req, res) => {
  try {
    const slotEntries = await Availability.find({
      providerId: req.user.id,
      role: 'counselor',
      isUnavailable: false,
      status: 'Active',
      date: { $ne: null }
    }).sort({ date: 1, startTime: 1 });

    const futureSlots = slotEntries.filter(isFutureSlot);
    const linkedSessions = await CounselingSession.find({
      availabilityEntryId: { $in: futureSlots.map((entry) => entry._id) },
      status: { $in: ACTIVE_SLOT_STATUSES }
    }).select('availabilityEntryId _id status');

    const sessionBySlotId = new Map(
      linkedSessions.map((session) => [session.availabilityEntryId?.toString(), session])
    );

    const openSlots = futureSlots
      .filter((entry) => !sessionBySlotId.has(entry._id.toString()))
      .map((entry) => formatSlot(entry));

    const bookedSessions = await CounselingSession.find({
      counselorId: req.user.id,
      status: { $in: WORKSPACE_SESSION_STATUSES }
    })
      .sort({ date: 1, time: 1 })
      .limit(50)
      .populate('assignedResources', 'title type category coverImage');

    res.json({
      openSlots,
      bookedSessions: bookedSessions.map((session) => serializeSession(session, 'counselor'))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

const getCounselingSessionChat = async (req, res) => {
  try {
    const result = await findAuthorizedSession(req);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    if (!isChatSession(session)) {
      return res.status(409).json({ message: 'Live chat is available only for chat counseling sessions' });
    }

    const conversation = await getOrCreateCounselingConversation(session);
    const populatedConversation = await populateConversation(conversation._id);

    const updated = await markConversationRead(populatedConversation, req.user.id);
    const refreshedConversation = await populateConversation(conversation._id);

    if (updated) {
      emitToConversation(conversation._id.toString(), 'messages-read', {
        conversationId: conversation._id.toString(),
        readBy: req.user.id.toString()
      });
    }

    res.json({
      conversationId: refreshedConversation._id,
      sessionId: session._id,
      canSend: canUseChat(session),
      messages: refreshedConversation.messages.map(serializeConversationMessage)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendCounselingSessionChatMessage = async (req, res) => {
  try {
    const result = await findAuthorizedSession(req);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    if (!isChatSession(session)) {
      return res.status(409).json({ message: 'Live chat is available only for chat counseling sessions' });
    }
    if (!canUseChat(session)) {
      return res.status(409).json({ message: `This chat session is no longer active because it is ${session.status.toLowerCase()}` });
    }

    const text = `${req.body?.text || ''}`.trim();
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'Messages cannot exceed 2000 characters' });
    }

    const conversation = await getOrCreateCounselingConversation(session);
    const message = {
      sender: req.user._id,
      text,
      createdAt: new Date(),
      read: false,
      readAt: null
    };

    conversation.messages.push(message);
    conversation.lastMessage = {
      text,
      sender: req.user._id,
      createdAt: message.createdAt
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    const refreshedConversation = await populateConversation(conversation._id);
    const savedMessage = refreshedConversation.messages[refreshedConversation.messages.length - 1];
    const serializedMessage = serializeConversationMessage(savedMessage);

    emitToConversation(conversation._id.toString(), 'new-message', {
      conversationId: conversation._id.toString(),
      message: serializedMessage
    });

    refreshedConversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user.id.toString()) {
        emitToUser(participantId.toString(), 'unread-message', {
          conversationId: conversation._id.toString(),
          from: req.user.name,
          sessionId: session._id.toString()
        });
      }
    });

    res.status(201).json({
      conversationId: conversation._id,
      message: serializedMessage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markCounselingSessionChatRead = async (req, res) => {
  try {
    const result = await findAuthorizedSession(req);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    if (!isChatSession(session)) {
      return res.status(409).json({ message: 'Live chat is available only for chat counseling sessions' });
    }

    const conversation = await getOrCreateCounselingConversation(session);
    const populatedConversation = await populateConversation(conversation._id);
    const updated = await markConversationRead(populatedConversation, req.user.id);
    const refreshedConversation = await populateConversation(conversation._id);

    if (updated) {
      emitToConversation(conversation._id.toString(), 'messages-read', {
        conversationId: conversation._id.toString(),
        readBy: req.user.id.toString()
      });
    }

    res.json({
      conversationId: conversation._id,
      unreadCount: refreshedConversation.messages.filter((message) => (
        message.sender?._id?.toString() !== req.user.id.toString() && !message.read
      )).length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCounselorSlot = async (req, res) => {
  try {
    const { date, startTime, duration, mode, notes } = req.body;
    const normalizedDate = date ? normalizeDateOnly(date) : null;
    const safeDuration = Number(duration) || 50;

    const validationMessage = validateSlotPayload({
      date: normalizedDate,
      startTime,
      duration: safeDuration,
      mode
    });
    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    if (isDateTimeInPast(normalizedDate, startTime)) {
      return res.status(409).json({ message: 'Counselor slots must be created in the future' });
    }

    const endTime = getSlotEndTime(startTime, safeDuration);
    if (!endTime) {
      return res.status(400).json({ message: 'Unable to compute the slot end time' });
    }

    const existingEntry = await Availability.findOne({
      providerId: req.user.id,
      role: 'counselor',
      date: normalizedDate,
      startTime,
      status: 'Active',
      isUnavailable: false
    });

    if (existingEntry) {
      return res.status(409).json({ message: 'A slot already exists for that time' });
    }

    const entry = await Availability.create({
      providerId: req.user.id,
      role: 'counselor',
      title: 'Counseling Slot',
      date: normalizedDate,
      recurringDays: [],
      startTime,
      endTime,
      slotDuration: safeDuration,
      consultationTypes: [getCounselingModeLabel(mode)],
      breaks: [],
      isUnavailable: false,
      notes: `${notes || ''}`.trim(),
      status: 'Active'
    });

    res.status(201).json(formatSlot(entry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCounselorSlot = async (req, res) => {
  try {
    const entry = await findCounselorSlot(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (await isSlotBooked(entry._id)) {
      return res.status(409).json({ message: 'Booked slots cannot be edited' });
    }

    const normalizedDate = req.body.date ? normalizeDateOnly(req.body.date) : entry.date;
    const startTime = req.body.startTime || entry.startTime;
    const duration = req.body.duration ? Number(req.body.duration) : entry.slotDuration;
    const mode = req.body.mode || entry.consultationTypes?.[0];

    const validationMessage = validateSlotPayload({
      date: normalizedDate,
      startTime,
      duration,
      mode
    });
    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    if (isDateTimeInPast(normalizedDate, startTime)) {
      return res.status(409).json({ message: 'Counselor slots must stay in the future' });
    }

    const endTime = getSlotEndTime(startTime, duration);
    if (!endTime) {
      return res.status(400).json({ message: 'Unable to compute the slot end time' });
    }

    const duplicateEntry = await Availability.findOne({
      _id: { $ne: entry._id },
      providerId: req.user.id,
      role: 'counselor',
      date: normalizedDate,
      startTime,
      status: 'Active',
      isUnavailable: false
    });

    if (duplicateEntry) {
      return res.status(409).json({ message: 'Another slot already exists for that time' });
    }

    entry.date = normalizedDate;
    entry.startTime = startTime;
    entry.slotDuration = duration;
    entry.endTime = endTime;
    entry.consultationTypes = [getCounselingModeLabel(mode)];
    entry.notes = req.body.notes ?? entry.notes;
    await entry.save();

    res.json(formatSlot(entry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCounselorSlot = async (req, res) => {
  try {
    const entry = await findCounselorSlot(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (await isSlotBooked(entry._id)) {
      return res.status(409).json({ message: 'Booked slots cannot be removed' });
    }

    await entry.deleteOne();
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCounselingSession = async (req, res) => {
  try {
    const { availabilityEntryId, reason, urgency } = req.body;

    if (!availabilityEntryId || !`${reason || ''}`.trim()) {
      return res.status(400).json({ message: 'Open slot and reason are required' });
    }

    const slot = await Availability.findOne({
      _id: availabilityEntryId,
      role: 'counselor',
      status: 'Active',
      isUnavailable: false
    });

    if (!slot || !slot.date) {
      return res.status(404).json({ message: 'Open slot not found' });
    }

    if (!isFutureSlot(slot)) {
      return res.status(409).json({ message: 'Past slots cannot be booked' });
    }

    if (await isSlotBooked(slot._id)) {
      return res.status(409).json({ message: 'This slot has already been booked' });
    }

    const counselor = await User.findById(slot.providerId).select('name specialty profileImage role');
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    const student = await User.findById(req.user.id).select('name');
    const session = await CounselingSession.create({
      availabilityEntryId: slot._id,
      studentId: req.user.id,
      counselorId: counselor._id,
      studentName: student?.name || req.user.name,
      counselorName: counselor.name,
      counselorSpecialty: counselor.specialty || 'Counselor',
      counselorImage: counselor.profileImage || null,
      date: slot.date,
      time: slot.startTime,
      duration: slot.slotDuration,
      type: slot.consultationTypes?.[0] || 'Video Call',
      urgency: urgency || 'Medium',
      reason: `${reason}`.trim(),
      location: normalizeCounselingMode(slot.consultationTypes?.[0]) === 'in_person' ? 'Campus Wellness Center' : null,
      status: 'Confirmed'
    });

    await sendCounselingNotification({
      createdBy: req.user.id,
      recipients: [counselor._id],
      title: 'New counseling booking',
      message: `${student?.name || req.user.name} booked ${session.time} on ${new Date(session.date).toLocaleDateString()}.`,
      link: `/counselor/sessions/${session._id}`
    });

    await sendCounselingNotification({
      createdBy: req.user.id,
      recipients: [req.user.id],
      title: 'Counseling session booked',
      message: `Your session with ${counselor.name} is booked for ${new Date(session.date).toLocaleDateString()} at ${session.time}.`,
      link: `/mental-health/sessions/${session._id}`
    });

    res.status(201).json(serializeSession(session, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rescheduleCounselingSession = async (req, res) => {
  try {
    const result = await findAuthorizedSession(req);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    if (!MANAGEABLE_SESSION_STATUSES.includes(session.status)) {
      return res.status(409).json({ message: 'This session can no longer be rescheduled' });
    }

    const { availabilityEntryId } = req.body;
    if (!availabilityEntryId) {
      return res.status(400).json({ message: 'A replacement open slot is required' });
    }

    const nextSlot = await Availability.findOne({
      _id: availabilityEntryId,
      providerId: session.counselorId,
      role: 'counselor',
      status: 'Active',
      isUnavailable: false
    });

    if (!nextSlot || !nextSlot.date) {
      return res.status(404).json({ message: 'Replacement slot not found' });
    }

    if (!isFutureSlot(nextSlot)) {
      return res.status(409).json({ message: 'Replacement slot must be in the future' });
    }

    if (await isSlotBooked(nextSlot._id, session._id)) {
      return res.status(409).json({ message: 'Replacement slot is already booked' });
    }

    session.availabilityEntryId = nextSlot._id;
    session.date = nextSlot.date;
    session.time = nextSlot.startTime;
    session.duration = nextSlot.slotDuration;
    session.type = nextSlot.consultationTypes?.[0] || session.type;
    session.location = normalizeCounselingMode(session.type) === 'in_person' ? 'Campus Wellness Center' : null;
    session.status = 'Confirmed';
    session.checkInAt = null;
    await session.save();

    await sendCounselingNotification({
      createdBy: req.user.id,
      recipients: [session.studentId, session.counselorId],
      title: 'Counseling session updated',
      message: `Session moved to ${new Date(session.date).toLocaleDateString()} at ${session.time}.`,
      link: req.user.role === 'counselor' ? `/counselor/sessions/${session._id}` : `/mental-health/sessions/${session._id}`
    });

    res.json(serializeSession(session, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCounselingSession = async (req, res) => {
  try {
    const result = await findAuthorizedSession(req);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    if (!MANAGEABLE_SESSION_STATUSES.includes(session.status)) {
      return res.status(409).json({ message: 'This session can no longer be deleted' });
    }

    await clearSessionForCancellation(session, req.user.role, req.body?.cancellationReason || 'Booking removed');

    await sendCounselingNotification({
      createdBy: req.user.id,
      recipients: [session.studentId, session.counselorId],
      title: 'Counseling booking cancelled',
      message: `The session on ${new Date(session.date).toLocaleDateString()} at ${session.time} has been cancelled and the slot is open again.`,
      link: req.user.role === 'counselor' ? '/counselor/sessions' : '/mental-health/sessions'
    });

    res.json({
      message: 'Booking cancelled and slot reopened',
      session: serializeSession(session, req.user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
        return res.status(409).json({ message: 'Sessions can only be checked in on the scheduled date' });
      }
    }

    if (req.user.role === 'counselor' && status === 'Completed') {
      const confidentialNotesLength = `${session.confidentialNotes || ''}`.trim().length;
      const sharedSummaryLength = `${session.sharedSummary || ''}`.trim().length;
      const actionPlanLength = `${session.actionPlan || ''}`.trim().length;
      const assignedResourceMessageLength = `${session.assignedResourceMessage || ''}`.trim().length;

      if (!sharedSummaryLength) {
        return res.status(400).json({ message: 'Save the student-visible summary before marking the session completed' });
      }

      if (sharedSummaryLength < 20) {
        return res.status(400).json({ message: 'Student-visible summary must be at least 20 characters before completion' });
      }

      if (confidentialNotesLength > 0 && confidentialNotesLength < 10) {
        return res.status(400).json({ message: 'Private notes must be at least 10 characters when provided' });
      }

      if (actionPlanLength > 0 && actionPlanLength < 10) {
        return res.status(400).json({ message: 'Action plan must be at least 10 characters when provided' });
      }

      if (assignedResourceMessageLength > 0 && assignedResourceMessageLength < 8) {
        return res.status(400).json({ message: 'Assigned resource note must be at least 8 characters when provided' });
      }

      if (session.followUpRecommended) {
        if (!session.followUpDate) {
          return res.status(400).json({ message: 'Choose a follow-up date before marking the session completed' });
        }

        const normalizedFollowUpDate = normalizeDateOnly(session.followUpDate);
        const normalizedToday = normalizeDateOnly(new Date());
        const normalizedSessionDate = normalizeDateOnly(session.date);
        const minimumFollowUpDate = normalizedSessionDate > normalizedToday ? normalizedSessionDate : normalizedToday;

        if (normalizedFollowUpDate < minimumFollowUpDate) {
          return res.status(400).json({
            message: `Follow-up date must be on or after ${minimumFollowUpDate.toISOString().slice(0, 10)} before completion`
          });
        }
      }
    }

    if (status === 'Cancelled') {
      await clearSessionForCancellation(session, req.user.role, cancellationReason || 'Session cancelled');
    } else {
      session.status = status;
      if (status === 'Ready') {
        session.checkInAt = new Date();
      }
      await session.save();
    }

    const serializedSession = serializeSession(session, req.user.role);
    res.json(serializedSession);

    void sendCounselingNotification({
      createdBy: req.user.id,
      recipients: [session.studentId, session.counselorId],
      title: 'Counseling session updated',
      message: `Session status is now ${status}.`,
      link: req.user.role === 'counselor' ? `/counselor/sessions/${session._id}` : `/mental-health/sessions/${session._id}`
    }).catch(() => {
      // Keep status updates fast even if notification delivery fails.
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

    if (`${confidentialNotes || ''}`.trim().length > 2500) {
      return res.status(400).json({ message: 'Private notes cannot exceed 2500 characters' });
    }

    const confidentialNotesLength = `${confidentialNotes || ''}`.trim().length;
    const sharedSummaryLength = `${sharedSummary || ''}`.trim().length;
    const actionPlanLength = `${actionPlan || ''}`.trim().length;
    const assignedResourceMessageLength = `${assignedResourceMessage || ''}`.trim().length;

    if (confidentialNotesLength > 0 && confidentialNotesLength < 10) {
      return res.status(400).json({ message: 'Private notes must be at least 10 characters when provided' });
    }

    if (sharedSummaryLength > 1200) {
      return res.status(400).json({ message: 'Student-visible summary cannot exceed 1200 characters' });
    }

    if (sharedSummaryLength < 20) {
      return res.status(400).json({ message: 'Student-visible summary must be at least 20 characters' });
    }

    if (actionPlanLength > 0 && actionPlanLength < 10) {
      return res.status(400).json({ message: 'Action plan must be at least 10 characters when provided' });
    }

    if (actionPlanLength > 1200) {
      return res.status(400).json({ message: 'Action plan cannot exceed 1200 characters' });
    }

    if (assignedResourceMessageLength > 0 && assignedResourceMessageLength < 8) {
      return res.status(400).json({ message: 'Assigned resource note must be at least 8 characters when provided' });
    }

    if (assignedResourceMessageLength > 500) {
      return res.status(400).json({ message: 'Assigned resource note cannot exceed 500 characters' });
    }

    if (!sharedSummaryLength) {
      return res.status(400).json({ message: 'Student-visible summary is required' });
    }

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
      if (followUpRecommended && !followUpDate) {
        return res.status(400).json({ message: 'Follow-up date is required when recommending a follow-up session' });
      }

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

const getCounselorNotes = async (req, res) => {
  try {
    const sessions = await CounselingSession.find({
      counselorId: req.user.id,
      $or: [
        { confidentialNotes: { $nin: ['', null] } },
        { sharedSummary: { $nin: ['', null] } }
      ]
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('assignedResources', 'title type category');

    res.json({
      notes: sessions.map((session) => ({
        sessionId: session._id,
        studentName: session.studentName,
        date: session.date,
        time: session.time,
        status: session.status,
        confidentialNotes: session.confidentialNotes,
        sharedSummary: session.sharedSummary,
        actionPlan: session.actionPlan,
        followUpRecommended: session.followUpRecommended,
        followUpDate: session.followUpDate,
        assignedResources: session.assignedResources
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitCounselingFeedback = async (req, res) => {
  try {
    const result = await findAuthorizedSession(req);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const session = result.session;
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit counseling feedback' });
    }

    if (session.status !== 'Completed') {
      return res.status(409).json({ message: 'Feedback is available only after the session is completed' });
    }

    if (session.feedbackSubmitted) {
      return res.status(409).json({ message: 'Feedback has already been submitted for this session' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5 || !`${comment || ''}`.trim()) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const item = `counseling:${session._id}`;
    const duplicate = await Feedback.findOne({
      module: 'Counselor',
      item,
      userId: req.user.id
    });

    if (duplicate) {
      return res.status(409).json({ message: 'Feedback has already been submitted for this session' });
    }

    const feedback = await Feedback.create({
      userId: req.user.id,
      userName: req.user.name,
      module: 'Counselor',
      item,
      rating,
      comment: `${comment}`.trim(),
      isAnonymous: Boolean(req.body.isAnonymous)
    });

    session.feedbackSubmitted = true;
    await session.save();

    res.status(201).json({
      feedbackSubmitted: true,
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  createCounselingSession,
  createCounselorSlot,
  deleteCounselingSession,
  deleteCounselorSlot,
  getCounselingSessionById,
  getCounselingSessionChat,
  getCounselingSessions,
  getCounselorDirectory,
  getCounselorFeedback,
  getCounselorNotes,
  getCounselorProfile,
  getCounselorSlots,
  getCounselorWorkspace,
  markCounselingSessionChatRead,
  rescheduleCounselingSession,
  sendCounselingSessionChatMessage,
  submitCounselingFeedback,
  updateCounselingSessionNotes,
  updateCounselingSessionStatus,
  updateCounselorSlot
};
