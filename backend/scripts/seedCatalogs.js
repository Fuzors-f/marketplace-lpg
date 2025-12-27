import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Catalog from '../models/Catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding catalogs...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed default catalogs
const seedCatalogs = async () => {
  try {
    await connectDB();

    // Check if catalogs already exist
    const count = await Catalog.countDocuments();
    
    if (count > 0) {
      console.log(`Catalogs already exist in database (${count} catalogs found)`);
      const catalogs = await Catalog.find();
      console.log('Current catalogs:', catalogs.map(c => ({ name: c.name })));
      process.exit(0);
    }

    // Create default LPG product catalogs
    const defaultCatalogs = [
      {
        name: 'LPG 3kg',
        description: 'Gas LPG 3kg untuk kebutuhan rumah tangga kecil. Cocok untuk memasak sehari-hari dengan konsumsi gas rendah.'
      },
      {
        name: 'LPG 5kg',
        description: 'Gas LPG 5kg untuk kebutuhan rumah tangga menengah. Pilihan ekonomis untuk keluarga kecil hingga menengah.'
      },
      {
        name: 'LPG 12kg',
        description: 'Gas LPG 12kg untuk kebutuhan rumah tangga besar atau usaha kecil menengah. Lebih tahan lama dan ekonomis untuk pemakaian intensif.'
      },
      {
        name: 'LPG 50kg',
        description: 'Gas LPG 50kg untuk kebutuhan industri dan usaha besar. Ideal untuk restoran, hotel, atau pabrik yang membutuhkan pasokan gas dalam jumlah besar.'
      }
    ];

    const createdCatalogs = await Catalog.insertMany(defaultCatalogs);

    console.log('✅ Catalogs seeded successfully!');
    console.log(`Created ${createdCatalogs.length} catalogs:`);
    createdCatalogs.forEach((catalog, index) => {
      console.log(`${index + 1}. ${catalog.name}`);
      console.log(`   Description: ${catalog.description}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding catalogs:', error);
    process.exit(1);
  }
};

seedCatalogs();
