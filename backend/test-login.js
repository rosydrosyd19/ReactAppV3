// Test login credentials
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function testLogin() {
    try {
        console.log('🔍 Testing login credentials...\n');

        // Get admin user from database
        const users = await db.query(
            'SELECT * FROM sysadmin_users WHERE username = ? OR email = ?',
            ['admin', 'admin']
        );

        if (users.length === 0) {
            console.log('❌ User "admin" not found in database!');
            console.log('Run: npm run init-db');
            process.exit(1);
        }

        const user = users[0];

        console.log('✅ User found in database:');
        console.log('   ID:', user.id);
        console.log('   Username:', user.username);
        console.log('   Email:', user.email);
        console.log('   Full Name:', user.full_name);
        console.log('   Active:', user.is_active);
        console.log('   Password Hash (first 30 chars):', user.password.substring(0, 30));
        console.log('');

        // Test password
        const testPassword = 'admin123';
        console.log(`🔐 Testing password: "${testPassword}"`);

        const isValid = await bcrypt.compare(testPassword, user.password);

        if (isValid) {
            console.log('✅ Password is CORRECT!');
            console.log('✅ Login should work!');
        } else {
            console.log('❌ Password is INCORRECT!');
            console.log('❌ This is why login fails with 401!');
            console.log('');
            console.log('🔧 To fix: Run npm run init-db again');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testLogin();
