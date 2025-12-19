const mariadb = require('mariadb');
require('dotenv').config();

async function runMigration() {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });

        console.log('Connected to database. Running migration update-asset-history-enum...');

        try {
            // Modify the column to include 'delete' in the ENUM
            await conn.query(`
                ALTER TABLE asset_history 
                MODIFY COLUMN action_type ENUM('checkout', 'checkin', 'transfer', 'maintenance', 'update', 'retire', 'delete') NOT NULL
            `);
            console.log('✅ updated asset_history action_type ENUM to include "delete"');
        } catch (e) {
            console.error('❌ Failed to update ENUM:', e.message);
            throw e;
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
