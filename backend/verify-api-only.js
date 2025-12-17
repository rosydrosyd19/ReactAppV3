const PORT = process.env.PORT || 3001;
const API_URL = `http://localhost:${PORT}/api`;

async function verifyApi() {
    try {
        console.log('🚀 Starting API Verification...');

        const request = async (url, method = 'GET', body = null, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            console.log(`📡 Request: ${method} ${url}`);
            if (token) console.log('   Token length:', token.length);
            // console.log('   Headers:', JSON.stringify(headers));

            const options = { method, headers, body: body ? JSON.stringify(body) : undefined };
            const res = await fetch(url, options);
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { data = text; }
            console.log(`   Response Status: ${res.status}`);
            return { status: res.status, data };
        };

        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await request(`${API_URL}/auth/login`, 'POST', {
            username: 'admin',
            password: 'admin123'
        });

        if (!loginRes.data.success) throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
        const token = loginRes.data.data.token; // Correct extraction based on auth.js

        // Wait, auth.js sends:
        // res.json({ success: true, data: { token, ... } })

        if (!token) throw new Error('Token is missing in login response: ' + JSON.stringify(loginRes.data));

        console.log('✅ Login OK.');
        console.log('Token snippet:', token.substring(0, 20) + '...');

        // 2. Create
        const name = `SoftDelTest_${Date.now()}`;
        console.log(`🆕 Creating ${name}...`);
        const createRes = await request(`${API_URL}/asset/categories`, 'POST', {
            category_name: name,
            category_code: 'SDT'
        }, token);

        if (!createRes.data.success) throw new Error('Create failed: ' + JSON.stringify(createRes.data));
        const id = createRes.data.data.id;
        console.log(`✅ Created ID: ${id}`);

        // 3. Delete
        console.log(`🗑️ Deleting ID: ${id}...`);
        const delRes = await request(`${API_URL}/asset/categories/${id}`, 'DELETE', null, token);
        if (!delRes.data.success) throw new Error('Delete failed: ' + JSON.stringify(delRes.data));
        console.log('✅ Delete OK.');

        // 4. Check List
        console.log('📋 Checking list...');
        const listRes = await request(`${API_URL}/asset/categories`, 'GET', null, token);
        const found = listRes.data.data.find(c => c.id == id);

        if (found) {
            console.error('❌ FAILED: Item still in list!');
            process.exit(1);
        } else {
            console.log('✅ PASSED: Item gone from list.');
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}

verifyApi();
