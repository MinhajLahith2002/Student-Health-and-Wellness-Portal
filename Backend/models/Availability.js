import { Schema, model } from 'mongoose';

const breakSchema = new Schema({
  startTime: {
    type: String,
    required: true,
    trim: true
  },
  endTime: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, { _id: false });

const availabilitySchema = new Schema({
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['doctor', 'counselor'],
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 120
  },
  date: {
    type: Date,
    default: null
  },
  recurringDays: [{
    type: Number,
    min: 0,
    max: 6
  }],
  startTime: {
    type: String,
    trim: true,
    required() {
      return !this.isUnavailable;
    }
  },
  endTime: {
    type: String,
    trim: true,
    required() {
      return !this.isUnavailable;
    }
  },
  slotDuration: {
    type: Number,
    default: 30,
    min: 15,
    max: 120
  },
  consultationTypes: [{
    type: String,
    enum: ['Video Call', 'In-Person', 'Chat']
  }],
  breaks: [breakSchema],
  isUnavailable: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

availabilitySchema.index({ providerId: 1, date: 1, status: 1 });
availabilitySchema.index({ providerId: 1, recurringDays: 1, status: 1 });

export default model('Availability', availabilitySchema);
