const db = require('../config/database');

async function verifySettings() {
    try {
        console.log('Testing connection...');
        await db.testConnection();

        console.log('\nChecking sysadmin_settings table...');
        try {
            const rows = await db.query('SELECT * FROM sysadmin_settings');
            console.log('✅ sysadmin_settings table exists.');
            console.log(`Found ${rows.length} rows.`);
            if (rows.length > 0) {
                console.log('Sample row:', rows[0]);
            } else {
                console.log('⚠️ Table is empty! This might cause issues if code expects data.');
            }

            // Simulate the endpoint logic
            console.log('\nSimulating GET /api/sysadmin/settings logic...');
            const settingsMap = {};
            rows.forEach(s => {
                settingsMap[s.setting_key] = s.setting_value;
            });
            console.log('✅ Logic success. Mapped settings:', settingsMap);

        } catch (err) {
            console.error('❌ Error accessing sysadmin_settings table:', err.message);
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.error('!!! The table "sysadmin_settings" DOES NOT EXIST in the database. !!!');
                console.error('The migration might not have run correctly or on the right database.');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        process.exit();
    }
}

verifySettings();
