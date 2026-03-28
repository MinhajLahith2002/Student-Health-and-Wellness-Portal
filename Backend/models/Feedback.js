import { Schema, model } from 'mongoose';

const feedbackSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  module: {
    type: String,
    
    enum: ['Appointments', 'Mental Health', 'Pharmacy', 'General', 'Doctor', 'Counselor'],
    required: true
  },
  item: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Flagged', 'Critical', 'Responded'],
    default: 'Pending'
  },
  response: {
    type: String
  },
  respondedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: Date,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
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

feedbackSchema.index({ module: 1, createdAt: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ sentiment: 1 });

export default model('Feedback', feedbackSchema);