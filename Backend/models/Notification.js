import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['appointment', 'prescription', 'order', 'pharmacy', 'system', 'alert', 'promotion'],
    required: true
  },
  target: {
    type: String,
    enum: ['All Users', 'All Students', 'All Doctors', 'All Staff', 'All Pharmacists', 'Specific Role', 'Specific User'],
    required: true
  },
  targetRole: {
    type: String,
    enum: ['student', 'doctor', 'pharmacist', 'admin', 'counselor']
  },
  targetUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  recipients: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Sent', 'Failed'],
    default: 'Draft'
  },
  scheduledFor: {
    type: Date
  },
  sentAt: Date,
  readBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  link: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ recipients: 1, createdAt: -1 });

export default model('Notification', notificationSchema);