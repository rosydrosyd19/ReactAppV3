---
description: Deploying QR Code Feature Updates
---

# How to Deploy Update (QR Code Feature)

This update includes a new public API endpoint for scanning and the QR code generation library for the frontend.

## 1. Update Codebase
Pull the latest changes from the git repository on the server:
```bash
cd /path/to/your/project
git pull origin main
```

## 2. Update Frontend Dependencies & Build
You added `react-qr-code`, so you MUST install dependencies before building.
```bash
cd frontend
npm install
npm run build
```

## 3. Restart Backend Service
A new public route was added to `backend/routes/asset.js`.
```bash
cd ../backend
# No new dependencies in backend, but good practice to check
npm install 
# Restart PM2
pm2 restart all
```

## 4. Database
**No database schema changes** were made in this update. You do not need to run migrations.
node database/migrations/add-location-soft-delete.js

## 5. Verify
-   Visit `/asset/items` and check for the "Show QR" button.
-   Scan a code to test the public scan URL.