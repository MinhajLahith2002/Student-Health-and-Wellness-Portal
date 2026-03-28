import { Schema, model } from 'mongoose';

const medicineSchema = new Schema({
  name: {
    type: String,
    required: true
    
  },
  dosage: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    enum: ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'As needed', 'Before meals', 'After meals'],
    default: 'Once daily'
  },
  instructions: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  }
});

const prescriptionSchema = new Schema({
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  medicines: [medicineSchema],
  notes: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Filled', 'Picked Up'],
    default: 'Pending'
  },
  imageUrl: {
    type: String
  },
  imagePublicId: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  pharmacistNotes: {
    type: String
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days from creation
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

prescriptionSchema.index({ studentId: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1 });

export default model('Prescription', prescriptionSchema);