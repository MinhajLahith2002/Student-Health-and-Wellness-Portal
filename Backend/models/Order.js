import { Schema, model } from 'mongoose';

const orderItemSchema = new Schema({
  medicineId: {
    type: Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  name: {
    type: String,
    
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new Schema({
  orderId: {
    type: String,
    unique: true
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
  studentEmail: {
    type: String,
    required: true
  },
  studentPhone: {
    type: String
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 2.50
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pricing Pending', 'Pending', 'Verified', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  orderType: {
    type: String,
    enum: ['Direct', 'Prescription'],
    default: 'Direct'
  },
  paymentMethod: {
    type: String,
    enum: ['Campus Card', 'Credit Card', 'Debit Card', 'Cash on Delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  address: {
    type: String,
    required: true
  },
  specialInstructions: {
    type: String
  },
  prescriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  trackingNumber: {
    type: String
  },
  estimatedDelivery: {
    type: Date
  },
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
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

// Generate order ID before saving
orderSchema.pre('save', async function() {
  if (this.isNew && !this.orderId) {
    const count = await model('Order').countDocuments();
    this.orderId = `ORD-${(count + 1).toString().padStart(5, '0')}`;
  }
});

orderSchema.index({ studentId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export default model('Order', orderSchema);
