const db = require('../../config/database');

async function migrateDatabase() {
    try {
        console.log('🔄 Starting database migration...');

        // 1. Add category_code to asset_categories
        try {
            await db.query(`
                ALTER TABLE asset_categories 
                ADD COLUMN category_code VARCHAR(10) AFTER category_name
            `);
            console.log('✅ Added category_code column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ category_code column already exists');
            } else {
                throw error;
            }
        }

        // 2. Add location_code to asset_locations
        try {
            await db.query(`
                ALTER TABLE asset_locations 
                ADD COLUMN location_code VARCHAR(10) AFTER location_name
            `);
            console.log('✅ Added location_code column');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ location_code column already exists');
            } else {
                throw error;
            }
        }

        // 3. Generate default codes for existing records
        console.log('🔄 Generating default codes...');

        // Categories
        const categories = await db.query('SELECT id, category_name FROM asset_categories WHERE category_code IS NULL');
        for (const cat of categories) {
            // Generate code: First 3 letters of name, uppercase
            let code = cat.category_name.substring(0, 3).toUpperCase();
            // Remove non-alphanumeric
            code = code.replace(/[^A-Z0-9]/g, '');
            // Ensure unique (simple fallback)
            await db.query('UPDATE asset_categories SET category_code = ? WHERE id = ?', [code, cat.id]);
        }
        console.log(`✅ Updated ${categories.length} categories with default codes`);

        // Locations
        const locations = await db.query('SELECT id, location_name FROM asset_locations WHERE location_code IS NULL');
        for (const loc of locations) {
            let code = loc.location_name.substring(0, 3).toUpperCase();
            code = code.replace(/[^A-Z0-9]/g, '');
            await db.query('UPDATE asset_locations SET location_code = ? WHERE id = ?', [code, loc.id]);
        }
        console.log(`✅ Updated ${locations.length} locations with default codes`);

        console.log('✨ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateDatabase();
