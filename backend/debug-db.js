const db = require('./config/database');
require('dotenv').config();

async function testQueries() {
    try {
        console.log('Testing Categories Query...');
        const categories = await db.query(`
      SELECT c.*, COUNT(a.id) as asset_count
      FROM asset_categories c
      LEFT JOIN asset_items a ON c.id = a.category_id
      GROUP BY c.id
      ORDER BY c.category_name
    `);
        console.log('✅ Categories Query Success:', categories.length, 'rows');

        console.log('Testing Locations Query...');
        const locations = await db.query(`
      SELECT l.*, COUNT(a.id) as asset_count, p.location_name as parent_location_name
      FROM asset_locations l
      LEFT JOIN asset_items a ON l.id = a.location_id
      LEFT JOIN asset_locations p ON l.parent_location_id = p.id
      GROUP BY l.id
      ORDER BY l.location_name
    `);
        console.log('✅ Locations Query Success:', locations.length, 'rows');

        console.log('--- Testing Permission Logic ---');
        // Simulate checkPermission('asset.items.view') for user admin (likely ID 1)

        // 1. Get User ID for 'admin'
        const users = await db.query("SELECT * FROM sysadmin_users WHERE username = 'admin'");
        if (users.length === 0) {
            console.error('❌ User admin not found!');
            return;
        }
        const userId = users[0].id;
        console.log('User ID for admin:', userId);

        const permissionKey = 'asset.items.view';

        const query = `
        SELECT DISTINCT p.permission_key
        FROM sysadmin_permissions p
        WHERE p.permission_key = ?
        AND (
          -- Via role
          EXISTS (
            SELECT 1 FROM sysadmin_role_permissions rp
            INNER JOIN sysadmin_user_roles ur ON ur.role_id = rp.role_id
            WHERE rp.permission_id = p.id AND ur.user_id = ?
          )
          -- Or direct permission
          OR EXISTS (
            SELECT 1 FROM sysadmin_user_permissions up
            WHERE up.permission_id = p.id AND up.user_id = ?
          )
        )
      `;

        const result = await db.query(query, [permissionKey, userId, userId]);
        console.log(`Permission Check for ${permissionKey}:`, result.length > 0 ? 'GRANTED' : 'DENIED');

        if (result.length === 0) {
            console.log('Debugging why denied...');
            // Check roles
            const roles = await db.query('SELECT r.role_name FROM sysadmin_roles r JOIN sysadmin_user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?', [userId]);
            console.log('User Roles:', roles.map(r => r.role_name));

            // Check if permission exists
            const perm = await db.query('SELECT id FROM sysadmin_permissions WHERE permission_key = ?', [permissionKey]);
            if (perm.length === 0) console.log('❌ Permission key does not exist in DB');
            else console.log('Permission ID:', perm[0].id);
        }

    } catch (error) {
        console.error('❌ Query Failed:', error);
    } finally {
        process.exit();
    }
}

testQueries();
