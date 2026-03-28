import { Schema, model } from 'mongoose';

const pharmacySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  queueLength: {
    type: Number,
    default: 0
  },
  estimatedWaitTime: {
    type: Number,
    default: 0
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  services: [{
    type: String,
    enum: ['Prescription', 'OTC', 'Vaccinations', 'Health Check', 'Consultation']
  }],
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

pharmacySchema.index({ location: '2dsphere' });

export default model('Pharmacy', pharmacySchema);