const db = require('./config/database');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '.env') }); // Already loaded by db config

const PORT = process.env.PORT || 3001;
const API_URL = `http://localhost:${PORT}/api`;

const TIMEOUT_MS = 15000;

async function verify() {
    try {
        console.log('🔗 Testing DB connection first...');
        // Test query
        await db.query('SELECT 1');
        console.log('✅ DB Connection working.');

        // Helper for fetch
        const request = async (url, method = 'GET', body = null, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const options = {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            };

            const res = await fetch(url, options);
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // console.log('Response was not JSON:', text.substring(0, 100));
                data = { message: text };
            }
            return { status: res.status, data };
        };

        // 1. Login to get token
        console.log('🔑 Logging in as admin...');
        const loginRes = await request(`${API_URL}/auth/login`, 'POST', {
            username: 'admin',
            password: 'admin123'
        });

        if (!loginRes.data.success) {
            throw new Error('Login failed: ' + (loginRes.data.message || JSON.stringify(loginRes.data)));
        }

        const token = loginRes.data.token;
        console.log('✅ Login successful. Token received.');

        // 2. Create a test category
        const testCategoryName = `Test Soft Delete ${Date.now()}`;
        console.log(`🆕 Creating test category: "${testCategoryName}"...`);
        const createRes = await request(`${API_URL}/asset/categories`, 'POST', {
            category_name: testCategoryName,
            category_code: 'TSD', // Assuming unique enough or handled
            description: 'Temporary category for testing soft delete'
        }, token);

        if (!createRes.data.success) {
            throw new Error('Failed to create category: ' + JSON.stringify(createRes.data));
        }
        const categoryId = createRes.data.data.id;
        console.log(`✅ Category created with ID: ${categoryId}`);

        // 3. Verify it exists in list
        console.log('📋 Fetching category list to confirm existence...');
        const listRes1 = await request(`${API_URL}/asset/categories`, 'GET', null, token);
        const itemInList1 = listRes1.data.data.find(c => c.id == categoryId);
        if (!itemInList1) throw new Error('Category not found in list after creation');
        console.log('✅ Category found in list.');

        // 4. Delete the category
        console.log(`🗑️ Deleting category ${categoryId}...`);
        const deleteRes = await request(`${API_URL}/asset/categories/${categoryId}`, 'DELETE', null, token);
        if (!deleteRes.data.success) throw new Error('Delete request failed: ' + JSON.stringify(deleteRes.data));
        console.log('✅ Delete request successful.');

        // 5. Verify it is GONE from list (Soft Delete check 1)
        console.log('📋 Fetching category list to confirm REMOVAL...');
        const listRes2 = await request(`${API_URL}/asset/categories`, 'GET', null, token);
        const itemInList2 = listRes2.data.data.find(c => c.id == categoryId);

        if (itemInList2) {
            console.error('❌ FAILURE: Category STILL appears in the list! Soft delete filter failed.');
            process.exit(1);
        } else {
            console.log('✅ Category is GONE from the API list response (Correct).');
        }

        // 6. Verify it is STILL IN DB but marked deleted (Soft Delete check 2)
        console.log('🔍 Checking database directly...');
        const [dbRow] = await db.query('SELECT * FROM asset_categories WHERE id = ?', [categoryId]);

        if (!dbRow) {
            console.error('❌ FAILURE: Category is completely MISSING from database! It was hard deleted.');
            process.exit(1);
        } else if (dbRow.is_deleted) {
            console.log('✅ SUCCESS: Category exists in DB and is_deleted = 1.');
        } else {
            console.error('❌ FAILURE: Category exists in DB but is_deleted is FALSE! (Update failed)');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    }

    // Explicit exit
    process.exit(0);
}

// Timeout watchdog
setTimeout(() => {
    console.error('❌ Timeout reached! Exiting force.');
    process.exit(1);
}, TIMEOUT_MS);

verify();
