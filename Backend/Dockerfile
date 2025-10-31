# FROM php:8.2-fpm

# # Instalar dependencias del sistema
# RUN apt-get update && apt-get install -y \
#     libpq-dev \
#     zip unzip git curl \
#     && docker-php-ext-install pdo pdo_pgsql

# # Instalar Composer
# COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# WORKDIR /var/www

# # Copiar código de Laravel
# COPY . .

# # Permisos para storage y cache
# RUN chown -R www-data:www-data /var/www \
#     && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# # Instalar dependencias de compilación para MongoDB
# RUN apt-get update && apt-get install -y \
#     build-essential \
#     autoconf \
#     pkg-config \
#     libssl-dev \
#     libcurl4-openssl-dev \
#     libsasl2-dev \
#     && rm -rf /var/lib/apt/lists/*

# # Instalar MongoDB extension desde el código fuente
# RUN cd /tmp \
#     && curl -L -o mongodb.tar.gz https://github.com/mongodb/mongo-php-driver/releases/download/1.17.0/mongodb-1.17.0.tgz \
#     && tar -xzf mongodb.tar.gz \
#     && cd mongodb-1.17.0 \
#     && phpize \
#     && ./configure \
#     && make \
#     && make install \
#     && docker-php-ext-enable mongodb \
#     && cd / \
#     && rm -rf /tmp/mongodb* \
#     && php -m | grep mongodb

# CMD ["php-fpm"]


# FROM php:8.2-fpm

# # Instalar dependencias del sistema
# RUN apt-get update && apt-get install -y \
#     libpq-dev \
#     zip unzip git curl \
#     build-essential \
#     autoconf \
#     pkg-config \
#     libssl-dev \
#     libcurl4-openssl-dev \
#     libsasl2-dev \
#     && docker-php-ext-install pdo pdo_pgsql \
#     && rm -rf /var/lib/apt/lists/*

# # Instalar Composer
# COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# WORKDIR /var/www

# # Copiar código de Laravel
# COPY . .

# # Permisos para storage y cache
# RUN chown -R www-data:www-data /var/www \
#     && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# # 🔹 Instalar versión específica del driver MongoDB (compatible con MongoDB 3.4)
# RUN pecl install mongodb-1.5.3 \
#     && docker-php-ext-enable mongodb \
#     && php -m | grep mongodb

# # 🔹 Instalar dependencias de PHP via Composer (librería cliente)
# RUN composer require mongodb/mongodb:^1.3 --no-interaction --prefer-dist

# CMD ["php-fpm"]

# FROM php:7.4-fpm

# # Dependencias del sistema
# RUN apt-get update && apt-get install -y \
#     libpq-dev \
#     zip unzip git curl \
#     build-essential \
#     autoconf \
#     pkg-config \
#     libssl-dev \
#     libcurl4-openssl-dev \
#     libsasl2-dev \
#     && docker-php-ext-install pdo pdo_pgsql

# # Composer
# COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer

# WORKDIR /var/www
# COPY . .

# # Permisos
# RUN chown -R www-data:www-data /var/www \
#     && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# # Driver MongoDB compatible con 3.4
# RUN pecl install mongodb-1.5.3 \
#     && docker-php-ext-enable mongodb \
#     && php -m | grep mongodb

# # Librería PHP
# RUN composer require mongodb/mongodb:^1.3 --no-interaction --prefer-dist

# CMD ["php-fpm"]

# Imagen base PHP 8.2 (Laravel)
FROM php:8.2-fpm

# Instalar dependencias del sistema y extensiones necesarias
RUN apt-get update && apt-get install -y \
    libpq-dev \
    zip unzip git curl \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Establecer directorio de trabajo
WORKDIR /var/www

# Copiar código del proyecto
COPY . .

# Asignar permisos correctos
RUN chown -R www-data:www-data /var/www \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Instalar dependencias de Laravel
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Limpiar cachés y optimizar
RUN php artisan config:clear || true \
    && php artisan cache:clear || true \
    && php artisan route:clear || true \
    && php artisan view:clear || true

# Exponer puerto
EXPOSE 9000

CMD ["php-fpm"]

