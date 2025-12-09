const mariadb = require('mariadb');
require('dotenv').config({ path: '../../.env' }); // Adjust path to reach root .env

async function addIsDeletedColumn() {
    let conn;
    try {
        console.log('🔄 Connecting to database...');
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });
        console.log('✅ Connected.');

        // Check if column exists
        const checkColumn = await conn.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sysadmin_users' AND COLUMN_NAME = 'is_deleted'
        `, [process.env.DB_NAME || 'reactappv3_db']);

        if (checkColumn.length > 0) {
            console.log('ℹ️ Column is_deleted already exists in sysadmin_users.');
        } else {
            console.log('🔄 Adding is_deleted column to sysadmin_users...');
            await conn.query(`
                ALTER TABLE sysadmin_users 
                ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER is_active
            `);
            console.log('✅ Column is_deleted added successfully.');

            // Add index for performance
            await conn.query(`
                CREATE INDEX idx_is_deleted ON sysadmin_users(is_deleted)
            `);
            console.log('✅ Index on is_deleted added successfully.');
        }

    } catch (error) {
        console.error('❌ Error adding column:', error.message);
        process.exit(1);
    } finally {
        if (conn) conn.end();
        process.exit(0);
    }
}

addIsDeletedColumn();
