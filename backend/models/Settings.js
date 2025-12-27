import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please provide company name'],
    trim: true,
    default: 'PT. Unggul Migas Sejati'
  },
  address: {
    type: String,
    required: [true, 'Please provide address'],
    trim: true,
    default: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237'
  },
  contactPerson: {
    type: String,
    required: [true, 'Please provide contact person name'],
    trim: true,
    default: 'Budi Pekerti'
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    trim: true,
    default: '+628117584566'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'budi@gmail.com'
  },
  location: {
    type: String,
    trim: true,
    default: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237'
  },
  footerLogo: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
