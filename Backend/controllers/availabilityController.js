import Availability from '../models/Availability.js';
import User from '../models/User.js';
import { getAvailabilityForProvider } from '../services/availabilityService.js';
import { normalizeDateOnly, toMinutes } from '../utils/timeSlots.js';

function normalizeRecurringDays(recurringDays = []) {
  return recurringDays
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
}

function normalizeBreaks(breaks = []) {
  if (!Array.isArray(breaks)) return [];
  return breaks
    .filter((entry) => entry?.startTime && entry?.endTime)
    .map((entry) => ({
      startTime: entry.startTime,
      endTime: entry.endTime,
      label: entry.label || ''
    }));
}

function validateSchedule({ isUnavailable, date, recurringDays, startTime, endTime, breaks }) {
  if (!date && (!Array.isArray(recurringDays) || recurringDays.length === 0)) {
    return 'Choose a date or at least one recurring day';
  }

  if (!isUnavailable) {
    if (!startTime || !endTime) return 'Start time and end time are required';
    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return 'End time must be after start time';
    }

    const hasInvalidBreak = breaks.some((entry) => {
      const breakStart = toMinutes(entry.startTime);
      const breakEnd = toMinutes(entry.endTime);
      return breakStart === null || breakEnd === null || breakEnd <= breakStart;
    });

    if (hasInvalidBreak) {
      return 'Each break must have a valid start and end time';
    }
  }

  return null;
}

// @desc    Get provider availability for a date
// @route   GET /api/availability/:providerId
// @access  Private
const getAvailabilityByProvider = async (req, res) => {
  try {
    const provider = await User.findById(req.params.providerId)
      .select('name role specialty profileImage');

    if (!provider || !['doctor', 'counselor'].includes(provider.role)) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
    const availability = await getAvailabilityForProvider({
      providerId: provider._id,
      role: provider.role,
      date: targetDate
    });

    res.json({
      provider,
      date: availability.date,
      availableSlots: availability.availableSlots,
      bookedSlots: availability.bookedSlots,
      configuredSlots: availability.configuredSlots,
      entries: availability.entries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current provider availability entries
// @route   GET /api/availability/me
// @access  Private/Doctor,Counselor
const getMyAvailability = async (req, res) => {
  try {
    const entries = await Availability.find({ providerId: req.user.id })
      .sort({ date: 1, createdAt: -1 });

    res.json({ entries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create availability entry
// @route   POST /api/availability
// @access  Private/Doctor,Counselor
const createAvailability = async (req, res) => {
  try {
    const recurringDays = normalizeRecurringDays(req.body.recurringDays);
    const breaks = normalizeBreaks(req.body.breaks);
    const isUnavailable = Boolean(req.body.isUnavailable);
    const payload = {
      providerId: req.user.id,
      role: req.user.role,
      title: req.body.title || '',
      date: req.body.date ? normalizeDateOnly(req.body.date) : null,
      recurringDays,
      startTime: req.body.startTime || '',
      endTime: req.body.endTime || '',
      slotDuration: Number(req.body.slotDuration) || 30,
      consultationTypes: Array.isArray(req.body.consultationTypes) && req.body.consultationTypes.length > 0
        ? req.body.consultationTypes
        : req.user.role === 'counselor'
          ? ['Video Call', 'Chat', 'In-Person']
          : ['Video Call', 'In-Person'],
      breaks,
      isUnavailable,
      notes: req.body.notes || '',
      status: req.body.status || 'Active'
    };

    const validationError = validateSchedule(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const entry = await Availability.create(payload);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update availability entry
// @route   PUT /api/availability/:id
// @access  Private/Doctor,Counselor
const updateAvailability = async (req, res) => {
  try {
    const entry = await Availability.findOne({ _id: req.params.id, providerId: req.user.id });

    if (!entry) {
      return res.status(404).json({ message: 'Availability entry not found' });
    }

    const recurringDays = req.body.recurringDays ? normalizeRecurringDays(req.body.recurringDays) : entry.recurringDays;
    const breaks = req.body.breaks ? normalizeBreaks(req.body.breaks) : entry.breaks;

    entry.title = req.body.title ?? entry.title;
    entry.date = req.body.date !== undefined
      ? (req.body.date ? normalizeDateOnly(req.body.date) : null)
      : entry.date;
    entry.recurringDays = recurringDays;
    entry.startTime = req.body.startTime ?? entry.startTime;
    entry.endTime = req.body.endTime ?? entry.endTime;
    entry.slotDuration = req.body.slotDuration ? Number(req.body.slotDuration) : entry.slotDuration;
    entry.consultationTypes = Array.isArray(req.body.consultationTypes)
      ? req.body.consultationTypes
      : entry.consultationTypes;
    entry.breaks = breaks;
    entry.isUnavailable = req.body.isUnavailable ?? entry.isUnavailable;
    entry.notes = req.body.notes ?? entry.notes;
    entry.status = req.body.status ?? entry.status;

    const validationError = validateSchedule(entry);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete availability entry
// @route   DELETE /api/availability/:id
// @access  Private/Doctor,Counselor
const deleteAvailability = async (req, res) => {
  try {
    const entry = await Availability.findOne({ _id: req.params.id, providerId: req.user.id });

    if (!entry) {
      return res.status(404).json({ message: 'Availability entry not found' });
    }

    await entry.deleteOne();
    res.json({ message: 'Availability entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAvailabilityByProvider,
  getMyAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability
};
