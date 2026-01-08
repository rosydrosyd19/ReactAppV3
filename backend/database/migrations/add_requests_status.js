const mariadb = require('mariadb');
require('dotenv').config();

async function runMigration() {
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

        console.log('Connected. altering table asset_maintenance...');

        // Check columns to be sure
        const [columns] = await conn.query("SHOW COLUMNS FROM asset_maintenance LIKE 'status'");
        console.log('Current column definition:', columns);

        // Modify enum
        await conn.query(`
            ALTER TABLE asset_maintenance 
            MODIFY COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'requests') DEFAULT 'requests'
        `);

        console.log('✅ Successfully added "requests" to status enum and set as default.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
