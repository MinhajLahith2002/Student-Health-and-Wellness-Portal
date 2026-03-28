import { Schema, model } from 'mongoose';

const faqSchema = new Schema({
  question: {
    type: String,
    required: true,
    
    trim: true
  },
  answer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['General', 'Security', 'Pharmacy', 'Emergency', 'Appointments', 'Mental Health', 'Payments'],
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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

faqSchema.index({ category: 1, order: 1 });

export default model('FAQ', faqSchema);