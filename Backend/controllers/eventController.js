// controllers/eventController.js

import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { uploadEventImage } from '../utils/cloudinaryService.js';

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { status, upcoming = 'true', limit = 20 } = req.query;
    const query = {};

    // Only published events by default
    if (status && status !== 'All') {
      query.status = status;
    } else {
      query.status = 'Published';
    }

    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const parsedLimit = parseInt(limit, 10) || 20;

    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(parsedLimit);

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const eventData = { ...req.body };

    // If a file was uploaded, upload to Cloudinary via named helper
    if (req.file) {
      try {
        const result = await uploadEventImage(req.file.path);
        eventData.image = result.secure_url;
        eventData.imagePublicId = result.public_id;
      } catch (uploadErr) {
        // Log upload error but continue — caller can decide how to handle
        console.warn('Event image upload failed:', uploadErr);
      }
    }

    const event = await Event.create({
      ...eventData,
      createdBy: req.user?.id
    });

    await AuditLog.create({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'Event Created',
      module: 'Events',
      details: `Created event: ${event.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If a new file is uploaded, replace image
    if (req.file) {
      try {
        const result = await uploadEventImage(req.file.path);
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;
      } catch (uploadErr) {
        console.warn('Event image upload failed:', uploadErr);
      }
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await AuditLog.create({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'Event Updated',
      module: 'Events',
      details: `Updated event: ${event.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'info',
      timestamp: Date.now()
    });

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await AuditLog.create({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'Event Deleted',
      module: 'Events',
      details: `Deleted event: ${event.title}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      level: 'warn',
      timestamp: Date.now()
    });

    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
