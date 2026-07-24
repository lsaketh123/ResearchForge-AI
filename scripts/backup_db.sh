#!/bin/bash
# ResearchHub AI - Production Database Backup Strategy
# Schedule this script to run daily via cron:
# 0 2 * * * /app/scripts/backup_db.sh >> /var/log/db_backup.log 2>&1

BACKUP_DIR="/var/backups/researchhub"
DB_CONTAINER="researchhub_db"
DB_USER="postgres"
DB_NAME="postgres"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/researchhub_backup_${DATE}.sql.gz"

echo "=== Starting DB Backup: ${DATE} ==="
mkdir -p "${BACKUP_DIR}"

# Dump and compress database inside container
docker exec ${DB_CONTAINER} pg_dump -U ${DB_USER} ${DB_NAME} | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: ${BACKUP_FILE}"
else
    echo "Error: Database backup failed."
    exit 1
fi

# Retention Policy: Clean up backups older than 7 days to conserve disk space
echo "Applying retention policy (deleting older than 7 days)..."
find "${BACKUP_DIR}" -name "researchhub_backup_*" -mtime +7 -exec rm {} \;

echo "=== Backup Process Completed ==="
