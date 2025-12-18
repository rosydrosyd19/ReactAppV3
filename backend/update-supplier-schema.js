const db = require('./config/database');

async function checkSchema() {
    try {
        console.log('Checking asset_suppliers columns...');
        const rows = await db.query('SHOW COLUMNS FROM asset_suppliers');
        // db.query returns rows directly with mariadb
        const columns = rows.map(r => r.Field);
        console.log('Columns:', columns);

        const hasIsDeleted = columns.includes('is_deleted');
        console.log('Has is_deleted:', hasIsDeleted);

        if (!hasIsDeleted) {
            console.log('Adding is_deleted column...');
            await db.query('ALTER TABLE asset_suppliers ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE');
            console.log('Column added.');
        } else {
            console.log('Column already exists.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkSchema();
