@echo off
echo ========================================
echo TESTING SINAR DOCKER SETUP
echo ========================================

echo.
echo [1] Building Docker containers...
docker compose build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build containers!
    pause
    exit /b 1
)

echo.
echo [2] Starting PostgreSQL and MinIO...
docker compose up -d postgres minio
if %errorlevel% neq 0 (
    echo ERROR: Failed to start services!
    pause
    exit /b 1
)

echo.
echo [3] Waiting for PostgreSQL to be ready...
timeout /t 15 /nobreak > nul

echo.
echo [4] Checking PostgreSQL status...
docker compose exec postgres pg_isready -U postgres
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL might not be ready yet
) else (
    echo SUCCESS: PostgreSQL is ready!
)

echo.
echo [5] Checking running services...
docker compose ps

echo.
echo [6] Building backup container...
docker compose build backup-cron
if %errorlevel% neq 0 (
    echo ERROR: Failed to build backup container!
    pause
    exit /b 1
)

echo.
echo [7] Testing backup script (dry run)...
docker compose run --rm backup-cron /usr/local/bin/backup.sh || echo "Expected to fail - database might be empty"

echo.
echo [8] Service logs (last 10 lines)...
echo --- PostgreSQL logs ---
docker compose logs --tail=10 postgres

echo.
echo --- MinIO logs ---
docker compose logs --tail=10 minio

echo.
echo ========================================
echo DOCKER TEST COMPLETED
echo ========================================
echo.
echo Next steps:
echo 1. If all looks good, start backend: docker compose up -d backend
echo 2. Run migrations: docker compose exec backend npx prisma migrate deploy
echo 3. Seed database: docker compose exec backend npm run seed
echo 4. Start backup service: docker compose --profile backup up -d
echo.
pause