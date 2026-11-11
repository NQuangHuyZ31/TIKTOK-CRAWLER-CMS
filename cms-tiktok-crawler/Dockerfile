# ==============================================================================
# Stage 1: Build Frontend Assets (React 19 SPA with Vite & Laravel Mix)
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install Node dependencies first for Docker caching
COPY package*.json ./
RUN npm ci

# Copy application sources
COPY . ./

# Type check TypeScript modules
RUN npm run check-types

# Provide build-time environment variables
ARG VITE_API_URL=/admin/api
ARG VITE_APP_NAME="CMS TikTok Crawler"
ENV NODE_ENV=production
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Compile production bundles for modular React SPA
RUN npm run mix:prod && npx vite build

# ==============================================================================
# Stage 2: PHP 8.3 FPM + Nginx All-in-One Runtime
# ==============================================================================
FROM php:8.3-fpm-alpine

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    nginx \
    curl \
    git \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    icu-dev \
    linux-headers \
    mariadb-client

RUN docker-php-ext-install pdo pdo_mysql mbstring bcmath zip intl pcntl opcache gd

# Install Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Get latest official Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Pre-install PHP dependencies for layer caching
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# Copy full application source files
COPY . /var/www/html

# Copy compiled frontend assets from builder stage
COPY --from=frontend-builder /app/public /var/www/html/public

# Generate optimized autoload classmap
RUN composer dump-autoload --optimize --no-dev

# Copy .env from host if present, fallback to .env.example
RUN if [ ! -f /var/www/html/.env ]; then \
        if [ -f /var/www/html/.env.example ]; then \
            cp /var/www/html/.env.example /var/www/html/.env; \
        fi; \
    fi

# Build-time overwrite of required Docker container fields in .env
RUN if [ -f /var/www/html/.env ]; then \
        sed -i 's|^APP_ENV=.*|APP_ENV=local|g' /var/www/html/.env || true; \
        sed -i 's|^APP_DEBUG=.*|APP_DEBUG=true|g' /var/www/html/.env || true; \
        sed -i 's|^APP_URL=.*|APP_URL=http://localhost:8000|g' /var/www/html/.env || true; \
        if grep -q "^FORCE_HTTPS=" /var/www/html/.env; then \
            sed -i 's|^FORCE_HTTPS=.*|FORCE_HTTPS=false|g' /var/www/html/.env; \
        else \
            echo "FORCE_HTTPS=false" >> /var/www/html/.env; \
        fi; \
        sed -i 's|^DB_CONNECTION=.*|DB_CONNECTION=mysql|g' /var/www/html/.env || true; \
        sed -i 's|^DB_HOST=.*|DB_HOST=mysql|g' /var/www/html/.env || true; \
        sed -i 's|^DB_PORT=.*|DB_PORT=3306|g' /var/www/html/.env || true; \
        sed -i 's|^DB_DATABASE=.*|DB_DATABASE=tiktok_crawler|g' /var/www/html/.env || true; \
        sed -i 's|^DB_USERNAME=.*|DB_USERNAME=tiktok_user|g' /var/www/html/.env || true; \
        sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD=secret_password|g' /var/www/html/.env || true; \
        if grep -q "^CRAWLER_SERVICE_URL=" /var/www/html/.env; then \
            sed -i 's|^CRAWLER_SERVICE_URL=.*|CRAWLER_SERVICE_URL=http://crawler-service:8001|g' /var/www/html/.env; \
        else \
            echo "CRAWLER_SERVICE_URL=http://crawler-service:8001" >> /var/www/html/.env; \
        fi; \
    fi

# Default environment configuration
ENV APP_ENV=local
ENV LOG_CHANNEL=stderr

# Copy Nginx & PHP configuration
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Storage, Cache & Public Avatars permissions
RUN mkdir -p /var/www/html/public/tiktok-accounts/avatars \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/tiktok-accounts \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/tiktok-accounts

EXPOSE 80

CMD ["/usr/local/bin/entrypoint.sh"]
