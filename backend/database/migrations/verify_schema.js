const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function verify() {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });

        const rows = await conn.query(`DESCRIBE asset_items`);
        console.log('Columns in asset_items:');
        rows.forEach(row => console.log(row.Field));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (conn) conn.end();
    }
}

verify();
