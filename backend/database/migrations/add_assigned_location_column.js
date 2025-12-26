const db = require('../config/database');

async function run() {
    try {
        console.log('Adding assigned_location_id column to asset_items table...');
        await db.query(`
            ALTER TABLE asset_items 
            ADD COLUMN assigned_location_id INT NULL DEFAULT NULL AFTER location_id,
            ADD CONSTRAINT fk_asset_assigned_location FOREIGN KEY (assigned_location_id) REFERENCES asset_locations(id) ON DELETE SET NULL
        `);
        console.log('Column assigned_location_id added successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column assigned_location_id already exists.');
        } else {
            console.error('Error adding column:', error);
        }
    } finally {
        process.exit();
    }
}

run();
