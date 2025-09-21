# TEDEXIS - Sistema de Gestión

## Descripción
Sistema de gestión desarrollado con Laravel (Backend) y Angular (Frontend), utilizando Docker para el despliegue.

## Arquitectura
- **Backend**: Laravel 12 con PHP 8.2
- **Frontend**: Angular 19
- **Base de Datos**: PostgreSQL + MongoDB
- **Cache**: Redis
- **Servidor Web**: Nginx

## Configuración Inicial

### 1. Configurar Variables de Entorno
Crear archivo `.env` en la carpeta `Backend/` con el siguiente contenido:

```env
APP_NAME=TEDEXIS
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://localhost:8000
APP_LOCALE=es
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=es_ES

APP_FRONTEND_URL=http://localhost:4200

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

# Database Configuration
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=db_tedexis
DB_USERNAME=postgres
DB_PASSWORD=jg081101

# MongoDB Configuration
MONGODB_CONNECTION=mongodb
MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_DATABASE=app
MONGODB_USERNAME=root
MONGODB_PASSWORD=secret

# Redis Configuration
REDIS_CLIENT=phpredis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# Cache Configuration
CACHE_STORE=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis

# Session Configuration
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

# Mail Configuration
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

# Google OAuth Configuration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/google-auth/callback

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost:4200
```

### 2. Configurar Google OAuth
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Habilitar la API de Google+
4. Crear credenciales OAuth 2.0
5. Configurar las URLs de redirección autorizadas:
   - `http://localhost:8000/google-auth/callback`
6. Copiar el Client ID y Client Secret al archivo `.env`

### 3. Ejecutar el Proyecto

```bash
# Construir y ejecutar los contenedores
docker-compose up -d --build

# Generar clave de aplicación Laravel
docker-compose exec app php artisan key:generate

# Ejecutar migraciones
docker-compose exec app php artisan migrate

# Instalar dependencias de Angular (si es necesario)
docker-compose exec angular npm install
```

### 4. Acceder a la Aplicación
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8000/api
- **pgAdmin**: http://localhost:5050
- **Mongo Express**: http://localhost:8081

## Estructura del Proyecto

```
├── Backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── config/
│   ├── database/
│   └── routes/
├── Frontend/                # Angular App
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   └── services/
│   │   └── main.ts
│   └── angular.json
├── nginx/                   # Configuración Nginx
└── docker-compose.yml       # Orquestación de servicios
```

## API Endpoints

### Servidores
- `GET /api/v1/servers` - Listar servidores
- `POST /api/v1/servers` - Crear servidor
- `GET /api/v1/servers/{id}` - Obtener servidor

### Conexiones de Base de Datos
- `GET /api/v1/databases` - Listar conexiones
- `POST /api/v1/databases` - Crear conexión
- `GET /api/v1/databases/{id}` - Obtener conexión
- `PUT /api/v1/databases/{id}` - Actualizar conexión
- `DELETE /api/v1/databases/{id}` - Eliminar conexión

### Autenticación
- `GET /google-auth/redirect` - Redirigir a Google OAuth
- `GET /google-auth/callback` - Callback de Google OAuth
- `GET /api/me` - Obtener usuario autenticado

## Seguridad

### Dominios Permitidos
El sistema está configurado para permitir acceso solo desde dominios específicos:
- tedexis.com
- gmail.com

### Contraseñas
- Las contraseñas de base de datos se ocultan automáticamente en las respuestas JSON
- Se recomienda usar variables de entorno para credenciales sensibles

## Desarrollo

### Comandos Útiles

```bash
# Ver logs de Laravel
docker-compose exec app php artisan pail

# Ejecutar tests
docker-compose exec app php artisan test

# Limpiar cache
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear

# Reinstalar dependencias
docker-compose exec app composer install
docker-compose exec angular npm install
```

### Troubleshooting

1. **Error de conexión a base de datos**: Verificar que PostgreSQL esté ejecutándose
2. **CORS errors**: Verificar configuración en `config/cors.php`
3. **Google OAuth no funciona**: Verificar credenciales y URLs de redirección
4. **Frontend no carga**: Verificar que Angular esté ejecutándose en puerto 4200

## Producción

Para despliegue en producción:

1. Cambiar `APP_ENV=production` en `.env`
2. Configurar `APP_DEBUG=false`
3. Usar credenciales de producción para Google OAuth
4. Configurar SSL/HTTPS
5. Usar base de datos de producción
6. Configurar backup automático de bases de datos

