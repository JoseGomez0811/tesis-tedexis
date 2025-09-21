FROM node:20-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli@latest

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente de la aplicación
COPY . .

# Exponer puerto para desarrollo de Angular
EXPOSE 4200

# Comando para iniciar Angular en modo desarrollo con escucha en todas las interfaces
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll=2000"]

