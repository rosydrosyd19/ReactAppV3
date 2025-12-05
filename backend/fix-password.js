// Quick fix: Update admin password in database
const db = require('./config/database');

async function fixPassword() {
    try {
        console.log('🔧 Fixing admin password...\n');

        // Correct password hash for "admin123"
        const correctHash = '$2a$10$q/j2n9Z/5zdAqLLcj0DWB.dppAHimBLbB.DDRUxS1xeAmPuV67QK.';

        const result = await db.query(
            'UPDATE sysadmin_users SET password = ? WHERE username = ?',
            [correctHash, 'admin']
        );

        console.log('✅ Password updated successfully!');
        console.log('   Affected rows:', result.affectedRows);
        console.log('');
        console.log('🎯 You can now login with:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('');
        console.log('🔄 Refresh your browser and try again!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixPassword();
