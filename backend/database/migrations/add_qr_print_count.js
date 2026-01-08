import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // Check if column exists
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM asset_items LIKE 'qr_print_count'
        `);

        if (columns.length === 0) {
            console.log('Adding qr_print_count column to asset_items table...');
            await connection.execute(`
                ALTER TABLE asset_items 
                ADD COLUMN qr_print_count INT DEFAULT 0
            `);
            console.log('Successfully added qr_print_count column');
        } else {
            console.log('qr_print_count column already exists');
        }

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
