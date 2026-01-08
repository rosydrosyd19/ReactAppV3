const mariadb = require('mariadb');
const axios = require('axios');
require('dotenv').config();

// We need a valid asset ID to create a request.
// This script assumes the server is running on port 5000 (default)

async function verify() {
    let conn;
    try {
        console.log('1. Finding an asset to test with...');
        conn = await mariadb.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'rosyd',
            password: process.env.DB_PASSWORD || 'rosyd1298',
            database: process.env.DB_NAME || 'reactappv3_db'
        });

        const [assets] = await conn.query("SELECT id FROM asset_items LIMIT 1");
        if (!assets) {
            console.error('No assets found. Cannot verify.');
            return;
        }
        const assetId = assets.id;
        console.log(`Found asset ID: ${assetId}`);

        console.log('2. Sending POST /api/public/maintenance-request ...');
        // Note: Using the public endpoint as it is easier (no auth needed for basic public request if logically allowed, or minimal auth)
        // The code shows /public/maintenance-request does NOT require auth header primarily, but handles it if present.

        const payload = {
            asset_id: assetId,
            issue_description: 'Automated verification test for status requests',
            requester_name: 'Verification Bot',
            requester_phone: '123456789'
        };

        const response = await axios.post('http://localhost:3001/api/asset/maintenance-request', payload);

        if (response.data.success) {
            console.log('Request submitted. Ticket:', response.data.ticket_number);

            console.log('3. Checking Database Status...');
            const [record] = await conn.query("SELECT status FROM asset_maintenance WHERE ticket_number = ?", [response.data.ticket_number]);

            console.log('Record status:', record.status);

            if (record.status === 'requests') {
                console.log('✅ SUCCESS: Status is "requests"');
            } else {
                console.error(`❌ FAILURE: Status is "${record.status}", expected "requests"`);
            }

            // Cleanup
            await conn.query("DELETE FROM asset_maintenance WHERE ticket_number = ?", [response.data.ticket_number]);
            console.log('Cleanup: Test record deleted.');

        } else {
            console.error('API Request failed:', response.data);
        }

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Verification Error:', error);
        }
    } finally {
        if (conn) await conn.end();
    }
}

verify();
