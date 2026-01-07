# Usamos una imagen ligera de Node.js
FROM node:18-alpine

# Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install --production

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que usa tu server
EXPOSE 3001

# Comando para iniciar el servidor
CMD ["node", "server.js"]