import { Schema, model } from 'mongoose';

const counselingSessionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  counselorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  counselorName: {
    type: String,
    required: true
  },
  counselorSpecialty: {
    type: String,
    default: 'Counselor'
  },
  counselorImage: {
    type: String,
    default: null
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
    default: 50
  },
  type: {
    type: String,
    enum: ['Video Call', 'In-Person', 'Chat'],
    required: true
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Crisis'],
    default: 'Medium'
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Ready', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Confirmed'
  },
  meetingLink: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  checkInAt: {
    type: Date,
    default: null
  },
  confidentialNotes: {
    type: String,
    trim: true,
    maxlength: 4000,
    default: ''
  },
  sharedSummary: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  actionPlan: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  assignedResources: [{
    type: Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  assignedResourceMessage: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  followUpRecommended: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  cancelledBy: {
    type: String,
    enum: ['student', 'counselor', 'system'],
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

counselingSessionSchema.index({ studentId: 1, date: -1 });
counselingSessionSchema.index({ counselorId: 1, date: -1 });
counselingSessionSchema.index({ status: 1, date: 1 });

export default model('CounselingSession', counselingSessionSchema);
