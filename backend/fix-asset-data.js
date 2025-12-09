const db = require('./config/database');
require('dotenv').config();

async function fixData() {
    try {
        console.log('🔄 Starting data fix...');

        // 1. Remove duplicate Categories
        console.log('🧹 Cleaning duplicate categories...');
        await db.query(`
            DELETE c1 FROM asset_categories c1
            INNER JOIN asset_categories c2 
            WHERE c1.id > c2.id AND c1.category_name = c2.category_name;
        `);

        // 2. Remove duplicate Locations
        console.log('🧹 Cleaning duplicate locations...');
        await db.query(`
            DELETE l1 FROM asset_locations l1
            INNER JOIN asset_locations l2 
            WHERE l1.id > l2.id AND l1.location_name = l2.location_name;
        `);

        // 3. Add Unique Constraints (if not exist)
        console.log('🔒 Adding unique constraints...');
        try {
            await db.query('ALTER TABLE asset_categories ADD UNIQUE INDEX idx_unique_category_name (category_name)');
        } catch (e) { console.log('   Category constraint might already exist'); }

        try {
            await db.query('ALTER TABLE asset_locations ADD UNIQUE INDEX idx_unique_location_name (location_name)');
        } catch (e) { console.log('   Location constraint might already exist'); }

        try {
            await db.query('ALTER TABLE asset_suppliers ADD UNIQUE INDEX idx_unique_supplier_name (supplier_name)');
        } catch (e) { console.log('   Supplier constraint might already exist'); }

        // 4. Seed Suppliers if empty
        console.log('🌱 Checking suppliers...');
        const suppliers = await db.query('SELECT COUNT(*) as count FROM asset_suppliers');
        if (suppliers[0].count === 0n) { // Handle BigInt return if strictly typed, but here usually Number/String
            console.log('   Seeding default suppliers...');
            await db.query(`
                INSERT INTO asset_suppliers (supplier_name, contact_person, email, phone, address, website) VALUES
                ('Global Tech Supplies', 'John Doe', 'sales@globaltech.com', '123-456-7890', '123 Tech Blvd', 'https://globaltech.com'),
                ('Office Depot', 'Jane Smith', 'support@officedepot.com', '098-765-4321', '456 Market St', 'https://officedepot.com'),
                ('Apple Business', 'Business Team', 'business@apple.com', '1-800-MY-APPLE', 'Cupertino, CA', 'https://apple.com')
             `);
        }

        console.log('✅ Data fix completed successfully!');

    } catch (error) {
        console.error('❌ Error fixing data:', error);
    } finally {
        process.exit();
    }
}

fixData();
