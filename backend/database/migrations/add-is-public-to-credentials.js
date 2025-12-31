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

        // Check if column exists
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM asset_credentials LIKE 'is_public'
        `);

        if (columns.length === 0) {
            const alterTableQuery = `
                ALTER TABLE asset_credentials 
                ADD COLUMN is_public BOOLEAN DEFAULT FALSE COMMENT 'Public visibility status' AFTER description;
            `;

            await connection.query(alterTableQuery);
            console.log('Column is_public added to asset_credentials successfully');
        } else {
            console.log('Column is_public already exists in asset_credentials');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
