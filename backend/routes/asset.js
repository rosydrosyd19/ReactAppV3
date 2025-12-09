const express = require('express');
const db = require('../config/database');
const { verifyToken, checkPermission, checkAnyPermission } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');
const upload = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// ==================== ASSETS ====================

// Get all assets
router.get('/assets', checkPermission('asset.items.view'), async (req, res) => {
    try {
        const { status, category_id, location_id, search } = req.query;

        let query = `
      SELECT 
        a.*,
        c.category_name,
        l.location_name,
        s.supplier_name,
        u.username as assigned_to_username,
        u.full_name as assigned_to_name,
        creator.username as created_by_username
      FROM asset_items a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN asset_locations l ON a.location_id = l.id
      LEFT JOIN asset_suppliers s ON a.supplier_id = s.id
      LEFT JOIN sysadmin_users u ON a.assigned_to = u.id
      LEFT JOIN sysadmin_users creator ON a.created_by = creator.id
      WHERE 1=1
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
        u.email as assigned_to_email
      FROM asset_items a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN asset_locations l ON a.location_id = l.id
      LEFT JOIN asset_suppliers s ON a.supplier_id = s.id
      LEFT JOIN sysadmin_users u ON a.assigned_to = u.id
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
        tl.location_name as to_location_name
      FROM asset_history h
      LEFT JOIN sysadmin_users u ON h.performed_by = u.id
      LEFT JOIN sysadmin_users fu ON h.from_user_id = fu.id
      LEFT JOIN sysadmin_users tu ON h.to_user_id = tu.id
      LEFT JOIN asset_locations fl ON h.from_location_id = fl.id
      LEFT JOIN asset_locations tl ON h.to_location_id = tl.id
      WHERE h.asset_id = ?
      ORDER BY h.action_date DESC
    `, [req.params.id]);

        asset.history = history;

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

        let query = `UPDATE asset_items SET 
      asset_name = ?, category_id = ?, description = ?, serial_number = ?,
      model = ?, manufacturer = ?, purchase_date = ?, purchase_cost = ?, supplier_id = ?,
      warranty_expiry = ?, location_id = ?, status = ?, condition_status = ?, notes = ?
    `;
        let params = [
            asset_name, category_id, description, serial_number,
            model, manufacturer, purchase_date, purchase_cost, supplier_id,
            warranty_expiry, location_id, status, condition_status, notes
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

// Delete asset
router.delete('/assets/:id', checkPermission('asset.items.delete'), async (req, res) => {
    try {
        await db.query('DELETE FROM asset_items WHERE id = ?', [req.params.id]);
        await logActivity(req.user.id, 'DELETE_ASSET', 'asset', 'asset', req.params.id, null, req);

        res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Delete asset error:', error);
        res.status(500).json({ success: false, message: 'Error deleting asset' });
    }
});

// Checkout asset
router.post('/assets/:id/checkout', checkPermission('asset.items.checkout'), async (req, res) => {
    try {
        const { user_id, notes } = req.body;

        // Get current asset state
        const [asset] = await db.query('SELECT assigned_to, location_id FROM asset_items WHERE id = ?', [req.params.id]);

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // Update asset
        await db.query(
            'UPDATE asset_items SET assigned_to = ?, status = ? WHERE id = ?',
            [user_id, 'assigned', req.params.id]
        );

        // Log history
        await db.query(
            `INSERT INTO asset_history (asset_id, action_type, performed_by, from_user_id, to_user_id, notes)
       VALUES (?, 'checkout', ?, ?, ?, ?)`,
            [req.params.id, req.user.id, asset.assigned_to, user_id, notes]
        );

        await logActivity(req.user.id, 'CHECKOUT_ASSET', 'asset', 'asset', req.params.id, { to_user: user_id }, req);

        res.json({ success: true, message: 'Asset checked out successfully' });
    } catch (error) {
        console.error('Checkout asset error:', error);
        res.status(500).json({ success: false, message: 'Error checking out asset' });
    }
});

// Checkin asset
router.post('/assets/:id/checkin', checkPermission('asset.items.checkin'), async (req, res) => {
    try {
        const { notes } = req.body;

        const [asset] = await db.query('SELECT assigned_to FROM asset_items WHERE id = ?', [req.params.id]);

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        await db.query(
            'UPDATE asset_items SET assigned_to = NULL, status = ? WHERE id = ?',
            ['available', req.params.id]
        );

        await db.query(
            `INSERT INTO asset_history (asset_id, action_type, performed_by, from_user_id, notes)
       VALUES (?, 'checkin', ?, ?, ?)`,
            [req.params.id, req.user.id, asset.assigned_to, notes]
        );

        await logActivity(req.user.id, 'CHECKIN_ASSET', 'asset', 'asset', req.params.id, null, req);

        res.json({ success: true, message: 'Asset checked in successfully' });
    } catch (error) {
        console.error('Checkin asset error:', error);
        res.status(500).json({ success: false, message: 'Error checking in asset' });
    }
});

// ==================== CATEGORIES ====================

router.get('/categories', checkPermission('asset.items.view'), async (req, res) => {
    try {
        const categories = await db.query(`
      SELECT c.*, COUNT(a.id) as asset_count
      FROM asset_categories c
      LEFT JOIN asset_items a ON c.id = a.category_id
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

router.post('/categories', checkPermission('asset.categories.manage'), async (req, res) => {
    try {
        const { category_name, description, icon } = req.body;

        const result = await db.query(
            'INSERT INTO asset_categories (category_name, description, icon) VALUES (?, ?, ?)',
            [category_name, description, icon]
        );

        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Error creating category' });
    }
});

router.put('/categories/:id', checkPermission('asset.categories.manage'), async (req, res) => {
    try {
        const { category_name, description, icon } = req.body;

        await db.query(
            'UPDATE asset_categories SET category_name = ?, description = ?, icon = ? WHERE id = ?',
            [category_name, description, icon, req.params.id]
        );

        res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ success: false, message: 'Error updating category' });
    }
});

router.delete('/categories/:id', checkPermission('asset.categories.manage'), async (req, res) => {
    try {
        await db.query('DELETE FROM asset_categories WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, message: 'Error deleting category' });
    }
});

// ==================== LOCATIONS ====================

router.get('/locations', checkPermission('asset.items.view'), async (req, res) => {
    try {
        const locations = await db.query(`
      SELECT l.*, COUNT(a.id) as asset_count, p.location_name as parent_location_name
      FROM asset_locations l
      LEFT JOIN asset_items a ON l.id = a.location_id
      LEFT JOIN asset_locations p ON l.parent_location_id = p.id
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

router.post('/locations', checkPermission('asset.locations.manage'), async (req, res) => {
    try {
        const { location_name, address, city, state, postal_code, country, parent_location_id } = req.body;

        const result = await db.query(
            `INSERT INTO asset_locations (location_name, address, city, state, postal_code, country, parent_location_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [location_name, address, city, state, postal_code, country, parent_location_id]
        );

        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        console.error('Create location error:', error);
        res.status(500).json({ success: false, message: 'Error creating location' });
    }
});

router.put('/locations/:id', checkPermission('asset.locations.manage'), async (req, res) => {
    try {
        const { location_name, address, city, state, postal_code, country, parent_location_id } = req.body;

        await db.query(
            `UPDATE asset_locations 
       SET location_name = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, parent_location_id = ?
       WHERE id = ?`,
            [location_name, address, city, state, postal_code, country, parent_location_id, req.params.id]
        );

        res.json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ success: false, message: 'Error updating location' });
    }
});

router.delete('/locations/:id', checkPermission('asset.locations.manage'), async (req, res) => {
    try {
        await db.query('DELETE FROM asset_locations WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ success: false, message: 'Error deleting location' });
    }
});

// ==================== SUPPLIERS ====================

router.get('/suppliers', checkPermission('asset.items.view'), async (req, res) => {
    try {
        const suppliers = await db.query('SELECT * FROM asset_suppliers ORDER BY supplier_name');
        res.json({ success: true, data: suppliers });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ success: false, message: 'Error fetching suppliers' });
    }
});

router.post('/suppliers', checkPermission('asset.suppliers.manage'), async (req, res) => {
    try {
        const { supplier_name, contact_person, email, phone, address, website, notes } = req.body;

        const result = await db.query(
            `INSERT INTO asset_suppliers (supplier_name, contact_person, email, phone, address, website, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [supplier_name, contact_person, email, phone, address, website, notes]
        );

        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ success: false, message: 'Error creating supplier' });
    }
});

router.put('/suppliers/:id', checkPermission('asset.suppliers.manage'), async (req, res) => {
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

router.delete('/suppliers/:id', checkPermission('asset.suppliers.manage'), async (req, res) => {
    try {
        await db.query('DELETE FROM asset_suppliers WHERE id = ?', [req.params.id]);
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

router.post('/maintenance', checkPermission('asset.maintenance.manage'), async (req, res) => {
    try {
        const {
            asset_id, maintenance_type, maintenance_date, performed_by,
            cost, description, next_maintenance_date, status
        } = req.body;

        const result = await db.query(
            `INSERT INTO asset_maintenance 
       (asset_id, maintenance_type, maintenance_date, performed_by, cost, description, next_maintenance_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [asset_id, maintenance_type, maintenance_date, performed_by, cost, description, next_maintenance_date, status, req.user.id]
        );

        // Log in asset history
        await db.query(
            `INSERT INTO asset_history (asset_id, action_type, performed_by, notes)
       VALUES (?, 'maintenance', ?, ?)`,
            [asset_id, req.user.id, `Maintenance record added: ${maintenance_type}`]
        );

        res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
        console.error('Create maintenance error:', error);
        res.status(500).json({ success: false, message: 'Error creating maintenance record' });
    }
});

router.put('/maintenance/:id', checkPermission('asset.maintenance.manage'), async (req, res) => {
    try {
        const {
            maintenance_type, maintenance_date, performed_by,
            cost, description, next_maintenance_date, status
        } = req.body;

        await db.query(
            `UPDATE asset_maintenance 
       SET maintenance_type = ?, maintenance_date = ?, performed_by = ?, cost = ?, 
           description = ?, next_maintenance_date = ?, status = ?
       WHERE id = ?`,
            [maintenance_type, maintenance_date, performed_by, cost, description, next_maintenance_date, status, req.params.id]
        );

        res.json({ success: true, message: 'Maintenance record updated successfully' });
    } catch (error) {
        console.error('Update maintenance error:', error);
        res.status(500).json({ success: false, message: 'Error updating maintenance record' });
    }
});

router.delete('/maintenance/:id', checkPermission('asset.maintenance.manage'), async (req, res) => {
    try {
        await db.query('DELETE FROM asset_maintenance WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Maintenance record deleted successfully' });
    } catch (error) {
        console.error('Delete maintenance error:', error);
        res.status(500).json({ success: false, message: 'Error deleting maintenance record' });
    }
});

module.exports = router;
