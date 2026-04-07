// controllers/resourceController.js

import Resource from '../models/Resource.js';
import MoodLog from '../models/MoodLog.js';
import AuditLog from '../models/AuditLog.js';
import { cloudinary } from '../utils/cloudinaryService.js';

const RECOMMENDATION_LIMITS = {
  sameType: 4,
  moodBased: 6
};
const RESOURCE_QUERY_LIMITS = {
  publicList: 24,
  managedList: 80,
  recommendationCandidates: 24,
  moodLogs: 30
};
const RESOURCE_LIST_SELECT = '_id title description type category subCategory duration author readTime tags views likes createdAt updatedAt videoUrl';
const RESOURCE_DETAIL_SELECT = '_id title description type category subCategory content coverImage videoUrl duration author readTime tags status views likes publishedAt createdBy createdAt updatedAt';
const RESOURCE_RECOMMENDATION_SELECT = '_id title description type category subCategory content duration author readTime tags views likes createdAt updatedAt videoUrl';

function parseResourceLimit(limit, fallback, max) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

const MOOD_RESOURCE_KEYWORDS = {
  Anxious: ['anxiety', 'grounding', 'stress', 'panic', 'calm', 'breathing'],
  Stressed: ['stress', 'grounding', 'burnout', 'panic', 'focus', 'reset'],
  Down: ['emotional recovery', 'motivation', 'gentle reset', 'peer support', 'support'],
  Sad: ['emotional recovery', 'motivation', 'gentle reset', 'peer support', 'support'],
  Tired: ['sleep', 'recovery', 'low-energy', 'rest', 'study break'],
  Okay: ['focus', 'habit', 'resilience', 'wellness', 'routine'],
  Great: ['focus', 'habit', 'resilience', 'wellness', 'routine'],
  Happy: ['focus', 'habit', 'resilience', 'wellness', 'routine'],
  Energetic: ['focus', 'habit', 'resilience', 'wellness', 'routine']
};

const FACTOR_RESOURCE_KEYWORDS = {
  Sleep: ['sleep', 'recovery', 'night routine', 'body scan'],
  Exams: ['stress', 'focus', 'burnout', 'study', 'exam'],
  Work: ['stress', 'focus', 'burnout', 'study', 'reset'],
  Relationships: ['peer support', 'boundaries', 'emotional recovery', 'conversation'],
  Social: ['peer support', 'boundaries', 'emotional recovery', 'friendship'],
  Health: ['recovery', 'gentle', 'self-care', 'wellness'],
  Exercise: ['routine', 'wellness', 'stretch', 'movement'],
  Diet: ['routine', 'wellness', 'energy', 'recovery']
};

function isResourceOwner(resource, user) {
  return `${resource?.createdBy?._id || resource?.createdBy || ''}` === `${user?.id || user?._id || ''}`;
}

function canManageResource(resource, user) {
  return user?.role === 'admin' || (user?.role === 'counselor' && isResourceOwner(resource, user));
}

function getResourceTimestamp(resource) {
  const value = resource?.createdAt ? new Date(resource.createdAt).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function getTagOverlapScore(resource, currentResource) {
  const currentTags = new Set((currentResource?.tags || []).map((tag) => `${tag}`.trim().toLowerCase()).filter(Boolean));
  if (!currentTags.size) return 0;

  return (resource?.tags || []).reduce((score, tag) => (
    currentTags.has(`${tag}`.trim().toLowerCase()) ? score + 1 : score
  ), 0);
}

function compareSameTypeResources(left, right, currentResource) {
  const leftSameSubCategory = left?.subCategory === currentResource?.subCategory ? 1 : 0;
  const rightSameSubCategory = right?.subCategory === currentResource?.subCategory ? 1 : 0;
  if (leftSameSubCategory !== rightSameSubCategory) return rightSameSubCategory - leftSameSubCategory;

  const leftTagOverlap = getTagOverlapScore(left, currentResource);
  const rightTagOverlap = getTagOverlapScore(right, currentResource);
  if (leftTagOverlap !== rightTagOverlap) return rightTagOverlap - leftTagOverlap;

  const leftViews = Number(left?.views || 0);
  const rightViews = Number(right?.views || 0);
  if (leftViews !== rightViews) return rightViews - leftViews;

  return getResourceTimestamp(right) - getResourceTimestamp(left);
}

function buildRecommendationText(resource = {}) {
  return [
    resource.title,
    resource.description,
    resource.content,
    resource.subCategory,
    resource.type,
    resource.category,
    ...(Array.isArray(resource.tags) ? resource.tags : [])
  ].join(' ').toLowerCase();
}

function countKeywordMatches(text, keywords = []) {
  return keywords.reduce((score, keyword) => (
    text.includes(`${keyword}`.toLowerCase()) ? score + 1 : score
  ), 0);
}

function buildMoodContext(moodLogs = []) {
  if (!moodLogs.length) {
    return {
      latestMood: '',
      frequentMood: '',
      topFactors: [],
      isFallback: true
    };
  }

  const latestMood = moodLogs[0]?.mood || '';
  const moodCounts = new Map();
  const factorCounts = new Map();

  moodLogs.forEach((log) => {
    if (log?.mood) {
      moodCounts.set(log.mood, (moodCounts.get(log.mood) || 0) + 1);
    }

    (log?.factors || []).forEach((factor) => {
      if (factor) {
        factorCounts.set(factor, (factorCounts.get(factor) || 0) + 1);
      }
    });
  });

  const frequentMood = [...moodCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] || '';

  const topFactors = [...factorCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([factor]) => factor);

  return {
    latestMood,
    frequentMood,
    topFactors,
    isFallback: false
  };
}

function buildMoodKeywords(moodContext) {
  const keywordSet = new Set();

  [moodContext.latestMood, moodContext.frequentMood].forEach((mood) => {
    (MOOD_RESOURCE_KEYWORDS[mood] || []).forEach((keyword) => keywordSet.add(keyword));
  });

  (moodContext.topFactors || []).forEach((factor) => {
    (FACTOR_RESOURCE_KEYWORDS[factor] || []).forEach((keyword) => keywordSet.add(keyword));
  });

  return [...keywordSet];
}

function pickFallbackRecommendations(resources = [], limit = RECOMMENDATION_LIMITS.moodBased) {
  const groups = new Map();

  resources.forEach((resource) => {
    const typeKey = resource?.type || 'Other';
    if (!groups.has(typeKey)) {
      groups.set(typeKey, []);
    }
    groups.get(typeKey).push(resource);
  });

  groups.forEach((items) => {
    items.sort((left, right) => (
      Number(right?.views || 0) - Number(left?.views || 0)
      || getResourceTimestamp(right) - getResourceTimestamp(left)
    ));
  });

  const orderedTypes = [...groups.keys()].sort((left, right) => left.localeCompare(right));
  const selected = [];

  while (selected.length < limit) {
    let addedInRound = false;

    orderedTypes.forEach((type) => {
      const nextItem = groups.get(type)?.shift();
      if (nextItem && selected.length < limit) {
        selected.push(nextItem);
        addedInRound = true;
      }
    });

    if (!addedInRound) break;
  }

  return selected;
}

function buildMoodBasedRecommendations(resources = [], moodContext, limit = RECOMMENDATION_LIMITS.moodBased) {
  const keywords = buildMoodKeywords(moodContext);
  if (!keywords.length) {
    return pickFallbackRecommendations(resources, limit);
  }

  const ranked = resources
    .map((resource) => {
      const searchableText = buildRecommendationText(resource);
      return {
        resource,
        keywordMatches: countKeywordMatches(searchableText, keywords),
        factorMatches: countKeywordMatches(searchableText, (moodContext.topFactors || []).map((factor) => factor.toLowerCase())),
        views: Number(resource?.views || 0),
        createdAt: getResourceTimestamp(resource)
      };
    })
    .filter((entry) => entry.keywordMatches > 0 || entry.factorMatches > 0)
    .sort((left, right) => (
      right.keywordMatches - left.keywordMatches
      || right.factorMatches - left.factorMatches
      || right.views - left.views
      || right.createdAt - left.createdAt
    ))
    .map((entry) => entry.resource);

  if (ranked.length >= limit) {
    return ranked.slice(0, limit);
  }

  const usedIds = new Set(ranked.map((resource) => `${resource._id}`));
  const fallbackFill = pickFallbackRecommendations(
    resources.filter((resource) => !usedIds.has(`${resource._id}`)),
    limit - ranked.length
  );

  return [...ranked, ...fallbackFill];
}

function normalizeResourcePayload(payload = {}, user) {
  const next = {
    title: `${payload.title || ''}`.trim(),
    description: `${payload.description || ''}`.trim(),
    type: `${payload.type || ''}`.trim(),
    category: `${payload.category || ''}`.trim() || 'Mental Health',
    subCategory: `${payload.subCategory || ''}`.trim(),
    content: `${payload.content || ''}`.trim(),
    videoUrl: `${payload.videoUrl || ''}`.trim(),
    duration: `${payload.duration || ''}`.trim(),
    author: `${payload.author || user?.name || ''}`.trim(),
    readTime: `${payload.readTime || ''}`.trim(),
    status: `${payload.status || 'Published'}`.trim(),
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : `${payload.tags || ''}`.split(',').map((tag) => tag.trim()).filter(Boolean)
  };

  if (!next.category) next.category = 'Mental Health';
  if (!next.author) next.author = user?.name || 'Campus Counselor';

  if (next.status === 'Published') {
    next.publishedAt = payload.publishedAt || new Date();
  }

  return next;
}

function validateResourcePayload(payload = {}) {
  const errors = {};

  if (!payload.title) errors.title = 'Title is required';
  else if (payload.title.length < 5) errors.title = 'Title must be at least 5 characters';
  else if (payload.title.length > 120) errors.title = 'Title cannot exceed 120 characters';

  if (!payload.description) errors.description = 'Description is required';
  else if (payload.description.length < 20) errors.description = 'Description must be at least 20 characters';
  else if (payload.description.length > 240) errors.description = 'Description cannot exceed 240 characters';

  if (!payload.content) errors.content = 'Content is required';
  else if (payload.content.length < 40) errors.content = 'Content must be at least 40 characters';

  if (!payload.author) errors.author = 'Author is required';

  if (!['Article', 'Video', 'Infographic', 'Podcast', 'Guide'].includes(payload.type)) {
    errors.type = 'Select a valid resource type';
  }

  if (!['Mental Health', 'Nutrition', 'General Health', 'Safety', 'Fitness', 'Wellness'].includes(payload.category)) {
    errors.category = 'Select a valid resource category';
  }

  if (!['Draft', 'Published', 'Archived'].includes(payload.status)) {
    errors.status = 'Select a valid resource status';
  }

  if (payload.type === 'Video' && !payload.videoUrl) {
    errors.videoUrl = 'Video URL is required for video resources';
  }

  if (payload.type !== 'Video' && payload.videoUrl) {
    errors.videoUrl = 'Video URL can only be added when the type is Video';
  }

  if (payload.videoUrl && !/^https?:\/\//i.test(payload.videoUrl)) {
    errors.videoUrl = 'Video URL must start with http:// or https://';
  }

  return errors;
}

async function findDuplicateResource({ payload, user, resourceId }) {
  const query = {
    createdBy: user.id,
    ...(resourceId ? { _id: { $ne: resourceId } } : {}),
    $or: [
      { title: new RegExp(`^${payload.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { content: payload.content }
    ]
  };

  return Resource.findOne(query).select('_id title content');
}

// @desc    Get resources
// @route   GET /api/resources
// @access  Public
const getResources = async (req, res) => {
  try {
    const { category, type, page = 1, limit = 20 } = req.query;
    const query = { status: 'Published' };

    if (category && category !== 'All') query.category = category;
    if (type && type !== 'All') query.type = type;

    const parsedPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const parsedLimit = parseResourceLimit(limit, 20, RESOURCE_QUERY_LIMITS.publicList);

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .select(RESOURCE_LIST_SELECT)
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit)
        .lean(),
      Resource.countDocuments(query)
    ]);

    res.json({
      resources,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get counselor/admin managed resources
// @route   GET /api/resources/manage/mine
// @access  Private/Counselor/Admin
const getManagedResources = async (req, res) => {
  try {
    const { category, type, status, search = '', page = 1, limit = 50 } = req.query;
    const query = req.user.role === 'admin'
      ? {}
      : { createdBy: req.user.id };

    if (category && category !== 'All') query.category = category;
    if (type && type !== 'All') query.type = type;
    if (status && status !== 'All') query.status = status;
    if (`${search}`.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $elemMatch: { $regex: search.trim(), $options: 'i' } } }
      ];
    }

    const parsedPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const parsedLimit = parseResourceLimit(limit, 50, RESOURCE_QUERY_LIMITS.managedList);
    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit),
      Resource.countDocuments(query)
    ]);

    res.json({
      resources,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Public
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .select(RESOURCE_DETAIL_SELECT)
      .lean();
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.status !== 'Published' && !canManageResource(resource, req.user)) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(resource);

    Resource.updateOne({ _id: resource._id }, { $inc: { views: 1 } }).catch(() => {
      // Ignore view counter failures so detail pages stay fast.
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get resource recommendations
// @route   GET /api/resources/:id/recommendations
// @access  Public with optional student personalization
const getResourceRecommendations = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .select(RESOURCE_DETAIL_SELECT)
      .lean();
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.status !== 'Published') {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const moodLogsPromise = req.user?.role === 'student'
      ? (() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return MoodLog.find({
          userId: req.user.id,
          date: { $gte: thirtyDaysAgo }
        })
          .select('mood factors date')
          .sort({ date: -1 })
          .limit(RESOURCE_QUERY_LIMITS.moodLogs)
          .lean();
      })()
      : Promise.resolve([]);

    const [sameTypeCandidates, moodCandidates, moodLogs] = await Promise.all([
      Resource.find({
        _id: { $ne: resource._id },
        status: 'Published',
        category: 'Mental Health',
        type: resource.type
      })
        .select(RESOURCE_RECOMMENDATION_SELECT)
        .sort({ views: -1, createdAt: -1 })
        .limit(RESOURCE_QUERY_LIMITS.recommendationCandidates)
        .lean(),
      Resource.find({
        _id: { $ne: resource._id },
        status: 'Published',
        category: 'Mental Health'
      })
        .select(RESOURCE_RECOMMENDATION_SELECT)
        .sort({ views: -1, createdAt: -1 })
        .limit(RESOURCE_QUERY_LIMITS.recommendationCandidates)
        .lean(),
      moodLogsPromise
    ]);

    const sameType = sameTypeCandidates
      .sort((left, right) => compareSameTypeResources(left, right, resource))
      .slice(0, RECOMMENDATION_LIMITS.sameType);

    const excludedResourceIds = new Set([`${resource._id}`, ...sameType.map((item) => `${item._id}`)]);
    let moodContext = {
      latestMood: '',
      frequentMood: '',
      topFactors: [],
      isFallback: true
    };

    if (req.user?.role === 'student') {
      moodContext = buildMoodContext(moodLogs);
    }

    const availableMoodCandidates = moodCandidates.filter((candidate) => !excludedResourceIds.has(`${candidate._id}`));
    const moodBased = moodContext.isFallback
      ? pickFallbackRecommendations(availableMoodCandidates, RECOMMENDATION_LIMITS.moodBased)
      : buildMoodBasedRecommendations(availableMoodCandidates, moodContext, RECOMMENDATION_LIMITS.moodBased);

    return res.json({
      sameType,
      moodBased,
      moodContext
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Create resource
// @route   POST /api/resources
// @access  Private/Admin
const createResource = async (req, res) => {
  try {
    const resourceData = normalizeResourcePayload(req.body, req.user);
    const validationErrors = validateResourcePayload(resourceData);
    if (Object.keys(validationErrors).length) {
      return res.status(400).json({ message: 'Please correct the highlighted resource fields.', errors: validationErrors });
    }

    const duplicateResource = await findDuplicateResource({ payload: resourceData, user: req.user });
    if (duplicateResource) {
      return res.status(409).json({
        message: 'A similar counselor resource already exists.',
        errors: {
          title: `${duplicateResource.title}`.toLowerCase() === resourceData.title.toLowerCase()
            ? 'You already created a resource with this title.'
            : undefined,
          content: duplicateResource.content === resourceData.content
            ? 'This content already exists in one of your resources.'
            : undefined
        }
      });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'resources'
      });
      resourceData.coverImage = result.secure_url;
      resourceData.coverImagePublicId = result.public_id;
    }

    const resource = await Resource.create({
      ...resourceData,
      createdBy: req.user.id
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Resource Created',
      module: 'Mental Health',
      details: `Created resource: ${resource.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
const updateResource = async (req, res) => {
  try {
    const existingResource = await Resource.findById(req.params.id);

    if (!existingResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (!canManageResource(existingResource, req.user)) {
      return res.status(403).json({ message: 'Not authorized to update this resource' });
    }

    const payload = normalizeResourcePayload({ ...existingResource.toObject(), ...req.body }, req.user);
    const validationErrors = validateResourcePayload(payload);
    if (Object.keys(validationErrors).length) {
      return res.status(400).json({ message: 'Please correct the highlighted resource fields.', errors: validationErrors });
    }

    const duplicateResource = await findDuplicateResource({
      payload,
      user: req.user,
      resourceId: existingResource._id
    });
    if (duplicateResource) {
      return res.status(409).json({
        message: 'A similar counselor resource already exists.',
        errors: {
          title: `${duplicateResource.title}`.toLowerCase() === payload.title.toLowerCase()
            ? 'You already created a resource with this title.'
            : undefined,
          content: duplicateResource.content === payload.content
            ? 'This content already exists in one of your resources.'
            : undefined
        }
      });
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Resource Updated',
      module: 'Mental Health',
      details: `Updated resource: ${resource.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (!canManageResource(resource, req.user)) {
      return res.status(403).json({ message: 'Not authorized to delete this resource' });
    }

    if (resource.coverImagePublicId) {
      await cloudinary.uploader.destroy(resource.coverImagePublicId);
    }

    await resource.deleteOne();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Resource Deleted',
      module: 'Mental Health',
      details: `Deleted resource: ${resource.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'warning',
      timestamp: Date.now()
    });

    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getResources,
  getManagedResources,
  getResourceById,
  getResourceRecommendations,
  createResource,
  updateResource,
  deleteResource
};
