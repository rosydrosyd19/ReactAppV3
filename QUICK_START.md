# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- MariaDB 10.5+ installed and running
- Terminal/PowerShell access

## 5-Minute Setup (Windows Development)

### Step 1: Setup Database (2 minutes)

Open MariaDB/MySQL client:
```sql
CREATE USER 'rosyd'@'localhost' IDENTIFIED BY 'rosyd1298';
CREATE DATABASE reactappv3_db;
GRANT ALL PRIVILEGES ON reactappv3_db.* TO 'rosyd'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2: Setup Backend (1 minute)

```powershell
cd c:\Users\Rosyd\Documents\React-js\ReactAppV3\backend
npm install
npm run init-db
```
bila muncul error waktu install coba ini
npm cache clean --force


Wait for "✅ Database initialized successfully!" message.

### Step 3: Start Backend (30 seconds)

```powershell
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on: http://localhost:3001
```

**Keep this terminal open!**

### Step 4: Setup Frontend (1 minute)

Open **NEW terminal/PowerShell**:

```powershell
cd c:\Users\Rosyd\Documents\React-js\ReactAppV3\frontend
npm install
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Step 5: Open Browser (30 seconds)

1. Open browser
2. Go to: `http://localhost:5173`
3. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`

## ✅ You're Done!

You should now see:
- ✅ Dashboard with statistics
- ✅ Sidebar menu (Sysadmin, Asset Management)
- ✅ Header with user menu and theme toggle

## 🎯 Try These Features

1. **Toggle Dark Mode** - Click moon icon in header
2. **Navigate Modules** - Click menu items in sidebar  
3. **View Assets** - Go to Asset Management > Assets
4. **Check Profile** - Click user button in header

## 🔧 Troubleshooting

### Backend won't start
**Error:** "Database connection failed"

**Solution:** 
```powershell
# Check if MariaDB is running
# In Windows: Check Services app

# Test connection
mysql -u rosyd -p
# Enter password: rosyd1298
```

### Frontend shows "Network Error"
**Problem:** Backend not running

**Solution:** 
```powershell
# Start backend in another terminal
cd backend
npm run dev
```

### Port already in use
**Error:** "Port 3001 is already in use"

**Solution:**
```powershell
# Change port in backend/.env
PORT=3002

# Or kill process using the port
netstat -ano | findstr :3001
taskkill /PID <process_id> /F
```

## 📱 Access from Other Devices (Local Network)

### 1. Find Your IP Address
```powershell
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

### 2. Update Frontend Config
Edit `frontend\.env`:
```env
VITE_API_URL=http://192.168.1.100:3001/api
```

### 3. Update Backend CORS
Edit `backend\.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:5173,http://192.168.1.0/24
```

### 4. Rebuild Frontend
```powershell
cd frontend
npm run dev
```

### 5. Access from Other Device
Open browser on other device:
```
http://192.168.1.100:5173
```

## 🌐 Production Deployment (Debian/Ubuntu)

See **README.md** for complete Debian installation guide with:
- ✅ Automated deployment script
- ✅ Systemd service setup
- ✅ Caddy web server configuration
- ✅ Database backup scripts

Quick deploy:
```bash
sudo bash deploy.sh
```

## 📚 Next Steps

1. **Read Documentation**
   - `README.md` - Full installation guide
   - `DEVELOPER_GUIDE.md` - How to add new modules
   - `PROJECT_SUMMARY.md` - What's included

2. **Explore Features**
   - Try adding assets
   - Check activity logs
   - Test permissions system

3. **Customize**
   - Change theme colors in `frontend/src/index.css`
   - Add your own modules following the guide
   - Configure for production

## 🎊 Enjoy!

Your modular asset management system is now ready! 🚀

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**⚠️ Remember to change the default password after first login!**

---

Need help? Check the documentation or create an issue.
