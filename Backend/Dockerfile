FROM php:8.2-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpq-dev \
    zip unzip git curl \
    && docker-php-ext-install pdo pdo_pgsql

# Instalar Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copiar código de Laravel
COPY . .

# Permisos para storage y cache
RUN chown -R www-data:www-data /var/www \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Instalar dependencias de compilación para MongoDB
RUN apt-get update && apt-get install -y \
    build-essential \
    autoconf \
    pkg-config \
    libssl-dev \
    libcurl4-openssl-dev \
    libsasl2-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar MongoDB extension desde el código fuente
RUN cd /tmp \
    && curl -L -o mongodb.tar.gz https://github.com/mongodb/mongo-php-driver/releases/download/1.17.0/mongodb-1.17.0.tgz \
    && tar -xzf mongodb.tar.gz \
    && cd mongodb-1.17.0 \
    && phpize \
    && ./configure \
    && make \
    && make install \
    && docker-php-ext-enable mongodb \
    && cd / \
    && rm -rf /tmp/mongodb* \
    && php -m | grep mongodb

CMD ["php-fpm"]
