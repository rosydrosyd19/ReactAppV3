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

        console.log('Connected to database. Running migration...');

        // 1. Add assigned_to_asset_id to asset_items
        try {
            await conn.query(`
                ALTER TABLE asset_items 
                ADD COLUMN assigned_to_asset_id INT DEFAULT NULL,
                ADD CONSTRAINT fk_assigned_to_asset FOREIGN KEY (assigned_to_asset_id) REFERENCES asset_items(id) ON DELETE SET NULL
            `);
            console.log('✅ Added assigned_to_asset_id to asset_items');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ assigned_to_asset_id already exists in asset_items');
            } else {
                throw e;
            }
        }

        // 2. Add to_asset_id to asset_history
        try {
            await conn.query(`
                ALTER TABLE asset_history 
                ADD COLUMN to_asset_id INT DEFAULT NULL,
                ADD CONSTRAINT fk_history_to_asset FOREIGN KEY (to_asset_id) REFERENCES asset_items(id) ON DELETE SET NULL
            `);
            console.log('✅ Added to_asset_id to asset_history');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ to_asset_id already exists in asset_history');
            } else {
                throw e;
            }
        }

        // 3. Add index for performance
        try {
            await conn.query(`CREATE INDEX idx_assigned_to_asset ON asset_items(assigned_to_asset_id)`);
            console.log('✅ Added index for assigned_to_asset_id');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️ Index idx_assigned_to_asset already exists');
            } else {
                console.log('ℹ️ Index creation skipped/error: ' + e.message);
            }
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
