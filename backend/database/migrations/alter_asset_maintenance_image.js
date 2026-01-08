const db = require('../../config/database');

async function up() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Add column request_image_url to asset_maintenance table
        try {
            await connection.query("ALTER TABLE asset_maintenance ADD COLUMN request_image_url VARCHAR(255) AFTER description");
            console.log("Executed: ALTER TABLE asset_maintenance ADD COLUMN request_image_url VARCHAR(255)");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column request_image_url already exists, skipping.");
            } else {
                throw err;
            }
        }

        await connection.commit();
        console.log('Migration for asset_maintenance image column successfully executed.');
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
