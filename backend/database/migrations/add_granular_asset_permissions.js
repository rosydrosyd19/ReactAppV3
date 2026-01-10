const db = require('../../config/database');

async function up() {
    console.log('Adding granular asset permissions...');
    try {
        const permissions = [
            // Categories
            ['asset', 'View Asset Categories', 'asset.categories.view', 'View asset categories list'],
            ['asset', 'Create Asset Categories', 'asset.categories.create', 'Create new asset categories'],
            ['asset', 'Edit Asset Categories', 'asset.categories.edit', 'Edit asset categories'],
            ['asset', 'Delete Asset Categories', 'asset.categories.delete', 'Delete asset categories'],

            // Locations
            ['asset', 'View Asset Locations', 'asset.locations.view', 'View asset locations list'],
            ['asset', 'Create Asset Locations', 'asset.locations.create', 'Create new asset locations'],
            ['asset', 'Edit Asset Locations', 'asset.locations.edit', 'Edit asset locations'],
            ['asset', 'Delete Asset Locations', 'asset.locations.delete', 'Delete asset locations'],

            // Suppliers
            ['asset', 'View Asset Suppliers', 'asset.suppliers.view', 'View asset suppliers list'],
            ['asset', 'Create Asset Suppliers', 'asset.suppliers.create', 'Create new asset suppliers'],
            ['asset', 'Edit Asset Suppliers', 'asset.suppliers.edit', 'Edit asset suppliers'],
            ['asset', 'Delete Asset Suppliers', 'asset.suppliers.delete', 'Delete asset suppliers'],

            // Maintenance
            // View already exists: asset.maintenance.view
            ['asset', 'Create Maintenance', 'asset.maintenance.create', 'Create maintenance records'],
            ['asset', 'Edit Maintenance', 'asset.maintenance.edit', 'Edit maintenance records'],
            ['asset', 'Delete Maintenance', 'asset.maintenance.delete', 'Delete maintenance records']
        ];

        for (const perm of permissions) {
            await db.query(
                `INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE permission_key=permission_key`,
                perm
            );
        }

        // Assign to Super Admin
        const [superAdminReq] = await db.query("SELECT id FROM sysadmin_roles WHERE role_name = 'Super Admin'");
        if (!superAdminReq) {
            console.error('Super Admin role not found!');
            return;
        }
        const superAdminId = superAdminReq.id;

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

        console.log('Granular asset permissions added and assigned to Super Admin.');

    } catch (error) {
        console.error('Error adding granular permissions:', error);
    }
}

up().then(() => {
    setTimeout(() => process.exit(0), 500);
});
