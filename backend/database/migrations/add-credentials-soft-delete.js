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

        // Check if is_deleted column exists
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM asset_credentials LIKE 'is_deleted'
        `);

        if (columns.length === 0) {
            console.log('Adding is_deleted column...');
            await connection.query(`
                ALTER TABLE asset_credentials 
                ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE
            `);
            console.log('is_deleted column added successfully');
        } else {
            console.log('is_deleted column already exists');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
