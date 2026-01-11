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
  locationInfo: {
    type: String,
    trim: true,
    default: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237'
  },
  contactPersons: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  }],
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
