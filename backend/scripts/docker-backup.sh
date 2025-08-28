#!/bin/bash

# ===========================================
# SINAR DOCKER DB BACKUP SCRIPT
# Backup database dari dalam Docker network
# ===========================================

# Configuration from environment variables
POSTGRES_HOST="${POSTGRES_HOST:-sinar_postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_DB="${POSTGRES_DB:-mentri}"
BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
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

# Export password for pg_dump
export PGPASSWORD="$POSTGRES_PASSWORD"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

log "=== STARTING DOCKER DATABASE BACKUP ==="
log "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
log "Database: ${POSTGRES_DB}"
log "User: ${POSTGRES_USER}"
log "Backup file: ${BACKUP_FILE}"
log "Retention: ${RETENTION_DAYS} days"

# Test database connection
log "Testing database connection..."
if ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; then
    error "Cannot connect to PostgreSQL server!"
    exit 1
fi
log "✅ Database connection successful"

# Create backup using pg_dump
log "Creating database backup..."
if pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
   --verbose --clean --if-exists --create > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    
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
    cat > "${BACKUP_DIR}/last_backup_status.json" << EOF
{
  "status": "success",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "backup_file": "${COMPRESSED_FILE}",
  "backup_size": "${BACKUP_SIZE}",
  "retention_days": ${RETENTION_DAYS},
  "remaining_backups": ${BACKUP_COUNT},
  "postgres_host": "${POSTGRES_HOST}",
  "postgres_db": "${POSTGRES_DB}"
}
EOF
    
    log "✅ Docker backup process completed successfully!"
    
    # Health check - verify backup can be read
    log "Verifying backup integrity..."
    if gzip -t "${BACKUP_DIR}/${COMPRESSED_FILE}"; then
        log "✅ Backup integrity verified!"
    else
        warning "⚠️ Backup integrity check failed!"
    fi
    
else
    error "❌ Backup failed!"
    
    # Create error status file
    cat > "${BACKUP_DIR}/last_backup_status.json" << EOF
{
  "status": "failed",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "error": "pg_dump command failed",
  "postgres_host": "${POSTGRES_HOST}",
  "postgres_db": "${POSTGRES_DB}"
}
EOF
    
    exit 1
fi

log "=== DOCKER BACKUP SUMMARY ==="
log "Backup file: ${COMPRESSED_FILE}"
log "Location: ${BACKUP_DIR}/${COMPRESSED_FILE}"
log "Size: ${BACKUP_SIZE}"
log "Total backups: ${BACKUP_COUNT}"
log "Retention: ${RETENTION_DAYS} days"
log "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
log "Database: ${POSTGRES_DB}"
log "=========================="

# Unset password
unset PGPASSWORD