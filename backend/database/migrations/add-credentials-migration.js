const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS asset_credentials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                platform_name VARCHAR(100) NOT NULL,
                username VARCHAR(100),
                password VARCHAR(255),
                url VARCHAR(255),
                category ENUM('social_media', 'storage', 'email', 'other') DEFAULT 'other',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by INT,
                FOREIGN KEY (created_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
                INDEX idx_platform_name (platform_name),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.query(createTableQuery);
        console.log('Table asset_credentials created successfully');

        // Add permissions for credentials management if they don't exist
        const addPermissionsQuery = `
            INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description) VALUES
            ('asset', 'View Credentials', 'asset.credentials.view', 'View credentials list and details'),
            ('asset', 'Manage Credentials', 'asset.credentials.manage', 'Create, edit, delete credentials')
            ON DUPLICATE KEY UPDATE permission_key=permission_key;
        `;
        
        await connection.query(addPermissionsQuery);
        console.log('Credentials permissions added successfully');

        // Assign permissions to Super Admin
        const assignPermissionsQuery = `
            INSERT INTO sysadmin_role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM sysadmin_roles r
            CROSS JOIN sysadmin_permissions p
            WHERE r.role_name = 'Super Admin' AND p.module_name = 'asset' AND p.permission_name LIKE '%Credentials%'
            ON DUPLICATE KEY UPDATE role_id=role_id;
        `;
        
        await connection.query(assignPermissionsQuery);
        console.log('Permissions assigned to Super Admin');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
