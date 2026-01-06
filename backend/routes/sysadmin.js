const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { verifyToken, checkPermission } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');
const upload = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// ==================== USERS ====================

// Get all users
router.get('/users', checkPermission('sysadmin.users.view'), async (req, res) => {
    try {
        const users = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.full_name, u.phone, 
        u.is_active, u.created_at, u.updated_at,
        GROUP_CONCAT(DISTINCT r.role_name) as roles
      FROM sysadmin_users u
      LEFT JOIN sysadmin_user_roles ur ON u.id = ur.user_id
      LEFT JOIN sysadmin_roles r ON ur.role_id = r.id
      WHERE u.is_deleted = FALSE
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
});

// Get single user
router.get('/users/:id', checkPermission('sysadmin.users.view'), async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT id, username, email, full_name, phone, is_active, created_at FROM sysadmin_users WHERE id = ? AND is_deleted = FALSE',
            [req.params.id]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get roles
        const roles = await db.query(`
      SELECT r.id, r.role_name, r.description
      FROM sysadmin_roles r
      INNER JOIN sysadmin_user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [req.params.id]);

        // Get direct permissions
        const permissions = await db.query(`
      SELECT p.id, p.permission_key, p.permission_name
      FROM sysadmin_permissions p
      INNER JOIN sysadmin_user_permissions up ON up.permission_id = p.id
      WHERE up.user_id = ?
    `, [req.params.id]);

        user.roles = roles;
        user.direct_permissions = permissions;

        // Get assigned assets
        const assets = await db.query(`
            SELECT 
                a.id, a.asset_tag, a.asset_name, a.status, 
                c.category_name, l.location_name
            FROM asset_items a
            LEFT JOIN asset_categories c ON a.category_id = c.id
            LEFT JOIN asset_locations l ON a.location_id = l.id
            WHERE a.assigned_to = ? AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)
        `, [req.params.id]);

        user.assigned_assets = assets;

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
});

// Create user
router.post('/users', checkPermission('sysadmin.users.create'), async (req, res) => {
    console.log('=== CREATE USER REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    try {
        const { username, email, password, full_name, phone, role_ids } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        // Check if username already exists
        const existingUsers = await db.query(
            'SELECT id FROM sysadmin_users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers && existingUsers.length > 0) {
            console.log('User already exists');
            return res.status(400).json({
                success: false,
                message: 'Username atau email sudah digunakan'
            });
        }

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Inserting user...');
        const result = await db.query(
            'INSERT INTO sysadmin_users (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name || null, phone || null]
        );

        const userId = result.insertId;
        console.log('User created with ID:', userId);

        // Assign roles if provided
        if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
            console.log('Assigning roles:', role_ids);
            for (const roleId of role_ids) {
                await db.query(
                    'INSERT INTO sysadmin_user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)',
                    [userId, roleId, req.user.id]
                );
            }
        }

        console.log('Logging activity...');
        await logActivity(req.user.id, 'CREATE_USER', 'sysadmin', 'user', userId, { username }, req);

        console.log('User created successfully!');
        res.status(201).json({
            success: true,
            data: {
                id: Number(userId), // Convert BigInt to Number
                username,
                email
            }
        });
    } catch (error) {
        console.error('=== CREATE USER ERROR ===');
        console.error('Error:', error);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating user'
        });
    }
});

// Update user
router.put('/users/:id', checkPermission('sysadmin.users.edit'), async (req, res) => {
    try {
        const { email, full_name, phone, is_active, password, role_ids } = req.body;

        let query = 'UPDATE sysadmin_users SET email = ?, full_name = ?, phone = ?, is_active = ?';
        let params = [email, full_name, phone, is_active];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(req.params.id);

        const result = await db.query(query, params);
        console.log('User basic info updated, affectedRows:', result.affectedRows);

        // Update roles if provided
        if (role_ids !== undefined) {
            try {
                console.log('Updating roles:', role_ids);
                // First remove existing roles
                await db.query('DELETE FROM sysadmin_user_roles WHERE user_id = ?', [req.params.id]);

                if (Array.isArray(role_ids) && role_ids.length > 0) {
                    if (!req.user || !req.user.id) throw new Error('User context missing');

                    const placeholders = role_ids.map(() => '(?, ?, ?)').join(', ');
                    const query = `INSERT INTO sysadmin_user_roles (user_id, role_id, assigned_by) VALUES ${placeholders}`;

                    const params = [];
                    role_ids.forEach(roleId => {
                        params.push(parseInt(req.params.id));
                        params.push(parseInt(roleId));
                        params.push(req.user.id);
                    });

                    await db.query(query, params);
                }
            } catch (roleError) {
                console.error('Error updating roles:', roleError);
                throw new Error('Failed to update user roles: ' + roleError.message);
            }
        }

        try {
            if (req.user && req.user.id) {
                // Sanitize password from logs
                const logData = { ...req.body };
                delete logData.password;

                await logActivity(req.user.id, 'UPDATE_USER', 'sysadmin', 'user', req.params.id, logData, req);
            }
        } catch (logError) {
            console.error('Error logging activity:', logError);
            // Don't fail the request if logging fails, just log errors
        }

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error details:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Delete user
router.delete('/users/:id', checkPermission('sysadmin.users.delete'), async (req, res) => {
    try {
        // Prevent deleting yourself
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        // Soft delete instead of hard delete
        await db.query('UPDATE sysadmin_users SET is_deleted = TRUE WHERE id = ?', [req.params.id]);

        // Also we might want to deactivate user to be safe
        await db.query('UPDATE sysadmin_users SET is_active = FALSE WHERE id = ?', [req.params.id]);

        await logActivity(req.user.id, 'DELETE_USER', 'sysadmin', 'user', req.params.id, { soft_delete: true }, req);

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

// Get roles list (for dropdowns/selects)
router.get('/roles-list', checkPermission('sysadmin.users.create'), async (req, res) => {
    try {
        const roles = await db.query('SELECT id, role_name, description FROM sysadmin_roles ORDER BY role_name');
        res.json({ success: true, data: roles });
    } catch (error) {
        console.error('Get roles list error:', error);
        res.status(500).json({ success: false, message: 'Error fetching roles list' });
    }
});

// ==================== ROLES ====================

// Get all roles
router.get('/roles', checkPermission('sysadmin.roles.view'), async (req, res) => {
    try {
        const roles = await db.query(`
      SELECT r.*, COUNT(DISTINCT ur.user_id) as user_count, COUNT(DISTINCT rp.permission_id) as permission_count
      FROM sysadmin_roles r
      LEFT JOIN sysadmin_user_roles ur ON r.id = ur.role_id
      LEFT JOIN sysadmin_role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);

        res.json({ success: true, data: roles });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ success: false, message: 'Error fetching roles' });
    }
});

// Get single role
router.get('/roles/:id', checkPermission('sysadmin.roles.view'), async (req, res) => {
    try {
        const [role] = await db.query('SELECT * FROM sysadmin_roles WHERE id = ?', [req.params.id]);

        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        const permissions = await db.query(`
      SELECT p.id, p.permission_key, p.permission_name, p.module_name
      FROM sysadmin_permissions p
      INNER JOIN sysadmin_role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `, [req.params.id]);

        role.permissions = permissions;

        res.json({ success: true, data: role });
    } catch (error) {
        console.error('Get role error:', error);
        res.status(500).json({ success: false, message: 'Error fetching role' });
    }
});

// Create role
router.post('/roles', checkPermission('sysadmin.roles.manage'), async (req, res) => {
    try {
        const { role_name, description, permission_ids } = req.body;

        const result = await db.query(
            'INSERT INTO sysadmin_roles (role_name, description) VALUES (?, ?)',
            [role_name, description]
        );

        const roleId = result.insertId;

        if (permission_ids && permission_ids.length > 0) {
            const values = permission_ids.map(permId => [roleId, permId]);
            await db.query('INSERT INTO sysadmin_role_permissions (role_id, permission_id) VALUES ?', [values]);
        }

        await logActivity(req.user.id, 'CREATE_ROLE', 'sysadmin', 'role', roleId, { role_name }, req);

        res.status(201).json({ success: true, data: { id: roleId } });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ success: false, message: 'Error creating role' });
    }
});

// Update role
router.put('/roles/:id', checkPermission('sysadmin.roles.manage'), async (req, res) => {
    try {
        const { role_name, description, permission_ids } = req.body;

        await db.query(
            'UPDATE sysadmin_roles SET role_name = ?, description = ? WHERE id = ?',
            [role_name, description, req.params.id]
        );

        // Update permissions
        if (permission_ids !== undefined) {
            await db.query('DELETE FROM sysadmin_role_permissions WHERE role_id = ?', [req.params.id]);

            if (permission_ids.length > 0) {
                const values = permission_ids.map(permId => [req.params.id, permId]);
                await db.query('INSERT INTO sysadmin_role_permissions (role_id, permission_id) VALUES ?', [values]);
            }
        }

        await logActivity(req.user.id, 'UPDATE_ROLE', 'sysadmin', 'role', req.params.id, req.body, req);

        res.json({ success: true, message: 'Role updated successfully' });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: 'Error updating role' });
    }
});

// Delete role
router.delete('/roles/:id', checkPermission('sysadmin.roles.manage'), async (req, res) => {
    try {
        const [role] = await db.query('SELECT is_system_role FROM sysadmin_roles WHERE id = ?', [req.params.id]);

        if (role && role.is_system_role) {
            return res.status(400).json({ success: false, message: 'Cannot delete system role' });
        }

        await db.query('DELETE FROM sysadmin_roles WHERE id = ?', [req.params.id]);
        await logActivity(req.user.id, 'DELETE_ROLE', 'sysadmin', 'role', req.params.id, null, req);

        res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ success: false, message: 'Error deleting role' });
    }
});

// ==================== PERMISSIONS ====================

// Get all permissions
router.get('/permissions', checkPermission('sysadmin.roles.view'), async (req, res) => {
    try {
        const permissions = await db.query('SELECT * FROM sysadmin_permissions ORDER BY module_name, permission_name');
        res.json({ success: true, data: permissions });
    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching permissions' });
    }
});

// Get user permissions
router.get('/users/:id/permissions', checkPermission('sysadmin.users.view'), async (req, res) => {
    try {
        const permissions = await db.query(`
      SELECT DISTINCT p.id, p.permission_key, p.permission_name, p.module_name,
        CASE WHEN up.id IS NOT NULL THEN 'direct' ELSE 'role' END as source
      FROM sysadmin_permissions p
      LEFT JOIN sysadmin_user_permissions up ON p.id = up.permission_id AND up.user_id = ?
      WHERE EXISTS (
        SELECT 1 FROM sysadmin_role_permissions rp
        INNER JOIN sysadmin_user_roles ur ON ur.role_id = rp.role_id
        WHERE rp.permission_id = p.id AND ur.user_id = ?
      ) OR up.id IS NOT NULL
    `, [req.params.id, req.params.id]);

        res.json({ success: true, data: permissions });
    } catch (error) {
        console.error('Get user permissions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching user permissions' });
    }
});

// ==================== ACTIVITY LOGS ====================

// Get activity logs
router.get('/logs', checkPermission('sysadmin.logs.view'), async (req, res) => {
    try {
        const { limit = 100, offset = 0, user_id, module, action } = req.query;

        let query = `
      SELECT l.*, u.username, u.full_name
      FROM sysadmin_activity_logs l
      LEFT JOIN sysadmin_users u ON l.user_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (user_id) {
            query += ' AND l.user_id = ?';
            params.push(user_id);
        }

        if (module) {
            query += ' AND l.module = ?';
            params.push(module);
        }

        if (action) {
            query += ' AND l.action LIKE ?';
            params.push(`%${action}%`);
        }

        query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const logs = await db.query(query, params);

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ success: false, message: 'Error fetching logs' });
    }
});

// ==================== SETTINGS ====================

// Get all settings (public read for now, but good to have authenticated)
router.get('/settings', async (req, res) => {
    try {
        const settings = await db.query('SELECT setting_key, setting_value, description FROM sysadmin_settings');
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.setting_key] = s.setting_value;
        });
        res.json({ success: true, data: settingsMap });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: 'Error fetching settings' });
    }
});

// Update settings
router.put('/settings', checkPermission('sysadmin.settings.manage'), async (req, res) => {
    try {
        const settings = req.body;
        const keys = Object.keys(settings);

        if (keys.length === 0) {
            return res.status(400).json({ success: false, message: 'No settings provided' });
        }

        for (const key of keys) {
            await db.query(
                `INSERT INTO sysadmin_settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [key, settings[key], settings[key]]
            );
        }

        await logActivity(req.user.id, 'UPDATE_SETTINGS', 'sysadmin', 'settings', null, settings, req);
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Error updating settings' });
    }
});

// Upload favicon/logo
router.post('/settings/upload', checkPermission('sysadmin.settings.manage'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error('Upload setting file error:', error);
        res.status(500).json({ success: false, message: 'Error uploading file' });
    }
});

module.exports = router;
