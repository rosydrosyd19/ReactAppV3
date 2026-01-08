# 📚 ReactAppV3 Documentation Index

Selamat datang di dokumentasi ReactAppV3! Pilih panduan sesuai kebutuhan Anda.

## 🎯 Untuk Pengguna Baru

1. **[QUICK_START.md](QUICK_START.md)** - ⚡ Mulai dalam 5 menit
   - Setup database
   - Install dependencies
   - Jalankan aplikasi
   - Login pertama kali

2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - 📊 Apa yang sudah dibuat
   - Fitur-fitur lengkap (termasuk WhatsApp Integration)
   - Struktur project
   - API endpoints
   - Database schema

## 🚀 Untuk Deployment

3. **[README.md](README.md)** - 📖 Instalasi Lengkap di Debian/Ubuntu
   - Prerequisites
   - Step-by-step installation
   - MariaDB setup
   - Caddy web server
   - Systemd service
   - Production deployment

4. **[NETWORK_SETUP.md](NETWORK_SETUP.md)** - 🌐 Konfigurasi Jaringan
   - Akses dari LAN
   - CORS configuration
   - Firewall setup
   - Domain setup
   - HTTPS dengan SSL

## 👨‍💻 Untuk Developer

5. **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - 🔧 Panduan Development
   - Arsitektur aplikasi
   - Menambah modul baru
   - Permission system
   - API structure
   - Code examples

## 📂 File Structure Overview

```
ReactAppV3/
│
├── 📄 Documentation Files
│   ├── README.md               - Instalasi Debian lengkap
│   ├── QUICK_START.md          - Quick start 5 menit
│   ├── PROJECT_SUMMARY.md      - Summary semua fitur
│   ├── DEVELOPER_GUIDE.md      - Guide untuk developer
│   ├── NETWORK_SETUP.md        - Network configuration
│   └── INDEX.md                - File ini
│
├── ⚙️ Configuration Files  
│   ├── Caddyfile               - Web server config
│   ├── reactappv3-backend.service  - Systemd service
│   ├── .gitignore              - Git ignore rules
│   ├── deploy.sh               - Auto deployment script
│   └── backup.sh               - Database backup script
│
├── 🔙 backend/                 - Backend API (Node.js)
│   ├── config/                 - Database config
│   ├── database/               - Schema & init scripts
│   ├── middleware/             - Auth, logger, upload
│   ├── routes/                 - API routes
│   ├── .env                    - Environment config
│   ├── package.json            - Dependencies
│   └── server.js               - Main server
│
└── 🎨 frontend/                - Frontend (React)
    ├── src/
    │   ├── components/         - React components
    │   ├── contexts/           - React contexts
    │   ├── pages/              - Page components
    │   ├── utils/              - Utilities
    │   ├── App.jsx             - Main app
    │   ├── main.jsx            - Entry point
    │   └── index.css           - Global styles
    ├── .env                    - Frontend config
    └── package.json            - Dependencies
```

## 🎓 Learning Path

### Pemula (Belum pernah coding)
1. Baca **QUICK_START.md** untuk setup
2. Baca **PROJECT_SUMMARY.md** untuk overview
3. Explore aplikasi di browser
4. Lihat **README.md** untuk deployment

### Developer (Mau customize)
1. Baca **QUICK_START.md** untuk setup lokal
2. Baca **DEVELOPER_GUIDE.md** untuk arsitektur
3. Explore source code
4. Tambah fitur/modul baru

### Sysadmin (Mau deploy production)
1. Baca **README.md** untuk instalasi Debian
2. Baca **NETWORK_SETUP.md** untuk network config
3. Jalankan **deploy.sh** untuk auto-deploy
4. Setup **backup.sh** untuk backup otomatis

## 🔑 Quick Reference

### Default Credentials
```
Username: admin
Password: admin123
```

### Default Ports
```
Backend:  3001
Frontend: 5173 (dev) / 80 (production)
Database: 3306
```

### Database Config
```
Host:     localhost
User:     rosyd
Password: rosyd1298
Database: reactappv3_db
```

### Important Commands

**Development:**
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

**Production:**
```bash
# Auto deploy
sudo bash deploy.sh

# Manual
sudo systemctl restart reactappv3-backend
sudo systemctl reload caddy
```

**Database:**
```bash
# Initialize
npm run init-db

# Backup
bash backup.sh
```

## 📞 Getting Help

### Common Issues

**Database connection failed:**
- Check MariaDB running: `sudo systemctl status mariadb`
- Verify credentials in `.env`
- Test: `mysql -u rosyd -p`

**Frontend can't connect to backend:**
- Check backend running on port 3001
- Verify API URL in frontend `.env`
- Check CORS settings in backend `.env`

**Can't access from other devices:**
- See **NETWORK_SETUP.md** for LAN configuration
- Check firewall settings
- Verify CORS origins

## 🎯 Next Steps

1. ✅ Read **QUICK_START.md** and get the app running
2. ✅ Explore the features in browser
3. ✅ Read **DEVELOPER_GUIDE.md** if you want to customize
4. ✅ Follow **README.md** for production deployment
5. ✅ Setup network access using **NETWORK_SETUP.md**

## 📧 Support

Untuk pertanyaan lebih lanjut:
- Check dokumentasi yang relevan
- Review logs: `sudo journalctl -u reactappv3-backend -f`
- Test with `curl` untuk debugging

---

## 🌟 Featured Technologies

- **Frontend:** React.js 19, Vite, React Router
- **Backend:** Node.js, Express.js, JWT
- **Database:** MariaDB with modular schema
- **Web Server:** Caddy (auto-SSL)
- **Deployment:** Systemd services

## 📊 Statistics

- **Total Files:** 50+ files
- **Lines of Code:** 5000+ lines
- **Database Tables:** 15 tables
- **API Endpoints:** 30+ endpoints
- **Documentation:** 5 complete guides

---

**Happy Coding! 🚀**

Built with ❤️ using modern web technologies.
