# ReactAppV3 - Developer Guide

## 📁 Project Structure

```
ReactAppV3/
├── backend/                        # Node.js + Express Backend
│   ├── config/
│   │   └── database.js            # MariaDB connection pool
│   ├── database/
│   │   ├── init.js                # Database initializer
│   │   └── schema.sql             # Complete DB schema with prefixes
│   ├── middleware/
│   │   ├── auth.js                # JWT + Permission middleware
│   │   ├── logger.js              # Activity logging
│   │   └── upload.js              # Multer file upload
│   ├── routes/
│   │   ├── auth.js                # Login, register, verify
│   │   ├── sysadmin.js            # Users, roles, permissions
│   │   └── asset.js               # Asset management CRUD
│   ├── .env                       # Environment configuration
│   ├── package.json
│   └── server.js                  # Main Express server
│
├── frontend/                       # React.js + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout/
│   │   │       ├── Sidebar.jsx    # Navigation sidebar
│   │   │       ├── Header.jsx     # Top header with user menu
│   │   │       └── MainLayout.jsx # Main app layout
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # Authentication state
│   │   ├── pages/
│   │   │   ├── Login/
│   │   │   │   └── Login.jsx      # Login page
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.jsx  # Main dashboard
│   │   │   └── Asset/
│   │   │       └── AssetList/
│   │   │           └── AssetList.jsx  # Asset list page
│   │   ├── utils/
│   │   │   └── axios.js           # Axios instance with interceptors
│   │   ├── App.jsx                # Main app with routes
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles + design system
│   ├── .env                       # Frontend config
│   └── package.json
│
├── Caddyfile                      # Caddy web server config
├── reactappv3-backend.service     # Systemd service file
├── deploy.sh                      # Deployment script
├── backup.sh                      # Backup script
└── README.md                      # Installation guide
```

## 🗄️ Database Architecture

### Table Prefixes
- `sysadmin_*` - System Administration tables
- `asset_*` - Asset Management tables

### Key Tables

**Sysadmin Module:**
- `sysadmin_users` - User accounts
- `sysadmin_roles` - User roles
- `sysadmin_permissions` - System permissions
- `sysadmin_user_roles` - User-Role mapping
- `sysadmin_role_permissions` - Role-Permission mapping
- `sysadmin_user_permissions` - Direct user permissions
- `sysadmin_activity_logs` - Audit trail

**Asset Module:**
- `asset_items` - Main asset table
- `asset_categories` - Asset categories
- `asset_locations` - Physical locations
- `asset_suppliers` - Vendors/suppliers
- `asset_history` - Asset movement history
- `asset_maintenance` - Maintenance records
- `asset_components` - Spare parts
- `asset_licenses` - Software licenses

## 🔐 Permission System

### Permission Keys Format
```
{module}.{resource}.{action}
```

Examples:
- `sysadmin.users.view`
- `sysadmin.users.create` 
- `asset.items.edit`
- `asset.maintenance.manage`

### Checking Permissions in Code

**Backend:**
```javascript
const { checkPermission } = require('../middleware/auth');

router.get('/users', verifyToken, checkPermission('sysadmin.users.view'), async (req, res) => {
  // Handler code
});
```

**Frontend:**
```javascript
const { hasPermission } = useAuth();

{hasPermission('asset.items.create') && (
  <button onClick={handleCreate}>Add Asset</button>
)}
```

## 🚀 Adding a New Module

### Step 1: Database Schema

Add tables in `backend/database/schema.sql`:

```sql
-- Use module prefix
CREATE TABLE IF NOT EXISTS modulename_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- ... other columns
) ENGINE=InnoDB;

-- Add permissions
INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description)
VALUES 
  ('modulename', 'View Items', 'modulename.items.view', 'View items'),
  ('modulename', 'Create Items', 'modulename.items.create', 'Create items'),
  ('modulename', 'Edit Items', 'modulename.items.edit', 'Edit items'),
  ('modulename', 'Delete Items', 'modulename.items.delete', 'Delete items');
```

### Step 2: Backend Routes

Create `backend/routes/modulename.js`:

```javascript
const express = require('express');
const db = require('../config/database');
const { verifyToken, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Apply auth to all routes
router.use(verifyToken);

// GET all items
router.get('/items', checkPermission('modulename.items.view'), async (req, res) => {
  try {
    const items = await db.query('SELECT * FROM modulename_items ORDER BY created_at DESC');
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create item
router.post('/items', checkPermission('modulename.items.create'), async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.query('INSERT INTO modulename_items (name) VALUES (?)', [name]);
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ... other CRUD operations

module.exports = router;
```

Register in `backend/server.js`:

```javascript
app.use('/api/modulename', require('./routes/modulename'));
```

### Step 3: Frontend Pages

Create module folder: `frontend/src/pages/ModuleName/`

Example: `frontend/src/pages/ModuleName/ItemList/ItemList.jsx`:

```javascript
import { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';

const ItemList = () => {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/modulename/items');
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Items</h1>
      {/* Component code */}
    </div>
  );
};

export default ItemList;
```

### Step 4: Add Routes

In `frontend/src/App.jsx`:

```javascript
import ItemList from './pages/ModuleName/ItemList/ItemList';

// In Routes:
<Route path="modulename">
  <Route path="items" element={<ItemList />} />
</Route>
```

### Step 5: Add to Sidebar

In `frontend/src/components/Layout/Sidebar.jsx`:

```javascript
{
  title: 'Module Name',
  module: 'modulename',
  icon: <FiIcon />,
  show: hasModule('modulename'),
  children: [
    {
      title: 'Items',
      path: '/modulename/items',
      icon: <FiIcon />,
      show: hasPermission('modulename.items.view'),
    },
  ],
}
```

## 🎨 Design System

The application uses CSS variables for theming. Key variables:

```css
--primary-color: #3b82f6;
--secondary-color: #10b981;
--danger-color: #ef4444;
--warning-color: #f59e0b;

--bg-color: #ffffff;
--text-primary: #111827;
--border-color: #e5e7eb;
```

### Component Classes

- `.btn` - Button styles
- `.card` - Card container
- `.form-group` - Form field wrapper
- `.form-input` - Text input
- `.badge` - Status badge
- `.table` - Data table

### Utility Classes

- `.flex` - Display flex
- `.gap-1/2/3` - Gap spacing
- `.mt-1/2/3` - Margin top
- `.mb-1/2/3` - Margin bottom

## 🔧 API Response Format

All API endpoints follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3001
DB_HOST=localhost
DB_USER=rosyd
DB_PASSWORD=rosyd1298
DB_NAME=reactappv3_db
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 🧪 Testing

### Backend
```bash
cd backend
npm run dev

# Test with curl
curl http://localhost:3001/api/health
```

### Frontend
```bash
cd frontend
npm run dev

# Open browser at http://localhost:3000
```

## 📦 Production Deployment

See main README.md for complete Debian installation.

Quick steps:
1. Install Node.js, MariaDB, Caddy
2. Setup database and user
3. Install dependencies
4. Initialize database: `npm run init-db`
5. Build frontend: `npm run build`
6. Setup systemd service
7. Configure Caddy
8. Start services

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check database connection
mysql -u rosyd -p

# Check logs
sudo journalctl -u reactappv3-backend -f
```

### Frontend build issues
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Permission errors
```bash
# Check file permissions
sudo chown -R www-data:www-data /var/www/ReactAppV3
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Router Documentation](https://reactrouter.com/)
- [MariaDB Documentation](https://mariadb.org/documentation/)
- [Caddy Documentation](https://caddyserver.com/docs/)

---

Happy coding! 🚀
