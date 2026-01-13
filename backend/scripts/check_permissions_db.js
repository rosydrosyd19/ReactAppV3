
const db = require('../config/database');

async function listPermissions() {
    try {
        console.log('Checking sysadmin_permissions for credential categories...');
        const permissions = await db.query(`
            SELECT id, permission_key, description 
            FROM sysadmin_permissions 
            WHERE permission_key LIKE '%credential_categories%'
            ORDER BY permission_key
        `);
        console.log('Found permissions:');
        console.table(permissions);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listPermissions();
