
const db = require('../config/database');

async function checkPermissions() {
    try {
        const username = 'admin';
        console.log(`Checking permissions for user: ${username}`);

        // Get User ID
        const [users] = await db.query('SELECT id FROM sysadmin_users WHERE username = ?', [username]);
        if (!users) {
            console.log('User not found!');
            process.exit(1);
        }
        const userId = users.id;

        // Get Role
        const roles = await db.query(`
            SELECT r.role_name 
            FROM sysadmin_roles r
            JOIN sysadmin_user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ?
        `, [userId]);
        console.log('Roles:', roles.map(r => r.role_name).join(', '));

        // Get Permissions
        const permissions = await db.query(`
            SELECT DISTINCT p.permission_key
            FROM sysadmin_permissions p
            WHERE 
            (
                EXISTS (
                    SELECT 1 FROM sysadmin_role_permissions rp
                    INNER JOIN sysadmin_user_roles ur ON ur.role_id = rp.role_id
                    WHERE rp.permission_id = p.id AND ur.user_id = ?
                )
                OR EXISTS (
                    SELECT 1 FROM sysadmin_user_permissions up
                    WHERE up.permission_id = p.id AND up.user_id = ?
                )
            )
            AND p.permission_key LIKE 'asset.credentials%'
        `, [userId, userId]);

        console.log('Credential Permissions:', permissions.map(p => p.permission_key));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPermissions();
