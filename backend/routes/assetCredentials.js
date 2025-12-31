const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken: authenticateToken, checkPermission } = require('../middleware/auth');

// ==================== CREDENTIAL CATEGORIES ====================

// Get all credential categories
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await db.query(`
            SELECT * FROM credential_categories 
            WHERE is_deleted = FALSE OR is_deleted IS NULL 
            ORDER BY category_name
        `);
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get credential categories error:', error);
        res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
});

// Create credential category
router.post('/categories', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    try {
        const { category_name } = req.body;

        const existing = await db.query('SELECT id FROM credential_categories WHERE category_name = ?', [category_name]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }

        const result = await db.query(
            'INSERT INTO credential_categories (category_name, created_by) VALUES (?, ?)',
            [category_name, req.user.id]
        );

        res.status(201).json({ success: true, data: { id: result.insertId.toString(), name: category_name } });
    } catch (error) {
        console.error('Create credential category error:', error);
        res.status(500).json({ success: false, message: 'Error creating category' });
    }
});

// ==================== CREDENTIALS ====================

// Get all credentials
router.get('/my-assignments', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT c.*, aca.assigned_at
            FROM asset_credentials c
            INNER JOIN asset_credential_assignments aca ON c.id = aca.credential_id
            WHERE aca.user_id = ? AND (c.is_deleted = FALSE OR c.is_deleted IS NULL)
            ORDER BY aca.assigned_at DESC
        `;

        const rows = await db.query(query, [req.user.id]);

        const safeRows = JSON.parse(JSON.stringify(rows, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json({ success: true, data: safeRows });
    } catch (error) {
        console.error('Error fetching my assignments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
    }
});

router.get('/', authenticateToken, checkPermission('asset.credentials.view'), async (req, res) => {
    try {
        const { search, category } = req.query;
        // CASTing is usually handled by driver, but removing the subquery count avoids BigInt JSON serialization issues entirely.
        // We can derive count from assigned_ids in frontend or here.
        let query = `
            SELECT c.*, u.username as created_by_name,
                   GROUP_CONCAT(au.id) as assigned_ids,
                   GROUP_CONCAT(au.username SEPARATOR ', ') as assigned_usernames,
                   GROUP_CONCAT(COALESCE(au.full_name, au.username) SEPARATOR ', ') as assigned_names,
                   GROUP_CONCAT(ai.id) as assigned_asset_ids,
                   GROUP_CONCAT(ai.asset_name SEPARATOR ', ') as assigned_asset_names
            FROM asset_credentials c
            LEFT JOIN sysadmin_users u ON c.created_by = u.id
            LEFT JOIN asset_credential_assignments aca ON c.id = aca.credential_id
            LEFT JOIN sysadmin_users au ON aca.user_id = au.id
            LEFT JOIN asset_items ai ON aca.asset_id = ai.id
            WHERE (c.is_deleted = FALSE OR c.is_deleted IS NULL)
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

        // Added u.username to group by to be safe, though functionally dependent.
        query += ` GROUP BY c.id, u.username ORDER BY c.created_at DESC`;

        const rows = await db.query(query, params);

        // Handle BigInt serialization if any fields are BigInt (like IDs sometimes in mariadb).
        // This helper replaces BigInts with string representation.
        const safeRows = JSON.parse(JSON.stringify(rows, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

        res.json({ success: true, data: safeRows });
    } catch (error) {
        console.error('Error fetching credentials:', error);
        require('fs').writeFileSync('debug_get_credential_error.txt', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
        res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
    }
});

// Get credential by ID
router.get('/:id', authenticateToken, checkPermission('asset.credentials.view'), async (req, res) => {
    try {
        const rows = await db.query(`
            SELECT c.*, u.username as created_by_name,
                   GROUP_CONCAT(au.id) as assigned_ids,
                   GROUP_CONCAT(au.username SEPARATOR ', ') as assigned_usernames,
                   GROUP_CONCAT(COALESCE(au.full_name, au.username) SEPARATOR ', ') as assigned_names,
                   GROUP_CONCAT(ai.id) as assigned_asset_ids,
                   GROUP_CONCAT(ai.asset_name SEPARATOR ', ') as assigned_asset_names
            FROM asset_credentials c
            LEFT JOIN sysadmin_users u ON c.created_by = u.id
            LEFT JOIN asset_credential_assignments aca ON c.id = aca.credential_id
            LEFT JOIN sysadmin_users au ON aca.user_id = au.id
            LEFT JOIN asset_items ai ON aca.asset_id = ai.id
            WHERE c.id = ? AND (c.is_deleted = FALSE OR c.is_deleted IS NULL)
            GROUP BY c.id
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Credential not found' });
        }

        // Fetch detailed assignments for this credential to return as a clean array
        const assignments = await db.query(`
            SELECT 
                aca.id as assignment_id,
                aca.assigned_at,
                u.id as user_id, 
                u.username, 
                u.full_name,
                ai.id as asset_id,
                ai.asset_name,
                ai.asset_tag
            FROM asset_credential_assignments aca
            LEFT JOIN sysadmin_users u ON aca.user_id = u.id
            LEFT JOIN asset_items ai ON aca.asset_id = ai.id
            WHERE aca.credential_id = ?
        `, [req.params.id]);

        const credential = rows[0];
        credential.assigned_users = assignments;

        // Handle BigInt serialization
        const safeCredential = JSON.parse(JSON.stringify(credential, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

        res.json({ success: true, data: safeCredential });
    } catch (error) {
        console.error('Error fetching credential:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch credential' });
    }
});

// Create credential
router.post('/', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    try {
        const { platform_name, username, password, url, category, description, is_public } = req.body;

        if (!platform_name) {
            return res.status(400).json({ success: false, message: 'Platform name is required' });
        }

        const result = await db.query(`
            INSERT INTO asset_credentials (platform_name, username, password, url, category, description, is_public, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [platform_name, username, password, url, category || 'other', description, is_public || false, req.user.id]);

        res.status(201).json({
            success: true,
            message: 'Credential created successfully',
            data: { id: result.insertId ? result.insertId.toString() : null }
        });
    } catch (error) {
        console.error('Error creating credential:', error);
        require('fs').writeFileSync('debug_credential_error.txt', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
        res.status(500).json({ success: false, message: 'Failed to create credential: ' + error.message });
    }
});

// Update credential
router.put('/:id', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    try {
        const { platform_name, username, password, url, category, description, is_public } = req.body;

        if (!platform_name) {
            return res.status(400).json({ success: false, message: 'Platform name is required' });
        }

        await db.query(`
            UPDATE asset_credentials 
            SET platform_name = ?, username = ?, password = ?, url = ?, category = ?, description = ?, is_public = ?
            WHERE id = ?
        `, [platform_name, username, password, url, category, description, is_public || false, req.params.id]);

        res.json({ success: true, message: 'Credential updated successfully' });
    } catch (error) {
        console.error('Error updating credential:', error);
        res.status(500).json({ success: false, message: 'Failed to update credential' });
    }
});

// Delete credential
router.delete('/:id', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    try {
        await db.query('UPDATE asset_credentials SET is_deleted = TRUE WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Error deleting credential:', error);
        res.status(500).json({ success: false, message: 'Failed to delete credential' });
    }
});

// Check-out credential
router.post('/:id/checkout', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { user_id, asset_id, notes } = req.body;
        const credentialId = req.params.id;

        if (!user_id && !asset_id) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Either user_id or asset_id is required' });
        }

        // Verify credential exists
        const rows = await connection.query(
            'SELECT * FROM asset_credentials WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL) FOR UPDATE',
            [credentialId]
        );

        if (!rows || rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Credential not found' });
        }

        // Check for duplicates
        let existingAssignment;
        if (user_id) {
            existingAssignment = await connection.query(
                'SELECT id FROM asset_credential_assignments WHERE credential_id = ? AND user_id = ?',
                [credentialId, user_id]
            );
        } else {
            existingAssignment = await connection.query(
                'SELECT id FROM asset_credential_assignments WHERE credential_id = ? AND asset_id = ?',
                [credentialId, asset_id]
            );
        }

        if (existingAssignment.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'This credential is already assigned to this target' });
        }

        // Add assignment
        if (user_id) {
            await connection.query(
                'INSERT INTO asset_credential_assignments (credential_id, user_id) VALUES (?, ?)',
                [credentialId, user_id]
            );
        } else {
            await connection.query(
                'INSERT INTO asset_credential_assignments (credential_id, asset_id) VALUES (?, ?)',
                [credentialId, asset_id]
            );
        }

        // Update credential status
        await connection.query(
            'UPDATE asset_credentials SET status = ? WHERE id = ?',
            ['assigned', credentialId]
        );

        // Record history
        await connection.query(`
            INSERT INTO asset_credential_history (credential_id, action_type, performed_by, to_user_id, to_asset_id, notes)
            VALUES (?, 'checkout', ?, ?, ?, ?)
        `, [credentialId, req.user.id, user_id || null, asset_id || null, notes]);

        await connection.commit();
        res.json({ success: true, message: 'Credential checked out successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error checking out credential:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to checkout credential',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Check-in credential
router.post('/:id/checkin', authenticateToken, checkPermission('asset.credentials.manage'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { notes, user_id, asset_id } = req.body;
        const credentialId = req.params.id;

        // Get current assignments
        const assignments = await connection.query(
            'SELECT user_id, asset_id FROM asset_credential_assignments WHERE credential_id = ? FOR UPDATE',
            [credentialId]
        );

        if (assignments.length === 0) {
            await connection.rollback();
            return res.json({ success: true, message: 'Credential is already available' });
        }

        let targetsToCheckIn = []; // Array of { type: 'user'|'asset', id: int }

        if (user_id) {
            targetsToCheckIn.push({ type: 'user', id: user_id });
        } else if (asset_id) {
            targetsToCheckIn.push({ type: 'asset', id: asset_id });
        } else {
            // No target specified
            if (assignments.length === 1) {
                // Only one assignee, safe to infer
                const assign = assignments[0];
                if (assign.user_id) targetsToCheckIn.push({ type: 'user', id: assign.user_id });
                if (assign.asset_id) targetsToCheckIn.push({ type: 'asset', id: assign.asset_id });
            } else {
                // Ambiguous!
                await connection.rollback();

                // Fetch details for the response
                const detailedAssignments = await connection.query(`
                    SELECT 
                        aca.id,
                        u.id as user_id, u.username, u.full_name,
                        ai.id as asset_id, ai.asset_name, ai.asset_tag
                    FROM asset_credential_assignments aca 
                    LEFT JOIN sysadmin_users u ON aca.user_id = u.id 
                    LEFT JOIN asset_items ai ON aca.asset_id = ai.id
                    WHERE aca.credential_id = ?
                `, [credentialId]);

                return res.status(400).json({
                    success: false,
                    message: 'Multiple assignments found. Please specify who to check in.',
                    requires_selection: true,
                    assignments: detailedAssignments
                });
            }
        }

        // Process Check-ins
        for (const target of targetsToCheckIn) {
            // Verify assignment exists
            let isAssigned;
            if (target.type === 'user') {
                isAssigned = assignments.find(a => a.user_id == target.id);
            } else {
                isAssigned = assignments.find(a => a.asset_id == target.id);
            }

            if (!isAssigned) continue;

            // Remove assignment
            if (target.type === 'user') {
                await connection.query(
                    'DELETE FROM asset_credential_assignments WHERE credential_id = ? AND user_id = ?',
                    [credentialId, target.id]
                );
            } else {
                await connection.query(
                    'DELETE FROM asset_credential_assignments WHERE credential_id = ? AND asset_id = ?',
                    [credentialId, target.id]
                );
            }

            // Record history
            await connection.query(`
                INSERT INTO asset_credential_history (credential_id, action_type, performed_by, to_user_id, to_asset_id, notes)
                VALUES (?, 'checkin', ?, ?, ?, ?)
            `, [credentialId, req.user.id, target.type === 'user' ? target.id : null, target.type === 'asset' ? target.id : null, notes]);
        }

        // Check if any assignments remain
        const remaining = await connection.query(
            'SELECT COUNT(*) as count FROM asset_credential_assignments WHERE credential_id = ?',
            [credentialId]
        );

        if (remaining[0].count === 0) {
            await connection.query(
                'UPDATE asset_credentials SET status = ?, assigned_to = NULL WHERE id = ?',
                ['available', credentialId]
            );
        } else {
            // Still assigned to someone, ensure status is 'assigned'
            await connection.query(
                'UPDATE asset_credentials SET status = ? WHERE id = ?',
                ['assigned', credentialId]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Credential checked in successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error checking in credential:', error);
        res.status(500).json({ success: false, message: 'Failed to checkin credential' });
    } finally {
        connection.release();
    }
});

module.exports = router;
