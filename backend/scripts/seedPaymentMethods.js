import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PaymentMethod from '../models/PaymentMethod.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding payment methods...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed default payment methods
const seedPaymentMethods = async () => {
  try {
    await connectDB();

    // Check if payment methods already exist
    const count = await PaymentMethod.countDocuments();
    
    if (count > 0) {
      console.log(`Payment methods already exist in database (${count} methods found)`);
      const methods = await PaymentMethod.find();
      console.log('Current payment methods:', methods.map(m => ({ name: m.name, isActive: m.isActive })));
      process.exit(0);
    }

    // Create default payment methods
    const defaultMethods = [
      {
        name: 'Cash On Delivery (COD)',
        description: 'Pembayaran tunai saat barang diterima',
        isActive: true
      },
      {
        name: 'Bank Transfer - BCA',
        description: 'Transfer ke rekening BCA: 1234567890 a.n. PT. Unggul Migas Sejati',
        isActive: true
      },
      {
        name: 'Bank Transfer - Mandiri',
        description: 'Transfer ke rekening Mandiri: 0987654321 a.n. PT. Unggul Migas Sejati',
        isActive: true
      },
      {
        name: 'Bank Transfer - BNI',
        description: 'Transfer ke rekening BNI: 5555666677 a.n. PT. Unggul Migas Sejati',
        isActive: true
      },
      {
        name: 'E-Wallet - GoPay',
        description: 'Transfer ke nomor GoPay: 0811-7584-566',
        isActive: true
      },
      {
        name: 'E-Wallet - OVO',
        description: 'Transfer ke nomor OVO: 0811-7584-566',
        isActive: false
      }
    ];

    const createdMethods = await PaymentMethod.insertMany(defaultMethods);

    console.log('✅ Payment methods seeded successfully!');
    console.log(`Created ${createdMethods.length} payment methods:`);
    createdMethods.forEach((method, index) => {
      console.log(`${index + 1}. ${method.name} - ${method.isActive ? 'Active' : 'Inactive'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding payment methods:', error);
    process.exit(1);
  }
};

seedPaymentMethods();
