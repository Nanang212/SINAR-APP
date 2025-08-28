#!/bin/bash

# ===========================================
# SINAR DOCKER DB RESTORE SCRIPT
# Restore database dari dalam Docker network
# ===========================================

# Configuration from environment variables
POSTGRES_HOST="${POSTGRES_HOST:-sinar_postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_DB="${POSTGRES_DB:-mentri}"
BACKUP_DIR="/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Export password for psql
export PGPASSWORD="$POSTGRES_PASSWORD"

# Function to show usage
show_usage() {
    echo ""
    echo -e "${BLUE}SINAR Docker Database Restore Script${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 [backup_file]              - Restore from specific backup file"
    echo "  $0 --list                     - List available backups"
    echo "  $0 --latest                   - Restore from latest backup"
    echo "  $0 --help                     - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 sinar_backup_20241228_120000.sql.gz"
    echo "  $0 --latest"
    echo "  $0 --list"
    echo ""
}

# Function to list available backups
list_backups() {
    log "Available backup files in ${BACKUP_DIR}:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory does not exist: $BACKUP_DIR"
        return 1
    fi
    
    # Find all backup files and sort by date
    BACKUPS=($(find "$BACKUP_DIR" -name "sinar_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -nr | cut -d' ' -f2-))
    
    if [ ${#BACKUPS[@]} -eq 0 ]; then
        warning "No backup files found in $BACKUP_DIR"
        return 1
    fi
    
    printf "%-5s %-35s %-15s %-20s\n" "No." "Backup File" "Size" "Date Modified"
    printf "%-5s %-35s %-15s %-20s\n" "---" "-----------------------------------" "---------------" "--------------------"
    
    for i in "${!BACKUPS[@]}"; do
        BACKUP_FILE="${BACKUPS[$i]}"
        FILENAME=$(basename "$BACKUP_FILE")
        SIZE=$(du -h "$BACKUP_FILE" 2>/dev/null | cut -f1 || echo "N/A")
        DATE=$(stat -c '%y' "$BACKUP_FILE" 2>/dev/null | cut -d'.' -f1 || echo "N/A")
        
        printf "%-5s %-35s %-15s %-20s\n" "$((i+1))" "$FILENAME" "$SIZE" "$DATE"
    done
    
    echo ""
    log "Total backups: ${#BACKUPS[@]}"
    
    # Show latest backup status if available
    if [ -f "${BACKUP_DIR}/last_backup_status.json" ]; then
        echo ""
        info "Last backup status:"
        cat "${BACKUP_DIR}/last_backup_status.json" 2>/dev/null || echo "Status file exists but couldn't be read"
    fi
}

# Function to get latest backup file
get_latest_backup() {
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "sinar_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)
    
    if [ -z "$LATEST_BACKUP" ] || [ ! -f "$LATEST_BACKUP" ]; then
        error "No backup files found in $BACKUP_DIR"
        return 1
    fi
    
    echo "$LATEST_BACKUP"
}

# Function to restore database
restore_database() {
    local BACKUP_FILE="$1"
    local TEMP_SQL="/tmp/sinar_restore_$(date +%s).sql"
    
    # Validate backup file
    if [ ! -f "$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_FILE"
        return 1
    fi
    
    log "=== STARTING DOCKER DATABASE RESTORE ==="
    info "Backup file: $(basename "$BACKUP_FILE")"
    info "Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
    info "Database: $POSTGRES_DB"
    info "User: $POSTGRES_USER"
    
    # Test database connection
    log "Testing database connection..."
    if ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; then
        error "Cannot connect to PostgreSQL server!"
        return 1
    fi
    log "✅ Database connection successful"
    
    # Verify backup file integrity
    log "Verifying backup file integrity..."
    if ! gzip -t "$BACKUP_FILE"; then
        error "Backup file is corrupted: $BACKUP_FILE"
        return 1
    fi
    log "✅ Backup file integrity verified"
    
    # Extract backup file
    log "Extracting backup file..."
    if ! gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"; then
        error "Failed to extract backup file"
        rm -f "$TEMP_SQL"
        return 1
    fi
    
    # Perform restore (no confirmation in Docker environment)
    log "Restoring database from backup..."
    warning "⚠️ This will replace the current database content!"
    
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres < "$TEMP_SQL"; then
        log "✅ Database restore completed successfully!"
        
        # Cleanup
        rm -f "$TEMP_SQL"
        
        # Create restore log
        cat > "${BACKUP_DIR}/last_restore_status.json" << EOF
{
  "status": "success",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "restored_from": "$(basename "$BACKUP_FILE")",
  "backup_size": "$(du -h "$BACKUP_FILE" | cut -f1)",
  "postgres_host": "${POSTGRES_HOST}",
  "postgres_db": "${POSTGRES_DB}"
}
EOF
        
        log "✅ Docker restore completed successfully!"
        return 0
    else
        error "❌ Database restore failed!"
        rm -f "$TEMP_SQL"
        
        # Create error log
        cat > "${BACKUP_DIR}/last_restore_status.json" << EOF
{
  "status": "failed",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "attempted_file": "$(basename "$BACKUP_FILE")",
  "error": "psql restore command failed",
  "postgres_host": "${POSTGRES_HOST}",
  "postgres_db": "${POSTGRES_DB}"
}
EOF
        
        return 1
    fi
}

# Main script logic
case "$1" in
    --help|-h)
        show_usage
        exit 0
        ;;
    --list|-l)
        list_backups
        exit 0
        ;;
    --latest)
        log "Restoring from latest backup..."
        LATEST_BACKUP=$(get_latest_backup)
        if [ $? -eq 0 ]; then
            restore_database "$LATEST_BACKUP"
        else
            exit 1
        fi
        ;;
    "")
        error "No backup file specified"
        show_usage
        exit 1
        ;;
    *)
        # Check if it's a full path or just filename
        if [ -f "$1" ]; then
            BACKUP_FILE="$1"
        elif [ -f "${BACKUP_DIR}/$1" ]; then
            BACKUP_FILE="${BACKUP_DIR}/$1"
        else
            error "Backup file not found: $1"
            echo ""
            info "Available backups:"
            list_backups
            exit 1
        fi
        
        restore_database "$BACKUP_FILE"
        ;;
esac

# Unset password
unset PGPASSWORD