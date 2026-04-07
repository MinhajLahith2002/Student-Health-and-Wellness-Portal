// controllers/mentalHealthController.js

import MoodLog from '../models/MoodLog.js';
import Resource from '../models/Resource.js';
import ForumProfile from '../models/ForumProfile.js';
import ForumThread from '../models/ForumThread.js';
import ForumReport from '../models/ForumReport.js';

const SUPPORT_TYPES = ['General Support', 'Anxiety', 'Burnout', 'Sleep', 'Motivation'];
const FORUM_ALIAS_ADJECTIVES = ['Quiet', 'Kind', 'Brave', 'Calm', 'Soft', 'Bright', 'Gentle', 'Steady', 'Silver', 'Sunny'];
const FORUM_ALIAS_NOUNS = ['Comet', 'River', 'Notebook', 'Lantern', 'Feather', 'Echo', 'Harbor', 'Sky', 'Willow', 'Star'];
const MIN_THREAD_TITLE = 3;
const MIN_THREAD_BODY = 10;
const MIN_REPLY_BODY = 2;
const THREAD_DUPLICATE_WINDOW_MS = 15 * 60 * 1000;
const REPLY_DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_MOOD_LOG_LIMIT = 50;
const MOOD_LOG_SELECT = '_id mood moodScore notes factors date createdAt';
const MAX_RESOURCE_LIMIT = 24;
const FORUM_THREAD_SELECT = '_id userId authorAlias title body supportType replies._id replies.userId replies.authorAlias replies.body replies.createdAt replies.updatedAt createdAt updatedAt lastActivityAt';
const RESOURCE_LIST_SELECT = '_id title description type category subCategory content coverImage videoUrl duration author readTime tags views likes createdAt';
let forumSeedReady = false;
let forumSeedPromise = null;

const sampleForumThreads = [
  {
    authorAlias: 'QuietComet',
    title: 'How do you handle burnout during exam week?',
    body: 'I feel like I am always behind whenever deadlines stack up. What actually helps you reset without losing momentum?',
    supportType: 'Burnout',
    isSeeded: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90),
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 40),
    replies: [
      {
        authorAlias: 'KindRiver',
        body: 'I break the day into two must-do tasks and one rest block. It helps me feel less trapped.',
        createdAt: new Date(Date.now() - 1000 * 60 * 70),
        updatedAt: new Date(Date.now() - 1000 * 60 * 70)
      },
      {
        authorAlias: 'NorthStar',
        body: 'A 10 minute walk between study sessions helps me stop spiraling when I am exhausted.',
        createdAt: new Date(Date.now() - 1000 * 60 * 40),
        updatedAt: new Date(Date.now() - 1000 * 60 * 40)
      }
    ]
  },
  {
    authorAlias: 'BlueNotebook',
    title: 'Looking for small routines that reduce anxiety',
    body: 'I have tried journaling on and off. Curious what tiny habits make the biggest difference for you.',
    supportType: 'Anxiety',
    isSeeded: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 240),
    updatedAt: new Date(Date.now() - 1000 * 60 * 240),
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 150),
    replies: [
      {
        authorAlias: 'SoftEcho',
        body: 'I keep a super short grounding list on my phone: water, breathing, one message to a friend, then one small task.',
        createdAt: new Date(Date.now() - 1000 * 60 * 150),
        updatedAt: new Date(Date.now() - 1000 * 60 * 150)
      }
    ]
  },
  {
    authorAlias: 'SunnyInk',
    title: 'Anyone have calm bedtime routines that actually work?',
    body: 'My sleep has been inconsistent lately and my brain feels loud at night. I would love simple ideas that help you wind down.',
    supportType: 'Sleep',
    isSeeded: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 360),
    updatedAt: new Date(Date.now() - 1000 * 60 * 360),
    lastActivityAt: new Date(Date.now() - 1000 * 60 * 300),
    replies: [
      {
        authorAlias: 'SlowRiver',
        body: 'Dim lights, no laptop in bed, and a short breathing video has helped me a lot more than trying to force sleep.',
        createdAt: new Date(Date.now() - 1000 * 60 * 300),
        updatedAt: new Date(Date.now() - 1000 * 60 * 300)
      }
    ]
  }
];

function normalizeForumAlias(alias) {
  return `${alias || ''}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

function buildRandomForumAlias() {
  const adjective = FORUM_ALIAS_ADJECTIVES[Math.floor(Math.random() * FORUM_ALIAS_ADJECTIVES.length)];
  const noun = FORUM_ALIAS_NOUNS[Math.floor(Math.random() * FORUM_ALIAS_NOUNS.length)];
  return `${adjective}${noun}`;
}

async function getOrCreateForumProfile(userId) {
  let profile = await ForumProfile.findOne({ userId });
  if (profile) return profile;

  profile = await ForumProfile.create({
    userId,
    alias: buildRandomForumAlias()
  });

  return profile;
}

async function ensureSeedForumThreads() {
  if (forumSeedReady) return;
  if (forumSeedPromise) {
    await forumSeedPromise;
    return;
  }

  forumSeedPromise = (async () => {
    const existingCount = await ForumThread.estimatedDocumentCount();
    if (existingCount === 0) {
      await ForumThread.insertMany(sampleForumThreads);
    }

    forumSeedReady = true;
  })();

  try {
    await forumSeedPromise;
  } finally {
    if (forumSeedReady) {
      forumSeedPromise = null;
    }
  }
}

function serializeForumReply(reply, currentUserId) {
  return {
    id: `${reply._id}`,
    author: reply.authorAlias,
    body: reply.body,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt && `${reply.updatedAt}` !== `${reply.createdAt}` ? reply.updatedAt : null,
    isOwned: Boolean(currentUserId) && `${reply.userId || ''}` === `${currentUserId}`
  };
}

function serializeForumThread(thread, currentUserId) {
  return {
    id: `${thread._id}`,
    author: thread.authorAlias,
    title: thread.title,
    body: thread.body,
    supportType: thread.supportType,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt && `${thread.updatedAt}` !== `${thread.createdAt}` ? thread.updatedAt : null,
    isOwned: Boolean(currentUserId) && `${thread.userId || ''}` === `${currentUserId}`,
    replies: (thread.replies || []).map((reply) => serializeForumReply(reply, currentUserId))
  };
}

function normalizeMoodLog(log) {
  if (!log) return null;

  return {
    _id: `${log._id}`,
    mood: log.mood,
    moodScore: log.moodScore,
    notes: log.notes || '',
    factors: Array.isArray(log.factors) ? log.factors : [],
    date: log.date,
    createdAt: log.createdAt
  };
}

function parseMoodLimit(limit, fallback = 30) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_MOOD_LOG_LIMIT);
}

function parseResourceLimit(limit, fallback = 10) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_RESOURCE_LIMIT);
}

async function buildForumBootstrapPayload(user) {
  await ensureSeedForumThreads();

  const [profile, threads, reportCount] = await Promise.all([
    getOrCreateForumProfile(user.id),
    ForumThread.find({})
      .select(FORUM_THREAD_SELECT)
      .sort({ lastActivityAt: -1, createdAt: -1 })
      .limit(50)
      .lean(),
    ForumReport.countDocuments({ reportedBy: user.id })
  ]);

  return {
    alias: profile.alias,
    threads: threads.map((thread) => serializeForumThread(thread, user.id)),
    reportCount
  };
}

// @desc    Get forum bootstrap payload
// @route   GET /api/mental-health/forum/bootstrap
// @access  Private (Student)
const getForumBootstrap = async (req, res) => {
  try {
    const payload = await buildForumBootstrapPayload(req.user);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update forum alias
// @route   PUT /api/mental-health/forum/alias
// @access  Private (Student)
const updateForumAlias = async (req, res) => {
  try {
    const normalized = normalizeForumAlias(req.body?.alias);
    const profile = await getOrCreateForumProfile(req.user.id);

    profile.alias = normalized || buildRandomForumAlias();
    await profile.save();

    res.json({ alias: profile.alias });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh forum alias
// @route   POST /api/mental-health/forum/alias/refresh
// @access  Private (Student)
const refreshForumAlias = async (req, res) => {
  try {
    const profile = await getOrCreateForumProfile(req.user.id);
    profile.alias = buildRandomForumAlias();
    await profile.save();
    res.json({ alias: profile.alias });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create forum thread
// @route   POST /api/mental-health/forum/threads
// @access  Private (Student)
const createForumThread = async (req, res) => {
  try {
    const title = `${req.body?.title || ''}`.trim();
    const body = `${req.body?.body || ''}`.trim();
    const supportType = SUPPORT_TYPES.includes(req.body?.supportType) ? req.body.supportType : 'General Support';

    if (title.length < MIN_THREAD_TITLE || body.length < MIN_THREAD_BODY) {
      return res.status(400).json({
        message: `Please use at least ${MIN_THREAD_TITLE} characters for the title and ${MIN_THREAD_BODY} characters for the message.`
      });
    }

    const duplicateWindowStart = new Date(Date.now() - THREAD_DUPLICATE_WINDOW_MS);
    const [profile, duplicateThread] = await Promise.all([
      getOrCreateForumProfile(req.user.id),
      ForumThread.findOne({
        userId: req.user.id,
        title,
        body,
        supportType,
        createdAt: { $gte: duplicateWindowStart }
      }).select('_id')
    ]);

    if (duplicateThread) {
      return res.status(409).json({
        message: 'This thread already looks posted recently. Please edit your existing post instead of sending the same message again.'
      });
    }

    const thread = await ForumThread.create({
      userId: req.user.id,
      authorAlias: profile.alias,
      title,
      body,
      supportType,
      lastActivityAt: new Date()
    });

    res.status(201).json(serializeForumThread(thread, req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update forum thread
// @route   PUT /api/mental-health/forum/threads/:id
// @access  Private (Student)
const updateForumThread = async (req, res) => {
  try {
    const thread = await ForumThread.findOne({ _id: req.params.id, userId: req.user.id });
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const title = `${req.body?.title || ''}`.trim();
    const body = `${req.body?.body || ''}`.trim();
    const supportType = SUPPORT_TYPES.includes(req.body?.supportType) ? req.body.supportType : thread.supportType;

    if (title.length < MIN_THREAD_TITLE || body.length < MIN_THREAD_BODY) {
      return res.status(400).json({
        message: `Edited threads still need at least ${MIN_THREAD_TITLE} characters for the title and ${MIN_THREAD_BODY} characters for the message.`
      });
    }

    thread.title = title;
    thread.body = body;
    thread.supportType = supportType;
    thread.lastActivityAt = new Date();
    await thread.save();

    res.json(serializeForumThread(thread, req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete forum thread
// @route   DELETE /api/mental-health/forum/threads/:id
// @access  Private (Student)
const deleteForumThread = async (req, res) => {
  try {
    const thread = await ForumThread.findOne({ _id: req.params.id, userId: req.user.id });
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    await ForumReport.deleteMany({
      $or: [
        { parentThreadId: thread._id },
        { targetType: 'thread', targetId: `${thread._id}` }
      ]
    });
    await thread.deleteOne();

    res.json({ message: 'Thread removed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create forum reply
// @route   POST /api/mental-health/forum/threads/:id/replies
// @access  Private (Student)
const createForumReply = async (req, res) => {
  try {
    const body = `${req.body?.body || ''}`.trim();
    if (body.length < MIN_REPLY_BODY) {
      return res.status(400).json({ message: `Replies should include at least ${MIN_REPLY_BODY} characters.` });
    }

    const [profile, thread] = await Promise.all([
      getOrCreateForumProfile(req.user.id),
      ForumThread.findById(req.params.id)
    ]);

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const duplicateWindowStart = Date.now() - REPLY_DUPLICATE_WINDOW_MS;
    const hasRecentDuplicateReply = (thread.replies || []).some((reply) => (
      `${reply.userId || ''}` === `${req.user.id}`
      && `${reply.body || ''}`.trim() === body
      && new Date(reply.createdAt).getTime() >= duplicateWindowStart
    ));

    if (hasRecentDuplicateReply) {
      return res.status(409).json({
        message: 'This reply already looks posted recently. Please avoid sending the same response again.'
      });
    }

    thread.replies.push({
      userId: req.user.id,
      authorAlias: profile.alias,
      body
    });
    thread.lastActivityAt = new Date();
    await thread.save();

    const reply = thread.replies[thread.replies.length - 1];
    res.status(201).json(serializeForumReply(reply, req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update forum reply
// @route   PUT /api/mental-health/forum/threads/:threadId/replies/:replyId
// @access  Private (Student)
const updateForumReply = async (req, res) => {
  try {
    const body = `${req.body?.body || ''}`.trim();
    if (body.length < MIN_REPLY_BODY) {
      return res.status(400).json({ message: `Edited replies should still contain at least ${MIN_REPLY_BODY} characters.` });
    }

    const thread = await ForumThread.findOne({
      _id: req.params.threadId,
      'replies._id': req.params.replyId,
      'replies.userId': req.user.id
    });

    if (!thread) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const reply = thread.replies.id(req.params.replyId);
    reply.body = body;
    thread.lastActivityAt = new Date();
    await thread.save();

    res.json(serializeForumReply(reply, req.user.id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete forum reply
// @route   DELETE /api/mental-health/forum/threads/:threadId/replies/:replyId
// @access  Private (Student)
const deleteForumReply = async (req, res) => {
  try {
    const thread = await ForumThread.findOne({
      _id: req.params.threadId,
      'replies._id': req.params.replyId,
      'replies.userId': req.user.id
    });

    if (!thread) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    thread.replies.pull({ _id: req.params.replyId });
    thread.lastActivityAt = new Date();
    await thread.save();

    await ForumReport.deleteMany({
      targetType: 'reply',
      targetId: `${req.params.replyId}`,
      parentThreadId: thread._id
    });

    res.json({ message: 'Reply removed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report forum content
// @route   POST /api/mental-health/forum/reports
// @access  Private (Student)
const reportForumContent = async (req, res) => {
  try {
    const targetType = req.body?.targetType === 'reply' ? 'reply' : 'thread';
    const targetId = `${req.body?.targetId || ''}`.trim();
    const reason = `${req.body?.reason || 'Student requested moderator review'}`.trim();
    const parentThreadId = targetType === 'reply'
      ? `${req.body?.parentThreadId || ''}`.trim()
      : targetId;

    if (!targetId || !parentThreadId) {
      return res.status(400).json({ message: 'A valid report target is required.' });
    }

    const thread = await ForumThread.findById(parentThreadId);
    if (!thread) {
      return res.status(404).json({ message: 'Report target not found.' });
    }

    if (targetType === 'reply' && !thread.replies.id(targetId)) {
      return res.status(404).json({ message: 'Report target not found.' });
    }

    const existing = await ForumReport.findOne({
      reportedBy: req.user.id,
      targetType,
      targetId
    });

    if (!existing) {
      await ForumReport.create({
        reportedBy: req.user.id,
        targetType,
        targetId,
        parentThreadId: thread._id,
        reason
      });

      thread.reportCount = Number(thread.reportCount || 0) + 1;
      await thread.save();
    }

    const reportCount = await ForumReport.countDocuments({ reportedBy: req.user.id });
    res.status(existing ? 200 : 201).json({
      message: 'The content was reported for moderator review.',
      reportCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      .select(MOOD_LOG_SELECT)
      .sort({ date: -1 })
      .limit(parseMoodLimit(limit))
      .lean();

    res.json(moods.map(normalizeMoodLog));
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
    })
      .select(MOOD_LOG_SELECT)
      .sort({ date: 1 })
      .lean();

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
      logs: moodLogs.map(normalizeMoodLog)
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
      .select(RESOURCE_LIST_SELECT)
      .sort({ views: -1, createdAt: -1 })
      .limit(parseResourceLimit(limit))
      .lean();

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getForumBootstrap,
  updateForumAlias,
  refreshForumAlias,
  createForumThread,
  updateForumThread,
  deleteForumThread,
  createForumReply,
  updateForumReply,
  deleteForumReply,
  reportForumContent,
  getMoodLogs,
  createMoodLog,
  updateMoodLog,
  deleteMoodLog,
  getMoodStats,
  getMentalHealthResources
};
