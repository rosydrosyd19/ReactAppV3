const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken: authenticateToken, checkPermission } = require('../middleware/auth');

// Get all credentials
router.get('/', authenticateToken, checkPermission('asset.credentials.view'), async (req, res) => {
    try {
        const { search, category } = req.query;
        // CASTing is usually handled by driver, but removing the subquery count avoids BigInt JSON serialization issues entirely.
        // We can derive count from assigned_ids in frontend or here.
        let query = `
            SELECT c.*, u.username as created_by_name,
                   GROUP_CONCAT(au.id) as assigned_ids,
                   GROUP_CONCAT(au.username SEPARATOR ', ') as assigned_usernames,
                   GROUP_CONCAT(COALESCE(au.full_name, au.username) SEPARATOR ', ') as assigned_names
            FROM asset_credentials c
            LEFT JOIN sysadmin_users u ON c.created_by = u.id
            LEFT JOIN asset_credential_assignments aca ON c.id = aca.credential_id
            LEFT JOIN sysadmin_users au ON aca.user_id = au.id
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
                   GROUP_CONCAT(COALESCE(au.full_name, au.username) SEPARATOR ', ') as assigned_names
            FROM asset_credentials c
            LEFT JOIN sysadmin_users u ON c.created_by = u.id
            LEFT JOIN asset_credential_assignments aca ON c.id = aca.credential_id
            LEFT JOIN sysadmin_users au ON aca.user_id = au.id
            WHERE c.id = ? AND (c.is_deleted = FALSE OR c.is_deleted IS NULL)
            GROUP BY c.id
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Credential not found' });
        }

        // Fetch detailed assignments for this credential to return as a clean array
        const assignments = await db.query(`
            SELECT u.id, u.username, u.full_name, aca.assigned_at
            FROM asset_credential_assignments aca
            JOIN sysadmin_users u ON aca.user_id = u.id
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
        const { platform_name, username, password, url, category, description } = req.body;

        if (!platform_name) {
            return res.status(400).json({ success: false, message: 'Platform name is required' });
        }

        const result = await db.query(`
            INSERT INTO asset_credentials (platform_name, username, password, url, category, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [platform_name, username, password, url, category || 'other', description, req.user.id]);

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

        const { user_id, notes } = req.body;
        const credentialId = req.params.id;

        // Verify credential exists
        const rows = await connection.query(
            'SELECT * FROM asset_credentials WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL) FOR UPDATE',
            [credentialId]
        );

        if (!rows || rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Credential not found' });
        }

        // Check if already assigned to this user
        const existingAssignment = await connection.query(
            'SELECT id FROM asset_credential_assignments WHERE credential_id = ? AND user_id = ?',
            [credentialId, user_id]
        );

        if (existingAssignment.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'This credential is already assigned to this user' });
        }

        // Add assignment
        await connection.query(
            'INSERT INTO asset_credential_assignments (credential_id, user_id) VALUES (?, ?)',
            [credentialId, user_id]
        );

        // Update credential status (it remains 'assigned' if at least one person has it)
        await connection.query(
            'UPDATE asset_credentials SET status = ? WHERE id = ?',
            ['assigned', credentialId]
        );

        // Record history
        await connection.query(`
            INSERT INTO asset_credential_history (credential_id, action_type, performed_by, to_user_id, notes)
            VALUES (?, 'checkout', ?, ?, ?)
        `, [credentialId, req.user.id, user_id, notes]);

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

        const { notes, user_id } = req.body; // user_id OPTIONAL for single assignment, REQUIRED for multiple
        const credentialId = req.params.id;

        // Get current assignments
        const assignments = await connection.query(
            'SELECT user_id FROM asset_credential_assignments WHERE credential_id = ? FOR UPDATE',
            [credentialId]
        );

        if (assignments.length === 0) {
            await connection.rollback();
            return res.json({ success: true, message: 'Credential is already available' });
        }

        let userIdsToCheckIn = [];

        if (user_id) {
            // Specific user check-in
            userIdsToCheckIn.push(user_id);
        } else {
            // No user specified
            if (assignments.length === 1) {
                // Only one assignee, safe to infer
                userIdsToCheckIn.push(assignments[0].user_id);
            } else {
                // Ambiguous!
                await connection.rollback();

                // Fetch details for the response
                const detailedAssignments = await connection.query(`
                    SELECT u.id, u.username, u.full_name 
                    FROM asset_credential_assignments aca 
                    JOIN sysadmin_users u ON aca.user_id = u.id 
                    WHERE aca.credential_id = ?
                `, [credentialId]);

                return res.status(400).json({
                    success: false,
                    message: 'Multiple users assigned. Please specify who to check in.',
                    requires_user_selection: true,
                    assigned_users: detailedAssignments
                });
            }
        }

        // Process Check-ins
        for (const uid of userIdsToCheckIn) {
            // Verify this user is actually assigned
            const isAssigned = assignments.find(a => a.user_id == uid);
            if (!isAssigned) continue;

            // Remove assignment
            await connection.query(
                'DELETE FROM asset_credential_assignments WHERE credential_id = ? AND user_id = ?',
                [credentialId, uid]
            );

            // Record history
            await connection.query(`
                INSERT INTO asset_credential_history (credential_id, action_type, performed_by, to_user_id, notes)
                VALUES (?, 'checkin', ?, ?, ?)
            `, [credentialId, req.user.id, uid, notes]);
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
