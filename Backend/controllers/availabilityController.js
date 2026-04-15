import Availability from '../models/Availability.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { getAvailabilityForProvider, matchesDateEntry } from '../services/availabilityService.js';
import { generateSlots, normalizeDateOnly, toMinutes } from '../utils/timeSlots.js';
import { getDoctorScopeIds } from '../utils/doctorScope.js';
import { emitAvailabilityUpdate } from '../utils/socket.js';

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

function slotMatchesEntry(entry, appointment) {
  if (!entry || entry.isUnavailable || !appointment?.time) return false;

  if (!matchesDateEntry(entry, appointment.date)) {
    return false;
  }

  const entrySlots = generateSlots({
    startTime: entry.startTime,
    endTime: entry.endTime,
    slotDuration: entry.slotDuration,
    breaks: entry.breaks
  });

  return entrySlots.some((slot) => {
    const slotMinutes = toMinutes(slot);
    const appointmentMinutes = toMinutes(appointment.time);
    return slotMinutes !== null && appointmentMinutes !== null && slotMinutes === appointmentMinutes;
  });
}

function appointmentMatchesEntry(entry, appointment) {
  if (!entry || !appointment) return false;

  if (appointment.availabilityId) {
    return appointment.availabilityId.toString() === entry._id.toString();
  }

  return slotMatchesEntry(entry, appointment);
}

function toEntryWithBookings(entry, bookedAppointments = [], isEditable = true) {
  return {
    ...entry.toObject(),
    isEditable,
    bookedCount: bookedAppointments.length,
    bookedAppointments
  };
}

function broadcastAvailabilityMutation({ action, entry, providerId, role }) {
  emitAvailabilityUpdate({
    action,
    providerId: providerId?.toString?.() || providerId,
    role: role || entry?.role || null,
    availabilityId: entry?._id?.toString?.() || null,
    date: entry?.date || null,
    recurringDays: entry?.recurringDays || [],
    status: entry?.status || null,
    isUnavailable: entry?.isUnavailable || false
  });
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
    const providerScopeIds = req.user.role === 'doctor'
      ? await getDoctorScopeIds(req.user)
      : [req.user.id];

    const entries = await Availability.find({ providerId: req.user.id })
      .sort({ date: 1, createdAt: -1 });

    const normalizedToday = normalizeDateOnly(new Date());
    const appointments = await Appointment.find({
      doctorId: { $in: providerScopeIds },
      date: { $gte: normalizedToday },
      status: { $in: ['Pending', 'Confirmed', 'Ready', 'In Progress'] }
    })
      .select('studentId studentName date time type status symptoms notes availabilityId')
      .populate('studentId', 'name email studentId profileImage')
      .sort({ date: 1, time: 1 });

    const entrySnapshots = entries.map((entry) => ({
      entry,
      bookedAppointments: []
    }));

    appointments.forEach((appointment) => {
      const matchingEntry = entrySnapshots.find(({ entry }) => appointmentMatchesEntry(entry, appointment));
      if (matchingEntry) {
        matchingEntry.bookedAppointments.push({
          _id: appointment._id,
          availabilityId: appointment.availabilityId || null,
          studentId: appointment.studentId?._id || appointment.studentId,
          studentName: appointment.studentName || appointment.studentId?.name || 'Student',
          studentEmail: appointment.studentId?.email || '',
          studentRecordId: appointment.studentId?.studentId || '',
          profileImage: appointment.studentId?.profileImage || '',
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          status: appointment.status,
          symptoms: appointment.symptoms || '',
          notes: appointment.notes || ''
        });
      }
    });

    const hydratedEntries = entrySnapshots.map(({ entry, bookedAppointments }) => (
      toEntryWithBookings(entry, bookedAppointments, entry.providerId?.toString?.() === req.user.id)
    ));

    res.json({ entries: hydratedEntries });
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
    broadcastAvailabilityMutation({
      action: 'created',
      entry,
      providerId: req.user.id,
      role: req.user.role
    });
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
    broadcastAvailabilityMutation({
      action: 'updated',
      entry,
      providerId: req.user.id,
      role: req.user.role
    });
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

    const snapshot = entry.toObject();
    await entry.deleteOne();
    broadcastAvailabilityMutation({
      action: 'deleted',
      entry: snapshot,
      providerId: req.user.id,
      role: req.user.role
    });
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
