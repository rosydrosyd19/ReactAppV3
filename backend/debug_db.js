const db = require('./config/database');
require('dotenv').config();

async function checkBigInt() {
    try {
        console.log('Checking BigInt...');
        const res = await db.query("SELECT COUNT(*) as count FROM asset_ip_subnets");
        console.log('Result:', res);

        if (res.length > 0) {
            console.log('Type of count:', typeof res[0].count);
            try {
                JSON.stringify(res);
                console.log('JSON.stringify success');
            } catch (e) {
                console.error('JSON.stringify FAILED:', e.message);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

checkBigInt();
