import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  type: {
    type: String,
    enum: ['IN', 'OUT'],
    required: [true, 'Type is required (IN or OUT)']
  },
  note: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
stockSchema.index({ itemId: 1, date: -1 });

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;
