const PORT = process.env.PORT || 3001;
const API_URL = `http://localhost:${PORT}/api`;

async function verifyDetail() {
    try {
        console.log('🚀 Starting Detail Verification...');

        const request = async (url, method = 'GET', body = null, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const options = { method, headers, body: body ? JSON.stringify(body) : undefined };
            const res = await fetch(url, options);
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { data = text; }
            return { status: res.status, data };
        };

        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await request(`${API_URL}/auth/login`, 'POST', {
            username: 'admin',
            password: 'admin123'
        });

        if (!loginRes.data.success) throw new Error('Login failed');
        const token = loginRes.data.data.token;

        // 2. Fetch list to get an ID
        console.log('📋 Fetching list...');
        const listRes = await request(`${API_URL}/asset/categories`, 'GET', null, token);
        if (!listRes.data.success) throw new Error('List failed');

        const categories = listRes.data.data;
        if (categories.length === 0) {
            console.warn('⚠️ No categories to test detail view. Creating one...');
            const createRes = await request(`${API_URL}/asset/categories`, 'POST', {
                category_name: 'Test Detail ' + Date.now(),
                category_code: 'TDET'
            }, token);
            categories.push(createRes.data.data);
        }

        const id = categories[0].id;
        console.log(`✅ Testing Detail for ID: ${id}`);

        // 3. Fetch Detail
        const detailRes = await request(`${API_URL}/asset/categories/${id}`, 'GET', null, token);
        if (!detailRes.data.success) {
            console.error('❌ Failed to fetch detail:', detailRes.data);
            process.exit(1);
        }

        const cat = detailRes.data.data;
        console.log('✅ Detail Fetched:', cat.category_name);
        console.log('   Stats:', cat.asset_count, 'assets');

        if (cat.id != id) throw new Error('ID mismatch');

        console.log('✅ Detail verification PASSED');

    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}

verifyDetail();
