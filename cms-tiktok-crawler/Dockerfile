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

# Copy application source files
COPY . /var/www/html

# Copy compiled frontend assets from builder stage
COPY --from=frontend-builder /app/public /var/www/html/public

# Install production PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Default environment configuration
ENV APP_ENV=production
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
