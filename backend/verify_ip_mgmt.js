const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const USERNAME = 'admin'; // Adjust if needed
const PASSWORD = 'admin123';

// Helper to log steps
const log = (msg) => console.log(`[TEST] ${msg}`);
const logError = (msg) => console.error(`[FAIL] ${msg}`);

async function runVerification() {
    log('Starting Verification...');

    try {
        // 1. Login
        log('Logging in...');
        const authRes = await axios.post(`${API_URL}/auth/login`, {
            username: USERNAME,
            password: PASSWORD
        });
        const token = authRes.data.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        log('Login successful. Token: ' + token.substring(0, 10) + '...');

        // 2. Create Dummy Assets (Router and Device)
        log('Creating dummy Router...');
        const routerRes = await axios.post(`${API_URL}/asset/assets`, {
            asset_tag: 'TEST-ROUTER-' + Date.now(),
            asset_name: 'Test Router ' + Date.now(),
            category_id: 1,
            status: 'available'
        }, config);
        const routerId = routerRes.data.data.id;
        log(`Router created (ID: ${routerId})`);

        log('Creating dummy Device...');
        const deviceRes = await axios.post(`${API_URL}/asset/assets`, {
            asset_tag: 'TEST-DEVICE-' + Date.now(),
            asset_name: 'Test Device ' + Date.now(),
            category_id: 1,
            status: 'available'
        }, config);
        const deviceId = deviceRes.data.data.id;
        log(`Device created (ID: ${deviceId})`);

        log('Creating second dummy Device...');
        const device2Res = await axios.post(`${API_URL}/asset/assets`, {
            asset_tag: 'TEST-DEVICE-2-' + Date.now(),
            asset_name: 'Test Device 2 ' + Date.now(),
            category_id: 1,
            status: 'available'
        }, config);
        const device2Id = device2Res.data.data.id;
        log(`Device 2 created (ID: ${device2Id})`);


        // 3. Create Subnet
        log('Creating Subnet...');
        const subnetRes = await axios.post(`${API_URL}/asset/ip/subnets`, {
            router_id: routerId,
            subnet_address: '192.168.99.0/24',
            subnet_mask: '255.255.255.0',
            gateway: '192.168.99.1',
            description: 'Test Subnet'
        }, config);
        const subnetId = subnetRes.data.id;
        log(`Subnet created (ID: ${subnetId})`);

        // 4. Assign IP
        log('Assigning IP 192.168.99.10 to Device 1...');
        await axios.post(`${API_URL}/asset/ip/assign`, {
            subnet_id: subnetId,
            ip_address: '192.168.99.10',
            assigned_to_asset_id: deviceId,
            notes: 'Test Assignment'
        }, config);
        log('IP Assigned successfully.');

        // 4.5 Test GET Subnets
        log('Fetching Subnets...');
        const listRes = await axios.get(`${API_URL}/asset/ip/subnets`, config);
        log(`Fetched ${listRes.data.length} subnets.`);
        const found = listRes.data.find(s => s.id === subnetId);
        if (found) {
            log('Newly created subnet found in list.');
        } else {
            logError('Newly created subnet NOT found in list.');
        }

        // 5. Test "Same IP to another device" (Should Fail)
        log('Attempting to assign SAME IP to Device 2 (Should Fail)...');
        try {
            await axios.post(`${API_URL}/asset/ip/assign`, {
                subnet_id: subnetId,
                ip_address: '192.168.99.10',
                assigned_to_asset_id: device2Id
            }, config);
            logError('Test Failed: Should not allow assigning same IP.');
        } catch (e) {
            log('Success: Prevented duplicate IP assignment.');
        }

        // 6. Test "One IP per device in subnet" (Should Fail)
        log('Attempting to assign DIFFERENT IP to Device 1 (Should Fail - 1 IP per Device)...');
        try {
            await axios.post(`${API_URL}/asset/ip/assign`, {
                subnet_id: subnetId,
                ip_address: '192.168.99.11',
                assigned_to_asset_id: deviceId
            }, config);
            logError('Test Failed: Should not allow multiple IPs for same device in subnet.');
        } catch (e) {
            log('Success: Prevented multiple IPs for same device.');
        }

        // 7. Block IP
        log('Blocking IP 192.168.99.20...');
        await axios.post(`${API_URL}/asset/ip/block`, {
            subnet_id: subnetId,
            ip_address: '192.168.99.20',
            block_reason: 'Testing Block'
        }, config);
        log('IP Blocked successfully.');

        // 8. Unblock IP
        log('Unblocking IP 192.168.99.20...');
        await axios.post(`${API_URL}/asset/ip/unblock`, {
            subnet_id: subnetId,
            ip_address: '192.168.99.20'
        }, config);
        log('IP Unblocked successfully.');

        // 9. Cleanup
        log('Cleaning up (Deleting Subnet)...');
        await axios.delete(`${API_URL}/asset/ip/subnets/${subnetId}`, config);
        log('Subnet deleted.');

        log('Deleting Test Assets...');
        await axios.delete(`${API_URL}/asset/assets/${routerId}`, config);
        await axios.delete(`${API_URL}/asset/assets/${deviceId}`, config);
        await axios.delete(`${API_URL}/asset/assets/${device2Id}`, config);

        log('Verification Completed Successfully!');

    } catch (error) {
        // Detailed Error Logging
        logError('Overall Test Failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}

runVerification();
