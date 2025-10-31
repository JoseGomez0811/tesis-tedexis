# Usa PHP 7.4 CLI (sin Apache)
FROM php:7.4-cli

# Instala dependencias necesarias para compilar la extensión mongodb
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    build-essential \
    autoconf \
    libssl-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instala la extensión mongodb desde PECL en la versión 1.5.3
# (compatible con PHP 7.4 y con servidores MongoDB 3.4.x)
RUN pecl channel-update pecl.php.net \
    && pecl install mongodb-1.5.3 \
    && docker-php-ext-enable mongodb

# Copia el código fuente
COPY . /var/www/html/

# Instalar Composer y dependencias del proyecto (genera vendor/autoload.php)
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm composer-setup.php \
    && cd /var/www/html \
    && composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader || true

# Instalar Composer y dependencias PHP del proyecto (genera vendor/autoload.php)
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm composer-setup.php \
    && cd /var/www/html \
    && composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader || true

# Crear carpeta de logs para que puedan montarse y persistir en el host
RUN mkdir -p /var/www/html/storage/logs \
    && touch /var/www/html/storage/logs/mongo_bridge.log \
    && chmod 0666 /var/www/html/storage/logs/mongo_bridge.log || true

# Expone el puerto 8080
EXPOSE 8081

# Arranca el servidor built-in de PHP en el puerto 8080
CMD ["php", "-S", "0.0.0.0:8081", "-t", "/var/www/html/public"]