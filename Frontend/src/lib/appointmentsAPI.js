/**
 * Appointments API Client
 *
 * PHASE 3 MIGRATION: Backend API Integration
 * =============================================
 *
 * This module replaces localStorage-based demo data with real backend API calls.
 * All data now flows through the backend, ensuring data consistency and security.
 *
 * Migration Summary:
 * - ✅ Removed localStorage simulation
 * - ✅ All calls now use apiFetch to backend
 * - ✅ Error handling matches backend responses
 * - ✅ Validation happens on client AND server
 * - ✅ Role-based access still enforced
 *
 * Backend Requirements:
 * - GET    /appointments          (list appointments)
 * - GET    /appointments/:id      (get single appointment)
 * - POST   /appointments          (book appointment)
 * - PUT    /appointments/:id      (update appointment)
 * - PUT    /appointments/:id/checkin (check in)
 * - DELETE /appointments/:id      (cancel/delete)
 * - GET    /prescriptions         (list prescriptions)
 * - POST   /prescriptions         (create prescription)
 * - GET    /users/providers       (list doctors)
 *
 * Usage:
 * - Old way: const apt = getAppointmentById(id);  // ❌ Demo data
 * - New way: const apt = await apiFetch(`/appointments/${id}`); // ✅ Real API
 *
 * For component usage, see: useAppointments hook (recommended approach)
 */

import { apiFetch } from './api';

// ===== HELPER FUNCTIONS (No changes needed) =====

function dateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function toDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const [year, month, day] = dateValue.split('-').map(Number);
  const [clock, meridiem] = timeValue.split(' ');
  const [hourText, minuteText] = clock.split(':');
  let hour = Number(hourText);
  const minute = Number(minuteText);

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function isPastDateTime(dateValue, timeValue) {
  const value = toDateTime(dateValue, timeValue);
  return value ? value.getTime() < Date.now() : false;
}

// ===== APPOINTMENT OPERATIONS =====

/**
 * Get all appointments (filtered by role)
 * GET /appointments?studentId=<id> | ?doctorId=<id>
 *
 * Student can only see their own appointments
 * Doctor can see their patient's appointments
 * Returns: [Appointment]
 */
export async function getAppointments(params = {}) {
  try {
    const query = new URLSearchParams();

    if (params.studentId) query.append('studentId', params.studentId);
    if (params.doctorId) query.append('doctorId', params.doctorId);
    if (params.status) query.append('status', params.status);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const response = await apiFetch(`/appointments?${query}`);

    // Handle response format: backend returns { appointments, totalPages, ... } or direct array
    const data = response.appointments || response || [];
    return {
      appointments: Array.isArray(data) ? data : [],
      totalPages: response.totalPages || 1,
      currentPage: response.currentPage || 1,
      total: response.total || (Array.isArray(data) ? data.length : 0)
    };
  } catch (err) {
    console.error('Failed to fetch appointments:', err);
    throw err;
  }
}

/**
 * Get single appointment by ID
 * GET /appointments/:id
 *
 * User must have access (student sees own, doctor sees their patients)
 * Returns: Appointment
 */
export async function getAppointmentById(id) {
  if (!id) {
    const error = new Error('Appointment ID required');
    error.status = 400;
    throw error;
  }

  try {
    const appointment = await apiFetch(`/appointments/${id}`);
    return appointment;
  } catch (err) {
    console.error(`Failed to fetch appointment ${id}:`, err);
    throw err;
  }
}

/**
 * Book a new appointment
 * POST /appointments
 *
 * Student books appointment with selected doctor
 * Required: doctorId, date, time, type, symptoms
 * Optional: notes
 *
 * Returns: Appointment (created)
 */
export async function bookAppointment(payload) {
  // Validation
  if (!payload.doctorId || !payload.date || !payload.time || !payload.type) {
    const error = new Error('Doctor, date, time, and consultation type are required');
    error.status = 400;
    throw error;
  }

  if (isPastDateTime(payload.date, payload.time)) {
    const error = new Error('Appointments must be booked for a future time slot');
    error.status = 400;
    throw error;
  }

  try {
    const appointment = await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: payload.doctorId,
        availabilityId: payload.availabilityId,
        date: payload.date,
        time: payload.time,
        type: payload.type,
        symptoms: payload.symptoms || '',
        notes: payload.notes || ''
      })
    });

    return appointment;
  } catch (err) {
    console.error('Failed to book appointment:', err);
    throw err;
  }
}

/**
 * Reschedule appointment
 * PUT /appointments/:id/reschedule
 *
 * Move appointment to different date/time
 * Only Confirmed appointments can be rescheduled
 * New date/time must be in future
 *
 * Returns: Appointment (updated)
 */
export async function rescheduleAppointment(id, payload) {
  if (!id || !payload.date || !payload.time) {
    const error = new Error('Appointment ID, date, and time are required');
    error.status = 400;
    throw error;
  }

  if (isPastDateTime(payload.date, payload.time)) {
    const error = new Error('Appointments must be rescheduled to a future time slot');
    error.status = 400;
    throw error;
  }

  try {
    const appointment = await apiFetch(`/appointments/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({
        date: payload.date,
        time: payload.time,
        availabilityId: payload.availabilityId,
        type: payload.type
      })
    });

    return appointment;
  } catch (err) {
    console.error('Failed to reschedule appointment:', err);
    throw err;
  }
}

/**
 * Check in to appointment
 * PUT /appointments/:id/checkin
 *
 * Student marks themselves as ready for consultation
 * Can only check in on appointment date
 * Only Confirmed appointments can be checked in
 *
 * Returns: Appointment (status changed to Ready)
 */
export async function checkInAppointment(id) {
  if (!id) {
    const error = new Error('Appointment ID required');
    error.status = 400;
    throw error;
  }

  try {
    const appointment = await apiFetch(`/appointments/${id}/check-in`, {
      method: 'PUT',
      body: JSON.stringify({
        checkInAt: new Date().toISOString()
      })
    });

    return appointment;
  } catch (err) {
    console.error('Failed to check in:', err);
    throw err;
  }
}

/**
 * Cancel appointment
 * PUT /appointments/:id (with status=Cancelled)
 *
 * Student cancels their own appointment
 * Doctor cancels patient appointment
 * Cannot cancel Completed, Cancelled, or NoShow appointments
 *
 * Returns: Appointment (status=Cancelled)
 */
export async function cancelAppointment(id, reason = '') {
  if (!id) {
    const error = new Error('Appointment ID required');
    error.status = 400;
    throw error;
  }

  try {
    const appointment = await apiFetch(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Cancelled',
        cancellationReason: reason
      })
    });

    return appointment;
  } catch (err) {
    console.error('Failed to cancel appointment:', err);
    throw err;
  }
}

/**
 * Update appointment status and consultation details (doctor only)
 * PUT /appointments/:id
 *
 * Doctor updates consultation notes, diagnosis, follow-up
 * Changes appointment status (Ready → In Progress → Completed)
 *
 * Returns: Appointment (updated)
 */
export async function updateConsultation(id, payload) {
  if (!id) {
    const error = new Error('Appointment ID required');
    error.status = 400;
    throw error;
  }

  try {
    const appointment = await apiFetch(`/appointments/${id}/consultation`, {
      method: 'PUT',
      body: JSON.stringify({
        status: payload.status,
        consultationNotes: payload.consultationNotes,
        diagnosis: payload.diagnosis,
        followUpDate: payload.followUpDate,
        followUpReason: payload.followUpReason,
        prescriptionId: payload.prescriptionId
      })
    });

    return appointment;
  } catch (err) {
    console.error('Failed to update consultation:', err);
    throw err;
  }
}

// ===== DOCTOR OPERATIONS =====

/**
 * Get doctor's queue for today
 * GET /appointments?doctorId=<id>&date=today&status=Confirmed,Ready,InProgress
 *
 * Doctor views all patients scheduled for today
 * Returns: [Appointment] (sorted by time)
 */
export async function getDoctorQueue(doctorId) {
  if (!doctorId) {
    const error = new Error('Doctor ID required');
    error.status = 400;
    throw error;
  }

  try {
    const today = dateOnly(new Date());
    const response = await apiFetch(
      `/appointments?doctorId=${doctorId}&date=${today}&status=Confirmed,Ready,InProgress`
    );

    return Array.isArray(response) ? response : response.appointments || [];
  } catch (err) {
    console.error('Failed to fetch doctor queue:', err);
    throw err;
  }
}

/**
 * Get all patients for a doctor
 * GET /doctors/:doctorId/patients
 *
 * Returns: [Patient] with visit history
 */
export async function getDoctorPatients(doctorId) {
  if (!doctorId) {
    const error = new Error('Doctor ID required');
    error.status = 400;
    throw error;
  }

  try {
    const response = await apiFetch(`/doctors/${doctorId}/patients`);
    return {
      patients: Array.isArray(response) ? response : response.patients || []
    };
  } catch (err) {
    console.error('Failed to fetch doctor patients:', err);
    throw err;
  }
}

/**
 * Get patient record for doctor
 * GET /doctors/:doctorId/patients/:studentId
 *
 * Returns: { patient, appointments, prescriptions }
 */
export async function getDoctorPatientById(doctorId, studentId) {
  if (!doctorId || !studentId) {
    const error = new Error('Doctor ID and student ID required');
    error.status = 400;
    throw error;
  }

  try {
    const data = await apiFetch(`/doctors/${doctorId}/patients/${studentId}`);
    return {
      patient: data.patient,
      appointments: data.appointments || [],
      prescriptions: data.prescriptions || []
    };
  } catch (err) {
    console.error('Failed to fetch patient record:', err);
    throw err;
  }
}

/**
 * Get doctor's dashboard stats
 * GET /doctors/:doctorId/dashboard
 *
 * Returns: { stats: { queue, pendingPrescriptions, ... }, todayAppointments: [...] }
 */
export async function getDoctorDashboard(doctorId) {
  if (!doctorId) {
    const error = new Error('Doctor ID required');
    error.status = 400;
    throw error;
  }

  try {
    const dashboard = await apiFetch(`/doctors/${doctorId}/dashboard`);
    return {
      stats: dashboard.stats || {},
      todayAppointments: dashboard.todayAppointments || []
    };
  } catch (err) {
    console.error('Failed to fetch doctor dashboard:', err);
    throw err;
  }
}

// ===== STUDENT OPERATIONS =====

/**
 * Get student's dashboard
 * GET /students/:studentId/dashboard
 *
 * Returns: { upcomingAppointments, recentPrescriptions, ... }
 */
export async function getStudentDashboard(studentId) {
  if (!studentId) {
    const error = new Error('Student ID required');
    error.status = 400;
    throw error;
  }

  try {
    const dashboard = await apiFetch(`/students/${studentId}/dashboard`);
    return {
      upcomingAppointments: dashboard.upcomingAppointments || [],
      recentPrescriptions: dashboard.recentPrescriptions || [],
      moodTrends: dashboard.moodTrends || {}
    };
  } catch (err) {
    console.error('Failed to fetch student dashboard:', err);
    throw err;
  }
}

// ===== PRESCRIPTION OPERATIONS =====

/**
 * Create prescription
 * POST /prescriptions
 *
 * Doctor creates prescription after consultation
 * Required: appointmentId, medicines, doctorId
 * Optional: notes
 *
 * Returns: Prescription (created)
 */
export async function createPrescription(payload) {
  if (!payload.appointmentId || !payload.medicines || !Array.isArray(payload.medicines)) {
    const error = new Error('Appointment ID and medicines are required');
    error.status = 400;
    throw error;
  }

  try {
    const prescription = await apiFetch('/prescriptions', {
      method: 'POST',
      body: JSON.stringify({
        appointmentId: payload.appointmentId,
        medicines: payload.medicines,
        notes: payload.notes || ''
      })
    });

    return prescription;
  } catch (err) {
    console.error('Failed to create prescription:', err);
    throw err;
  }
}

/**
 * Get prescription history
 * GET /prescriptions
 *
 * Student sees their prescriptions
 * Doctor sees their issued prescriptions
 * Returns: [Prescription]
 */
export async function getPrescriptionHistory() {
  try {
    const response = await apiFetch('/prescriptions');
    return {
      prescriptions: Array.isArray(response) ? response : response.prescriptions || []
    };
  } catch (err) {
    console.error('Failed to fetch prescriptions:', err);
    throw err;
  }
}

/**
 * Get single prescription
 * GET /prescriptions/:id
 */
export async function getPrescriptionById(id) {
  if (!id) {
    const error = new Error('Prescription ID required');
    error.status = 400;
    throw error;
  }

  try {
    const prescription = await apiFetch(`/prescriptions/${id}`);
    return prescription;
  } catch (err) {
    console.error('Failed to fetch prescription:', err);
    throw err;
  }
}

// ===== PROVIDER/DOCTOR OPERATIONS =====

/**
 * Get all providers/doctors
 * GET /users/providers?specialty=General&search=Smith
 *
 * Student searches for doctors
 * Returns: [Provider]
 */
export async function getProviders(params = {}) {
  try {
    const query = new URLSearchParams();

    if (params.specialty) query.append('specialty', params.specialty);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const response = await apiFetch(`/users/providers?${query}`);
    return Array.isArray(response) ? response : response.providers || [];
  } catch (err) {
    console.error('Failed to fetch providers:', err);
    throw err;
  }
}

/**
 * Get provider details
 * GET /users/providers/:id
 *
 * Student views doctor profile, availability, ratings
 * Returns: Provider (detailed)
 */
export async function getProviderById(id) {
  if (!id) {
    const error = new Error('Provider ID required');
    error.status = 400;
    throw error;
  }

  try {
    const provider = await apiFetch(`/users/providers/${id}`);
    return provider;
  } catch (err) {
    console.error('Failed to fetch provider:', err);
    throw err;
  }
}

/**
 * Get provider availability
 * GET /availability/:providerId?date=2026-04-05
 *
 * Student views available slots for doctor
 * Returns: { availableSlots: ['10:00 AM', '10:30 AM', ...], bookedSlots: [...] }
 */
export async function getProviderAvailability(id, date) {
  if (!id || !date) {
    const error = new Error('Provider ID and date are required');
    error.status = 400;
    throw error;
  }

  try {
    const availability = await apiFetch(`/availability/${id}?date=${encodeURIComponent(date)}`);
    return availability;
  } catch (err) {
    console.error('Failed to fetch availability:', err);
    throw err;
  }
}

/**
 * Set provider/doctor availability (doctor only)
 * POST /availability
 *
 * Doctor configures working hours, slots, lunch breaks
 * Required: days, startTime, endTime, slotDuration, consultationTypes
 *
 * Returns: Availability (created)
 */
export async function setProviderAvailability(payload) {
  if (!payload.days || !payload.startTime || !payload.endTime) {
    const error = new Error('Days, start time, and end time are required');
    error.status = 400;
    throw error;
  }

  try {
    const availability = await apiFetch('/availability', {
      method: 'POST',
      body: JSON.stringify({
        days: payload.days,
        startTime: payload.startTime,
        endTime: payload.endTime,
        slotDuration: payload.slotDuration || 30,
        consultationTypes: payload.consultationTypes || ['Video Call', 'In-Person'],
        lunchBreak: payload.lunchBreak
      })
    });

    return availability;
  } catch (err) {
    console.error('Failed to set availability:', err);
    throw err;
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if video consultation can be opened
 * Used by: Student Consultation page
 *
 * Returns: boolean
 */
export function canOpenVideoVisit(appointment) {
  return Boolean(
    appointment
    && appointment.type === 'Video Call'
    && ['Ready', 'In Progress'].includes(appointment.status)
  );
}

/**
 * Get reason why video can't be opened
 * Used by: Student Consultation page (to show helpful message)
 *
 * Returns: string (error message)
 */
export function getVideoVisitBlockedReason(appointment) {
  if (!appointment || appointment.type !== 'Video Call') {
    return 'This is not an active video consultation.';
  }

  if (['Confirmed', 'Pending'].includes(appointment.status)) {
    return 'Video access unlocks only after your appointment is marked ready.';
  }

  if (appointment.status === 'Completed') {
    return 'This video consultation is already completed.';
  }

  if (['Cancelled', 'No Show'].includes(appointment.status)) {
    return 'This appointment is no longer active.';
  }

  return 'Video access is not available yet.';
}

/**
 * Format date for display
 */
export function formatAppointmentDate(dateString) {
  return new Date(dateString).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format time for display
 */
export function formatAppointmentTime(timeString) {
  return timeString; // Already formatted as "10:30 AM"
}

export default {
  // Appointments
  getAppointments,
  getAppointmentById,
  bookAppointment,
  rescheduleAppointment,
  checkInAppointment,
  cancelAppointment,
  updateConsultation,

  // Doctor operations
  getDoctorQueue,
  getDoctorPatients,
  getDoctorPatientById,
  getDoctorDashboard,

  // Student operations
  getStudentDashboard,

  // Prescriptions
  createPrescription,
  getPrescriptionHistory,
  getPrescriptionById,

  // Providers
  getProviders,
  getProviderById,
  getProviderAvailability,
  setProviderAvailability,

  // Utilities
  canOpenVideoVisit,
  getVideoVisitBlockedReason,
  formatAppointmentDate,
  formatAppointmentTime
};
