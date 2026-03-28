import { Schema, model } from 'mongoose';

const reportSchema = new Schema({
  name: {
    type: String,
    required: true
    
  },
  type: {
    type: String,
    enum: ['appointments', 'prescriptions', 'pharmacy', 'users', 'revenue', 'activity'],
    required: true
  },
  format: {
    type: String,
    enum: ['PDF', 'CSV', 'Excel'],
    required: true
  },
  parameters: {
    dateRange: {
      start: Date,
      end: Date
    },
    filters: Schema.Types.Mixed
  },
  fileUrl: {
    type: String
  },
  fileSize: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Generating', 'Completed', 'Failed'],
    default: 'Pending'
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: Date,
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reportSchema.index({ generatedBy: 1, createdAt: -1 });
reportSchema.index({ status: 1 });

export default model('Report', reportSchema);