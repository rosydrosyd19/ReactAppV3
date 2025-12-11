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

        console.log('Connected to database. Running migration 002...');

        try {
            await conn.query(`
                ALTER TABLE asset_history 
                ADD COLUMN from_asset_id INT DEFAULT NULL,
                ADD CONSTRAINT fk_history_from_asset FOREIGN KEY (from_asset_id) REFERENCES asset_items(id) ON DELETE SET NULL
            `);
            console.log('✅ Added from_asset_id to asset_history');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ from_asset_id already exists in asset_history');
            } else {
                throw e;
            }
        }

        console.log('Migration 002 completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
