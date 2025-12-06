#!/bin/bash

# ReactAppV3 Deployment Script for Debian/Ubuntu
# This script automates the deployment process

set -e

echo "=========================================="
echo "  ReactAppV3 Deployment Script"
echo "=========================================="
echo ""

# Variables
PROJECT_DIR="/var/www/ReactAppV3"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
SERVICE_NAME="reactappv3-backend"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Please run as root or with sudo"
    exit 1
fi

echo "📦 Installing system dependencies..."
apt update
apt install -y curl wget git

echo ""
echo "📥 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "✅ Node.js already installed: $(node --version)"
fi

echo ""
echo "📥 Checking MariaDB..."
if ! command -v mysql &> /dev/null; then
    echo "Installing MariaDB..."
    apt install -y mariadb-server mariadb-client
    systemctl start mariadb
    systemctl enable mariadb
    echo "⚠️  Please run 'sudo mysql_secure_installation' to secure MariaDB"
else
    echo "✅ MariaDB already installed"
fi

echo ""
echo "📥 Checking Caddy..."
if ! command -v caddy &> /dev/null; then
    echo "Installing Caddy..."
    apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy
else
    echo "✅ Caddy already installed: $(caddy version)"
fi

echo ""
echo "📂 Setting up project directory..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo ""
echo "📦 Installing backend dependencies..."
cd $BACKEND_DIR
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Please edit $BACKEND_DIR/.env with your configuration"
fi
npm install --production

echo ""
echo "🗄️  Initializing database..."
read -p "Do you want to initialize the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run init-db
fi

echo ""
echo "🎨 Building frontend..."
cd $FRONTEND_DIR
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Please edit $FRONTEND_DIR/.env with your API URL"
fi
npm install
npm run build

echo ""
echo ""
echo "⚙️  Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
else
    echo "✅ PM2 already installed: $(pm2 -v)"
fi

# Start app with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup | tail -n 1 | bash || echo "⚠️  Please run 'pm2 startup' manually if needed"

echo "✅ Backend started with PM2"

echo ""
echo "🌐 Setting up Caddy..."
cp $PROJECT_DIR/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy

echo ""
echo "🔧 Setting permissions..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

echo ""
echo "=========================================="
echo "  ✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📊 Service Status:"
systemctl status $SERVICE_NAME --no-pager
echo ""
systemctl status caddy --no-pager
echo ""
echo "🌐 Access your application at:"
echo "   http://$(hostname -I | awk '{print $1}')"
echo ""
echo "🔑 Default login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📝 Next steps:"
echo "   1. Edit /var/www/ReactAppV3/backend/.env if needed"
echo "   2. Edit /var/www/ReactAppV3/frontend/.env if needed"
echo "   3. Run 'sudo mysql_secure_installation' if not done"
echo "   4. Change default admin password after first login"
echo ""
