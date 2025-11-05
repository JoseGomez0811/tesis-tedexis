# Etapa 1: Construcción del frontend Angular
FROM node:20-alpine AS build

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de configuración de npm
COPY package*.json ./

# Instalar dependencias (usa npm ci para builds reproducibles)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación en modo producción
RUN npm run build -- --configuration=production

# Etapa 2: Servir con Nginx
FROM nginx:1.25-alpine

# Copiar el build de Angular al directorio de Nginx
COPY --from=build /usr/src/app/dist/frontend/browser /usr/share/nginx/html

# Copiar configuración de Nginx y certificados
COPY ./nginx/conf.d/app.config /etc/nginx/conf.d/default.conf
COPY ./nginx/ssl /etc/nginx/ssl

# Instalar utilidades
RUN apk add --no-cache bash openssl curl

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]