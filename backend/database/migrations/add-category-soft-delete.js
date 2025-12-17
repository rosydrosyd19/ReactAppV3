const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function migrate() {
    let conn;
    try {
        console.log('Connecting to database...');
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });

        console.log('🔄 Checking asset_categories table...');

        // Check if column exists
        const [columns] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'asset_categories' AND COLUMN_NAME = 'is_deleted'
        `, [process.env.DB_NAME || 'reactappv3_db']);

        if (columns) {
            console.log('⚠️ Column is_deleted already exists in asset_categories table.');
        } else {
            console.log('🔄 Adding is_deleted column to asset_categories table...');
            await conn.query(`
                ALTER TABLE asset_categories 
                ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ Column is_deleted added successfully.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (conn) conn.end();
        console.log('Done.');
    }
}

migrate();
