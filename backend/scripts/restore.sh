#!/bin/bash

# ===========================================
# SINAR DB RESTORE SCRIPT
# Script untuk restore database dari backup
# ===========================================

# Configuration
BACKUP_DIR="/var/backups/sinar"
CONTAINER_NAME="sinar_postgres"
DB_NAME="mentri"
DB_USER="postgres"

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

# Function to show usage
show_usage() {
    echo ""
    echo -e "${BLUE}SINAR Database Restore Script${NC}"
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
        cat "${BACKUP_DIR}/last_backup_status.json" | jq . 2>/dev/null || cat "${BACKUP_DIR}/last_backup_status.json"
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
    
    log "Starting database restore process..."
    info "Backup file: $(basename "$BACKUP_FILE")"
    info "Database: $DB_NAME"
    info "Container: $CONTAINER_NAME"
    
    # Check if PostgreSQL container is running
    if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        error "PostgreSQL container '${CONTAINER_NAME}' is not running!"
        return 1
    fi
    
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
    
    # Confirm restore operation
    echo ""
    warning "⚠️  WARNING: This will completely replace the current database!"
    warning "   Database: $DB_NAME"
    warning "   Container: $CONTAINER_NAME"
    warning "   Backup: $(basename "$BACKUP_FILE")"
    echo ""
    read -p "Are you sure you want to continue? (type 'YES' to confirm): " CONFIRM
    
    if [ "$CONFIRM" != "YES" ]; then
        log "Restore operation cancelled by user"
        rm -f "$TEMP_SQL"
        return 1
    fi
    
    # Perform restore
    log "Restoring database from backup..."
    if docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres < "$TEMP_SQL"; then
        log "✅ Database restore completed successfully!"
        
        # Cleanup
        rm -f "$TEMP_SQL"
        
        # Create restore log
        echo "{
  \"status\": \"success\",
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")\",
  \"restored_from\": \"$(basename "$BACKUP_FILE")\",
  \"backup_size\": \"$(du -h "$BACKUP_FILE" | cut -f1)\"
}" > "${BACKUP_DIR}/last_restore_status.json"
        
        log "Restore completed successfully!"
        return 0
    else
        error "❌ Database restore failed!"
        rm -f "$TEMP_SQL"
        
        # Create error log
        echo "{
  \"status\": \"failed\",
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")\",
  \"attempted_file\": \"$(basename "$BACKUP_FILE")\",
  \"error\": \"psql restore command failed\"
}" > "${BACKUP_DIR}/last_restore_status.json"
        
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