const express = require('express');
const router = express.Router();
const controller = require('../controllers/assetIpController');
const { verifyToken: authenticateToken, checkPermission } = require('../middleware/auth');

// Middleware for all routes in this file
router.use(authenticateToken);

// === Subnets ===

// View subnets
router.get('/subnets', checkPermission('asset.ip_management.view'), controller.getSubnets);

// Create subnet
router.post('/subnets', checkPermission('asset.ip_management.manage'), controller.createSubnet);

// Get single subnet
router.get('/subnets/:id', checkPermission('asset.ip_management.view'), controller.getSubnetById);

// Update subnet
router.put('/subnets/:id', checkPermission('asset.ip_management.manage'), controller.updateSubnet);

// Delete subnet
router.delete('/subnets/:id', checkPermission('asset.ip_management.manage'), controller.deleteSubnet);

// === IP Addresses ===

// Get IPs for a subnet
router.get('/subnets/:subnetId/ips', checkPermission('asset.ip_management.view'), controller.getIpsBySubnet);

// Assign IP
router.post('/assign', checkPermission('asset.ip_management.manage'), controller.assignIp);

// Block IP
router.post('/block', checkPermission('asset.ip_management.manage'), controller.blockIp);

// Unblock IP
router.post('/unblock', checkPermission('asset.ip_management.manage'), controller.unblockIp);

module.exports = router;
