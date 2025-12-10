# ReactAppV3 - Modular Asset Management System

Aplikasi manajemen aset modular dengan React.js dan MariaDB yang dapat berjalan di Debian/Ubuntu.

## 📋 Fitur

### Modul Sysadmin
- ✅ Manajemen User dengan CRUD lengkap
- ✅ Role-based Access Control (RBAC)
- ✅ Manajemen Permissions yang fleksibel
- ✅ Activity Logs untuk audit trail

### Modul Asset Management
- ✅ Manajemen Asset dengan detail lengkap
- ✅ Kategori dan Lokasi
- ✅ Supplier/Vendor tracking
- ✅ Maintenance scheduling dan history
- ✅ Check-in/Check-out system
- ✅ Component dan License management
- ✅ Upload gambar untuk asset

## 🏗️ Arsitektur

Aplikasi ini dibangun dengan **Modular Architecture** untuk kemudahan maintenance dan skalabilitas:

```
ReactAppV3/
├── backend/                 # Node.js + Express API
│   ├── config/             # Database configuration
│   ├── middleware/         # Auth, logger, upload
│   ├── routes/             # API routes (modular)
│   └── database/           # Schema & migrations
├── frontend/               # React.js + Vite
│   └── src/
│       ├── components/     # Reusable components
│       ├── contexts/       # React contexts
│       ├── pages/          # Page components (modular)
│       └── utils/          # Utilities
└── README.md
```

### Prefix Database Table
Setiap modul menggunakan prefix untuk memudahkan pengelolaan:
- **sysadmin_*** - Tabel untuk modul System Administrator
- **asset_*** - Tabel untuk modul Asset Management

## 🚀 Instalasi di Debian/Ubuntu

### 1. Persiapan Sistem

Update sistem dan install dependencies:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git
```

### 2. Install Node.js 20.x

```bash
# Install Node.js 20.x dari NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi instalasi
node --version  # v20.x.x
npm --version   # v10.x.x
```

### 3. Install MariaDB

```bash
# Install MariaDB Server
sudo apt install -y mariadb-server mariadb-client

# Jalankan secure installation
sudo mysql_secure_installation
# Ikuti wizard dan set root password

# Start dan enable MariaDB
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### 4. Buat Database User

```bash
# Login ke MariaDB sebagai root
sudo mysql -u root -p

# Jalankan SQL berikut:
```

```sql
-- Buat user dengan kredensial yang ditentukan
CREATE USER 'rosyd'@'localhost' IDENTIFIED BY 'rosyd1298';

-- Buat database
CREATE DATABASE reactappv3_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Berikan akses penuh ke database
GRANT ALL PRIVILEGES ON reactappv3_db.* TO 'rosyd'@'localhost';

-- Untuk akses dari jaringan local (opsional)
CREATE USER 'rosyd'@'%' IDENTIFIED BY 'rosyd1298';
GRANT ALL PRIVILEGES ON reactappv3_db.* TO 'rosyd'@'%';

-- Apply privileges
FLUSH PRIVILEGES;

EXIT;
```

### 5. Clone atau Copy Project

```bash
# Jika dari Git
git clone <repository-url> /var/www/ReactAppV3

# Atau copy manual ke server
# scp -r ReactAppV3 user@server:/var/www/

cd /var/www/ReactAppV3
```

### 6. Setup Backend

```bash
cd /var/www/ReactAppV3/backend

# Install dependencies
npm install

# Copy dan edit environment file
cp .env.example .env
nano .env
```

Edit `.env` sesuai kebutuhan:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=rosyd
DB_PASSWORD=rosyd1298
DB_NAME=reactappv3_db
JWT_SECRET=your-secret-key-change-this
ALLOWED_ORIGINS=http://localhost:3000
```

Inisialisasi database:
```bash
npm run init-db
```

**PENTING: Jalankan script perbaikan data** (untuk mencegah duplikat & mengisi data default):
```bash
node fix-asset-data.js
```

Test backend:
```bash
npm run dev
# Backend should run on http://localhost:3001
```

### 7. Setup Frontend

```bash
cd /var/www/ReactAppV3/frontend

# Install dependencies
npm install

# Edit environment file
nano .env
```

Sesuaikan API URL di `.env`:
```env
VITE_API_URL=http://your-server-ip:3001/api
```

Build production:
```bash
npm run build
# Output akan ada di folder 'dist'
```

### 8. Install Caddy Web Server

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

### 9. Konfigurasi Caddy

Buat Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Isi dengan konfigurasi berikut:

```caddy
# Ganti dengan IP server atau domain Anda
:80 {
    # Frontend - serve built React app
    root * /var/www/ReactAppV3/frontend/dist
    file_server
    
    # Backend API - reverse proxy to Node.js
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    # SPA fallback
    try_files {path} /index.html
    
    # Logging
    log {
        output file /var/log/caddy/reactappv3.log
    }
}
```

Untuk domain khusus:
```caddy
yourdomain.com {
    root * /var/www/ReactAppV3/frontend/dist
    file_server
    
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    try_files {path} /index.html
    
    # Caddy otomatis handle HTTPS dengan Let's Encrypt
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

### 10. Setup Backend sebagai Service

Buat systemd service untuk backend:

```bash
sudo nano /etc/systemd/system/reactappv3-backend.service
```

Isi dengan:

```ini
[Unit]
Description=ReactAppV3 Backend API
After=network.target mariadb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ReactAppV3/backend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable dan start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable reactappv3-backend
sudo systemctl start reactappv3-backend
sudo systemctl status reactappv3-backend
```

### 11. Konfigurasi Firewall (jika ada)

```bash
# UFW Firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp  # Jika ingin akses langsung ke backend
sudo ufw enable
```

### 12. Akses dari Jaringan Lokal

Untuk akses dari jaringan lokal:

1. Cari IP server:
```bash
ip addr show
# Atau
hostname -I
```

2. Edit backend `.env` untuk CORS:
```env
ALLOWED_ORIGINS=http://192.168.1.0/24,http://192.168.1.100
```

3. Update frontend `.env.production`:
```env
VITE_API_URL=http://192.168.1.100/api
```

4. Rebuild frontend:
```bash
cd /var/www/ReactAppV3/frontend
npm run build
```

5. Restart services:
```bash
sudo systemctl restart reactappv3-backend
sudo systemctl reload caddy
```

6. Akses dari komputer lain:
```
http://192.168.1.100
```

## 🔑 Login Default

```
Username: admin
Password: admin123
```

**⚠️ PENTING:** Segera ubah password default setelah login pertama!

## 📱 Akses Aplikasi

- **Web App:** `http://server-ip` atau `http://domain.com`
- **API Backend:** `http://server-ip/api` atau `http://domain.com/api`
- **Health Check:** `http://server-ip/api/health`

## 🔧 Maintenance

### Melihat Logs

```bash
# Backend logs
sudo journalctl -u reactappv3-backend -f

# Caddy logs
sudo tail -f /var/log/caddy/reactappv3.log

# MariaDB logs
sudo tail -f /var/log/mysql/error.log
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart reactappv3-backend

# Reload Caddy
sudo systemctl reload caddy

# Restart MariaDB
sudo systemctl restart mariadb
```

### Backup Database

```bash
# Backup
mysqldump -u rosyd -p reactappv3_db > backup_$(date +%Y%m%d).sql

# Restore
mysql -u rosyd -p reactappv3_db < backup_20241205.sql
```

## 🛠️ Development

### Backend Development

```bash
cd backend
npm install
npm run dev  # Dengan nodemon untuk auto-reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev  # Development server dengan HMR
```

API akan berjalan di `http://localhost:3001` dan frontend di `http://localhost:3000`.

## 📦 Menambah Modul Baru

Aplikasi ini didesain modular, untuk menambah modul baru:

### 1. Database
Tambahkan tabel dengan prefix modul di `backend/database/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS modulename_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- ... columns
) ENGINE=InnoDB;
```

### 2. Backend Routes
Buat file route baru di `backend/routes/modulename.js`:
```javascript
const express = require('express');
const router = express.Router();
// ... route handlers
module.exports = router;
```

Daftarkan di `server.js`:
```javascript
app.use('/api/modulename', require('./routes/modulename'));
```

### 3. Frontend Pages
Buat folder modul di `frontend/src/pages/ModuleName/`

### 4. Permissions
Tambahkan permissions di database:
```sql
INSERT INTO sysadmin_permissions (module_name, permission_name, permission_key, description)
VALUES ('modulename', 'View Items', 'modulename.items.view', 'View module items');
```

## 🤝 Contributing

Untuk berkontribusi pada project ini:
1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📄 License

MIT License

## 🙋 Support

Untuk pertanyaan dan bantuan, silakan buat issue di repository.

---

**ReactAppV3** - Built with ❤️ using React.js, Node.js, and MariaDB

**Update File On Server**
git pull


Tergantung mana yang mau di update
cd /var/www/ReactAppV3/frontend
npm install
npm run build

<!-- cd /var/www/ReactAppV3/backend
npm install
npm run dev -->