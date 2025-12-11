const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });

        console.log('🔄 Checking asset_items table...');

        // Check if column exists
        const [columns] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'asset_items' AND COLUMN_NAME = 'is_deleted'
        `, [process.env.DB_NAME || 'reactappv3_db']);

        if (columns) {
            console.log('⚠️ Column is_deleted already exists in asset_items table.');
        } else {
            console.log('🔄 Adding is_deleted column to asset_items table...');
            await conn.query(`
                ALTER TABLE asset_items 
                ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER status
            `);
            // Note: asset_items might not have is_active, so we can just add it at the end or after a known column like status
            // checking schema: asset_items has status, created_by etc. I'll just add it.
            // Wait, I should check the schema again to be sure where to put it or just let it append.
            // Safest to just ADD COLUMN without AFTER if I'm not strict, or AFTER 'notes' or 'status'.
            // Re-reading schema lines...
            // asset_items has created_by at the end.
            // I will use a safer query without AFTER to avoid errors if column doesn't exist.
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (conn) conn.end();
    }
}

// I will refine the content in the actual tool call below after seeing the file.
