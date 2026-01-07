# 1. Usar una imagen base de Node.js ligera (Alpine Linux)
FROM node:18-alpine

# 2. Crear y definir el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar los archivos de definición de dependencias
# Se copian primero para aprovechar la caché de capas de Docker
COPY package*.json ./

# 4. Instalar solo las dependencias de producción
RUN npm install --only=production

# 5. Copiar el resto del código fuente del backend
COPY . .

# 6. Exponer el puerto en el que corre tu app (según el Word es el 4000 o 3001)
# Ajustamos al puerto estándar que definimos en los pasos anteriores
EXPOSE 3001

# 7. Comando para arrancar la aplicación
CMD ["npm", "start"]