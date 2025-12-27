import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Admin from '../models/Admin.js';
import Settings from '../models/Settings.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Catalog from '../models/Catalog.js';
import Item from '../models/Item.js';
import Stock from '../models/Stock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding database...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed Admin
const seedAdmin = async () => {
  console.log('\n📋 Seeding Admin...');
  const existingAdmin = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
  
  if (existingAdmin) {
    console.log('✓ Admin already exists');
    return;
  }

  await Admin.create({
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'superadmin'
  });
  
  console.log('✅ Admin created successfully');
  console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
  console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
};

// Seed Settings
const seedSettings = async () => {
  console.log('\n📋 Seeding Settings...');
  const existingSettings = await Settings.findOne();
  
  if (existingSettings) {
    console.log('✓ Settings already exist');
    return;
  }

  await Settings.create({
    companyName: 'PT. Unggul Migas Sejati',
    address: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237',
    contactPerson: 'Budi Pekerti',
    phone: '+628117584566',
    email: 'budi@gmail.com',
    location: 'Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, Nusa Tenggara Bar. 83237',
    footerLogo: ''
  });
  
  console.log('✅ Settings created successfully');
};

// Seed Payment Methods
const seedPaymentMethods = async () => {
  console.log('\n📋 Seeding Payment Methods...');
  const count = await PaymentMethod.countDocuments();
  
  if (count > 0) {
    console.log(`✓ Payment methods already exist (${count} methods)`);
    return;
  }

  const methods = [
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
    }
  ];

  await PaymentMethod.insertMany(methods);
  console.log(`✅ Created ${methods.length} payment methods`);
};

// Seed Catalogs
const seedCatalogs = async () => {
  console.log('\n📋 Seeding Catalogs...');
  const count = await Catalog.countDocuments();
  
  if (count > 0) {
    console.log(`✓ Catalogs already exist (${count} catalogs)`);
    return;
  }

  const catalogs = [
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

  await Catalog.insertMany(catalogs);
  console.log(`✅ Created ${catalogs.length} catalogs`);
};

// Seed Items
const seedItems = async () => {
  console.log('\n📋 Seeding Items...');
  const itemCount = await Item.countDocuments();
  
  if (itemCount > 0) {
    console.log(`✓ Items already exist (${itemCount} items)`);
    return;
  }

  const catalogs = await Catalog.find();
  const catalogMap = {};
  catalogs.forEach(catalog => {
    catalogMap[catalog.name] = catalog._id;
  });

  const items = [
    // LPG 3kg
    {
      catalogId: catalogMap['LPG 3kg'],
      name: 'Gas LPG 3kg Bright Gas',
      description: 'Gas LPG 3kg merek Bright Gas. Kualitas terjamin, aman untuk penggunaan rumah tangga.',
      price: 20000,
      image: ''
    },
    {
      catalogId: catalogMap['LPG 3kg'],
      name: 'Gas LPG 3kg Pertamina',
      description: 'Gas LPG 3kg subsidi dari Pertamina. Harga terjangkau untuk kebutuhan rumah tangga.',
      price: 18000,
      image: ''
    },
    
    // LPG 5kg
    {
      catalogId: catalogMap['LPG 5kg'],
      name: 'Gas LPG 5kg Bright Gas',
      description: 'Gas LPG 5kg merek Bright Gas. Pilihan ekonomis untuk keluarga menengah.',
      price: 85000,
      image: ''
    },
    {
      catalogId: catalogMap['LPG 5kg'],
      name: 'Gas LPG 5kg Pertamina Blue Gaz',
      description: 'Gas LPG 5kg Pertamina Blue Gaz. Kualitas premium dengan tabung kokoh.',
      price: 90000,
      image: ''
    },
    
    // LPG 12kg
    {
      catalogId: catalogMap['LPG 12kg'],
      name: 'Gas LPG 12kg Bright Gas',
      description: 'Gas LPG 12kg merek Bright Gas. Tahan lama untuk kebutuhan intensif.',
      price: 150000,
      image: ''
    },
    {
      catalogId: catalogMap['LPG 12kg'],
      name: 'Gas LPG 12kg Pertamina',
      description: 'Gas LPG 12kg dari Pertamina. Standar industri untuk rumah tangga dan usaha kecil.',
      price: 145000,
      image: ''
    },
    {
      catalogId: catalogMap['LPG 12kg'],
      name: 'Gas LPG 12kg Elpiji Premium',
      description: 'Gas LPG 12kg kualitas premium. Tabung berkualitas tinggi dengan keamanan terjamin.',
      price: 155000,
      image: ''
    },
    
    // LPG 50kg
    {
      catalogId: catalogMap['LPG 50kg'],
      name: 'Gas LPG 50kg Industrial',
      description: 'Gas LPG 50kg untuk kebutuhan industri. Cocok untuk restoran, hotel, dan pabrik.',
      price: 550000,
      image: ''
    }
  ];

  const createdItems = await Item.insertMany(items);

  // Create initial stock (0) for each item
  const stockRecords = createdItems.map(item => ({
    itemId: item._id,
    type: 'IN',
    quantity: 0,
    note: 'Initial stock - please add stock via admin panel',
    date: new Date()
  }));

  await Stock.insertMany(stockRecords);
  console.log(`✅ Created ${createdItems.length} items with initial stock records`);
};

// Main seed function
const seedAll = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log('=' .repeat(50));
    
    await connectDB();
    
    await seedAdmin();
    await seedSettings();
    await seedPaymentMethods();
    await seedCatalogs();
    await seedItems();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Admin users: ${await Admin.countDocuments()}`);
    console.log(`   - Settings: ${await Settings.countDocuments()}`);
    console.log(`   - Payment methods: ${await PaymentMethod.countDocuments()}`);
    console.log(`   - Catalogs: ${await Catalog.countDocuments()}`);
    console.log(`   - Items: ${await Item.countDocuments()}`);
    console.log(`   - Stock records: ${await Stock.countDocuments()}`);
    
    console.log('\n⚠️  Note: All items start with 0 stock. Please add stock via admin panel.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedAll();
