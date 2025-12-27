import mongoose from 'mongoose';

const catalogSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item ID is required'],
    unique: true
  },
  isListed: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
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
catalogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Catalog = mongoose.model('Catalog', catalogSchema);

export default Catalog;
