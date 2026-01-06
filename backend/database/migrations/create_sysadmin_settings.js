const db = require('../../config/database');

async function up() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Create sysadmin_settings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sysadmin_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Seed initial app_name
        await connection.query(`
            INSERT INTO sysadmin_settings (setting_key, setting_value, description)
            VALUES ('app_name', 'ReactAppV3', 'Application Name displayed in Sidebar and Title')
            ON DUPLICATE KEY UPDATE setting_key=setting_key;
        `);

        // Add permission for managing settings
        await connection.query(`
            INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description)
            VALUES ('sysadmin', 'Manage Settings', 'sysadmin.settings.manage', 'Manage application settings')
            ON DUPLICATE KEY UPDATE permission_key=permission_key;
        `);

        // Grant new permission to Super Admin role
        await connection.query(`
            INSERT INTO sysadmin_role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM sysadmin_roles r
            CROSS JOIN sysadmin_permissions p
            WHERE r.role_name = 'Super Admin' AND p.permission_key = 'sysadmin.settings.manage'
            ON DUPLICATE KEY UPDATE role_id=role_id;
        `);

        console.log('sysadmin_settings table created and seeded successfully.');
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

up();
