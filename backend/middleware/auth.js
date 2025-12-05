const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user data from database
        const users = await db.query(
            'SELECT id, username, email, full_name, is_active FROM sysadmin_users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or inactive user.'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Check if user has specific permission
const checkPermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Check if user has permission via role or direct assignment
            const query = `
        SELECT DISTINCT p.permission_key
        FROM sysadmin_permissions p
        WHERE p.permission_key = ?
        AND (
          -- Via role
          EXISTS (
            SELECT 1 FROM sysadmin_role_permissions rp
            INNER JOIN sysadmin_user_roles ur ON ur.role_id = rp.role_id
            WHERE rp.permission_id = p.id AND ur.user_id = ?
          )
          -- Or direct permission
          OR EXISTS (
            SELECT 1 FROM sysadmin_user_permissions up
            WHERE up.permission_id = p.id AND up.user_id = ?
          )
        )
      `;

            const result = await db.query(query, [permissionKey, userId, userId]);

            if (result.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking permissions.'
            });
        }
    };
};

// Check if user has any of the specified permissions
const checkAnyPermission = (permissionKeys) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const placeholders = permissionKeys.map(() => '?').join(',');

            const query = `
        SELECT DISTINCT p.permission_key
        FROM sysadmin_permissions p
        WHERE p.permission_key IN (${placeholders})
        AND (
          EXISTS (
            SELECT 1 FROM sysadmin_role_permissions rp
            INNER JOIN sysadmin_user_roles ur ON ur.role_id = rp.role_id
            WHERE rp.permission_id = p.id AND ur.user_id = ?
          )
          OR EXISTS (
            SELECT 1 FROM sysadmin_user_permissions up
            WHERE up.permission_id = p.id AND up.user_id = ?
          )
        )
      `;

            const params = [...permissionKeys, userId, userId];
            const result = await db.query(query, params);

            if (result.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking permissions.'
            });
        }
    };
};

module.exports = {
    verifyToken,
    checkPermission,
    checkAnyPermission
};
