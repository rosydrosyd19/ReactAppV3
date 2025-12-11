const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function forceAdd() {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });

        console.log('🔄 Force adding is_deleted column...');
        // Only run if verify showed it missing, but running this blind is usually safe with proper error handling or checking first.
        // I'll check first to avoid error "Duplicate column name".

        const [columns] = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'asset_items' AND COLUMN_NAME = 'is_deleted'
        `, [process.env.DB_NAME || 'reactappv3_db']);

        if (columns) {
            console.log('✅ Column already exists.');
        } else {
            await conn.query(`ALTER TABLE asset_items ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE`);
            console.log('✅ Column added successfully (at end of table).');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (conn) conn.end();
    }
}

forceAdd();
