require('dotenv').config();
const db = require('../config/database');

const run = async () => {
    try {
        console.log('Fixing permissions...');

        const permissions = [
            // Categories
            { key: 'asset.categories.view', name: 'View Categories', desc: 'View asset categories' },
            { key: 'asset.categories.create', name: 'Create Categories', desc: 'Create asset categories' },
            { key: 'asset.categories.edit', name: 'Edit Categories', desc: 'Edit asset categories' },
            { key: 'asset.categories.delete', name: 'Delete Categories', desc: 'Delete asset categories' },

            // Locations
            { key: 'asset.locations.view', name: 'View Locations', desc: 'View asset locations' },
            { key: 'asset.locations.create', name: 'Create Locations', desc: 'Create asset locations' },
            { key: 'asset.locations.edit', name: 'Edit Locations', desc: 'Edit asset locations' },
            { key: 'asset.locations.delete', name: 'Delete Locations', desc: 'Delete asset locations' },

            // Suppliers
            { key: 'asset.suppliers.view', name: 'View Suppliers', desc: 'View asset suppliers' },
            { key: 'asset.suppliers.create', name: 'Create Suppliers', desc: 'Create asset suppliers' },
            { key: 'asset.suppliers.edit', name: 'Edit Suppliers', desc: 'Edit asset suppliers' },
            { key: 'asset.suppliers.delete', name: 'Delete Suppliers', desc: 'Delete asset suppliers' }
        ];

        // 1. Insert Permissions
        for (const p of permissions) {
            console.log(`Processing permission: ${p.key}`);
            await db.query(`
                INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description)
                VALUES ('asset', ?, ?, ?)
                ON DUPLICATE KEY UPDATE permission_key=permission_key
            `, [p.name, p.key, p.desc]);
        }

        // 2. Assign to Super Admin Role
        // Get Role ID
        const [roles] = await db.query("SELECT id FROM sysadmin_roles WHERE role_name IN ('Super Admin', 'Admin')");

        if (roles.length > 0) {
            console.log('Assigning permissions to roles...');

            // Get all permission IDs including the new ones
            const keys = permissions.map(p => p.key);
            // also include existing manage permissions just in case we want to support both or legacy
            // keys.push('asset.categories.manage', 'asset.locations.manage', 'asset.suppliers.manage');

            const placeholders = keys.map(() => '?').join(',');
            const [perms] = await db.query(`SELECT id FROM sysadmin_permissions WHERE permission_key IN (${placeholders})`, keys);

            const permIds = perms.map(p => p.id);

            for (const role of roles) {
                console.log(`Assigning ${permIds.length} permissions to Role ID ${role.id}`);
                for (const permId of permIds) {
                    await db.query(`
                        INSERT INTO sysadmin_role_permissions (role_id, permission_id)
                        VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE role_id=role_id
                    `, [role.id, permId]);
                }
            }
        }

        console.log('Permissions fixed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing permissions:', error);
        process.exit(1);
    }
};

run();
