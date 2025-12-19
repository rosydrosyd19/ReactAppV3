const db = require('../../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const runMigration = async () => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        console.log('Adding to_asset_id to asset_credential_history table...');

        // Add to_asset_id column
        await connection.query(`
            ALTER TABLE asset_credential_history
            ADD COLUMN to_asset_id INT NULL AFTER to_user_id,
            ADD CONSTRAINT fk_cred_hist_to_asset FOREIGN KEY (to_asset_id) REFERENCES asset_items(id) ON DELETE SET NULL
        `);

        await connection.commit();
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        if (connection) await connection.rollback();

        // Check if error is duplicate column
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists, skipping...');
            process.exit(0);
        }

        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
