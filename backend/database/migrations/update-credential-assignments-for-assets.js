const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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

        console.log('Altering asset_credential_assignments table...');

        // 1. Add asset_id column
        // 2. Make user_id nullable (modify column)
        // 3. Add FK for asset_id
        // 4. Add unique constraint for (credential_id, asset_id)

        // Check if column exists first to be safe (optional but good practice)
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'asset_credential_assignments' 
            AND COLUMN_NAME = 'asset_id'
        `, [process.env.DB_NAME]);

        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE asset_credential_assignments
                ADD COLUMN asset_id INT NULL AFTER user_id,
                MODIFY COLUMN user_id INT NULL,
                ADD CONSTRAINT fk_cred_assign_asset FOREIGN KEY (asset_id) REFERENCES asset_items(id) ON DELETE CASCADE,
                ADD UNIQUE KEY unique_asset_assignment (credential_id, asset_id)
            `);
            console.log('Table structure updated successfully.');
        } else {
            console.log('Column asset_id already exists.');
        }

        console.log('Migration completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
