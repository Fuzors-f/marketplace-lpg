import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Payment method name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['bank_transfer', 'e_wallet', 'cod', 'qris'],
    required: [true, 'Payment type is required']
  },
  accountNumber: {
    type: String,
    default: ''
  },
  accountName: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  active: {
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
});

// Update timestamp before saving
paymentMethodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;
