import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required'],
    unique: true
  },
  transactionIds: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }],
    validate: {
      validator: function(transactionIds) {
        return transactionIds && transactionIds.length > 0;
      },
      message: 'Payment must have at least one transaction'
    }
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: [true, 'Payment method is required']
  },
  totalPaid: {
    type: Number,
    required: [true, 'Total paid amount is required'],
    min: [0, 'Total paid cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient querying (avoiding duplicates)
paymentSchema.index({ userId: 1, createdAt: -1 });

// Virtual for populated user data
paymentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated payment method data
paymentSchema.virtual('paymentMethod', {
  ref: 'PaymentMethod',
  localField: 'paymentMethodId',
  foreignField: '_id',
  justOne: true
});

// Virtual for populated transaction data
paymentSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: 'transactionIds',
  foreignField: '_id'
});

// Enable virtuals in JSON
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
