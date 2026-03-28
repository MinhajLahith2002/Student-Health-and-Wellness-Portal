import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    
    required: true
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    enum: ['Auth', 'Users', 'Appointments', 'Prescriptions', 'Orders', 'Pharmacy', 'Mental Health', 'Admin', 'Settings', 'System'],
    required: true
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  level: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'critical'],
    default: 'info'
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ level: 1, timestamp: -1 });
auditLogSchema.index({ module: 1 });

export default model('AuditLog', auditLogSchema);