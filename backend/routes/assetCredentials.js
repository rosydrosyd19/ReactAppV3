const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken: authenticateToken, checkPermission } = require('../middleware/auth');

// Get all credentials
router.get('/', authenticateToken, checkPermission('asset.credentials.view'), async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = `
            SELECT c.*, u.username as created_by_name 
            FROM asset_credentials c
            LEFT JOIN sysadmin_users u ON c.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (c.platform_name LIKE ? OR c.username LIKE ? OR c.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ` AND c.category = ?`;
            params.push(category);
        }

        query += ` ORDER BY c.created_at DESC`;

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
    }
});

// Get credential by ID
router.get('/:id', authenticateToken, checkPermission('asset.credentials.view'), async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, u.username as created_by_name 
            FROM asset_credentials c
            LEFT JOIN sysadmin_users u ON c.created_by = u.id
            WHERE c.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Credential not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching credential:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch credential' });
    }
});

// Create credential
router.post('/', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    try {
        const { platform_name, username, password, url, category, description } = req.body;

        if (!platform_name) {
            return res.status(400).json({ success: false, message: 'Platform name is required' });
        }

        const [result] = await db.query(`
            INSERT INTO asset_credentials (platform_name, username, password, url, category, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [platform_name, username, password, url, category || 'other', description, req.user.id]);

        res.status(201).json({
            success: true,
            message: 'Credential created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Error creating credential:', error);
        res.status(500).json({ success: false, message: 'Failed to create credential' });
    }
});

// Update credential
router.put('/:id', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    try {
        const { platform_name, username, password, url, category, description } = req.body;

        if (!platform_name) {
            return res.status(400).json({ success: false, message: 'Platform name is required' });
        }

        await db.query(`
            UPDATE asset_credentials 
            SET platform_name = ?, username = ?, password = ?, url = ?, category = ?, description = ?
            WHERE id = ?
        `, [platform_name, username, password, url, category, description, req.params.id]);

        res.json({ success: true, message: 'Credential updated successfully' });
    } catch (error) {
        console.error('Error updating credential:', error);
        res.status(500).json({ success: false, message: 'Failed to update credential' });
    }
});

// Delete credential
router.delete('/:id', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    try {
        await db.query('DELETE FROM asset_credentials WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ success: false, message: 'Failed to delete credential' });
    }
});

module.exports = router;
