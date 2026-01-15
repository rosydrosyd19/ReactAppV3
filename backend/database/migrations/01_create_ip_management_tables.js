const db = require('../../config/database');

async function up() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create asset_ip_subnets table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS asset_ip_subnets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                router_id INT,
                subnet_address VARCHAR(45) NOT NULL,
                subnet_mask VARCHAR(45),
                gateway VARCHAR(45),
                vlan_id VARCHAR(20),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by INT,
                FOREIGN KEY (router_id) REFERENCES asset_items(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
                INDEX idx_router_id (router_id),
                INDEX idx_subnet (subnet_address)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Create asset_ip_addresses table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS asset_ip_addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subnet_id INT NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                status ENUM('available', 'assigned', 'blocked', 'reserved') DEFAULT 'available',
                assigned_to_asset_id INT,
                assigned_at TIMESTAMP NULL,
                block_reason TEXT,
                notes TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                updated_by INT,
                FOREIGN KEY (subnet_id) REFERENCES asset_ip_subnets(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_to_asset_id) REFERENCES asset_items(id) ON DELETE SET NULL,
                FOREIGN KEY (updated_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
                UNIQUE KEY unique_subnet_ip (subnet_id, ip_address),
                INDEX idx_status (status),
                INDEX idx_assigned_to (assigned_to_asset_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Insert Permissions
        const permissions = [
            ['asset', 'View IP Management', 'asset.ip_management.view', 'View IP address lists and subnets'],
            ['asset', 'Manage IP Management', 'asset.ip_management.manage', 'Create/Edit subnets, Assign/Block IPs']
        ];

        for (const [module, name, key, desc] of permissions) {
            await connection.query(`
                INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE permission_key=permission_key;
            `, [module, name, key, desc]);
        }

        // 4. Grant permissions to Super Admin
        await connection.query(`
            INSERT INTO sysadmin_role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM sysadmin_roles r
            CROSS JOIN sysadmin_permissions p
            WHERE r.role_name = 'Super Admin' AND p.permission_key LIKE 'asset.ip_management.%'
            ON DUPLICATE KEY UPDATE role_id=role_id;
        `);

        console.log('IP Management tables created and permissions assigned successfully.');
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
