# Database Seeding Scripts

This directory contains scripts to populate the database with initial data for the LPG Marketplace application.

## Available Scripts

### Individual Seed Scripts

1. **seedAdmin.js** - Creates the superadmin user
2. **seedSettings.js** - Creates company settings (footer information)
3. **seedPaymentMethods.js** - Creates default payment methods
4. **seedCatalogs.js** - Creates LPG product categories (3kg, 5kg, 12kg, 50kg)
5. **seedItems.js** - Creates sample LPG products with initial stock records

### Master Seed Script

**seedAll.js** - Runs all seed scripts in the correct order

## Usage

### Using NPM Scripts (Recommended)

```bash
# Seed everything at once (recommended for initial setup)
npm run seed:all

# Or seed individual collections
npm run seed:admin
npm run seed:settings
npm run seed:payments
npm run seed:catalogs
npm run seed:items
```

### Using Node Directly

```bash
# From backend directory
node scripts/seedAll.js

# Or individual scripts
node scripts/seedAdmin.js
node scripts/seedSettings.js
node scripts/seedPaymentMethods.js
node scripts/seedCatalogs.js
node scripts/seedItems.js
```

## Seeding Order

The scripts should be run in this order (handled automatically by `seedAll.js`):

1. **Admin** - Required for system access
2. **Settings** - Required for footer/company information
3. **Payment Methods** - Required for checkout
4. **Catalogs** - Required before creating items
5. **Items** - Depends on catalogs

## Default Data

### Admin User
- **Username:** `admin` (from .env `ADMIN_USERNAME`)
- **Password:** `admin123` (from .env `ADMIN_PASSWORD`)
- **Role:** `superadmin`

### Company Settings
- **Company Name:** PT. Unggul Migas Sejati
- **Address:** Jl. Karang Bayan, Sigerongan, Kec. Lingsar, Kabupaten Lombok Barat, NTB 83237
- **Contact Person:** Budi Pekerti
- **Phone:** +628117584566
- **Email:** budi@gmail.com

### Payment Methods
1. Cash On Delivery (COD) - **Active**
2. Bank Transfer - BCA - **Active**
3. Bank Transfer - Mandiri - **Active**
4. Bank Transfer - BNI - **Active**
5. E-Wallet - GoPay - **Active**

### Product Catalogs
1. **LPG 3kg** - For small household needs
2. **LPG 5kg** - For medium household needs
3. **LPG 12kg** - For large household or small business needs
4. **LPG 50kg** - For industrial and large business needs

### Sample Items
- **LPG 3kg:** Bright Gas (Rp 20,000), Pertamina (Rp 18,000)
- **LPG 5kg:** Bright Gas (Rp 85,000), Pertamina Blue Gaz (Rp 90,000)
- **LPG 12kg:** Bright Gas (Rp 150,000), Pertamina (Rp 145,000), Elpiji Premium (Rp 155,000)
- **LPG 50kg:** Industrial (Rp 550,000)

## Features

### Smart Checking
All seed scripts check if data already exists before inserting:
- If data exists, the script will skip seeding and show current data
- If data doesn't exist, it will create the default data

### Safe to Run Multiple Times
You can safely run any seed script multiple times without creating duplicates.

## Initial Stock

⚠️ **Important:** All items are created with **0 stock** by default. After seeding, you need to:

1. Login to admin panel
2. Go to Stock Management
3. Add stock for each item using "IN" transactions

## Environment Variables

Make sure your `.env` file contains:

```env
MONGODB_URI=mongodb://localhost:27017/lpg-marketplace
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Troubleshooting

### Error: Cannot connect to MongoDB
- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify the database name is correct

### Error: Catalogs not found (when seeding items)
- Run `npm run seed:catalogs` first
- Or use `npm run seed:all` to seed everything in order

### Items not showing in catalog
- Check if stock exists: All items need at least one stock record
- Add stock via admin panel or update the seed script

## Customization

To customize the default data:

1. Edit the respective seed script
2. Modify the `default...` arrays with your data
3. Run the seed script again (after clearing existing data if needed)

## Clearing Data

To reset and reseed the database:

```bash
# Connect to MongoDB
mongosh lpg-marketplace

# Drop collections
db.admins.drop()
db.settings.drop()
db.paymentmethods.drop()
db.catalogs.drop()
db.items.drop()
db.stocks.drop()

# Exit mongo
exit

# Run seed again
npm run seed:all
```

## Migration vs Seeding

- **Migration:** Updates existing data or schema (e.g., adding new fields)
- **Seeding:** Populates empty database with initial data

These scripts function as both:
- On first run: Seeds initial data
- On subsequent runs: Checks and skips if data exists (safe migration)

## Production Use

For production deployment:

1. Change admin credentials in `.env`
2. Update company settings with real information
3. Update payment methods with real account details
4. Remove or modify sample items
5. Run `npm run seed:all` on production server after deployment

## Support

For issues or questions, refer to:
- `PROJECT_SUMMARY.md` - Project overview
- `API_DOCUMENTATION.md` - API endpoints
- `SETUP_GUIDE.md` - Setup instructions
