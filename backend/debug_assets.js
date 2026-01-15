const db = require('./config/database');
require('dotenv').config();

async function checkAssets() {
    try {
        console.log('Checking Categories...');
        const categories = await db.query("SELECT * FROM asset_categories");
        console.log('Categories:', categories);

        console.log('\nChecking Assets...');
        const assets = await db.query(`
            SELECT a.id, a.asset_name, a.asset_tag, c.category_name 
            FROM asset_items a
            LEFT JOIN asset_categories c ON a.category_id = c.id
        `);
        console.log('Assets:', assets);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

checkAssets();
