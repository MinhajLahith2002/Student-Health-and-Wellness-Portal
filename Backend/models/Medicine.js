import { Schema, model } from 'mongoose';

const medicineSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  strength: {
    type: String,
    required: true
    
  },
  manufacturer: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    default: 20
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['Pain Relief', 'Antibiotics', 'Allergy', 'Cold & Flu', 'Vitamins', 'First Aid', 'Personal Care', 'Hygiene', 'Wellness'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  usage: {
    type: String,
    required: true
  },
  sideEffects: {
    type: String
  },
  storage: {
    type: String
  },
  image: {
    type: String
  },
  imagePublicId: {
    type: String
  },
  genericAlternatives: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
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

medicineSchema.index({ name: 'text', category: 'text', manufacturer: 'text' });
medicineSchema.index({ category: 1 });
medicineSchema.index({ requiresPrescription: 1 });

export default model('Medicine', medicineSchema);
