#!/bin/bash

# ===========================================
# SETUP BACKUP CRON JOB
# Script untuk setup cron job backup otomatis
# ===========================================

# Configuration
SCRIPT_DIR="/opt/sinar-backup"
BACKUP_SCRIPT_PATH="${SCRIPT_DIR}/backup.sh"
CRON_LOG="/var/log/sinar-backup.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "=== SETTING UP SINAR DATABASE BACKUP CRON JOB ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

# Create script directory
log "Creating backup script directory: ${SCRIPT_DIR}"
mkdir -p "$SCRIPT_DIR"

# Copy backup script to system location
CURRENT_DIR="$(dirname "$(readlink -f "$0")")"
log "Copying backup script from ${CURRENT_DIR}/backup.sh to ${BACKUP_SCRIPT_PATH}"

if [ -f "${CURRENT_DIR}/backup.sh" ]; then
    cp "${CURRENT_DIR}/backup.sh" "$BACKUP_SCRIPT_PATH"
    chmod +x "$BACKUP_SCRIPT_PATH"
    log "✅ Backup script copied and made executable"
else
    error "backup.sh not found in current directory!"
    exit 1
fi

# Create log directory
LOG_DIR=$(dirname "$CRON_LOG")
mkdir -p "$LOG_DIR"
touch "$CRON_LOG"

# Setup cron job (backup setiap jam 12 malam)
log "Setting up cron job for daily backup at midnight..."

# Remove existing sinar backup cron job if exists
crontab -l 2>/dev/null | grep -v "sinar.*backup" | crontab -

# Add new cron job
(crontab -l 2>/dev/null; echo "# SINAR Database Backup - Daily at midnight") | crontab -
(crontab -l 2>/dev/null; echo "0 0 * * * $BACKUP_SCRIPT_PATH >> $CRON_LOG 2>&1") | crontab -

log "✅ Cron job added successfully!"

# Verify cron job
log "Verifying cron job installation..."
if crontab -l | grep -q "sinar.*backup\|$BACKUP_SCRIPT_PATH"; then
    log "✅ Cron job verified!"
    log ""
    log "Current cron jobs:"
    crontab -l | grep -E "(sinar|backup|$BACKUP_SCRIPT_PATH)"
else
    error "❌ Cron job verification failed!"
    exit 1
fi

# Create backup directories
log "Creating backup directories..."
mkdir -p /var/backups/sinar
chmod 755 /var/backups/sinar

# Test backup script
log "Testing backup script..."
if bash "$BACKUP_SCRIPT_PATH" --test 2>/dev/null; then
    log "✅ Backup script test successful!"
else
    warning "⚠️ Backup script test had issues (this is normal if Docker is not running)"
fi

log ""
log "=== SETUP COMPLETED SUCCESSFULLY! ==="
log ""
log "📋 SUMMARY:"
log "- Backup script: ${BACKUP_SCRIPT_PATH}"
log "- Backup directory: /var/backups/sinar"
log "- Cron schedule: Daily at 00:00 (midnight)"
log "- Log file: ${CRON_LOG}"
log "- Retention: 7 days"
log ""
log "📝 MANUAL COMMANDS:"
log "- Test backup: sudo ${BACKUP_SCRIPT_PATH}"
log "- View logs: sudo tail -f ${CRON_LOG}"
log "- List backups: sudo ls -lah /var/backups/sinar/"
log "- Edit cron: sudo crontab -e"
log ""
log "🔄 The backup will run automatically every night at midnight."
log "🗂️ Old backups (>7 days) will be automatically deleted."
log ""