const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // Check if table exists
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'asset_credential_assignments'
        `, [process.env.DB_NAME]);

        if (tables.length === 0) {
            console.log('Creating asset_credential_assignments table...');
            await connection.query(`
                CREATE TABLE asset_credential_assignments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    credential_id INT NOT NULL,
                    user_id INT NOT NULL,
                    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (credential_id) REFERENCES asset_credentials(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES sysadmin_users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_assignment (credential_id, user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            console.log('Migrating existing assignments...');
            // Migrate current 'assigned_to' values to the new table
            await connection.query(`
                INSERT IGNORE INTO asset_credential_assignments (credential_id, user_id)
                SELECT id, assigned_to 
                FROM asset_credentials 
                WHERE assigned_to IS NOT NULL
            `);

            console.log('Migration completed successfully');
        } else {
            console.log('Table asset_credential_assignments already exists');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
