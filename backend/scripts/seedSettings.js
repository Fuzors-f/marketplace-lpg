import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Settings from '../models/Settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding settings...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed default settings
const seedSettings = async () => {
  try {
    await connectDB();

    // Check if settings already exist
    const existingSettings = await Settings.findOne();
    
    if (existingSettings) {
      console.log('Settings already exist in database');
      console.log('Current settings:', existingSettings);
      process.exit(0);
    }

    // Create default settings
    const defaultSettings = await Settings.create({
      companyName: 'PT. Unggul Migas Sejati',
      address: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237',
      contactPerson: 'Budi Pekerti',
      phone: '+628117584566',
      email: 'budi@gmail.com',
      location: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237',
      footerLogo: null
    });

    console.log('✅ Default settings created successfully!');
    console.log('Settings:', defaultSettings);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding settings:', error);
    process.exit(1);
  }
};

// Run the seed function
seedSettings();
