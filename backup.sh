#!/bin/bash

# Backup script for ReactAppV3

BACKUP_DIR="/var/backups/reactappv3"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="reactappv3_db"
DB_USER="rosyd"
PROJECT_DIR="/var/www/ReactAppV3"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Creating backup: $DATE"

# Backup database
echo "Backing up database..."
mysqldump -u $DB_USER -p $DB_NAME > "$BACKUP_DIR/db_$DATE.sql"

# Backup uploads
echo "Backing up uploads..."
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR/backend" uploads

# Backup configuration
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" -C "$PROJECT_DIR" --exclude=node_modules --exclude=dist --exclude=uploads backend/.env frontend/.env

echo "✅ Backup completed: $BACKUP_DIR"

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Old backups cleaned up."
