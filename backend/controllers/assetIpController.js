const db = require('../config/database');

// === Subnet Management ===

exports.getSubnets = async (req, res) => {
    try {
        const query = `
            SELECT s.*, 
                   i.asset_name as router_name,
                   i.asset_tag as router_tag,
                   (SELECT COUNT(*) FROM asset_ip_addresses WHERE subnet_id = s.id) as total_ips,
                   (SELECT COUNT(*) FROM asset_ip_addresses WHERE subnet_id = s.id AND status = 'assigned') as assigned_ips
            FROM asset_ip_subnets s
            LEFT JOIN asset_items i ON s.router_id = i.id
            ORDER BY s.created_at DESC
        `;
        const subnets = await db.query(query);

        // Convert BigInt to Number
        const safeSubnets = subnets.map(s => ({
            ...s,
            total_ips: Number(s.total_ips || 0),
            assigned_ips: Number(s.assigned_ips || 0)
        }));

        res.json(safeSubnets);
    } catch (error) {
        console.error('Error fetching subnets:', error);
        res.status(500).json({ message: 'Server error fetching subnets' });
    }
};

exports.getSubnetById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT s.*, 
                   i.asset_name as router_name,
                   i.asset_tag as router_tag
            FROM asset_ip_subnets s
            LEFT JOIN asset_items i ON s.router_id = i.id
            WHERE s.id = ?
        `;
        const subnets = await db.query(query, [id]);
        if (!subnets || subnets.length === 0) {
            return res.status(404).json({ message: 'Subnet not found' });
        }
        res.json(subnets[0]);
    } catch (error) {
        console.error('Error fetching subnet:', error);
        res.status(500).json({ message: 'Server error fetching subnet' });
    }
};

exports.createSubnet = async (req, res) => {
    try {
        const { router_id, subnet_address, subnet_mask, gateway, vlan_id, description } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!subnet_address) {
            return res.status(400).json({ message: 'Subnet address is required' });
        }

        const query = `
            INSERT INTO asset_ip_subnets 
            (router_id, subnet_address, subnet_mask, gateway, vlan_id, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await db.query(query, [router_id, subnet_address, subnet_mask, gateway, vlan_id, description, userId]);

        res.status(201).json({
            id: Number(result.insertId),
            message: 'Subnet created successfully'
        });
    } catch (error) {
        console.error('Error creating subnet:', error);
        res.status(500).json({ message: 'Server error creating subnet' });
    }
};

exports.updateSubnet = async (req, res) => {
    try {
        const { id } = req.params;
        const { router_id, subnet_address, subnet_mask, gateway, vlan_id, description } = req.body;

        const query = `
            UPDATE asset_ip_subnets 
            SET router_id = ?, subnet_address = ?, subnet_mask = ?, gateway = ?, vlan_id = ?, description = ?
            WHERE id = ?
        `;
        await db.query(query, [router_id, subnet_address, subnet_mask, gateway, vlan_id, description, id]);

        res.json({ message: 'Subnet updated captured' });
    } catch (error) {
        console.error('Error updating subnet:', error);
        res.status(500).json({ message: 'Server error updating subnet' });
    }
};

exports.deleteSubnet = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM asset_ip_subnets WHERE id = ?', [id]);
        res.json({ message: 'Subnet deleted successfully' });
    } catch (error) {
        console.error('Error deleting subnet:', error);
        res.status(500).json({ message: 'Server error deleting subnet' });
    }
};

// === IP Address Management ===

exports.getIpsBySubnet = async (req, res) => {
    try {
        const { subnetId } = req.params;
        const query = `
            SELECT ip.*, 
                   a.asset_name as device_name,
                   a.asset_tag as device_tag,
                   u.username as updated_by_username
            FROM asset_ip_addresses ip
            LEFT JOIN asset_items a ON ip.assigned_to_asset_id = a.id
            LEFT JOIN sysadmin_users u ON ip.updated_by = u.id
            WHERE ip.subnet_id = ?
            ORDER BY INET_ATON(ip.ip_address)
        `; // Note: INET_ATON for proper IP sorting if MySQL/MariaDB supports it

        const ips = await db.query(query, [subnetId]);
        res.json(ips);
    } catch (error) {
        console.error('Error fetching IPs:', error);
        res.status(500).json({ message: 'Server error fetching IPs' });
    }
};

exports.assignIp = async (req, res) => {
    try {
        const { subnet_id, ip_address, assigned_to_asset_id, notes } = req.body;
        const userId = req.user.id;

        // Validation: Check if IP is already assigned
        const checkQuery = `SELECT * FROM asset_ip_addresses WHERE subnet_id = ? AND ip_address = ?`;
        const existing = await db.query(checkQuery, [subnet_id, ip_address]);

        if (existing.length > 0) {
            const ip = existing[0];
            if (ip.status === 'assigned' || ip.status === 'blocked') {
                return res.status(400).json({ message: `IP ${ip_address} is already ${ip.status}` });
            }
            if (ip.status === 'reserved') {
                // Allow assignment if reserved? Let's assume yes but change status.
            }
        }

        // Validation: "1 IP from 1 router only for 1 device"
        // Meaning: A device cannot have multiple IPs from the SAME Subnet/Router?
        // Or specific rule: One IP -> One Device. 
        // User said: "Assign IP ke DEVICE untuk assign 1 ip dari 1 router hanya bisa di assign 1 device"
        // "Assign IP to DEVICE, to assign 1 ip from 1 router can only be assigned 1 device"
        // This phrasing is a bit ambiguous. 
        // Interpetation 1: Uniqueness of Device in the Subnet. A device can only have ONE IP in this subnet.
        if (assigned_to_asset_id) {
            const deviceCheckQuery = `
                SELECT * FROM asset_ip_addresses 
                WHERE subnet_id = ? AND assigned_to_asset_id = ? AND ip_address != ?
            `;
            const existingDeviceIp = await db.query(deviceCheckQuery, [subnet_id, assigned_to_asset_id, ip_address]);
            if (existingDeviceIp.length > 0) {
                return res.status(400).json({ message: 'This device is already assigned an IP in this subnet.' });
            }
        }

        // Upsert logic (Insert or Update)
        const upsertQuery = `
            INSERT INTO asset_ip_addresses (subnet_id, ip_address, status, assigned_to_asset_id, assigned_at, notes, updated_by)
            VALUES (?, ?, 'assigned', ?, NOW(), ?, ?)
            ON DUPLICATE KEY UPDATE 
                status = 'assigned',
                assigned_to_asset_id = VALUES(assigned_to_asset_id),
                assigned_at = NOW(),
                notes = VALUES(notes),
                updated_by = VALUES(updated_by),
                block_reason = NULL
        `;

        await db.query(upsertQuery, [subnet_id, ip_address, assigned_to_asset_id, notes, userId]);

        res.json({ message: 'IP assigned successfully' });
    } catch (error) {
        console.error('Error assigning IP:', error);
        res.status(500).json({ message: 'Server error assigning IP' });
    }
};

exports.blockIp = async (req, res) => {
    try {
        const { subnet_id, ip_address, block_reason } = req.body;
        const userId = req.user.id;

        const upsertQuery = `
            INSERT INTO asset_ip_addresses (subnet_id, ip_address, status, block_reason, updated_by)
            VALUES (?, ?, 'blocked', ?, ?)
            ON DUPLICATE KEY UPDATE 
                status = 'blocked',
                assigned_to_asset_id = NULL,
                assigned_at = NULL,
                block_reason = VALUES(block_reason),
                updated_by = VALUES(updated_by)
        `;

        await db.query(upsertQuery, [subnet_id, ip_address, block_reason, userId]);
        res.json({ message: 'IP blocked successfully' });
    } catch (error) {
        console.error('Error blocking IP:', error);
        res.status(500).json({ message: 'Server error blocking IP' });
    }
};

exports.unblockIp = async (req, res) => {
    try {
        const { subnet_id, ip_address } = req.body;
        const userId = req.user.id; // Unused for delete but good if we kept history.

        // DELETE the row to remove it from the managed list (status 'assigned'/'blocked').
        // If the design was to keep history, we would set status = 'available',
        // but user requested "ip list di hapus" behavior.
        const query = `
            DELETE FROM asset_ip_addresses
            WHERE subnet_id = ? AND ip_address = ?
        `;
        await db.query(query, [subnet_id, ip_address]);
        res.json({ message: 'IP released/unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking IP:', error);
        res.status(500).json({ message: 'Server error unblocking IP' });
    }
};
