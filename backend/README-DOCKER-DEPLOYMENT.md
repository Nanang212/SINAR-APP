# 🐳 SINAR Docker Deployment Guide

Panduan lengkap deploy aplikasi SINAR dengan Docker di server Hostinger dengan sistem backup otomatis.

## 📋 Prerequisites

- Docker & Docker Compose installed di server
- Domain/subdomain pointing ke server IP
- SSL certificate (optional, tapi recommended)

## 🚀 Quick Deploy

### 1. Clone & Setup Project

```bash
# Clone repository
git clone <your-repo-url>
cd Fullstack-Sinar/backend

# Copy environment file
cp .env.example .env
# Edit .env sesuai kebutuhan production
```

### 2. Deploy Full Application

```bash
# Deploy semua services (tanpa backup)
docker compose up -d

# Deploy dengan backup otomatis
docker compose --profile backup up -d
```

### 3. Setup Database

```bash
# Run migrations
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate

# Seed initial data
docker compose exec backend npm run seed
```

## 🛡️ Backup System

### Automatic Backup (Recommended)

Deploy dengan backup otomatis:

```bash
# Deploy dengan backup service
docker compose --profile backup up -d

# Check backup service logs
docker compose logs -f backup-cron
```

### Manual Backup Commands

```bash
# Manual backup
docker compose exec backup-cron /usr/local/bin/backup.sh

# List all backups
docker compose exec backup-cron /usr/local/bin/restore.sh --list

# Restore from latest backup
docker compose exec backup-cron /usr/local/bin/restore.sh --latest

# Restore from specific backup
docker compose exec backup-cron /usr/local/bin/restore.sh sinar_backup_20241228_120000.sql.gz
```

### Backup Monitoring

```bash
# Check backup logs
docker compose exec backup-cron cat /var/log/sinar-backup.log

# Check backup status
docker compose exec backup-cron cat /backups/last_backup_status.json

# List backup files
docker compose exec backup-cron ls -lah /backups/
```

## 📁 Directory Structure

```
backend/
├── docker-compose.yml          # Main deployment config
├── Dockerfile                  # Backend app container
├── Dockerfile.backup          # Backup service container
├── backups/                   # Backup files (mounted volume)
├── logs/                      # Application logs
├── postgres_data/             # PostgreSQL data
├── minio_data/               # MinIO storage data
└── scripts/
    ├── docker-backup.sh      # Docker backup script
    ├── docker-restore.sh     # Docker restore script
    └── ...
```

## 🔧 Configuration

### Environment Variables

Create `.env` file dengan konfigurasi production:

```env
# Database
DATABASE_URL="postgresql://postgres:admin@postgres:5432/mentri?schema=public"

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=sinar-documents

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=production
```

### Backup Configuration

Edit environment variables di `docker-compose.yml`:

```yaml
backup-cron:
  environment:
    - BACKUP_RETENTION_DAYS=7  # Keep backups for 7 days
    - POSTGRES_HOST=sinar_postgres
    - POSTGRES_DB=mentri
    # ... other vars
```

## 🌐 Reverse Proxy Setup (Nginx)

Create nginx config untuk expose aplikasi:

```nginx
# /etc/nginx/sites-available/sinar
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # MinIO Console (optional)
    location /minio/ {
        proxy_pass http://localhost:9001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/sinar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check all services status
docker compose ps

# Check service health
docker compose exec postgres pg_isready -U postgres
docker compose exec minio curl -f http://localhost:9000/minio/health/live
docker compose exec backend curl -f http://localhost:3000/health

# Check backup service
docker compose exec backup-cron ps aux | grep cron
```

### Logs Monitoring

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f backup-cron

# View backup logs
docker compose exec backup-cron tail -f /var/log/sinar-backup.log
```

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose build --no-cache backend
docker compose up -d

# Run migrations if needed
docker compose exec backend npx prisma migrate deploy
```

## 🔒 Security Best Practices

### 1. Network Security
- PostgreSQL hanya expose ke internal network (`expose`, bukan `ports`)
- MinIO hanya expose ports yang diperlukan
- Backend hanya expose port 3000

### 2. Data Security
- Backup files encrypted dan stored securely
- Environment variables menggunakan secrets
- Regular backup dengan retention policy

### 3. Access Control
```bash
# Create limited user untuk aplikasi
sudo adduser sinar
sudo usermod -aG docker sinar

# Set proper file permissions
chmod 600 .env
chmod 750 backups/
chown -R sinar:sinar backups/
```

## 🚨 Disaster Recovery

### Complete Database Loss

1. **Stop all services**:
   ```bash
   docker compose down
   ```

2. **Remove corrupted data**:
   ```bash
   sudo rm -rf postgres_data/*
   ```

3. **Start PostgreSQL only**:
   ```bash
   docker compose up -d postgres
   ```

4. **Restore from backup**:
   ```bash
   docker compose --profile backup up -d backup-cron
   docker compose exec backup-cron /usr/local/bin/restore.sh --latest
   ```

5. **Start all services**:
   ```bash
   docker compose up -d
   ```

### Partial Data Recovery

```bash
# Restore specific backup
docker compose exec backup-cron /usr/local/bin/restore.sh --list
docker compose exec backup-cron /usr/local/bin/restore.sh sinar_backup_YYYYMMDD_HHMMSS.sql.gz
```

## ⚙️ Advanced Configuration

### Custom Backup Schedule

Edit crontab in `Dockerfile.backup`:

```dockerfile
# Daily at 2 AM
RUN echo "0 2 * * * /usr/local/bin/backup.sh >> /var/log/sinar-backup.log 2>&1" >> /var/spool/cron/crontabs/root

# Every 6 hours
RUN echo "0 */6 * * * /usr/local/bin/backup.sh >> /var/log/sinar-backup.log 2>&1" >> /var/spool/cron/crontabs/root
```

### External Backup Storage

Mount external storage untuk backup:

```yaml
backup-cron:
  volumes:
    - ./backups:/backups
    - /mnt/external-storage:/external-backups  # External storage
```

### Scaling & Load Balancing

```yaml
backend:
  deploy:
    replicas: 3
  # Add load balancer configuration
```

## 🔧 Troubleshooting

### Common Issues

1. **Backend can't connect to PostgreSQL**:
   ```bash
   # Check if postgres is running
   docker compose ps postgres
   
   # Check network connectivity
   docker compose exec backend ping postgres
   ```

2. **Backup fails**:
   ```bash
   # Check backup service logs
   docker compose logs backup-cron
   
   # Test manual backup
   docker compose exec backup-cron /usr/local/bin/backup.sh
   ```

3. **Disk space issues**:
   ```bash
   # Check disk usage
   df -h
   
   # Clean old Docker images
   docker system prune -a
   
   # Adjust backup retention
   # Edit BACKUP_RETENTION_DAYS in docker-compose.yml
   ```

4. **Permission issues**:
   ```bash
   # Fix backup directory permissions
   sudo chown -R 999:999 backups/
   sudo chmod -R 755 backups/
   ```

---

## 📞 Support Commands

```bash
# Quick health check
docker compose ps && docker compose exec postgres pg_isready && docker compose exec backend curl -f http://localhost:3000/health

# Quick backup
docker compose exec backup-cron /usr/local/bin/backup.sh

# View recent logs
docker compose logs --tail=50 -f

# Emergency stop
docker compose down

# Emergency start
docker compose up -d
```

🚀 **Ready to deploy!** Sistem backup otomatis akan melindungi data Anda setiap hari jam 12 malam.