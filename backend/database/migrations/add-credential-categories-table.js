const mariadb = require('mariadb');
require('dotenv').config();

async function runMigration() {
    let conn;
    try {
        // Connect to database
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });

        console.log('Connected to database. Running migration for credential_categories...');

        // Create asset_credential_categories table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS asset_credential_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_name VARCHAR(255) NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                is_deleted BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (created_by) REFERENCES sysadmin_users(id)
            ) ENGINE=InnoDB;
        `);

        console.log('✅ credential_categories table created (or already exists).');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
