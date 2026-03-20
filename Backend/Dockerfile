FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git curl zip unzip libzip-dev libpng-dev libonig-dev \
    libpq-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql zip mbstring gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader

EXPOSE 8000
CMD php artisan config:clear && \
    php artisan cache:clear && \
    env | grep -E "^(APP_|DB_|MAIL_|SESSION_|CACHE_|QUEUE_|FRONTEND_|SANCTUM_|LOG_|BREVO_)" > .env && \
    php artisan config:clear && \
    php artisan migrate --force && \
    php artisan db:seed --force 2>/dev/null || true && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
