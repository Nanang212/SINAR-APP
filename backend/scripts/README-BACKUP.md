# 🛡️ SINAR Database Backup System

Sistem backup otomatis untuk database PostgreSQL aplikasi SINAR dengan fitur:
- ✅ Backup otomatis setiap jam 12 malam
- ✅ Kompresi backup (gzip)
- ✅ Cleanup otomatis backup lama (>7 hari)
- ✅ Logging dan monitoring
- ✅ Restore mudah dari backup
- ✅ Verifikasi integritas backup

## 📁 File Structure

```
backend/scripts/
├── backup.sh              # Script backup utama
├── restore.sh             # Script restore database
├── setup-backup-cron.sh   # Setup cron job otomatis
└── README-BACKUP.md        # Dokumentasi ini
```

## 🚀 Quick Setup

### 1. Setup Backup Otomatis (di server Hostinger)

```bash
# Masuk ke server sebagai root
sudo su

# Masuk ke direktori project
cd /path/to/your/project/backend/scripts

# Jadikan script executable
chmod +x *.sh

# Setup cron job otomatis
sudo ./setup-backup-cron.sh
```

### 2. Test Backup Manual

```bash
# Test backup sekali
sudo /opt/sinar-backup/backup.sh

# Lihat hasil backup
sudo ls -lah /var/backups/sinar/
```

## 📋 Penggunaan

### Backup Manual
```bash
sudo /opt/sinar-backup/backup.sh
```

### List Backup yang Tersedia
```bash
sudo /opt/sinar-backup/restore.sh --list
```

### Restore dari Backup Terbaru
```bash
sudo /opt/sinar-backup/restore.sh --latest
```

### Restore dari File Backup Spesifik
```bash
sudo /opt/sinar-backup/restore.sh sinar_backup_20241228_120000.sql.gz
```

### Monitoring Backup
```bash
# Lihat log backup
sudo tail -f /var/log/sinar-backup.log

# Lihat status backup terakhir
sudo cat /var/backups/sinar/last_backup_status.json

# Lihat cron job yang aktif
sudo crontab -l
```

## 📊 Konfigurasi

### Lokasi File
- **Backup Directory**: `/var/backups/sinar/`
- **Log File**: `/var/log/sinar-backup.log`
- **Script Location**: `/opt/sinar-backup/`

### Pengaturan Default
- **Backup Time**: Setiap hari jam 00:00 (midnight)
- **Retention**: 7 hari (backup lama otomatis dihapus)
- **Compression**: Gzip (.gz)
- **Container Name**: `sinar_postgres`
- **Database**: `mentri`

### Mengubah Konfigurasi

Edit file `/opt/sinar-backup/backup.sh` untuk mengubah:

```bash
RETENTION_DAYS=7        # Ubah jumlah hari retention
CONTAINER_NAME="..."    # Ubah nama container
DB_NAME="..."          # Ubah nama database
```

Edit cron job untuk mengubah jadwal:
```bash
sudo crontab -e
# Ubah: 0 0 * * * (midnight) ke waktu yang diinginkan
```

## 🔧 Troubleshooting

### Backup Gagal
1. **Cek apakah container PostgreSQL running**:
   ```bash
   docker ps | grep postgres
   ```

2. **Cek log error**:
   ```bash
   sudo tail -f /var/log/sinar-backup.log
   ```

3. **Cek disk space**:
   ```bash
   df -h /var/backups/sinar/
   ```

### Restore Gagal
1. **Verifikasi file backup**:
   ```bash
   gzip -t /var/backups/sinar/backup_file.sql.gz
   ```

2. **Cek koneksi database**:
   ```bash
   docker exec sinar_postgres psql -U postgres -c "SELECT version();"
   ```

### Cron Job Tidak Jalan
1. **Cek apakah cron service aktif**:
   ```bash
   sudo systemctl status cron
   ```

2. **Cek cron job**:
   ```bash
   sudo crontab -l
   ```

3. **Test manual**:
   ```bash
   sudo /opt/sinar-backup/backup.sh
   ```

## 📈 Monitoring & Alerts

### Status File JSON
Setiap backup menghasilkan file status dalam format JSON:

```json
{
  "status": "success",
  "timestamp": "2024-12-28T00:00:05.123Z",
  "backup_file": "sinar_backup_20241228_000005.sql.gz",
  "backup_size": "2.3M",
  "retention_days": 7,
  "remaining_backups": 5
}
```

### Monitoring Script (Opsional)
Buat script monitoring untuk alert jika backup gagal:

```bash
#!/bin/bash
STATUS=$(cat /var/backups/sinar/last_backup_status.json | jq -r '.status')
if [ "$STATUS" != "success" ]; then
    # Send notification (email, webhook, etc.)
    echo "ALERT: Backup failed!"
fi
```

## 🔒 Security Notes

1. **Backup files berisi data sensitif** - pastikan direktori backup aman
2. **Script berjalan sebagai root** - review script sebelum production
3. **Network access** - PostgreSQL hanya expose ke internal Docker network
4. **File permissions** - backup files hanya readable oleh root

## ❓ FAQ

**Q: Backup berjalan otomatis tapi tidak ada file backup?**
A: Cek log file dan pastikan container PostgreSQL running.

**Q: Disk penuh karena terlalu banyak backup?**
A: Kurangi `RETENTION_DAYS` atau pindah backup ke storage eksternal.

**Q: Bagaimana backup manual saat maintenance?**
A: Jalankan `sudo /opt/sinar-backup/backup.sh` sebelum maintenance.

**Q: Restore butuh waktu lama?**
A: Normal untuk database besar. Monitor dengan `docker logs sinar_postgres`.

## 🆘 Emergency Recovery

Jika database benar-benar hilang:

1. **Restore dari backup terbaru**:
   ```bash
   sudo /opt/sinar-backup/restore.sh --latest
   ```

2. **Jika backup local tidak ada, gunakan backup dari storage eksternal**

3. **Restart aplikasi**:
   ```bash
   docker-compose restart backend
   ```

---

🔧 **Catatan**: Sistem ini dirancang untuk environment production di Hostinger. Pastikan semua script telah ditest sebelum implementasi.