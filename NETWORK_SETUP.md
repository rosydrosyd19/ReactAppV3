# 🌐 Network Configuration Guide

Panduan untuk mengakses ReactAppV3 dari jaringan lokal (LAN).

## 📡 Skenario Penggunaan

### Skenario 1: Development di Windows, Akses dari Perangkat Lain
Server di Windows (laptop/PC), akses dari HP/laptop lain di jaringan yang sama.

### Skenario 2: Production di Debian Server, Akses dari Client
Server di Debian/Ubuntu, akses dari client Windows/Linux/Mac di kantor.

---

## 🔧 Konfigurasi untuk Development (Windows)

### Langkah 1: Cari IP Address Windows

```powershell
ipconfig
```

Cari **IPv4 Address**, contoh: `192.168.1.100`

### Langkah 2: Edit Backend .env

File: `backend\.env`

Tambahkan IP range jaringan Anda:
```env
# Ganti dengan IP range jaringan Anda
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.0/24,http://192.168.1.100:5173

# Atau allow semua (TIDAK AMAN untuk production!)
# ALLOWED_ORIGINS=*
```

### Langkah 3: Edit Frontend .env

File: `frontend\.env`

Ganti dengan IP server:
```env
VITE_API_URL=http://192.168.1.100:3001/api
```

### Langkah 4: Restart Backend

```powershell
# Stop backend (Ctrl+C)
# Start lagi
cd backend
npm run dev
```

### Langkah 5: Rebuild Frontend

```powershell
cd frontend
npm run dev
```

### Langkah 6: Allow Firewall (Windows)

```powershell
# Buka Windows Defender Firewall
# Atau jalankan sebagai Administrator:

netsh advfirewall firewall add rule name="ReactAppV3 Backend" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="ReactAppV3 Frontend" dir=in action=allow protocol=TCP localport=5173
```

### Langkah 7: Akses dari Perangkat Lain

Dari HP/laptop lain di jaringan yang sama:
```
http://192.168.1.100:5173
```

---

## 🐧 Konfigurasi untuk Production (Debian/Ubuntu)

### Langkah 1: Cari IP Server

```bash
ip addr show
# Atau
hostname -I
```

Contoh output: `192.168.1.50`

### Langkah 2: Edit Backend .env

File: `/var/www/ReactAppV3/backend/.env`

```bash
sudo nano /var/www/ReactAppV3/backend/.env
```

Update ALLOWED_ORIGINS:
```env
# IP jaringan kantor
ALLOWED_ORIGINS=http://192.168.1.0/24,http://192.168.1.50

# Atau specific IPs
# ALLOWED_ORIGINS=http://192.168.1.10,http://192.168.1.11,http://192.168.1.12
```

### Langkah 3: Edit Frontend .env (untuk rebuild)

File: `/var/www/ReactAppV3/frontend/.env`

```bash
sudo nano /var/www/ReactAppV3/frontend/.env
```

```env
# Gunakan IP server atau domain
VITE_API_URL=http://192.168.1.50/api

# Jika pakai domain
# VITE_API_URL=http://assetmanager.local/api
```

### Langkah 4: Rebuild Frontend

```bash
cd /var/www/ReactAppV3/frontend
npm run build
```

### Langkah 5: Restart Services

```bash
sudo systemctl restart reactappv3-backend
sudo systemctl reload caddy
```

### Langkah 6: Configure Firewall (UFW)

```bash
# Allow HTTP dan HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend port (jika perlu direct access)
sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Langkah 7: Edit Caddyfile untuk Network Access

File: `/etc/caddy/Caddyfile`

```bash
sudo nano /etc/caddy/Caddyfile
```

Option 1 - Dengan IP:
```caddy
http://192.168.1.50:80 {
    root * /var/www/ReactAppV3/frontend/dist
    file_server
    
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    handle /uploads/* {
        reverse_proxy localhost:3001
    }
    
    try_files {path} /index.html
    encode gzip
    
    # CORS untuk LAN
    header {
        Access-Control-Allow-Origin http://192.168.1.0/24
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
}
```

Option 2 - Bind ke semua interface:
```caddy
:80 {
    bind 0.0.0.0
    
    root * /var/www/ReactAppV3/frontend/dist
    file_server
    
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    handle /uploads/* {
        reverse_proxy localhost:3001
    }
    
    try_files {path} /index.html
    encode gzip
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

### Langkah 8: Test dari Client

Dari komputer client di jaringan:
```
http://192.168.1.50
```

---

## 🌍 Menggunakan Domain Local (Optional)

### Setup DNS Local atau Edit Hosts File

**Di Client Windows:**

Edit `C:\Windows\System32\drivers\etc\hosts`:
```
192.168.1.50    assetmanager.local
```

**Di Client Linux/Mac:**

Edit `/etc/hosts`:
```bash
sudo nano /etc/hosts
```
```
192.168.1.50    assetmanager.local
```

### Update Caddyfile

```caddy
assetmanager.local {
    root * /var/www/ReactAppV3/frontend/dist
    file_server
    
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    try_files {path} /index.html
}
```

### Akses dengan Domain

```
http://assetmanager.local
```

---

## 🔒 Production dengan HTTPS (Domain Publik)

Jika punya domain publik (misal: `assetmanager.example.com`):

### 1. Point Domain ke Server

Di DNS provider, buat A record:
```
assetmanager.example.com -> [IP-PUBLIC-SERVER]
```

### 2. Update Caddyfile

```caddy
assetmanager.example.com {
    root * /var/www/ReactAppV3/frontend/dist
    file_server
    
    handle /api/* {
        reverse_proxy localhost:3001
    }
    
    try_files {path} /index.html
    encode gzip
    
    # Caddy otomatis dapat SSL certificate dari Let's Encrypt!
}
```

### 3. Reload Caddy

```bash
sudo systemctl reload caddy
```

Caddy akan otomatis:
- ✅ Request SSL certificate dari Let's Encrypt
- ✅ Setup HTTPS redirect
- ✅ Auto-renew certificate

### 4. Akses dengan HTTPS

```
https://assetmanager.example.com
```

---

## 🔍 Troubleshooting

### Client tidak bisa connect

**1. Check server berjalan:**
```bash
sudo systemctl status reactappv3-backend
sudo systemctl status caddy
```

**2. Check port listening:**
```bash
sudo netstat -tlnp | grep 3001
sudo netstat -tlnp | grep 80
```

**3. Check firewall:**
```bash
sudo ufw status
```

**4. Test dari server sendiri:**
```bash
curl http://localhost/api/health
```

**5. Test dari client:**
```powershell
# Windows
curl http://192.168.1.50/api/health

# Atau buka browser
http://192.168.1.50
```

### CORS Error di Browser

**Error:** "Access to XMLHttpRequest has been blocked by CORS"

**Solution:**

Edit `backend/.env`:
```env
ALLOWED_ORIGINS=http://192.168.1.0/24,*
```

Restart backend:
```bash
sudo systemctl restart reactappv3-backend
```

### Cannot GET /api/... 404 Error

**Problem:** Caddy tidak proxy ke backend

**Solution:**

Check Caddyfile:
```caddy
handle /api/* {
    reverse_proxy localhost:3001
}
```

Check backend running:
```bash
curl http://localhost:3001/api/health
```

### Slow Connection

**Problem:** Jaringan lambat atau DNS issue

**Solution:**

1. Gunakan IP langsung bukan domain
2. Check network congestion
3. Periksa router/switch

---

## 📊 Network Architecture

```
Client Browser (192.168.1.10)
        ↓
   HTTP Request
        ↓
Caddy Web Server (192.168.1.50:80)
        ↓
   /api/* → Backend (localhost:3001)
   /*     → Frontend (dist/)
        ↓
Backend Node.js → MariaDB
```

---

## ✅ Best Practices

1. **Development:**
   - Gunakan `localhost` untuk development
   - Hanya expose ke LAN jika perlu testing dari device lain

2. **Production:**
   - Setup proper firewall rules
   - Gunakan HTTPS jika ada domain
   - Restrict ALLOWED_ORIGINS ke IP/domain specific
   - Monitor logs regularly
   - Backup database secara berkala

3. **Security:**
   - Jangan expose database port (3306) ke network
   - Change default admin password
   - Gunakan strong JWT secret
   - Enable HTTPS untuk production
   - Regular security updates

---

## 📞 Support

Jika masih ada issue:
1. Check logs: `sudo journalctl -u reactappv3-backend -f`
2. Check Caddy logs: `sudo journalctl -u caddy -f`
3. Test dengan `curl` untuk isolate masalah
4. Verify firewall rules

---

Happy networking! 🌐
