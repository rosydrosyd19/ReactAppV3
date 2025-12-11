---
description: Deploying Asset Check Out Updates
---
# How to Deploy Update (Assert Check Out Feature)

You need to update both the backend code and the database schema on your server.

## 1. Update Codebase
Pull the latest changes from your git repository on the server:
```bash
cd /path/to/your/project
git pull origin main
```

## 2. Update Database Schema
Run the initialization script, which will now automatically execute all migrations.
```bash
cd backend
npm run init-db
```
Or if you want to run them manually:
```bash
node database/migrations/001_checkout_to_asset.js
node database/migrations/002_add_from_asset_id.js
```

## 3. Restart Backend Service
Restart your Node.js backend to apply the API changes.
```bash
# Example if using PM2
pm2 restart all
# Or if running directly
# Ctrl+C to stop, then npm start
```

## 4. Rebuild Frontend (If production build)
If you are serving a built version of the frontend:
```bash
cd ../frontend
npm install
npm run build
# Copy dist/ to your web server directory if necessary
```
