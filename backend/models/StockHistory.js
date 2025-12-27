import mongoose from 'mongoose';

const stockHistorySchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item ID is required']
  },
  type: {
    type: String,
    enum: ['IN', 'OUT'],
    required: [true, 'Type is required (IN or OUT)']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  reason: {
    type: String,
    enum: ['restock', 'sold', 'purchased', 'damaged', 'correction', 'return', 'initial', 'other'],
    required: [true, 'Reason is required']
  },
  note: {
    type: String,
    default: ''
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  performedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'performedBy.userType'
    },
    userType: {
      type: String,
      enum: ['User', 'Admin'],
      default: 'Admin'
    },
    name: {
      type: String,
      default: 'System'
    }
  },
  referenceId: {
    type: String,
    default: null
  },
  referenceType: {
    type: String,
    enum: ['transaction', 'order', 'manual', 'system'],
    default: 'manual'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
stockHistorySchema.index({ itemId: 1, createdAt: -1 });
stockHistorySchema.index({ reason: 1 });
stockHistorySchema.index({ 'performedBy.userId': 1 });

const StockHistory = mongoose.model('StockHistory', stockHistorySchema);

export default StockHistory;
