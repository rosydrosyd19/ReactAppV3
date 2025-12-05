const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    let conn;

    try {
        console.log('🔄 Initializing database...');

        // Connect without database first
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            multipleStatements: true
        });

        console.log('✅ Connected to MariaDB');

        // Read and execute schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔄 Executing schema...');
        await conn.query(schema);

        console.log('✅ Database initialized successfully!');
        console.log('📊 Database name:', process.env.DB_NAME || 'reactappv3_db');
        console.log('👤 Default admin user:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('   Email: admin@reactappv3.com');

    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (conn) {
            await conn.end();
        }
    }
}

// Run initialization
initDatabase();
