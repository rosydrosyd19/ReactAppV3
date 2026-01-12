const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'rosyd',
    password: process.env.DB_PASSWORD || 'rosyd1298',
    database: process.env.DB_NAME || 'reactappv3_db',
    connectionLimit: 5
});

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Connected to database.');

        // Create asset_maintenance_images table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS asset_maintenance_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                maintenance_id INT NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (maintenance_id) REFERENCES asset_maintenance(id) ON DELETE CASCADE,
                INDEX idx_maintenance_id (maintenance_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await conn.query(createTableQuery);
        console.log('Created table asset_maintenance_images successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
        throw err;
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

migrate();
