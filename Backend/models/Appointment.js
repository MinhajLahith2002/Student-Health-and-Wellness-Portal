import { Schema, model } from 'mongoose';

const appointmentSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialty: {
    type: String,
    required: true
  },
  doctorImage: {
    type: String
  },
  studentName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 30 // minutes
  },
  type: {
    type: String,
    enum: ['Video Call', 'In-Person'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Ready', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    default: 'Pending'
  },
  meetingLink: {
    type: String
  },
  location: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  consultationNotes: {
    type: String,
    maxlength: 4000
  },
  diagnosis: {
    type: String,
    maxlength: 1000
  },
  symptoms: {
    type: String
  },
  checkInAt: {
    type: Date,
    default: null
  },
  followUpDate: {
    type: Date,
    default: null
  },
  followUpReason: {
    type: String,
    maxlength: 500
  },
  prescriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  cancellationReason: {
    type: String
  },
  cancelledBy: {
    type: String,
    enum: ['student', 'doctor', 'system']
  },
  cancelledAt: Date,
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
appointmentSchema.index({ studentId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ status: 1, date: 1 });

export default model('Appointment', appointmentSchema);
