-- ================================================
-- ReactAppV3 Database Schema
-- Modular Architecture with Table Prefixes
-- ================================================

-- Database Creation
CREATE DATABASE IF NOT EXISTS reactappv3_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reactappv3_db;

-- ================================================
-- SYSADMIN MODULE TABLES (Prefix: sysadmin_)
-- ================================================

-- Users Table
CREATE TABLE IF NOT EXISTS sysadmin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles Table
CREATE TABLE IF NOT EXISTS sysadmin_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions Table
CREATE TABLE IF NOT EXISTS sysadmin_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_name VARCHAR(50) NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  permission_key VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_module_permission (module_name, permission_name),
  INDEX idx_module (module_name),
  INDEX idx_permission_key (permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-Role Mapping
CREATE TABLE IF NOT EXISTS sysadmin_user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  FOREIGN KEY (user_id) REFERENCES sysadmin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES sysadmin_roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_role (user_id, role_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-Permission Mapping
CREATE TABLE IF NOT EXISTS sysadmin_role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES sysadmin_roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES sysadmin_permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id),
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Direct Permissions (Override role permissions)
CREATE TABLE IF NOT EXISTS sysadmin_user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INT,
  FOREIGN KEY (user_id) REFERENCES sysadmin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES sysadmin_permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_permission (user_id, permission_id),
  INDEX idx_user_id (user_id),
  INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs
CREATE TABLE IF NOT EXISTS sysadmin_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- ASSET MANAGEMENT MODULE TABLES (Prefix: asset_)
-- ================================================

-- Categories
CREATE TABLE IF NOT EXISTS asset_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  category_code VARCHAR(10),
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Locations
CREATE TABLE IF NOT EXISTS asset_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_name VARCHAR(100) NOT NULL,
  location_code VARCHAR(10),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(50),
  parent_location_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_location_id) REFERENCES asset_locations(id) ON DELETE SET NULL,
  INDEX idx_location_name (location_name),
  INDEX idx_parent_location (parent_location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers/Vendors
CREATE TABLE IF NOT EXISTS asset_suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supplier_name (supplier_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assets
CREATE TABLE IF NOT EXISTS asset_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_tag VARCHAR(50) UNIQUE NOT NULL,
  asset_name VARCHAR(200) NOT NULL,
  category_id INT,
  description TEXT,
  serial_number VARCHAR(100),
  model VARCHAR(100),
  manufacturer VARCHAR(100),
  purchase_date DATE,
  purchase_cost DECIMAL(15,2),
  supplier_id INT,
  warranty_expiry DATE,
  location_id INT,
  assigned_to INT,
  status ENUM('available', 'assigned', 'maintenance', 'retired', 'lost') DEFAULT 'available',
  condition_status ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
  image_url VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES asset_locations(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES asset_suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  INDEX idx_asset_tag (asset_tag),
  INDEX idx_asset_name (asset_name),
  INDEX idx_status (status),
  INDEX idx_category (category_id),
  INDEX idx_location (location_id),
  INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asset History (Check-in/Check-out, transfers, etc.)
CREATE TABLE IF NOT EXISTS asset_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  action_type ENUM('checkout', 'checkin', 'transfer', 'maintenance', 'update', 'retire', 'delete') NOT NULL,
  performed_by INT,
  from_user_id INT,
  to_user_id INT,
  from_location_id INT,
  to_location_id INT,
  notes TEXT,
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES asset_items(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (from_user_id) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (to_user_id) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (from_location_id) REFERENCES asset_locations(id) ON DELETE SET NULL,
  FOREIGN KEY (to_location_id) REFERENCES asset_locations(id) ON DELETE SET NULL,
  INDEX idx_asset_id (asset_id),
  INDEX idx_action_type (action_type),
  INDEX idx_action_date (action_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance Records
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  maintenance_type ENUM('preventive', 'corrective', 'inspection', 'upgrade') NOT NULL,
  maintenance_date DATE NOT NULL,
  performed_by VARCHAR(100),
  cost DECIMAL(15,2),
  description TEXT,
  next_maintenance_date DATE,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (asset_id) REFERENCES asset_items(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  INDEX idx_asset_id (asset_id),
  INDEX idx_maintenance_date (maintenance_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Components (Spare parts, accessories that can be attached to assets)
CREATE TABLE IF NOT EXISTS asset_components (
  id INT AUTO_INCREMENT PRIMARY KEY,
  component_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  serial_number VARCHAR(100),
  quantity INT DEFAULT 0,
  min_quantity INT DEFAULT 0,
  location_id INT,
  purchase_date DATE,
  purchase_cost DECIMAL(15,2),
  supplier_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES asset_locations(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES asset_suppliers(id) ON DELETE SET NULL,
  INDEX idx_component_name (component_name),
  INDEX idx_quantity (quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Component Assignment to Assets
CREATE TABLE IF NOT EXISTS asset_component_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  component_id INT NOT NULL,
  quantity INT DEFAULT 1,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  notes TEXT,
  FOREIGN KEY (asset_id) REFERENCES asset_items(id) ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES asset_components(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  INDEX idx_asset_id (asset_id),
  INDEX idx_component_id (component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Software Licenses
CREATE TABLE IF NOT EXISTS asset_licenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  software_name VARCHAR(200) NOT NULL,
  license_key TEXT,
  license_type ENUM('perpetual', 'subscription', 'trial') DEFAULT 'subscription',
  seats INT DEFAULT 1,
  seats_used INT DEFAULT 0,
  purchase_date DATE,
  expiry_date DATE,
  purchase_cost DECIMAL(15,2),
  supplier_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES asset_suppliers(id) ON DELETE SET NULL,
  INDEX idx_software_name (software_name),
  INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- License Assignments
CREATE TABLE IF NOT EXISTS asset_license_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  license_id INT NOT NULL,
  asset_id INT,
  user_id INT,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  notes TEXT,
  FOREIGN KEY (license_id) REFERENCES asset_licenses(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES asset_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES sysadmin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES sysadmin_users(id) ON DELETE SET NULL,
  INDEX idx_license_id (license_id),
  INDEX idx_asset_id (asset_id),
  INDEX idx_credential_id (credential_id),
  INDEX idx_asset_id (asset_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- ================================================
-- INITIAL DATA SEEDING
-- ================================================

-- Insert default admin user (password: admin123)
INSERT INTO sysadmin_users (username, email, password, full_name, is_active) VALUES
('admin', 'admin@reactappv3.com', '$2a$10$q/j2n9Z/5zdAqLLcj0DWB.dppAHimBLbB.DDRUxS1xeAmPuV67QK.', 'System Administrator', TRUE)
ON DUPLICATE KEY UPDATE username=username;

-- Insert default roles
INSERT INTO sysadmin_roles (role_name, description, is_system_role) VALUES
('Super Admin', 'Full system access with all permissions', TRUE),
('Admin', 'Administrative access to most modules', TRUE),
('Asset Manager', 'Manage assets and related data', FALSE),
('User', 'Basic user access', FALSE)
ON DUPLICATE KEY UPDATE role_name=role_name;

-- Insert permissions for Sysadmin module
INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description) VALUES
('sysadmin', 'View Users', 'sysadmin.users.view', 'View user list and details'),
('sysadmin', 'Create Users', 'sysadmin.users.create', 'Create new users'),
('sysadmin', 'Edit Users', 'sysadmin.users.edit', 'Edit user information'),
('sysadmin', 'Delete Users', 'sysadmin.users.delete', 'Delete users'),
('sysadmin', 'View Roles', 'sysadmin.roles.view', 'View roles and permissions'),
('sysadmin', 'Manage Roles', 'sysadmin.roles.manage', 'Create, edit, delete roles'),
('sysadmin', 'Assign Permissions', 'sysadmin.permissions.assign', 'Assign permissions to roles/users'),
('sysadmin', 'View Activity Logs', 'sysadmin.logs.view', 'View system activity logs')
ON DUPLICATE KEY UPDATE permission_key=permission_key;

-- Insert permissions for Asset Management module
INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description) VALUES
('asset', 'View Assets', 'asset.items.view', 'View asset list and details'),
('asset', 'Create Assets', 'asset.items.create', 'Create new assets'),
('asset', 'Edit Assets', 'asset.items.edit', 'Edit asset information'),
('asset', 'Delete Assets', 'asset.items.delete', 'Delete assets'),
('asset', 'Checkout Assets', 'asset.items.checkout', 'Checkout assets to users'),
('asset', 'Checkin Assets', 'asset.items.checkin', 'Checkin assets from users'),
('asset', 'Manage Categories', 'asset.categories.manage', 'Manage asset categories'),
('asset', 'Manage Locations', 'asset.locations.manage', 'Manage locations'),
('asset', 'Manage Suppliers', 'asset.suppliers.manage', 'Manage suppliers'),
('asset', 'View Maintenance', 'asset.maintenance.view', 'View maintenance records'),
('asset', 'Manage Maintenance', 'asset.maintenance.manage', 'Create and edit maintenance records'),
('asset', 'Manage Components', 'asset.components.manage', 'Manage components and spare parts'),
('asset', 'Manage Licenses', 'asset.licenses.manage', 'Manage software licenses')
ON DUPLICATE KEY UPDATE permission_key=permission_key;

-- Assign all permissions to Super Admin role
INSERT INTO sysadmin_role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM sysadmin_roles r
CROSS JOIN sysadmin_permissions p
WHERE r.role_name = 'Super Admin'
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Assign Super Admin role to admin user
INSERT INTO sysadmin_user_roles (user_id, role_id)
SELECT u.id, r.id
FROM sysadmin_users u
CROSS JOIN sysadmin_roles r
WHERE u.username = 'admin' AND r.role_name = 'Super Admin'
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Insert sample categories
INSERT INTO asset_categories (category_name, description, icon) VALUES
('Computers', 'Desktop computers and workstations', 'computer'),
('Laptops', 'Laptop computers', 'laptop'),
('Monitors', 'Display monitors', 'monitor'),
('Networking', 'Network equipment (routers, switches, etc.)', 'network'),
('Printers', 'Printers and scanners', 'printer'),
('Mobile Devices', 'Smartphones and tablets', 'phone'),
('Servers', 'Server hardware', 'server'),
('Accessories', 'Keyboards, mice, cables, etc.', 'accessories')
ON DUPLICATE KEY UPDATE category_name=category_name;

-- Insert sample locations
INSERT INTO asset_locations (location_name, address, city, country) VALUES
('Head Office', 'Jl. Sudirman No. 1', 'Jakarta', 'Indonesia'),
('Branch Office - Surabaya', 'Jl. Tunjungan No. 10', 'Surabaya', 'Indonesia'),
('Warehouse', 'Jl. Industri No. 5', 'Tangerang', 'Indonesia')
ON DUPLICATE KEY UPDATE location_name=location_name;
