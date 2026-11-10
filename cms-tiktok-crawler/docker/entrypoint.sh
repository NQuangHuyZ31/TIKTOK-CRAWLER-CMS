#!/bin/sh
set -e

echo "[CMS] Initializing CMS TikTok Crawler Production Container..."

# Ensure storage and public avatar directories exist and have proper permissions
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/storage/app/public/tiktok-accounts/avatars \
         /var/www/html/public/tiktok-accounts/avatars

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/tiktok-accounts
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/tiktok-accounts
php /var/www/html/artisan storage:link --force || true

# Support Render dynamic $PORT binding (defaults to port 80)
TARGET_PORT="${PORT:-80}"
if [ "$TARGET_PORT" != "80" ]; then
    echo "[CMS] Adjusting Nginx to listen on dynamic port $TARGET_PORT for Render..."
    sed -i "s/listen 80;/listen ${TARGET_PORT};/g" /etc/nginx/http.d/default.conf
fi

# Wait for Database if DB_HOST is configured
if [ -n "$DB_HOST" ] && [ "$DB_CONNECTION" != "sqlite" ]; then
    DB_PORT_TARGET="${DB_PORT:-3306}"
    echo "[CMS] Waiting for database on $DB_HOST:$DB_PORT_TARGET..."
    RETRY_COUNT=0
    MAX_RETRIES=30
    until nc -z -w 2 "$DB_HOST" "$DB_PORT_TARGET" 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "[CMS] Database is not ready yet... waiting (attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "[CMS] Warning: Database connection timed out. Continuing startup..."
    else
        echo "[CMS] Database connection established!"
    fi
fi

# Run database migrations in production
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "[CMS] Running Database Migrations..."
    php /var/www/html/artisan migrate --force || echo "[CMS] Warning: Migration completed with notice."
    if [ "${RUN_SEEDER:-false}" = "true" ]; then
        echo "[CMS] Running Database Seeders..."
        php /var/www/html/artisan db:seed --force || echo "[CMS] Notice: Seeding completed or skipped."
    fi
fi

# Cache configuration, routes, and views if APP_ENV is production
if [ "${APP_ENV:-production}" = "production" ]; then
    echo "[CMS] Caching configuration, routes, and views..."
    php /var/www/html/artisan config:cache || true
    php /var/www/html/artisan route:cache || true
    php /var/www/html/artisan view:cache || true
fi

# Start background Queue Worker with auto-restart supervisor loop
echo "[Queue] Starting background Queue Worker..."
(
    while true; do
        php /var/www/html/artisan queue:work --sleep=3 --tries=3 --max-time=3600 --queue=default,crawler,system
        echo "[Queue] Worker stopped, restarting in 2s..."
        sleep 2
    done
) &

# Start background Scheduler with auto-restart supervisor loop
echo "[Schedule] Starting background Scheduler..."
(
    while true; do
        php /var/www/html/artisan schedule:work
        echo "[Schedule] Scheduler stopped, restarting in 5s..."
        sleep 5
    done
) &

# Start PHP-FPM in background
echo "[CMS] Starting PHP-FPM..."
php-fpm -D

# Start Nginx in foreground to satisfy Render HTTP health checks
echo "[CMS] Starting Nginx on port $TARGET_PORT..."
exec nginx -g "daemon off;"
