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

        // 1. Add columns to asset_credentials
        console.log('Checking asset_credentials columns...');
        const [columns] = await connection.query(`SHOW COLUMNS FROM asset_credentials`);
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('status')) {
            console.log('Adding status column...');
            await connection.query(`
                ALTER TABLE asset_credentials 
                ADD COLUMN status ENUM('available', 'assigned') DEFAULT 'available',
                ADD INDEX idx_status (status)
            `);
        }

        if (!columnNames.includes('assigned_to')) {
            console.log('Adding assigned_to column...');
            await connection.query(`
                ALTER TABLE asset_credentials 
                ADD COLUMN assigned_to INT,
                ADD FOREIGN KEY (assigned_to) REFERENCES sysadmin_users(id) ON DELETE SET NULL
            `);
        }

        // 2. Create asset_credential_history table
        console.log('Creating asset_credential_history table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS asset_credential_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                credential_id INT NOT NULL,
                action_type ENUM('checkout', 'checkin', 'create', 'update', 'delete', 'soft_delete') NOT NULL,
                performed_by INT,
                to_user_id INT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (credential_id) REFERENCES asset_credentials(id) ON DELETE CASCADE,
                FOREIGN KEY (performed_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
                FOREIGN KEY (to_user_id) REFERENCES sysadmin_users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('Migration completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
