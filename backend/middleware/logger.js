const db = require('../config/database');

// Log activity
async function logActivity(userId, action, module, entityType = null, entityId = null, details = null, req = null) {
    try {
        const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
        const userAgent = req ? req.headers['user-agent'] : null;

        await db.query(
            `INSERT INTO sysadmin_activity_logs 
       (user_id, action, module, entity_type, entity_id, ip_address, user_agent, details) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, action, module, entityType, entityId, ipAddress, userAgent, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error to prevent breaking the main operation
    }
}

// Middleware to log requests
const logRequest = (module) => {
    return (req, res, next) => {
        const originalSend = res.json;

        res.json = function (data) {
            // Log after response is sent
            if (req.user && req.method !== 'GET') {
                const action = `${req.method} ${req.path}`;
                logActivity(req.user.id, action, module, null, null, { body: req.body }, req);
            }

            originalSend.call(this, data);
        };

        next();
    };
};

module.exports = {
    logActivity,
    logRequest
};
