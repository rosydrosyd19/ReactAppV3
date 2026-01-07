const db = require('../../config/database');

async function up() {
    console.log('Adding maintenance permissions...');
    try {
        // 1. Insert Permissions
        const permissions = [
            ['asset', 'View Maintenance', 'asset.maintenance.view', 'View maintenance records'],
            ['asset', 'Manage Maintenance', 'asset.maintenance.manage', 'Create and edit maintenance records']
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
        // Convert array to quoted string for IN clause
        // Actually, let's just fetch them
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

        console.log('Maintenance permissions added and assigned to Super Admin.');

    } catch (error) {
        console.error('Error adding maintenance permissions:', error);
    }
}


up().then(() => {
    // We need to wait a bit for pool to possibly drain or just force exit since it is a script
    setTimeout(() => process.exit(0), 500);
});
