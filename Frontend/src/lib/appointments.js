export async function getAppointments(params = {}) {
  // PHASE 3: API Integration - Replace demo localStorage with real backend
  try {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const { apiFetch } = await import('./api.js');
    const response = await apiFetch(`/appointments?${queryParams}`);

    return {
      appointments: Array.isArray(response.appointments) ? response.appointments : [],
      totalPages: response.totalPages || 1,
      currentPage: response.currentPage || 1,
      total: response.total || 0
    };
  } catch (err) {
    console.error('getAppointments error:', err);
    throw err;
  }
}

export async function getAppointmentById(id) {
  // PHASE 3: API Integration - Get single appointment from backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch(`/appointments/${id}`);
  } catch (err) {
    console.error(`getAppointmentById(${id}) error:`, err);
    throw err;
  }
}

export async function bookAppointment(payload) {
  // PHASE 3: API Integration - Book appointment via backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        availabilityId: payload.availabilityId || undefined
      })
    });
  } catch (err) {
    console.error('bookAppointment error:', err);
    throw err;
  }
}

export async function updateAppointmentStatus(id, payload) {
  // PHASE 3: API Integration - Update appointment status via backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error(`updateAppointmentStatus(${id}) error:`, err);
    throw err;
  }
}

export async function rescheduleAppointment(id, payload) {
  // PHASE 3: API Integration - Reschedule appointment via backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch(`/appointments/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        availabilityId: payload.availabilityId || undefined
      })
    });
  } catch (err) {
    console.error(`rescheduleAppointment(${id}) error:`, err);
    throw err;
  }
}

export async function checkInAppointment(id) {
  // PHASE 3: API Integration - Check in to appointment via backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch(`/appointments/${id}/check-in`, {
      method: 'PUT',
      body: JSON.stringify({})
    });
  } catch (err) {
    console.error(`checkInAppointment(${id}) error:`, err);
    throw err;
  }
}

export async function updateConsultation(id, payload) {
  // PHASE 3: API Integration - Update consultation via backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch(`/appointments/${id}/consultation`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error(`updateConsultation(${id}) error:`, err);
    throw err;
  }
}

export async function getDoctorQueue() {
  // PHASE 3: API Integration - Get doctor's queue from backend
  try {
    const { apiFetch } = await import('./api.js');
    const response = await apiFetch('/appointments/queue');
    return Array.isArray(response) ? response : response.queue || [];
  } catch (err) {
    console.error('getDoctorQueue error:', err);
    throw err;
  }
}

export async function getDoctorPatients() {
  // PHASE 3: API Integration - Get doctor's patients from backend
  try {
    const { apiFetch } = await import('./api.js');
    const response = await apiFetch('/appointments/patients');
    return {
      patients: response.patients || response || []
    };
  } catch (err) {
    console.error('getDoctorPatients error:', err);
    throw err;
  }
}

export async function getDoctorPatientById(studentId) {
  // PHASE 3: API Integration - Get patient details from backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch(`/appointments/patients/${studentId}`);
  } catch (err) {
    console.error(`getDoctorPatientById(${studentId}) error:`, err);
    throw err;
  }
}

export async function createPrescription(payload) {
  // PHASE 3: API Integration - Create prescription via backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('createPrescription error:', err);
    throw err;
  }
}

export async function getPrescriptionHistory() {
  // PHASE 3: API Integration - Get prescription history from backend
  try {
    const { apiFetch } = await import('./api.js');
    const response = await apiFetch('/prescriptions');
    return {
      prescriptions: Array.isArray(response.prescriptions) ? response.prescriptions : Array.isArray(response) ? response : []
    };
  } catch (err) {
    console.error('getPrescriptionHistory error:', err);
    throw err;
  }
}

export async function getDoctorDashboard() {
  // PHASE 3: API Integration - Get doctor dashboard from backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch('/dashboard/doctor');
  } catch (err) {
    console.error('getDoctorDashboard error:', err);
    throw err;
  }
}

export async function getStudentDashboard() {
  // PHASE 3: API Integration - Get student dashboard from backend
  try {
    const { apiFetch } = await import('./api.js');
    return await apiFetch('/dashboard/student');
  } catch (err) {
    console.error('getStudentDashboard error:', err);
    throw err;
  }
}

export function canOpenVideoVisit(appointment) {
  return Boolean(
    appointment
    && appointment.type === 'Video Call'
    && ['Ready', 'In Progress'].includes(appointment.status)
  );
}

export function getVideoVisitBlockedReason(appointment) {
  if (!appointment || appointment.type !== 'Video Call') {
    return 'This is not an active video consultation.';
  }

  if (['Confirmed', 'Pending'].includes(appointment.status)) {
    return 'Video access unlocks when your appointment is marked ready or the doctor starts the video call.';
  }

  if (appointment.status === 'Completed') {
    return 'This video consultation is already completed.';
  }

  if (['Cancelled', 'No Show'].includes(appointment.status)) {
    return 'This appointment is no longer active.';
  }

  return 'Video access is not available yet.';
}
