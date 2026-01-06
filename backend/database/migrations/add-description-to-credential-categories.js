const db = require('../../config/database');

async function up() {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if column exists to avoid error
        const columns = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'asset_credential_categories' 
            AND COLUMN_NAME = 'description'
        `);

        if (columns.length === 0) {
            console.log('Adding description column to asset_credential_categories...');
            await connection.query(`
                ALTER TABLE asset_credential_categories 
                ADD COLUMN description TEXT AFTER category_name
            `);
            console.log('Column added successfully.');
        } else {
            console.log('Column description already exists.');
        }

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
