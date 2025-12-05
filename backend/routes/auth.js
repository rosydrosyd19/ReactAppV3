const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { logActivity } = require('../middleware/logger');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Get user
        const users = await db.query(
            'SELECT * FROM sysadmin_users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Get user permissions
        const permissions = await db.query(`
      SELECT DISTINCT p.permission_key, p.module_name
      FROM sysadmin_permissions p
      WHERE EXISTS (
        SELECT 1 FROM sysadmin_role_permissions rp
        INNER JOIN sysadmin_user_roles ur ON ur.role_id = rp.role_id
        WHERE rp.permission_id = p.id AND ur.user_id = ?
      )
      OR EXISTS (
        SELECT 1 FROM sysadmin_user_permissions up
        WHERE up.permission_id = p.id AND up.user_id = ?
      )
    `, [user.id, user.id]);

        // Get user roles
        const roles = await db.query(`
      SELECT r.id, r.role_name
      FROM sysadmin_roles r
      INNER JOIN sysadmin_user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `, [user.id]);

        // Log login activity
        await logActivity(user.id, 'LOGIN', 'sysadmin', 'user', user.id, null, req);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    phone: user.phone
                },
                roles: roles.map(r => r.role_name),
                permissions: permissions.map(p => p.permission_key),
                modules: [...new Set(permissions.map(p => p.module_name))]
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Register (for initial setup or admin use)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        // Check if user exists
        const existing = await db.query(
            'SELECT id FROM sysadmin_users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await db.query(
            `INSERT INTO sysadmin_users (username, email, password, full_name, phone) 
       VALUES (?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, full_name, phone]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: result.insertId,
                username,
                email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Verify token (for checking if user is still authenticated)
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const users = await db.query(
            'SELECT id, username, email, full_name, is_active FROM sysadmin_users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({ success: false, message: 'Invalid user' });
        }

        res.json({
            success: true,
            data: { user: users[0] }
        });

    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

module.exports = router;
