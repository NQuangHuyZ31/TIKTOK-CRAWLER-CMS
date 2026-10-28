#!/bin/sh
set -e

echo "[Render] Starting CMS TikTok Crawler Web Service..."

# Ensure storage directories exist and have proper permissions
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Run database migrations with force in production
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "[Render] Running Database Migrations..."
    php /var/www/html/artisan migrate --force || echo "[Render] Warning: Migration completed with notice."
fi

# Cache configuration, routes, and views for optimal performance
echo "[Render] Caching configuration, routes, and views..."
php /var/www/html/artisan config:cache || true
php /var/www/html/artisan route:cache || true
php /var/www/html/artisan view:cache || true

# Start PHP-FPM in background
echo "[Render] Starting PHP-FPM..."
php-fpm -D

# Start Nginx in foreground
echo "[Render] Starting Nginx on port 80..."
exec nginx -g "daemon off;"
