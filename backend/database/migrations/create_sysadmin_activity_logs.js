const db = require('../../config/database');

async function up() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Create sysadmin_activity_logs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sysadmin_activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(255) NOT NULL,
                module VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50),
                entity_id VARCHAR(50),
                details JSON,
                ip_address VARCHAR(45),
                user_agent VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_module (module),
                INDEX idx_action (action),
                FOREIGN KEY (user_id) REFERENCES sysadmin_users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Add permission for viewing logs
        await connection.query(`
            INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description)
            VALUES ('sysadmin', 'View Activity Logs', 'sysadmin.logs.view', 'View system activity logs')
            ON DUPLICATE KEY UPDATE permission_key=permission_key;
        `);

        // Grant new permission to Super Admin role
        await connection.query(`
            INSERT INTO sysadmin_role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM sysadmin_roles r
            CROSS JOIN sysadmin_permissions p
            WHERE r.role_name = 'Super Admin' AND p.permission_key = 'sysadmin.logs.view'
            ON DUPLICATE KEY UPDATE role_id=role_id;
        `);

        console.log('sysadmin_activity_logs table created and permission added successfully.');
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
