const db = require('../../config/database');

async function up() {
    console.log('Adding credential permissions...');
    try {
        // 1. Insert Permissions
        const permissions = [
            ['asset', 'Create Credentials', 'asset.credentials.create', 'Create new credentials'],
            ['asset', 'Edit Credentials', 'asset.credentials.edit', 'Edit credential details'],
            ['asset', 'Delete Credentials', 'asset.credentials.delete', 'Delete credentials'],
            ['asset', 'View Credentials', 'asset.credentials.view', 'View credential list and details'],
            ['asset', 'Manage Credentials', 'asset.credentials.manage', 'Manage credentials (legacy/generic)'],
            ['asset', 'Checkout Credentials', 'asset.credentials.checkout', 'Checkout credentials to users/assets'],
            ['asset', 'Checkin Credentials', 'asset.credentials.checkin', 'Checkin credentials from users/assets']
        ];

        for (const perm of permissions) {
            await db.query(
                `INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE permission_key=permission_key`,
                perm
            );
        }

        // 2. Assign to Super Admin
        // Get Role ID
        const [superAdminReq] = await db.query("SELECT id FROM sysadmin_roles WHERE role_name = 'Super Admin'");
        if (!superAdminReq) {
            console.error('Super Admin role not found!');
            return;
        }
        const superAdminId = superAdminReq.id;

        // Get Permission IDs
        const permissionKeys = permissions.map(p => p[2]);
        const permRows = await db.query(
            `SELECT id FROM sysadmin_permissions WHERE permission_key IN ('${permissionKeys.join("','")}')`
        );

        for (const row of permRows) {
            await db.query(
                `INSERT INTO sysadmin_role_permissions (role_id, permission_id) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE role_id=role_id`,
                [superAdminId, row.id]
            );
        }

        console.log('Credential permissions added and assigned to Super Admin.');

    } catch (error) {
        console.error('Error adding credential permissions:', error);
    }
}


up().then(() => {
    setTimeout(() => process.exit(0), 500);
});
