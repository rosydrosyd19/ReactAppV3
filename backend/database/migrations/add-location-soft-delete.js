const mariadb = require('mariadb');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'reactappv3_db'
};

async function migrate() {
    let pool;
    let connection;
    try {
        console.log('Connecting to database...');
        pool = mariadb.createPool(dbConfig);
        connection = await pool.getConnection();

        console.log('Checking asset_locations table structure...');
        const columns = await connection.query('SHOW COLUMNS FROM asset_locations LIKE "is_deleted"');

        if (columns.length === 0) {
            console.log('Adding is_deleted column to asset_locations...');
            await connection.query('ALTER TABLE asset_locations ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE');
            console.log('Column added successfully.');
        } else {
            console.log('Column is_deleted already exists.');
        }

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) connection.release();
        if (pool) await pool.end();
        process.exit();
    }
}

migrate();
