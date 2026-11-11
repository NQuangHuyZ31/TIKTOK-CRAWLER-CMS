
# ==============================================================================
# Stage 1: Frontend Dependencies
# ==============================================================================
FROM node:20-alpine AS frontend-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


# ==============================================================================
# Stage 2: Frontend Production Build
# ==============================================================================
FROM frontend-deps AS frontend-builder

WORKDIR /app

COPY . .

ARG VITE_API_URL=/admin/api
ARG VITE_APP_NAME="CMS TikTok Crawler"

ENV NODE_ENV=production \
    VITE_API_URL=${VITE_API_URL} \
    VITE_APP_NAME=${VITE_APP_NAME}

# TypeScript validation
RUN npm run check-types

# Laravel Mix / Webpack build
RUN npm run mix:prod

# React SPA / Vite build
RUN npx vite build


# ==============================================================================
# Stage 3: PHP Dependencies
# ==============================================================================
FROM composer:2 AS composer-builder

WORKDIR /var/www/html

COPY composer.json composer.lock ./
COPY modules ./modules

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction \
    --no-progress


# ==============================================================================
# Stage 4: Production Runtime
# ==============================================================================
FROM php:8.3-fpm-alpine AS production

WORKDIR /var/www/html

# ------------------------------------------------------------------------------
# System dependencies
# ------------------------------------------------------------------------------
RUN apk add --no-cache \
    nginx \
    curl \
    git \
    zip \
    unzip \
    libpng \
    libjpeg-turbo \
    freetype \
    libzip \
    oniguruma \
    icu-libs \
    mariadb-client \
    su-exec

# ------------------------------------------------------------------------------
# PHP extension build dependencies
# ------------------------------------------------------------------------------
RUN apk add --no-cache --virtual .php-build-deps \
    $PHPIZE_DEPS \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    linux-headers

# GD configuration
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg

# Install PHP extensions
RUN docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    mbstring \
    bcmath \
    zip \
    intl \
    pcntl \
    opcache \
    gd

# Install Redis extension
RUN pecl install redis \
    && docker-php-ext-enable redis

# Remove build dependencies
RUN apk del .php-build-deps

# ------------------------------------------------------------------------------
# Composer
# ------------------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ------------------------------------------------------------------------------
# Application source
# ------------------------------------------------------------------------------
COPY --chown=www-data:www-data . .

# ------------------------------------------------------------------------------
# Composer dependencies
# ------------------------------------------------------------------------------
COPY --from=composer-builder --chown=www-data:www-data \
    /var/www/html/vendor ./vendor

# ------------------------------------------------------------------------------
# Frontend production assets (Vite bundles, Mix modules, entrypoints manifest)
# ------------------------------------------------------------------------------
COPY --from=frontend-builder --chown=www-data:www-data \
    /app/public ./public

# ------------------------------------------------------------------------------
# Runtime directories and permissions
# ------------------------------------------------------------------------------
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    public/tiktok-accounts/avatars \
    /run/nginx \
    /var/log/nginx \
    && chown -R www-data:www-data \
        storage \
        bootstrap/cache \
        public/tiktok-accounts \
    && chmod -R 775 \
        storage \
        bootstrap/cache \
        public/tiktok-accounts

# ------------------------------------------------------------------------------
# Generate optimized autoload files
# ------------------------------------------------------------------------------
RUN composer dump-autoload \
    --no-dev \
    --optimize \
    --no-interaction

# ------------------------------------------------------------------------------
# PHP configuration
# ------------------------------------------------------------------------------
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini

# ------------------------------------------------------------------------------
# Nginx configuration
# ------------------------------------------------------------------------------
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# ------------------------------------------------------------------------------
# Container entrypoint
# ------------------------------------------------------------------------------
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

# ------------------------------------------------------------------------------
# Runtime environment
# ------------------------------------------------------------------------------
ENV APP_ENV=production \
    LOG_CHANNEL=stderr \
    PHP_OPCACHE_ENABLE=1

EXPOSE 80

CMD ["/usr/local/bin/entrypoint.sh"]
