const axios = require('axios');
const API_URL = 'http://localhost:3001/api';

async function verifyLogin() {
    try {
        console.log('Attempting login...');
        const res = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });

        console.log('Login status:', res.status);
        if (res.data.success) {
            console.log('Login successful. Token:', res.data.data.token.substring(0, 20) + '...');

            // Now verify token
            console.log('Verifying token...');
            try {
                const verifyRes = await axios.get(`${API_URL}/auth/verify`, {
                    headers: { Authorization: `Bearer ${res.data.data.token}` }
                });
                console.log('Token verification status:', verifyRes.status);
                console.log('Token verification success:', verifyRes.data.success);
            } catch (vErr) {
                console.error('Token verification failed:', vErr.response ? vErr.response.data : vErr.message);
            }

        } else {
            console.error('Login failed (logical):', res.data);
        }
    } catch (e) {
        console.error('Login request failed:', e.response ? e.response.data : e.message);
    }
}

verifyLogin();
