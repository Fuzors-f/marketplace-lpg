import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Item from '../models/Item.js';
import Catalog from '../models/Catalog.js';
import Stock from '../models/Stock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding items...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed default items
const seedItems = async () => {
  try {
    await connectDB();

    // Check if items already exist
    const itemCount = await Item.countDocuments();
    
    if (itemCount > 0) {
      console.log(`Items already exist in database (${itemCount} items found)`);
      const items = await Item.find().populate('catalogId');
      console.log('Current items:', items.map(i => ({ 
        name: i.name, 
        price: i.price, 
        catalog: i.catalogId?.name 
      })));
      process.exit(0);
    }

    // Get all catalogs
    const catalogs = await Catalog.find();
    
    if (catalogs.length === 0) {
      console.log('⚠️  No catalogs found! Please run seedCatalogs.js first.');
      process.exit(1);
    }

    // Create a map of catalog names to IDs
    const catalogMap = {};
    catalogs.forEach(catalog => {
      catalogMap[catalog.name] = catalog._id;
    });

    // Create default LPG items
    const defaultItems = [
      // LPG 3kg items
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
      
      // LPG 5kg items
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
      
      // LPG 12kg items
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
      
      // LPG 50kg items (if catalog exists)
      ...(catalogMap['LPG 50kg'] ? [
        {
          catalogId: catalogMap['LPG 50kg'],
          name: 'Gas LPG 50kg Industrial',
          description: 'Gas LPG 50kg untuk kebutuhan industri. Cocok untuk restoran, hotel, dan pabrik.',
          price: 550000,
          image: ''
        }
      ] : [])
    ];

    const createdItems = await Item.insertMany(defaultItems);

    // Create initial stock for each item (all start with 0 stock)
    const stockRecords = createdItems.map(item => ({
      itemId: item._id,
      type: 'IN',
      quantity: 0,
      note: 'Initial stock - please add stock via admin panel',
      date: new Date()
    }));

    await Stock.insertMany(stockRecords);

    console.log('✅ Items seeded successfully!');
    console.log(`Created ${createdItems.length} items with initial stock records:`);
    
    // Group by catalog
    const itemsByCatalog = {};
    for (const item of createdItems) {
      const catalog = await Catalog.findById(item.catalogId);
      if (!itemsByCatalog[catalog.name]) {
        itemsByCatalog[catalog.name] = [];
      }
      itemsByCatalog[catalog.name].push(item);
    }

    Object.keys(itemsByCatalog).forEach(catalogName => {
      console.log(`\n📦 ${catalogName}:`);
      itemsByCatalog[catalogName].forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} - Rp ${item.price.toLocaleString('id-ID')}`);
      });
    });

    console.log('\n⚠️  Note: All items start with 0 stock. Please add stock via admin panel.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding items:', error);
    process.exit(1);
  }
};

seedItems();
