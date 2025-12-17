const mariadb = require('mariadb');
require('dotenv').config();

async function checkTriggers() {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });

        console.log('Connected.');

        const triggers = await conn.query("SHOW TRIGGERS LIKE 'asset_history'");
        if (triggers.length > 0) {
            console.log('Triggers found:', triggers);
        } else {
            console.log('No triggers found on asset_history.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (conn) await conn.end();
    }
}

checkTriggers();
