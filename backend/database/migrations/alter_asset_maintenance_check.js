const db = require('../../config/database');

async function up() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Add columns to asset_maintenance table
        const columnsToAdd = [
            "ADD COLUMN requester_name VARCHAR(100) AFTER status",
            "ADD COLUMN requester_phone VARCHAR(20) AFTER requester_name",
            "ADD COLUMN ticket_number VARCHAR(50) UNIQUE AFTER id" // Add ticket_number near the beginning
        ];

        for (const col of columnsToAdd) {
            // Check if column exists to avoid errors on re-run (simple check)
            // Ideally we'd query information_schema, but for this simpler migration script structure:
            try {
                await connection.query(`ALTER TABLE asset_maintenance ${col}`);
                console.log(`Executed: ALTER TABLE asset_maintenance ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists, skipping: ${col}`);
                } else {
                    throw err;
                }
            }
        }

        await connection.commit();
        console.log('Migration for asset_maintenance successfully executed.');
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
