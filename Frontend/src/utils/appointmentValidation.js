/**
 * Appointment Validation Utilities
 *
 * Purpose: Provide reusable validation functions for appointment-related fields
 * Keeps validation logic separate from components and makes it testable
 *
 * Usage:
 * ```
 * const errors = {};
 * if (!validateSymptoms(symptoms)) {
 *   errors.symptoms = 'Please describe your symptoms';
 * }
 * ```
 */

// === DATE & TIME VALIDATION ===

/**
 * Check if date string is valid and in future
 */
export function validateAppointmentDate(dateString) {
  if (!dateString) {
    return { valid: false, message: 'Please select an appointment date' };
  }

  const selectedDate = new Date(dateString).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  if (selectedDate < today) {
    return { valid: false, message: 'Please choose today or a future date' };
  }

  return { valid: true };
}

/**
 * Check if time is valid format
 */
export function validateAppointmentTime(timeString) {
  if (!timeString) {
    return { valid: false, message: 'Please select an appointment time' };
  }

  // Validate time format (HH:MM AM/PM)
  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s(AM|PM)$/i;
  if (!timeRegex.test(timeString)) {
    return { valid: false, message: 'Invalid time format' };
  }

  return { valid: true };
}

/**
 * Check if date+time combination is in future
 */
export function validateFutureDateTime(dateString, timeString) {
  if (!dateString || !timeString) {
    return { valid: false, message: 'Please provide both date and time' };
  }

  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const [time, meridiem] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    let hour = hours;
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;

    const selectedDateTime = new Date(year, month - 1, day, hour, minutes, 0, 0);
    const now = new Date();

    if (selectedDateTime <= now) {
      return { valid: false, message: 'Please choose a future date and time' };
    }

    return { valid: true };
  } catch {
    return { valid: false, message: 'Invalid date or time' };
  }
}

// === APPOINTMENT DETAILS VALIDATION ===

/**
 * Validate symptoms/reason description
 * - Required
 * - Minimum 8 characters (prevents lazy descriptions)
 * - Maximum 400 characters (prevents spam)
 */
export function validateSymptoms(symptoms) {
  const trimmed = (symptoms || '').trim();

  if (!trimmed) {
    return { valid: false, message: 'Please describe your symptoms or reason for visit' };
  }

  if (trimmed.length < 8) {
    return { valid: false, message: 'Please provide at least 8 characters describing your symptoms' };
  }

  if (trimmed.length > 400) {
    return { valid: false, message: 'Symptoms description must be under 400 characters' };
  }

  return { valid: true };
}

/**
 * Validate additional notes (optional, but has max length)
 */
export function validateNotes(notes) {
  const trimmed = (notes || '').trim();

  if (trimmed.length > 500) {
    return { valid: false, message: 'Additional notes must be under 500 characters' };
  }

  return { valid: true };
}

/**
 * Validate consultation type
 */
export function validateConsultationType(type) {
  const validTypes = ['Video Call', 'In-Person'];

  if (!type) {
    return { valid: false, message: 'Please select a consultation type' };
  }

  if (!validTypes.includes(type)) {
    return { valid: false, message: `Invalid consultation type. Must be: ${validTypes.join(' or ')}` };
  }

  return { valid: true };
}

// === STATUS VALIDATION ===

/**
 * Check if appointment can be rescheduled
 * Only Confirmed appointments can be rescheduled
 */
export function validateCanReschedule(appointmentStatus) {
  if (appointmentStatus !== 'Confirmed') {
    return {
      valid: false,
      message: `Cannot reschedule a ${appointmentStatus} appointment. Only confirmed appointments can be rescheduled.`
    };
  }

  return { valid: true };
}

/**
 * Check if appointment can be cancelled
 * Cannot cancel Completed, Cancelled, or No Show appointments
 */
export function validateCanCancel(appointmentStatus) {
  const uncancellableStatuses = ['Completed', 'Cancelled', 'No Show'];

  if (uncancellableStatuses.includes(appointmentStatus)) {
    return {
      valid: false,
      message: `Cannot cancel a ${appointmentStatus} appointment.`
    };
  }

  return { valid: true };
}

/**
 * Check if student can join video call
 * Only allow video access for Ready or In Progress status
 */
export function validateCanJoinVideo(appointmentStatus) {
  const allowedStatuses = ['Ready', 'In Progress'];

  if (!allowedStatuses.includes(appointmentStatus)) {
    return {
      valid: false,
      message: 'Video access not available. Appointment must be marked as ready by the doctor.'
    };
  }

  return { valid: true };
}

/**
 * Check if student can check in
 * Can only check in on appointment day, and must be Confirmed status
 */
export function validateCanCheckIn(appointmentDate, appointmentStatus) {
  const today = new Date().toISOString().slice(0, 10);
  const apptDate = appointmentDate;

  if (apptDate !== today) {
    return {
      valid: false,
      message: 'You can only check in on your appointment date.'
    };
  }

  if (appointmentStatus !== 'Confirmed') {
    return {
      valid: false,
      message: `Cannot check in. Appointment status is ${appointmentStatus}.`
    };
  }

  return { valid: true };
}

// === COMBINED FORM VALIDATION ===

/**
 * Validate entire booking form
 * Returns object with all errors, or empty object if valid
 */
export function validateBookingForm(formData) {
  const {
    date,
    time,
    symptoms,
    notes,
    type
  } = formData;

  const errors = {};

  // Date validation
  const dateValidation = validateAppointmentDate(date);
  if (!dateValidation.valid) {
    errors.date = dateValidation.message;
  }

  // Time validation
  const timeValidation = validateAppointmentTime(time);
  if (!timeValidation.valid) {
    errors.time = timeValidation.message;
  }

  // Combined date-time validation (only if both provided)
  if (date && time) {
    const dateTimeValidation = validateFutureDateTime(date, time);
    if (!dateTimeValidation.valid) {
      errors.dateTime = dateTimeValidation.message;
    }
  }

  // Symptoms validation
  const symptomsValidation = validateSymptoms(symptoms);
  if (!symptomsValidation.valid) {
    errors.symptoms = symptomsValidation.message;
  }

  // Notes validation (optional, but validate length if provided)
  if (notes) {
    const notesValidation = validateNotes(notes);
    if (!notesValidation.valid) {
      errors.notes = notesValidation.message;
    }
  }

  // Type validation
  const typeValidation = validateConsultationType(type);
  if (!typeValidation.valid) {
    errors.type = typeValidation.message;
  }

  return errors;
}

/**
 * Validate availability management form
 */
export function validateAvailabilityForm(formData) {
  const {
    startTime,
    endTime,
    slotDuration,
    days
  } = formData;

  const errors = {};

  if (!startTime) {
    errors.startTime = 'Start time is required';
  }

  if (!endTime) {
    errors.endTime = 'End time is required';
  }

  if (startTime && endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    if (startTotal >= endTotal) {
      errors.endTime = 'End time must be after start time';
    }
  }

  if (!slotDuration || slotDuration <= 0) {
    errors.slotDuration = 'Slot duration must be greater than 0';
  }

  if (!days || days.length === 0) {
    errors.days = 'Select at least one day';
  }

  return errors;
}

/**
 * Validate prescription creation form
 */
export function validatePrescriptionForm(formData) {
  const { medicines } = formData;
  const errors = {};

  if (!Array.isArray(medicines) || medicines.length === 0) {
    errors.medicines = 'Add at least one medicine';
  } else {
    // Validate each medicine
    const medicineErrors = medicines
      .map((med, idx) => {
        const medErrors = {};

        if (!med.name?.trim()) {
          medErrors.name = 'Medicine name required';
        }

        if (!med.dosage?.trim()) {
          medErrors.dosage = 'Dosage required';
        }

        if (!med.frequency?.trim()) {
          medErrors.frequency = 'Frequency required';
        }

        if (!med.duration) {
          medErrors.duration = 'Duration required';
        }

        return Object.keys(medErrors).length > 0 ? { index: idx, errors: medErrors } : null;
      })
      .filter(Boolean);

    if (medicineErrors.length > 0) {
      errors.medicines = medicineErrors;
    }
  }

  return errors;
}

/**
 * Validate feedback form
 */
export function validateFeedbackForm(formData) {
  const { rating, comment } = formData;
  const errors = {};

  if (!rating || rating < 1 || rating > 5) {
    errors.rating = 'Please provide a rating between 1 and 5 stars';
  }

  if (comment && comment.length > 500) {
    errors.comment = 'Comment must be under 500 characters';
  }

  return errors;
}

// === HELPER FUNCTIONS ===

/**
 * Check if appointment is past
 */
export function isAppointmentPast(dateString, timeString) {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);

    const appointmentTime = new Date(year, month - 1, day, hours, minutes);
    return appointmentTime < new Date();
  } catch {
    return false;
  }
}

/**
 * Check if appointment is today
 */
export function isAppointmentToday(dateString) {
  const today = new Date().toISOString().slice(0, 10);
  return dateString === today;
}

/**
 * Check if appointment is upcoming (within next 7 days)
 */
export function isAppointmentUpcoming(dateString) {
  const today = new Date();
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const apptDate = new Date(dateString);

  return apptDate >= today && apptDate <= next7Days;
}
