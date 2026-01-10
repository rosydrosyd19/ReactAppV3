const express = require('express');
const db = require('../config/database');
const { verifyToken, checkPermission, checkAnyPermission } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');
const upload = require('../middleware/upload');
const { sendWhatsAppMessage } = require('../utils/whatsapp');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get single asset (Public)
router.get('/public/:id', async (req, res) => {
    try {
        const [asset] = await db.query(`
      SELECT 
        a.*,
        c.category_name,
        l.location_name,
        s.supplier_name,
        parent_asset.asset_name as assigned_to_asset_name,
        parent_asset.asset_tag as assigned_to_asset_tag
      FROM asset_items a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN asset_locations l ON a.location_id = l.id
      LEFT JOIN asset_suppliers s ON a.supplier_id = s.id
      LEFT JOIN asset_items parent_asset ON a.assigned_to_asset_id = parent_asset.id
      WHERE a.id = ? AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)
    `, [req.params.id]);

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // We don't expose user details or history in public view for security/privacy if preferred,
        // or we can strictly limit what's sent.
        // For now, sending basic asset info is safe.

        // Hide sensitive fields if any (cost is already visible in internal, maybe hide for public?)
        // User didn't specify, but "read only scan" usually implies basic info.
        // I will keep it similar to internal but maybe omit cost/warranty if that's sensitive?
        // Let's assume full read-only detail is fine for now as per "menampilkan detail asset".

        // Fetch history for public view as well
        const history = await db.query(`
          SELECT 
            h.*,
            u.username as performed_by_username,
            fu.username as from_user_username,
            tu.username as to_user_username,
            fl.location_name as from_location_name,
            tl.location_name as to_location_name,
            ta.asset_name as to_asset_name
          FROM asset_history h
          LEFT JOIN sysadmin_users u ON h.performed_by = u.id
          LEFT JOIN sysadmin_users fu ON h.from_user_id = fu.id
          LEFT JOIN sysadmin_users tu ON h.to_user_id = tu.id
          LEFT JOIN asset_locations fl ON h.from_location_id = fl.id
          LEFT JOIN asset_locations tl ON h.to_location_id = tl.id
          LEFT JOIN asset_items ta ON h.to_asset_id = ta.id
          WHERE h.asset_id = ?
          ORDER BY h.action_date DESC
        `, [req.params.id]);

        // Fetch maintenance records for public view
        const maintenance = await db.query(`
          SELECT * FROM asset_maintenance 
          WHERE asset_id = ? 
          ORDER BY maintenance_date DESC
        `, [req.params.id]);

        // Fetch assigned credentials for public view
        const credentials = await db.query(`
            SELECT c.id, c.platform_name, c.username, c.url, c.is_public, c.password 
            FROM asset_credentials c
            JOIN asset_credential_assignments ac ON c.id = ac.credential_id
            WHERE ac.asset_id = ? AND (c.is_deleted = FALSE OR c.is_deleted IS NULL)
        `, [req.params.id]);

        // Security: Filter out passwords for private credentials in public view
        const safeCredentials = credentials.map(cred => {
            if (!cred.is_public) {
                const { password, ...rest } = cred;
                return rest;
            }
            return cred;
        });

        asset.history = history;
        asset.maintenance_records = maintenance;
        asset.assigned_credentials = safeCredentials;

        res.json({ success: true, data: asset });
    } catch (error) {
        console.error('Get public asset error:', error);
        res.status(500).json({ success: false, message: 'Error fetching asset' });
    }
});


// Maintenance Request (Public) with Image Support
router.post('/maintenance-request', upload.single('image'), async (req, res) => {
    try {
        const { asset_id, issue_description, requester_name, requester_phone } = req.body;

        if (!asset_id || !issue_description) {
            return res.status(400).json({ success: false, message: 'Asset ID and issue description are required' });
        }

        // 1. Identify Requester (Guest or User)
        let userId = null;
        let finalRequesterName = requester_name;
        let finalRequesterPhone = requester_phone;

        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const [users] = await db.query('SELECT id, full_name, phone FROM sysadmin_users WHERE id = ?', [decoded.userId]);
                    if (users) {
                        userId = users.id;
                        // Use user info if not explicitly provided (or override? Plan said use if logged in)
                        // If frontend sends manual input even if logged in, we might honor it, but let's default to user data if missing.
                        if (!finalRequesterName) finalRequesterName = users.full_name;
                        if (!finalRequesterPhone) finalRequesterPhone = users.phone;
                    }
                }
            } catch (err) {
                console.warn('Token verification failed for maintenance request:', err.message);
                // Continue as guest
            }
        }

        if (!finalRequesterName || !finalRequesterPhone) {
            return res.status(400).json({ success: false, message: 'Name and Phone number are required' });
        }

        // 2. Generate Ticket Number (MT-YYYYMMDD-XXX)
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`;
        const prefix = `MT-${dateStr}-`;

        const [lastTicket] = await db.query(
            `SELECT ticket_number FROM asset_maintenance 
             WHERE ticket_number LIKE ? 
             ORDER BY LENGTH(ticket_number) DESC, ticket_number DESC LIMIT 1`,
            [`${prefix}%`]
        );

        let sequence = '001';
        if (lastTicket && lastTicket.ticket_number) {
            const parts = lastTicket.ticket_number.split('-');
            const lastSeq = parts[parts.length - 1];
            if (/^\d+$/.test(lastSeq)) {
                sequence = String(parseInt(lastSeq, 10) + 1).padStart(3, '0');
            }
        }
        const ticketNumber = `${prefix}${sequence}`;

        // 3. Insert into Database
        const request_image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await db.query(
            `INSERT INTO asset_maintenance (
                asset_id, maintenance_type, maintenance_date, description, status, 
                ticket_number, requester_name, requester_phone, created_by, request_image_url
            ) VALUES (?, 'corrective', NOW(), ?, 'requests', ?, ?, ?, ?, ?)`,
            [asset_id, issue_description, ticketNumber, finalRequesterName, finalRequesterPhone, userId, request_image_url]
        );

        // 4. Send Notifications
        // Fetch Asset Details for placeholders
        const [asset] = await db.query('SELECT asset_tag, asset_name FROM asset_items WHERE id = ?', [asset_id]);

        // Fetch Settings
        const settingsRows = await db.query("SELECT * FROM sysadmin_settings");
        let config = {};
        settingsRows.forEach(row => {
            config[row.setting_key] = row.setting_value;
        });

        // Prepare Placeholders
        const placeholders = {
            '{asset_tag}': asset ? asset.asset_tag : 'Unknown',
            '{asset_name}': asset ? asset.asset_name : 'Unknown',
            '{issue_description}': issue_description,
            '{request_date}': `${dd}-${mm}-${yyyy}`,
            '{requester_name}': finalRequesterName,
            '{requester_phone}': finalRequesterPhone,
            '{ticket_number}': ticketNumber
        };

        const replacePlaceholders = (template) => {
            if (!template) return '';
            let msg = template;
            for (const [key, value] of Object.entries(placeholders)) {
                msg = msg.replace(new RegExp(key, 'g'), value || '');
            }
            return msg;
        };

        // Send to Admins
        if (config.whatsapp_enable_admin_notifications === 'true' && config.admin_it_phones) {
            try {
                let adminPhones = [];
                try {
                    const parsed = JSON.parse(config.admin_it_phones);
                    if (Array.isArray(parsed)) adminPhones = parsed;
                    else adminPhones = [String(parsed)];
                } catch (e) {
                    adminPhones = [String(config.admin_it_phones)];
                }

                const adminMsg = replacePlaceholders(config.whatsapp_template_admin_request);
                if (adminMsg) {
                    for (const phone of adminPhones) {
                        if (phone) await sendWhatsAppMessage(phone, adminMsg);
                    }
                }
            } catch (e) {
                console.error('Error sending admin notifications:', e);
            }
        }

        // Send to User
        if (config.whatsapp_enable_user_notifications === 'true' && config.whatsapp_template_user_request && finalRequesterPhone) {
            const userMsg = replacePlaceholders(config.whatsapp_template_user_request);
            if (userMsg) {
                await sendWhatsAppMessage(finalRequesterPhone, userMsg);
            }
        }

        // Send to Telegram Admins
        if (config.telegram_enable_admin_notifications === 'true' && config.telegram_admin_chat_ids && config.telegram_bot_token) {
            try {
                let chatIds = [];
                try {
                    chatIds = JSON.parse(config.telegram_admin_chat_ids);
                } catch (e) {
                    chatIds = [config.telegram_admin_chat_ids]; // Legacy/Simple string support
                }

                if (Array.isArray(chatIds) && chatIds.length > 0) {
                    const telegramMsg = replacePlaceholders(config.telegram_template_admin_request);
                    if (telegramMsg) {
                        const axios = require('axios');
                        const promises = chatIds.map(chatId => {
                            return axios.post(`https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`, {
                                chat_id: chatId,
                                text: telegramMsg
                            }, { timeout: 10000 }).catch(err => {
                                console.error(`Failed to send Telegram to ${chatId}:`, err.message);
                            });
                        });
                        await Promise.all(promises);
                    }
                }
            } catch (error) {
                console.error('Error sending Telegram notifications:', error);
            }
        }

        res.status(201).json({ success: true, message: 'Maintenance request submitted successfully', ticket_number: ticketNumber });

    } catch (error) {
        console.error('Maintenance Request Error:', error);
        res.status(500).json({ success: false, message: 'Error submitting maintenance request' });
    }
});

// Apply authentication to all routes below
router.use(verifyToken);

// ==================== ASSETS ====================

// Get all assets
router.get('/assets', checkPermission('asset.items.view'), async (req, res) => {
    try {
        const { status, category_id, location_id, supplier_id, search, qr_print_min, qr_print_max } = req.query;

        let query = `
      SELECT 
        a.*,
        c.category_name,
        l.location_name,
        s.supplier_name,
        u.username as assigned_to_username,
        u.full_name as assigned_to_name,
        creator.username as created_by_username,
        parent_asset.asset_name as assigned_to_asset_name,
        parent_asset.asset_tag as assigned_to_asset_tag,
        al.location_name as assigned_location_name
      FROM asset_items a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN asset_locations l ON a.location_id = l.id
      LEFT JOIN asset_locations al ON a.assigned_location_id = al.id
      LEFT JOIN asset_suppliers s ON a.supplier_id = s.id
      LEFT JOIN sysadmin_users u ON a.assigned_to = u.id
      LEFT JOIN sysadmin_users creator ON a.created_by = creator.id
      LEFT JOIN asset_items parent_asset ON a.assigned_to_asset_id = parent_asset.id
      WHERE (a.is_deleted = FALSE OR a.is_deleted IS NULL)
    `;
        const params = [];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        if (category_id) {
            query += ' AND a.category_id = ?';
            params.push(category_id);
        }

        if (location_id) {
            query += ' AND a.location_id = ?';
            params.push(location_id);
        }

        if (supplier_id) {
            query += ' AND a.supplier_id = ?';
            params.push(supplier_id);
        }

        if (qr_print_min) {
            query += ' AND COALESCE(a.qr_print_count, 0) >= ?';
            params.push(qr_print_min);
        }

        if (qr_print_max) {
            query += ' AND COALESCE(a.qr_print_count, 0) <= ?';
            params.push(qr_print_max);
        }

        if (search) {
            query += ' AND (a.asset_name LIKE ? OR a.asset_tag LIKE ? OR a.serial_number LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        query += ' ORDER BY a.created_at DESC';

        const assets = await db.query(query, params);

        res.json({ success: true, data: assets });
    } catch (error) {
        console.error('Get assets error:', error);
        res.status(500).json({ success: false, message: 'Error fetching assets' });
    }
});

// Get next asset tag
router.get('/assets/next-tag', checkPermission('asset.items.create'), async (req, res) => {
    try {
        const { category_id, location_id, date } = req.query;

        // Default tag if info is missing
        if (!category_id || !location_id) {
            return res.json({ success: true, data: '' });
        }

        const [category] = await db.query('SELECT category_code FROM asset_categories WHERE id = ?', [category_id]);
        const [location] = await db.query('SELECT location_code FROM asset_locations WHERE id = ?', [location_id]);

        if (!category || !location) {
            return res.json({ success: true, data: '' });
        }

        const catCode = category.category_code || 'CAT';
        const locCode = location.location_code || 'LOC';

        let year = new Date().getFullYear();
        if (date) {
            year = new Date(date).getFullYear();
        }

        const prefix = `${locCode}/${catCode}/${year}/`;

        // Find last tag with this prefix
        // We use length check to avoid matching shorter prefixes accidentally if format changes
        const [lastAsset] = await db.query(
            `SELECT asset_tag FROM asset_items 
             WHERE asset_tag LIKE ? 
             ORDER BY LENGTH(asset_tag) DESC, asset_tag DESC LIMIT 1`,
            [`${prefix}%`]
        );

        let nextSequence = '001';

        if (lastAsset && lastAsset.asset_tag) {
            const parts = lastAsset.asset_tag.split('/');
            const lastSeq = parts[parts.length - 1]; // Get last part
            if (/^\d+$/.test(lastSeq)) { // Check if it's a number
                const nextNum = parseInt(lastSeq, 10) + 1;
                nextSequence = String(nextNum).padStart(3, '0');
            }
        }

        const nextTag = `${prefix}${nextSequence}`;
        res.json({ success: true, data: nextTag });
    } catch (error) {
        console.error('Get next tag error:', error);
        res.status(500).json({ success: false, message: 'Error generating next tag' });
    }
});

// Get single asset
router.get('/assets/:id', checkPermission('asset.items.view'), async (req, res) => {
    try {
        const [asset] = await db.query(`
      SELECT 
        a.*,
        c.category_name,
        l.location_name,
        s.supplier_name,
        u.username as assigned_to_username,
        u.full_name as assigned_to_name,
        u.email as assigned_to_email,
        parent_asset.asset_name as assigned_to_asset_name,
        parent_asset.asset_tag as assigned_to_asset_tag
      FROM asset_items a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN asset_locations l ON a.location_id = l.id
      LEFT JOIN asset_suppliers s ON a.supplier_id = s.id
      LEFT JOIN sysadmin_users u ON a.assigned_to = u.id
      LEFT JOIN asset_items parent_asset ON a.assigned_to_asset_id = parent_asset.id
      WHERE a.id = ?
    `, [req.params.id]);

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // Get asset history
        const history = await db.query(`
      SELECT 
        h.*,
        u.username as performed_by_username,
        fu.username as from_user_username,
        tu.username as to_user_username,
        fl.location_name as from_location_name,
        tl.location_name as to_location_name,
        ta.asset_name as to_asset_name
      FROM asset_history h
      LEFT JOIN sysadmin_users u ON h.performed_by = u.id
      LEFT JOIN sysadmin_users fu ON h.from_user_id = fu.id
      LEFT JOIN sysadmin_users tu ON h.to_user_id = tu.id
      LEFT JOIN asset_locations fl ON h.from_location_id = fl.id
      LEFT JOIN asset_locations tl ON h.to_location_id = tl.id
      LEFT JOIN asset_items ta ON h.to_asset_id = ta.id
      WHERE h.asset_id = ?
      ORDER BY h.action_date DESC
    `, [req.params.id]);

        asset.history = history;

        // Get assigned child assets
        const childAssets = await db.query(`
            SELECT 
                a.id, a.asset_tag, a.asset_name, a.status, 
                c.category_name, l.location_name
            FROM asset_items a
            LEFT JOIN asset_categories c ON a.category_id = c.id
            LEFT JOIN asset_locations l ON a.location_id = l.id
            WHERE a.assigned_to_asset_id = ? AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)
        `, [req.params.id]);

        asset.child_assets = childAssets;

        // Get assigned credentials
        const assignedCredentials = await db.query(`
            SELECT c.*
            FROM asset_credentials c
            INNER JOIN asset_credential_assignments aca ON c.id = aca.credential_id
            WHERE aca.asset_id = ? AND (c.is_deleted = FALSE OR c.is_deleted IS NULL)
        `, [req.params.id]);

        asset.assigned_credentials = assignedCredentials;

        res.json({ success: true, data: asset });
    } catch (error) {
        console.error('Get asset error:', error);
        res.status(500).json({ success: false, message: 'Error fetching asset' });
    }
});

// Create asset
router.post('/assets', checkPermission('asset.items.create'), upload.single('image'), async (req, res) => {
    try {
        const {
            asset_tag, asset_name, category_id, description, serial_number,
            model, manufacturer, purchase_date, purchase_cost, supplier_id,
            warranty_expiry, location_id, status, condition_status, notes
        } = req.body;

        if (!asset_tag || !asset_name) {
            return res.status(400).json({ success: false, message: 'Asset tag and name are required' });
        }

        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const purchase_date_val = purchase_date || null;
        const warranty_expiry_val = warranty_expiry || null;
        const supplier_id_val = supplier_id || null;
        const location_id_val = location_id || null;
        const category_id_val = category_id || null;
        const purchase_cost_val = purchase_cost || null;

        const result = await db.query(
            `INSERT INTO asset_items (
        asset_tag, asset_name, category_id, description, serial_number,
        model, manufacturer, purchase_date, purchase_cost, supplier_id,
        warranty_expiry, location_id, status, condition_status, image_url, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                asset_tag, asset_name, category_id_val, description, serial_number,
                model, manufacturer, purchase_date_val, purchase_cost_val, supplier_id_val,
                warranty_expiry_val, location_id_val, status, condition_status, image_url, notes, req.user.id
            ]
        );

        const assetId = result.insertId;

        // Log in history
        await db.query(
            `INSERT INTO asset_history (asset_id, action_type, performed_by, notes)
       VALUES (?, 'update', ?, 'Asset created')`,
            [assetId, req.user.id]
        );

        await logActivity(req.user.id, 'CREATE_ASSET', 'asset', 'asset', Number(assetId), { asset_tag, asset_name }, req);

        res.status(201).json({ success: true, data: { id: Number(assetId) } });
    } catch (error) {
        console.error('Create asset error:', error);
        require('fs').appendFileSync('error_log.txt', `[${new Date().toISOString()}] Create Asset Error: ${error.stack || error.message}\n`);
        res.status(500).json({ success: false, message: 'Error creating asset' });
    }
});

// Update asset
router.put('/assets/:id', checkPermission('asset.items.edit'), upload.single('image'), async (req, res) => {
    try {
        const {
            asset_name, category_id, description, serial_number,
            model, manufacturer, purchase_date, purchase_cost, supplier_id,
            warranty_expiry, location_id, status, condition_status, notes
        } = req.body;

        const purchase_date_val = purchase_date || null;
        const warranty_expiry_val = warranty_expiry || null;
        const supplier_id_val = supplier_id || null;
        const location_id_val = location_id || null;
        const category_id_val = category_id || null;
        const purchase_cost_val = purchase_cost || null;

        let query = `UPDATE asset_items SET 
      asset_name = ?, category_id = ?, description = ?, serial_number = ?,
      model = ?, manufacturer = ?, purchase_date = ?, purchase_cost = ?, supplier_id = ?,
      warranty_expiry = ?, location_id = ?, status = ?, condition_status = ?, notes = ?
    `;
        let params = [
            asset_name, category_id_val, description, serial_number,
            model, manufacturer, purchase_date_val, purchase_cost_val, supplier_id_val,
            warranty_expiry_val, location_id_val, status, condition_status, notes
        ];

        if (req.file) {
            query += ', image_url = ?';
            params.push(`/uploads/${req.file.filename}`);
        }

        query += ' WHERE id = ?';
        params.push(req.params.id);

        await db.query(query, params);

        await db.query(
            `INSERT INTO asset_history (asset_id, action_type, performed_by, notes)
       VALUES (?, 'update', ?, 'Asset updated')`,
            [req.params.id, req.user.id]
        );

        await logActivity(req.user.id, 'UPDATE_ASSET', 'asset', 'asset', req.params.id, req.body, req);

        res.json({ success: true, message: 'Asset updated successfully' });
    } catch (error) {
        console.error('Update asset error:', error);
        res.status(500).json({ success: false, message: 'Error updating asset' });
    }
});

// Get users list for assignment (Dropdown)
router.get('/users/list', checkPermission('asset.items.view'), async (req, res) => {
    try {
        const users = await db.query('SELECT DISTINCT id, username, full_name FROM sysadmin_users WHERE is_active = TRUE AND is_deleted = FALSE ORDER BY username');
        res.json({ success: true, data: [...users] });
    } catch (error) {
        console.error('Get users list error:', error);
        res.status(500).json({ success: false, message: 'Error fetching users list' });
    }
});



// Check-in Asset
router.post('/assets/:id/checkin', checkPermission('asset.items.checkin'), async (req, res) => {
    try {
        const { notes, condition_status, location_id } = req.body;

        // Get current asset info
        const [asset] = await db.query('SELECT status, assigned_to, location_id, assigned_to_asset_id FROM asset_items WHERE id = ?', [req.params.id]);
        if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
        // Allow checkin if assigned OR if checking in from a location move context (if needed in future, but stick to assigned for now)
        if (asset.status !== 'assigned') {
            return res.status(400).json({ success: false, message: `Asset is ${asset.status}, cannot check in` });
        }

        // Update asset
        let updateQuery = "UPDATE asset_items SET status = 'available', assigned_to = NULL, assigned_to_asset_id = NULL, assigned_location_id = NULL";
        const updateParams = [];

        if (location_id) {
            updateQuery += ", location_id = ?";
            updateParams.push(location_id);
        }

        if (condition_status) {
            updateQuery += ", condition_status = ?";
            updateParams.push(condition_status);
        }

        updateQuery += " WHERE id = ?";
        updateParams.push(req.params.id);

        await db.query(updateQuery, updateParams);

        // Record history
        await db.query(`
            INSERT INTO asset_history (asset_id, action_type, performed_by, from_user_id, from_asset_id, from_location_id, to_location_id, notes)
            VALUES (?, 'checkin', ?, ?, ?, ?, ?, ?)
        `, [req.params.id, req.user.id, asset.assigned_to, asset.assigned_to_asset_id, asset.location_id, location_id || null, notes || null]);

        await logActivity(req.user.id, 'CHECKIN_ASSET', 'asset', 'asset', req.params.id, { notes, condition_status, location_id }, req);

        res.json({ success: true, message: 'Asset checked in successfully' });
    } catch (error) {
        console.error('Checkin error:', error);
        res.status(500).json({ success: false, message: 'Error checking in asset' });
    }
});

// Delete asset (Soft delete)
router.delete('/assets/:id', checkPermission('asset.items.delete'), async (req, res) => {
    try {
        const [asset] = await db.query('SELECT asset_tag, asset_name FROM asset_items WHERE id = ?', [req.params.id]);

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // Soft delete
        await db.query('UPDATE asset_items SET is_deleted = TRUE WHERE id = ?', [req.params.id]);

        // Record history
        await db.query(`
            INSERT INTO asset_history (asset_id, action_type, performed_by, notes)
            VALUES (?, 'delete', ?, 'Asset deleted')
        `, [req.params.id, req.user.id]);

        await logActivity(req.user.id, 'DELETE_ASSET', 'asset', 'asset', req.params.id, {
            asset_tag: asset.asset_tag,
            asset_name: asset.asset_name
        }, req);

        res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Delete asset error:', error);
        res.status(500).json({ success: false, message: 'Error deleting asset' });
    }
});

// Checkout asset
router.post('/assets/:id/checkout', checkPermission('asset.items.checkout'), async (req, res) => {
    try {
        const { user_id, location_id, asset_id, notes } = req.body;
        // console.log('Checkout Request Body:', req.body);
        require('fs').appendFileSync('chk_debug.txt', JSON.stringify(req.body) + '\n');

        if (!user_id && !location_id && !asset_id) {
            require('fs').appendFileSync('chk_debug.txt', 'Validation Failed: Missing target\n');
            console.log('Checkout Validation Failed: Missing target');
            return res.status(400).json({ success: false, message: 'User, Location, or Asset target is required' });
        }

        // Get current asset state
        const [asset] = await db.query('SELECT assigned_to, location_id, status FROM asset_items WHERE id = ?', [req.params.id]);

        if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

        // Check if target asset exists and is valid (if applicable)
        if (asset_id) {
            const [targetAsset] = await db.query('SELECT id FROM asset_items WHERE id = ?', [asset_id]);
            if (!targetAsset) return res.status(404).json({ success: false, message: 'Target asset not found' });
            if (Number(asset_id) === Number(req.params.id)) return res.status(400).json({ success: false, message: 'Cannot check out asset to itself' });
        }

        // console.log('Asset Status:', asset.status);
        require('fs').appendFileSync('chk_debug.txt', 'Asset Status: ' + asset.status + '\n');
        if (asset.status !== 'available') {
            return res.status(400).json({ success: false, message: `Asset is ${asset.status}, cannot check out` });
        }

        let updateQuery = "UPDATE asset_items SET status = 'assigned'";
        const updateParams = [];

        if (user_id) {
            updateQuery += ", assigned_to = ?, assigned_to_asset_id = NULL, assigned_location_id = NULL";
            updateParams.push(user_id);
        } else if (location_id) {
            // Checkout to location: Set assigned_location_id, clear others. HOME location (location_id) stays same.
            updateQuery += ", assigned_location_id = ?, assigned_to = NULL, assigned_to_asset_id = NULL";
            updateParams.push(location_id);
        } else if (asset_id) {
            updateQuery += ", assigned_to_asset_id = ?, assigned_to = NULL, assigned_location_id = NULL";
            updateParams.push(asset_id);
        }

        updateQuery += " WHERE id = ?";
        updateParams.push(req.params.id);

        await db.query(updateQuery, updateParams);

        // Record history
        await db.query(`
            INSERT INTO asset_history (asset_id, action_type, performed_by, to_user_id, to_asset_id, from_location_id, to_location_id, notes)
            VALUES (?, 'checkout', ?, ?, ?, ?, ?, ?)
        `, [
            req.params.id,
            req.user.id,
            user_id || null,
            asset_id || null,
            asset.location_id, // from previous location
            location_id || null, // to new location (if location_id provided as target)
            notes || null
        ]);

        await logActivity(req.user.id, 'CHECKOUT_ASSET', 'asset', 'asset', req.params.id, { user_id, location_id, asset_id, notes }, req);

        res.json({ success: true, message: 'Asset checked out successfully' });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: 'Error checking out asset' });
    }
});






// Increment QR Print Count
router.post('/assets/:id/qr-print', checkPermission('asset.items.view'), async (req, res) => {
    try {
        await db.query('UPDATE asset_items SET qr_print_count = qr_print_count + 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'QR print count incremented' });
    } catch (error) {
        console.error('QR print increment error:', error);
        res.status(500).json({ success: false, message: 'Error incrementing QR print count' });
    }
});

// ==================== CATEGORIES ====================

router.get('/categories', checkPermission('asset.categories.view'), async (req, res) => {
    try {
        const categories = await db.query(`
      SELECT c.*, COUNT(a.id) as asset_count
      FROM asset_categories c
      LEFT JOIN asset_items a ON c.id = a.category_id AND (a.is_deleted = FALSE OR a.is_deleted IS NULL)
      WHERE (c.is_deleted = FALSE OR c.is_deleted IS NULL)
      GROUP BY c.id
      ORDER BY c.category_name
    `);

        const categoriesWithCount = categories.map(cat => ({
            ...cat,
            asset_count: Number(cat.asset_count)
        }));

        res.json({ success: true, data: categoriesWithCount });
    } catch (error) {
        console.error('Get categories error:', error);
        require('fs').appendFileSync('error_log.txt', `[${new Date().toISOString()}] Categories Error: ${error.stack || error.message}\n`);
        res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
});

// Get single category
router.get('/categories/:id', checkPermission('asset.categories.view'), async (req, res) => {
    try {
        const [category] = await db.query('SELECT * FROM asset_categories WHERE id = ?', [req.params.id]);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, data: category });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ success: false, message: 'Error fetching category' });
    }
});

// Helper to generate unique code
const generateCode = async (tableName, codeColumn, name) => {
    const baseCode = name.substring(0, 3).toUpperCase();

    // Find latest code with this prefix
    // We order by length first then value to ensure proper sorting (e.g. ABC9 vs ABC10)
    const result = await db.query(
        `SELECT ${codeColumn} FROM ${tableName} 
         WHERE ${codeColumn} REGEXP ? 
         ORDER BY LENGTH(${codeColumn}) DESC, ${codeColumn} DESC LIMIT 1`,
        [`^${baseCode}[0-9]*$`]
    );

    if (result.length === 0) {
        return baseCode;
    }

    const lastCode = result[0][codeColumn];
    if (lastCode === baseCode) {
        return `${baseCode}1`;
    }

    const numPart = lastCode.replace(baseCode, '');
    const nextNum = parseInt(numPart) + 1;
    return `${baseCode}${nextNum}`;
};

router.post('/categories', checkPermission('asset.categories.create'), async (req, res) => {
    try {
        const { category_name, description, icon } = req.body;

        const existing = await db.query('SELECT id FROM asset_categories WHERE category_name = ?', [category_name]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }

        const category_code = await generateCode('asset_categories', 'category_code', category_name);

        const result = await db.query(
            'INSERT INTO asset_categories (category_name, category_code, description, icon) VALUES (?, ?, ?, ?)',
            [category_name, category_code, description || null, icon || null]
        );

        res.status(201).json({ success: true, data: { id: result.insertId.toString(), code: category_code } });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Error creating category' });
    }
});

router.put('/categories/:id', checkPermission('asset.categories.edit'), async (req, res) => {
    try {
        const { category_name, description, icon } = req.body;

        const existing = await db.query('SELECT id FROM asset_categories WHERE category_name = ? AND id != ?', [category_name, req.params.id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }

        await db.query(
            'UPDATE asset_categories SET category_name = ?, description = ?, icon = ? WHERE id = ?',
            [category_name, description || null, icon || null, req.params.id]
        );

        res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ success: false, message: 'Error updating category' });
    }
});

router.delete('/categories/:id', checkPermission('asset.categories.delete'), async (req, res) => {
    try {
        await db.query('UPDATE asset_categories SET is_deleted = TRUE WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, message: 'Error deleting category' });
    }
});

// ==================== LOCATIONS ====================

router.get('/locations', checkPermission('asset.locations.view'), async (req, res) => {
    try {
        const locations = await db.query(`
      SELECT l.*, COUNT(CASE WHEN a.is_deleted = 0 OR a.is_deleted IS NULL THEN a.id END) as asset_count, p.location_name as parent_location_name
      FROM asset_locations l
      LEFT JOIN asset_items a ON l.id = a.location_id
      LEFT JOIN asset_locations p ON l.parent_location_id = p.id
      WHERE (l.is_deleted = 0 OR l.is_deleted IS NULL)
      GROUP BY l.id
      ORDER BY l.location_name
    `);

        const locationsWithCount = locations.map(loc => ({
            ...loc,
            asset_count: Number(loc.asset_count)
        }));

        res.json({ success: true, data: locationsWithCount });
    } catch (error) {
        console.error('Get locations error:', error);
        require('fs').appendFileSync('error_log.txt', `[${new Date().toISOString()}] Locations Error: ${error.stack || error.message}\n`);
        res.status(500).json({ success: false, message: 'Error fetching locations' });
    }
});

router.get('/locations/:id', checkPermission('asset.locations.view'), async (req, res) => {
    try {
        const [location] = await db.query(`
            SELECT l.*, p.location_name as parent_location_name
            FROM asset_locations l
            LEFT JOIN asset_locations p ON l.parent_location_id = p.id
            WHERE l.id = ? AND (l.is_deleted = 0 OR l.is_deleted IS NULL)
        `, [req.params.id]);

        if (!location) {
            return res.status(404).json({ success: false, message: 'Location not found' });
        }

        res.json({ success: true, data: location });
    } catch (error) {
        console.error('Get location error:', error);
        res.status(500).json({ success: false, message: 'Error fetching location' });
    }
});

router.post('/locations', checkPermission('asset.locations.create'), async (req, res) => {
    try {
        const { location_name, address, city, state, postal_code, country, parent_location_id } = req.body;

        const existing = await db.query('SELECT id FROM asset_locations WHERE location_name = ?', [location_name]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Location name already exists' });
        }

        const location_code = await generateCode('asset_locations', 'location_code', location_name);

        const result = await db.query(
            `INSERT INTO asset_locations (location_name, location_code, address, city, state, postal_code, country, parent_location_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [location_name, location_code, address || null, city || null, state || null, postal_code || null, country || null, parent_location_id || null]
        );

        res.status(201).json({ success: true, data: { id: result.insertId.toString(), code: location_code } });
    } catch (error) {
        console.error('Create location error:', error);
        res.status(500).json({ success: false, message: 'Error creating location' });
    }
});

router.put('/locations/:id', checkPermission('asset.locations.edit'), async (req, res) => {
    try {
        const { location_name, address, city, state, postal_code, country, parent_location_id } = req.body;

        const existing = await db.query('SELECT id FROM asset_locations WHERE location_name = ? AND id != ?', [location_name, req.params.id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Location name already exists' });
        }

        await db.query(
            `UPDATE asset_locations 
       SET location_name = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, parent_location_id = ?
       WHERE id = ?`,
            [location_name, address || null, city || null, state || null, postal_code || null, country || null, parent_location_id || null, req.params.id]
        );

        res.json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ success: false, message: 'Error updating location' });
    }
});

router.delete('/locations/:id', checkPermission('asset.locations.delete'), async (req, res) => {
    try {
        await db.query('UPDATE asset_locations SET is_deleted = 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ success: false, message: 'Error deleting location' });
    }
});

// ==================== SUPPLIERS ====================

router.get('/suppliers', checkPermission('asset.suppliers.view'), async (req, res) => {
    try {
        const suppliers = await db.query(`
            SELECT s.*, COUNT(a.id) as asset_count
            FROM asset_suppliers s
            LEFT JOIN asset_items a ON s.id = a.supplier_id AND (a.is_deleted = 0 OR a.is_deleted IS NULL)
            WHERE (s.is_deleted = 0 OR s.is_deleted IS NULL)
            GROUP BY s.id
            ORDER BY s.supplier_name
        `);

        const suppliersWithCount = suppliers.map(sup => ({
            ...sup,
            asset_count: Number(sup.asset_count)
        }));

        res.json({ success: true, data: suppliersWithCount });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ success: false, message: 'Error fetching suppliers' });
    }
});

router.get('/suppliers/:id', checkPermission('asset.suppliers.view'), async (req, res) => {
    try {
        const [supplier] = await db.query('SELECT * FROM asset_suppliers WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)', [req.params.id]);

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        res.json({ success: true, data: supplier });
    } catch (error) {
        console.error('Get supplier error:', error);
        res.status(500).json({ success: false, message: 'Error fetching supplier' });
    }
});

router.post('/suppliers', checkPermission('asset.suppliers.create'), async (req, res) => {
    try {
        const { supplier_name, contact_person, email, phone, address, website, notes } = req.body;

        const existing = await db.query('SELECT id FROM asset_suppliers WHERE supplier_name = ? AND is_deleted = 0', [supplier_name]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Supplier name already exists' });
        }

        // Note: Check if supplier_code column exists before enabling code generation for suppliers
        // const supplier_code = await generateCode('asset_suppliers', 'supplier_code', supplier_name);

        const result = await db.query(
            `INSERT INTO asset_suppliers (supplier_name, contact_person, email, phone, address, website, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [supplier_name, contact_person || null, email || null, phone || null, address || null, website || null, notes || null]
        );

        res.status(201).json({ success: true, data: { id: result.insertId.toString() } });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ success: false, message: 'Error creating supplier' });
    }
});

router.put('/suppliers/:id', checkPermission('asset.suppliers.edit'), async (req, res) => {
    try {
        const { supplier_name, contact_person, email, phone, address, website, notes } = req.body;

        await db.query(
            `UPDATE asset_suppliers 
       SET supplier_name = ?, contact_person = ?, email = ?, phone = ?, address = ?, website = ?, notes = ?
       WHERE id = ?`,
            [supplier_name, contact_person, email, phone, address, website, notes, req.params.id]
        );

        res.json({ success: true, message: 'Supplier updated successfully' });
    } catch (error) {
        console.error('Update supplier error:', error);
        res.status(500).json({ success: false, message: 'Error updating supplier' });
    }
});

router.delete('/suppliers/:id', checkPermission('asset.suppliers.delete'), async (req, res) => {
    try {
        // Soft delete
        await db.query('UPDATE asset_suppliers SET is_deleted = 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Delete supplier error:', error);
        res.status(500).json({ success: false, message: 'Error deleting supplier' });
    }
});

// ==================== MAINTENANCE ====================

router.get('/maintenance', checkPermission('asset.maintenance.view'), async (req, res) => {
    try {
        const { asset_id } = req.query;

        let query = `
      SELECT m.*, a.asset_tag, a.asset_name, u.username as created_by_username
      FROM asset_maintenance m
      INNER JOIN asset_items a ON m.asset_id = a.id
      LEFT JOIN sysadmin_users u ON m.created_by = u.id
      WHERE 1=1
    `;
        const params = [];

        if (asset_id) {
            query += ' AND m.asset_id = ?';
            params.push(asset_id);
        }

        query += ' ORDER BY m.maintenance_date DESC';

        const maintenance = await db.query(query, params);

        res.json({ success: true, data: maintenance });
    } catch (error) {
        console.error('Get maintenance error:', error);
        res.status(500).json({ success: false, message: 'Error fetching maintenance records' });
    }
});

router.get('/maintenance/:id', checkPermission('asset.maintenance.view'), async (req, res) => {
    try {
        const [maintenance] = await db.query(`
            SELECT m.*, 
            a.asset_tag, 
            a.asset_name, 
            u.username as created_by_username
            FROM asset_maintenance m
            INNER JOIN asset_items a ON m.asset_id = a.id
            LEFT JOIN sysadmin_users u ON m.created_by = u.id
            WHERE m.id = ?
        `, [req.params.id]);

        if (!maintenance) {
            return res.status(404).json({ success: false, message: 'Maintenance record not found' });
        }

        res.json({ success: true, data: maintenance });
    } catch (error) {
        console.error('Get maintenance detail error:', error);
        res.status(500).json({ success: false, message: 'Error fetching maintenance detail' });
    }
});

router.post('/maintenance', checkPermission('asset.maintenance.create'), async (req, res) => {
    try {
        const {
            asset_id, maintenance_type, maintenance_date, performed_by,
            cost, description, next_maintenance_date, status
        } = req.body;

        const result = await db.query(
            `INSERT INTO asset_maintenance 
       (asset_id, maintenance_type, maintenance_date, performed_by, cost, description, next_maintenance_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [asset_id, maintenance_type, maintenance_date, performed_by, cost, description, next_maintenance_date || null, status, req.user.id]
        );

        // If maintenance is active (in_progress or scheduled), update asset status to maintenance
        // But typically only 'in_progress' implies the asset is physically under maintenance and unavailable.
        // Let's assume 'in_progress' and 'scheduled' might both mean it's being worked on or about to be.
        // For strict availability, usually only 'in_progress' makes it unavailable.
        // However, let's follow the plan: "creating maintenance... updates ... to maintenance"
        // I'll stick to 'in_progress' making it unavailable ('maintenance' status). 
        // 'scheduled' might just be a plan, asset could still be used?
        // Let's assume 'in_progress' triggers asset status change.

        console.log('Maintenance record created with ID:', result.insertId);

        let statusNote = '';
        if (status === 'in_progress') {
            console.log('Updating asset status to maintenance...');
            await db.query("UPDATE asset_items SET status = 'maintenance' WHERE id = ?", [asset_id]);
            statusNote = ' (Asset status updated to maintenance)';
        }

        // Log in asset history
        console.log('Inserting into asset_history...');
        await db.query(
            `INSERT INTO asset_history (asset_id, action_type, performed_by, notes)
       VALUES (?, 'maintenance', ?, ?)`,
            [asset_id, req.user.id, `Maintenance record added: ${maintenance_type} - ${status}${statusNote}`]
        );
        console.log('History record inserted.');

        res.status(201).json({ success: true, data: { id: result.insertId.toString() } });
    } catch (error) {
        console.error('Create maintenance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating maintenance record',
            error: error.message
        });
    }
});

router.put('/maintenance/:id', checkPermission('asset.maintenance.edit'), async (req, res) => {
    try {
        const {
            maintenance_type, maintenance_date, performed_by,
            cost, description, next_maintenance_date, status
        } = req.body;

        // Get old status to compare
        const [oldRecord] = await db.query('SELECT status, asset_id FROM asset_maintenance WHERE id = ?', [req.params.id]);

        if (!oldRecord) {
            return res.status(404).json({ success: false, message: 'Maintenance record not found' });
        }

        await db.query(
            `UPDATE asset_maintenance 
       SET maintenance_type = ?, maintenance_date = ?, performed_by = ?, cost = ?, 
           description = ?, next_maintenance_date = ?, status = ?
       WHERE id = ?`,
            [maintenance_type, maintenance_date, performed_by, cost, description, next_maintenance_date || null, status, req.params.id]
        );

        // Handle Asset Status Changes
        // If changing TO completed, set asset to 'available'
        if (status === 'completed' && oldRecord.status !== 'completed') {
            await db.query("UPDATE asset_items SET status = 'available' WHERE id = ?", [oldRecord.asset_id]);
            await db.query(
                `INSERT INTO asset_history (asset_id, action_type, performed_by, notes)
                 VALUES (?, 'maintenance', ?, ?)`,
                [oldRecord.asset_id, req.user.id, `Maintenance completed. Asset available.`]
            );
        }
        // If changing TO in_progress, set asset to 'maintenance'
        else if (status === 'in_progress' && oldRecord.status !== 'in_progress') {
            await db.query("UPDATE asset_items SET status = 'maintenance' WHERE id = ?", [oldRecord.asset_id]);
            await db.query(
                `INSERT INTO asset_history (asset_id, action_type, performed_by, notes)
                 VALUES (?, 'maintenance', ?, ?)`,
                [oldRecord.asset_id, req.user.id, `Maintenance in progress. Asset set to maintenance mode.`]
            );
        }

        res.json({ success: true, message: 'Maintenance record updated successfully' });
    } catch (error) {
        console.error('Update maintenance error:', error);
        res.status(500).json({ success: false, message: 'Error updating maintenance record', error: error.message });
    }
});

router.delete('/maintenance/:id', checkPermission('asset.maintenance.delete'), async (req, res) => {
    try {
        await db.query('DELETE FROM asset_maintenance WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Maintenance record deleted successfully' });
    } catch (error) {
        console.error('Delete maintenance error:', error);
        res.status(500).json({ success: false, message: 'Error deleting maintenance record' });
    }
});

module.exports = router;
