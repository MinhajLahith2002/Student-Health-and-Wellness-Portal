const STORAGE_USER = 'campushealth_user';
const APPOINTMENTS_KEY = 'campushealth_demo_appointments_v1';
const PRESCRIPTIONS_KEY = 'campushealth_demo_prescriptions_v1';

const DEMO_DOCTOR = {
  id: 'demo-doctor-primary',
  email: 'doctor@gmail.com',
  name: 'Dr. Campus Demo',
  specialty: 'General Medicine',
  profileImage: ''
};

const DEMO_STUDENT = {
  id: 'demo-student-john',
  email: 'john.doe@student.edu',
  name: 'John Doe',
  studentId: 'ST2026-001',
  profileImage: '',
  bloodType: 'O+',
  allergies: ['Penicillin'],
  medicalHistory: [
    { condition: 'Seasonal allergies', status: 'monitoring' },
    { condition: 'Migraine history', status: 'managed' }
  ]
};

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentUser() {
  return readStorage(STORAGE_USER, null);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

function formatDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function seedAppointments() {
  return [
    {
      _id: 'demo-appointment-upcoming',
      studentId: DEMO_STUDENT.id,
      studentEmail: DEMO_STUDENT.email,
      studentName: DEMO_STUDENT.name,
      studentRecord: DEMO_STUDENT,
      doctorId: DEMO_DOCTOR.id,
      doctorEmail: DEMO_DOCTOR.email,
      doctorName: DEMO_DOCTOR.name,
      doctorSpecialty: DEMO_DOCTOR.specialty,
      doctorImage: DEMO_DOCTOR.profileImage,
      date: formatDateOffset(1),
      time: '10:30 AM',
      duration: 30,
      type: 'Video Call',
      status: 'Confirmed',
      meetingLink: 'https://campushealth.local/demo-consultation/upcoming',
      location: null,
      symptoms: 'Follow-up consultation for headaches and study fatigue.',
      notes: 'Prefers a morning consultation slot.',
      consultationNotes: '',
      diagnosis: '',
      checkInAt: null,
      followUpDate: '',
      followUpReason: '',
      prescriptionId: '',
      cancellationReason: '',
      cancelledBy: '',
      cancelledAt: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'demo-appointment-history',
      studentId: DEMO_STUDENT.id,
      studentEmail: DEMO_STUDENT.email,
      studentName: DEMO_STUDENT.name,
      studentRecord: DEMO_STUDENT,
      doctorId: DEMO_DOCTOR.id,
      doctorEmail: DEMO_DOCTOR.email,
      doctorName: DEMO_DOCTOR.name,
      doctorSpecialty: DEMO_DOCTOR.specialty,
      doctorImage: DEMO_DOCTOR.profileImage,
      date: formatDateOffset(-5),
      time: '02:00 PM',
      duration: 30,
      type: 'In-Person',
      status: 'Completed',
      meetingLink: '',
      location: 'Campus Health Center',
      symptoms: 'Cold symptoms and sore throat.',
      notes: 'Requested a quick follow-up after medicines.',
      consultationNotes: 'Advised hydration, rest, and short follow-up if symptoms continue.',
      diagnosis: 'Upper respiratory tract irritation',
      checkInAt: new Date().toISOString(),
      followUpDate: formatDateOffset(7),
      followUpReason: 'Review recovery progress',
      prescriptionId: 'demo-prescription-history',
      cancellationReason: '',
      cancelledBy: '',
      cancelledAt: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function seedPrescriptions() {
  return [
    {
      _id: 'demo-prescription-history',
      appointmentId: 'demo-appointment-history',
      doctorId: DEMO_DOCTOR.id,
      doctorEmail: DEMO_DOCTOR.email,
      doctorName: DEMO_DOCTOR.name,
      studentId: DEMO_STUDENT.id,
      studentEmail: DEMO_STUDENT.email,
      createdAt: new Date().toISOString(),
      date: formatDateOffset(-5),
      status: 'Issued',
      medicines: [
        {
          name: 'Paracetamol',
          dosage: '500mg',
          duration: '3 days',
          frequency: 'Twice daily',
          instructions: 'Take after meals and rest well.'
        }
      ],
      notes: 'Continue fluids and monitor symptoms.'
    }
  ];
}

function ensureSeededData() {
  const existingAppointments = readStorage(APPOINTMENTS_KEY, null);
  const existingPrescriptions = readStorage(PRESCRIPTIONS_KEY, null);

  if (!Array.isArray(existingAppointments) || existingAppointments.length === 0) {
    writeStorage(APPOINTMENTS_KEY, seedAppointments());
  }

  if (!Array.isArray(existingPrescriptions) || existingPrescriptions.length === 0) {
    writeStorage(PRESCRIPTIONS_KEY, seedPrescriptions());
  }
}

function getAllAppointments() {
  ensureSeededData();
  return readStorage(APPOINTMENTS_KEY, []);
}

function saveAllAppointments(appointments) {
  writeStorage(APPOINTMENTS_KEY, appointments);
}

function getAllPrescriptions() {
  ensureSeededData();
  return readStorage(PRESCRIPTIONS_KEY, []);
}

function saveAllPrescriptions(prescriptions) {
  writeStorage(PRESCRIPTIONS_KEY, prescriptions);
}

function assertAuthenticated() {
  const user = getCurrentUser();
  if (!user) {
    const error = new Error('Please log in first.');
    error.status = 401;
    throw error;
  }

  return user;
}

function assertRole(user, allowedRoles) {
  if (!allowedRoles.includes(user.role)) {
    const error = new Error(`Role ${user.role} is not authorized to access this feature`);
    error.status = 403;
    throw error;
  }
}

function matchesAppointmentUser(appointment, user) {
  if (user.role === 'student') {
    return appointment.studentEmail === user.email || appointment.studentId === user.id;
  }

  if (user.role === 'doctor') {
    return appointment.doctorEmail === user.email || appointment.doctorId === user.id;
  }

  return false;
}

function getAccessibleAppointments() {
  const user = assertAuthenticated();
  assertRole(user, ['student', 'doctor']);

  return getAllAppointments()
    .filter((appointment) => matchesAppointmentUser(appointment, user))
    .sort((left, right) => {
      const leftValue = toDateTime(dateOnly(left.date), left.time)?.getTime() || 0;
      const rightValue = toDateTime(dateOnly(right.date), right.time)?.getTime() || 0;
      return leftValue - rightValue;
    });
}

function requireAppointmentAccess(id) {
  const user = assertAuthenticated();
  const appointment = getAllAppointments().find((item) => item._id === id);

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }

  if (!matchesAppointmentUser(appointment, user)) {
    const error = new Error('Unauthorized');
    error.status = 403;
    throw error;
  }

  return { appointment, user };
}

function hydrateAppointment(appointment) {
  return {
    ...appointment,
    studentId: appointment.studentRecord || appointment.studentId
  };
}

export function getAppointments(params = {}) {
  const { status, startDate, endDate } = params;
  let appointments = getAccessibleAppointments();

  if (status && status !== 'All') {
    appointments = appointments.filter((appointment) => appointment.status === status);
  }

  if (startDate) {
    appointments = appointments.filter((appointment) => dateOnly(appointment.date) >= startDate);
  }

  if (endDate) {
    appointments = appointments.filter((appointment) => dateOnly(appointment.date) <= endDate);
  }

  return Promise.resolve({
    appointments: appointments.map(hydrateAppointment),
    totalPages: 1,
    currentPage: 1,
    total: appointments.length
  });
}

export function getAppointmentById(id) {
  const { appointment } = requireAppointmentAccess(id);
  return Promise.resolve(hydrateAppointment(deepClone(appointment)));
}

export function bookAppointment(payload) {
  const user = assertAuthenticated();
  assertRole(user, ['student']);

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

  const appointment = {
    _id: createId('appointment'),
    studentId: user.id || DEMO_STUDENT.id,
    studentEmail: user.email || DEMO_STUDENT.email,
    studentName: user.name || DEMO_STUDENT.name,
    studentRecord: {
      ...DEMO_STUDENT,
      _id: user.id || DEMO_STUDENT.id,
      email: user.email || DEMO_STUDENT.email,
      name: user.name || DEMO_STUDENT.name
    },
    doctorId: payload.doctorId,
    doctorEmail: payload.doctorEmail || DEMO_DOCTOR.email,
    doctorName: payload.doctorName || DEMO_DOCTOR.name,
    doctorSpecialty: payload.doctorSpecialty || DEMO_DOCTOR.specialty,
    doctorImage: payload.doctorImage || '',
    date: payload.date,
    time: payload.time,
    duration: 30,
    type: payload.type,
    status: 'Confirmed',
    meetingLink: payload.type === 'Video Call' ? `https://campushealth.local/demo-consultation/${Date.now()}` : '',
    location: payload.type === 'In-Person' ? 'Campus Health Center' : '',
    symptoms: payload.symptoms || '',
    notes: payload.notes || '',
    consultationNotes: '',
    diagnosis: '',
    checkInAt: null,
    followUpDate: '',
    followUpReason: '',
    prescriptionId: '',
    cancellationReason: '',
    cancelledBy: '',
    cancelledAt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const appointments = getAllAppointments();
  appointments.push(appointment);
  saveAllAppointments(appointments);

  return Promise.resolve(hydrateAppointment(deepClone(appointment)));
}

export function updateAppointmentStatus(id, payload) {
  const { user } = requireAppointmentAccess(id);

  if (user.role === 'student' && payload.status !== 'Cancelled') {
    const error = new Error('Students can only cancel appointments');
    error.status = 403;
    throw error;
  }

  const appointments = getAllAppointments().map((item) => {
    if (item._id !== id) return item;

    return {
      ...item,
      status: payload.status,
      cancellationReason: payload.status === 'Cancelled' ? payload.cancellationReason || 'Cancelled by student' : item.cancellationReason,
      cancelledBy: payload.status === 'Cancelled' ? user.role : item.cancelledBy,
      cancelledAt: payload.status === 'Cancelled' ? new Date().toISOString() : item.cancelledAt,
      updatedAt: new Date().toISOString()
    };
  });

  saveAllAppointments(appointments);
  return getAppointmentById(id);
}

export function rescheduleAppointment(id, payload) {
  const { appointment } = requireAppointmentAccess(id);

  if (['Completed', 'Cancelled', 'No Show'].includes(appointment.status)) {
    const error = new Error('This appointment can no longer be rescheduled');
    error.status = 400;
    throw error;
  }

  if (!payload.date || !payload.time) {
    const error = new Error('Date and time are required');
    error.status = 400;
    throw error;
  }

  if (isPastDateTime(payload.date, payload.time)) {
    const error = new Error('Appointments must be rescheduled to a future time slot');
    error.status = 400;
    throw error;
  }

  const appointments = getAllAppointments().map((item) => {
    if (item._id !== id) return item;

    return {
      ...item,
      date: payload.date,
      time: payload.time,
      type: payload.type || item.type,
      status: 'Confirmed',
      meetingLink: (payload.type || item.type) === 'Video Call' ? `https://campushealth.local/demo-consultation/${id}` : '',
      location: (payload.type || item.type) === 'In-Person' ? 'Campus Health Center' : '',
      updatedAt: new Date().toISOString()
    };
  });

  saveAllAppointments(appointments);
  return getAppointmentById(id);
}

export function checkInAppointment(id) {
  const { appointment, user } = requireAppointmentAccess(id);
  assertRole(user, ['student']);

  if (appointment.status !== 'Confirmed') {
    const error = new Error('Only confirmed appointments can be checked in');
    error.status = 400;
    throw error;
  }

  if (dateOnly(appointment.date) !== dateOnly(new Date())) {
    const error = new Error('Appointments can only be checked in on the scheduled date');
    error.status = 400;
    throw error;
  }

  const appointments = getAllAppointments().map((item) => (
    item._id === id
      ? {
        ...item,
        checkInAt: new Date().toISOString(),
        status: 'Ready',
        updatedAt: new Date().toISOString()
      }
      : item
  ));

  saveAllAppointments(appointments);
  return getAppointmentById(id);
}

export function updateConsultation(id, payload) {
  const { user } = requireAppointmentAccess(id);
  assertRole(user, ['doctor']);

  const allowedStatuses = ['Confirmed', 'Ready', 'In Progress', 'Completed', 'No Show'];

  const appointments = getAllAppointments().map((item) => {
    if (item._id !== id) return item;

    return {
      ...item,
      consultationNotes: payload.consultationNotes ?? item.consultationNotes,
      diagnosis: payload.diagnosis ?? item.diagnosis,
      followUpDate: payload.followUpDate ?? item.followUpDate,
      followUpReason: payload.followUpReason ?? item.followUpReason,
      meetingLink: payload.meetingLink ?? item.meetingLink,
      location: payload.location ?? item.location,
      prescriptionId: payload.prescriptionId ?? item.prescriptionId,
      status: payload.status && allowedStatuses.includes(payload.status) ? payload.status : item.status,
      updatedAt: new Date().toISOString()
    };
  });

  saveAllAppointments(appointments);
  return getAppointmentById(id);
}

export function getDoctorQueue() {
  const user = assertAuthenticated();
  assertRole(user, ['doctor']);

  const queue = getAllAppointments()
    .filter((appointment) => (
      (appointment.doctorEmail === user.email || appointment.doctorId === user.id)
      && dateOnly(appointment.date) === dateOnly(new Date())
      && ['Confirmed', 'Ready', 'In Progress'].includes(appointment.status)
    ))
    .map(hydrateAppointment);

  return Promise.resolve(queue);
}

export function getDoctorPatients() {
  const user = assertAuthenticated();
  assertRole(user, ['doctor']);

  const appointments = getAllAppointments()
    .filter((appointment) => appointment.doctorEmail === user.email || appointment.doctorId === user.id)
    .sort((left, right) => (new Date(right.date).getTime() - new Date(left.date).getTime()));

  const patientMap = new Map();

  appointments.forEach((appointment) => {
    const key = appointment.studentId;
    if (!patientMap.has(key)) {
      patientMap.set(key, {
        _id: appointment.studentId,
        name: appointment.studentName,
        email: appointment.studentEmail,
        studentId: appointment.studentRecord?.studentId || DEMO_STUDENT.studentId,
        profileImage: appointment.studentRecord?.profileImage || '',
        lastVisit: appointment.date,
        totalVisits: 1,
        latestStatus: appointment.status,
        latestAppointmentId: appointment._id
      });
      return;
    }

    patientMap.get(key).totalVisits += 1;
  });

  return Promise.resolve({ patients: [...patientMap.values()] });
}

export function getDoctorPatientById(studentId) {
  const user = assertAuthenticated();
  assertRole(user, ['doctor']);

  const appointments = getAllAppointments()
    .filter((appointment) => (
      (appointment.doctorEmail === user.email || appointment.doctorId === user.id)
      && appointment.studentId === studentId
    ))
    .sort((left, right) => (new Date(right.date).getTime() - new Date(left.date).getTime()));

  if (!appointments.length) {
    const error = new Error('Patient not found');
    error.status = 404;
    throw error;
  }

  const patient = appointments[0].studentRecord || {
    ...DEMO_STUDENT,
    _id: studentId,
    email: appointments[0].studentEmail,
    name: appointments[0].studentName
  };

  const prescriptions = getAllPrescriptions().filter((prescription) => prescription.studentId === studentId);

  return Promise.resolve({
    patient,
    appointments: appointments.map(hydrateAppointment),
    prescriptions: deepClone(prescriptions)
  });
}

export function createPrescription(payload) {
  const user = assertAuthenticated();
  assertRole(user, ['doctor']);

  const appointment = getAllAppointments().find((item) => item._id === payload.appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.status = 404;
    throw error;
  }

  const prescription = {
    _id: createId('prescription'),
    appointmentId: payload.appointmentId,
    doctorId: appointment.doctorId,
    doctorEmail: appointment.doctorEmail,
    doctorName: appointment.doctorName,
    studentId: appointment.studentId,
    studentEmail: appointment.studentEmail,
    createdAt: new Date().toISOString(),
    date: dateOnly(new Date()),
    status: 'Issued',
    medicines: payload.medicines || [],
    notes: payload.notes || ''
  };

  const prescriptions = getAllPrescriptions();
  prescriptions.unshift(prescription);
  saveAllPrescriptions(prescriptions);

  const appointments = getAllAppointments().map((item) => (
    item._id === payload.appointmentId
      ? { ...item, prescriptionId: prescription._id, updatedAt: new Date().toISOString() }
      : item
  ));
  saveAllAppointments(appointments);

  return Promise.resolve(deepClone(prescription));
}

export function getPrescriptionHistory() {
  const user = assertAuthenticated();
  const prescriptions = getAllPrescriptions().filter((prescription) => {
    if (user.role === 'student') {
      return prescription.studentEmail === user.email || prescription.studentId === user.id;
    }

    if (user.role === 'doctor') {
      return prescription.doctorEmail === user.email || prescription.doctorId === user.id;
    }

    return true;
  });

  return Promise.resolve({
    prescriptions: deepClone(prescriptions)
  });
}

export function getDoctorDashboard() {
  const user = assertAuthenticated();
  assertRole(user, ['doctor']);

  const appointments = getAllAppointments().filter((appointment) => appointment.doctorEmail === user.email || appointment.doctorId === user.id);
  const today = dateOnly(new Date());

  const todayAppointments = appointments.filter((appointment) => dateOnly(appointment.date) === today);

  return Promise.resolve({
    stats: {
      queue: todayAppointments.filter((appointment) => ['Confirmed', 'Ready', 'In Progress'].includes(appointment.status)).length,
      pendingPrescriptions: appointments.filter((appointment) => appointment.status === 'In Progress' && !appointment.prescriptionId).length,
      activeSchedules: 3
    },
    todayAppointments: deepClone(todayAppointments)
  });
}

export function getStudentDashboard() {
  const user = assertAuthenticated();
  assertRole(user, ['student']);

  const appointments = getAllAppointments()
    .filter((appointment) => appointment.studentEmail === user.email || appointment.studentId === user.id)
    .sort((left, right) => {
      const leftValue = toDateTime(dateOnly(left.date), left.time)?.getTime() || 0;
      const rightValue = toDateTime(dateOnly(right.date), right.time)?.getTime() || 0;
      return leftValue - rightValue;
    });

  const prescriptions = getAllPrescriptions().filter((prescription) => prescription.studentEmail === user.email || prescription.studentId === user.id);

  return Promise.resolve({
    upcomingAppointments: deepClone(appointments.filter((appointment) => ['Pending', 'Confirmed', 'Ready', 'In Progress'].includes(appointment.status)).slice(0, 4)),
    upcomingCounselingSessions: [],
    recentPrescriptions: deepClone(prescriptions.slice(0, 4)),
    moodTrends: {
      averageMood: '6.4'
    }
  });
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
