#!/bin/bash

# ===========================================
# SINAR DB BACKUP SCRIPT
# Backup database setiap hari jam 12 malam
# ===========================================

# Configuration
BACKUP_DIR="/var/backups/sinar"
CONTAINER_NAME="sinar_postgres"
DB_NAME="mentri"
DB_USER="postgres"
RETENTION_DAYS=7  # Simpan backup 7 hari terakhir
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="sinar_backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create backup directory if not exists
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Check if PostgreSQL container is running
if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    error "PostgreSQL container '${CONTAINER_NAME}' is not running!"
    exit 1
fi

log "Starting database backup process..."
log "Container: ${CONTAINER_NAME}"
log "Database: ${DB_NAME}"
log "Backup file: ${BACKUP_FILE}"

# Create backup using pg_dump
log "Creating database backup..."
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --verbose --clean --if-exists --create > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    # Compress the backup
    log "Compressing backup..."
    gzip "${BACKUP_DIR}/${BACKUP_FILE}"
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    
    # Check backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${COMPRESSED_FILE}" | cut -f1)
    log "Backup completed successfully!"
    log "File: ${COMPRESSED_FILE}"
    log "Size: ${BACKUP_SIZE}"
    
    # Cleanup old backups (keep only last RETENTION_DAYS days)
    log "Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
    find "$BACKUP_DIR" -name "sinar_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # List remaining backups
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "sinar_backup_*.sql.gz" -type f | wc -l)
    log "Cleanup completed. ${BACKUP_COUNT} backup(s) remaining."
    
    # Create backup status file
    echo "{
  \"status\": \"success\",
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")\",
  \"backup_file\": \"${COMPRESSED_FILE}\",
  \"backup_size\": \"${BACKUP_SIZE}\",
  \"retention_days\": ${RETENTION_DAYS},
  \"remaining_backups\": ${BACKUP_COUNT}
}" > "${BACKUP_DIR}/last_backup_status.json"
    
    log "✅ Backup process completed successfully!"
    
else
    error "❌ Backup failed!"
    
    # Create error status file
    echo "{
  \"status\": \"failed\",
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")\",
  \"error\": \"pg_dump command failed\"
}" > "${BACKUP_DIR}/last_backup_status.json"
    
    exit 1
fi

# Health check - verify backup can be read
log "Verifying backup integrity..."
if gzip -t "${BACKUP_DIR}/${COMPRESSED_FILE}"; then
    log "✅ Backup integrity verified!"
else
    warning "⚠️ Backup integrity check failed!"
fi

log "=== BACKUP SUMMARY ==="
log "Backup file: ${COMPRESSED_FILE}"
log "Location: ${BACKUP_DIR}/${COMPRESSED_FILE}"
log "Size: ${BACKUP_SIZE}"
log "Total backups: ${BACKUP_COUNT}"
log "Retention: ${RETENTION_DAYS} days"
log "===================="