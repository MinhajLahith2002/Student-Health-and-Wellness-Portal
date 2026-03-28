import { Schema, model } from 'mongoose';

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
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
  endTime: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  target: {
    type: String,
    enum: ['All Students', 'All Users', 'All Staff', 'Specific Groups'],
    required: true
  },
  targetGroup: {
    type: String
  },
  image: {
    type: String
  },
  imagePublicId: {
    type: String
  },
  capacity: {
    type: Number,
    default: 0
  },
  registeredCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Cancelled', 'Completed'],
    default: 'Draft'
  },
  color: {
    type: String,
    enum: ['blue', 'purple', 'emerald', 'amber', 'rose'],
    default: 'blue'
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

eventSchema.index({ date: 1, status: 1 });

export default model('Event', eventSchema);