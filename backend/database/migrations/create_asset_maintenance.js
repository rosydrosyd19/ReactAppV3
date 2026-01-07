const db = require('../../config/database');

async function up() {
    console.log('Creating asset_maintenance table...');
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS asset_maintenance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asset_id INT NOT NULL,
                maintenance_type VARCHAR(100) NOT NULL,
                maintenance_date DATE NOT NULL,
                performed_by VARCHAR(255), -- Could be external vendor name or user ID if internal
                cost DECIMAL(10, 2),
                description TEXT,
                next_maintenance_date DATE,
                status ENUM('scheduled', 'in_progress', 'completed') DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                FOREIGN KEY (asset_id) REFERENCES asset_items(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
                INDEX idx_asset_id (asset_id),
                INDEX idx_status (status),
                INDEX idx_date (maintenance_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('asset_maintenance table created successfully.');
    } catch (error) {
        console.error('Error creating asset_maintenance table:', error);
    }
}

up();
