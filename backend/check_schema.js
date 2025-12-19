const db = require('./config/database');

async function checkSchema() {
    try {
        console.log("Checking schema for asset_credential_history...");
        const columns = await db.query("DESCRIBE asset_credential_history");
        console.log("Columns:", columns);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

checkSchema();
