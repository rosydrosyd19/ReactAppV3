const cron = require('node-cron');
const db = require('../config/database');

const initCronJobs = () => {
    console.log('Initializing Cron Jobs...');

    // Schedule task to run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily log cleanup...');
        try {
            // Delete logs older than 100 days
            const result = await db.query(
                'DELETE FROM sysadmin_activity_logs WHERE created_at < NOW() - INTERVAL 100 DAY'
            );
            console.log(`Log cleanup completed. Deleted ${result.affectedRows} old logs.`);
        } catch (error) {
            console.error('Error during log cleanup:', error);
        }
    });
};

module.exports = initCronJobs;
