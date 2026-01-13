
const db = require('../../config/database');

async function addPermissions() {
    const permissions = [
        { key: 'asset.credential_categories.view', name: 'View Credential Categories', description: 'View credential categories' },
        { key: 'asset.credential_categories.create', name: 'Create Credential Categories', description: 'Create credential categories' },
        { key: 'asset.credential_categories.edit', name: 'Edit Credential Categories', description: 'Edit credential categories' },
        { key: 'asset.credential_categories.delete', name: 'Delete Credential Categories', description: 'Delete credential categories' }
    ];

    try {
        console.log('Adding new permissions...');
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 0. Cleanup bad data
            await connection.query("DELETE FROM sysadmin_permissions WHERE permission_key LIKE 'asset.credential_categories.%'");

            // 1. Insert Permissions
            for (const perm of permissions) {
                await connection.query(`
                    INSERT INTO sysadmin_permissions (permission_key, permission_name, description, module_name)
                    VALUES (?, ?, ?, 'asset')
                    ON DUPLICATE KEY UPDATE description = VALUES(description), permission_name = VALUES(permission_name)
                `, [perm.key, perm.name, perm.description]);
            }
            console.log('Permissions inserted.');

            // 2. Get Super Admin Role ID
            const rows = await connection.query("SELECT id FROM sysadmin_roles WHERE role_name = 'Super Admin'");
            if (rows.length === 0) {
                throw new Error('Super Admin role not found');
            }
            const superAdminRoleId = rows[0].id;

            // 3. Assign Permissions to Super Admin
            console.log('Assigning to Super Admin...');
            await connection.query(`
                INSERT INTO sysadmin_role_permissions (role_id, permission_id)
                SELECT ?, id FROM sysadmin_permissions
                WHERE permission_key LIKE 'asset.credential_categories.%'
                ON DUPLICATE KEY UPDATE role_id = role_id
            `, [superAdminRoleId]);

            await connection.commit();
            console.log('Success! Permissions added and assigned to Super Admin.');
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addPermissions();
