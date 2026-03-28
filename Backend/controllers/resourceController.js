// controllers/resourceController.js

import Resource from '../models/Resource.js';
import AuditLog from '../models/AuditLog.js';
import { cloudinary } from '../utils/cloudinaryService.js';

// @desc    Get resources
// @route   GET /api/resources
// @access  Public
const getResources = async (req, res) => {
  try {
    const { category, type, page = 1, limit = 20 } = req.query;
    const query = { status: 'Published' };

    if (category && category !== 'All') query.category = category;
    if (type && type !== 'All') query.type = type;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit);

    const total = await Resource.countDocuments(query);

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
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.views += 1;
    await resource.save();

    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create resource
// @route   POST /api/resources
// @access  Private/Admin
const createResource = async (req, res) => {
  try {
    const resourceData = { ...req.body };

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
      module: 'Resources',
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
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

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

    if (resource.coverImagePublicId) {
      await cloudinary.uploader.destroy(resource.coverImagePublicId);
    }

    await resource.deleteOne();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'Resource Deleted',
      module: 'Resources',
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
  getResourceById,
  createResource,
  updateResource,
  deleteResource
};
