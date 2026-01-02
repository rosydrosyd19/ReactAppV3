const db = require('../../config/database');

async function fixCategoryColumn() {
    console.log('🔄 Starting database schema fix...');
    try {
        console.log('📊 Executing: ALTER TABLE asset_credentials MODIFY COLUMN category VARCHAR(100)');

        await db.query('ALTER TABLE asset_credentials MODIFY COLUMN category VARCHAR(100)');

        console.log('✅ Success: asset_credentials.category column has been updated to VARCHAR(100).');
    } catch (error) {
        console.error('❌ Error executing fix:', error.message);
    } finally {
        console.log('👋 Closing database connection...');
        if (db.pool) {
            await db.pool.end();
        }
    }
}

fixCategoryColumn();
