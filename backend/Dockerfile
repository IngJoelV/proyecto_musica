# CAMBIO CLAVE: Usamos 'node:18' (versión completa) en lugar de 'alpine'.
# Esto es un poco más pesado, pero evita todos los errores de compilación con bcrypt.
FROM node:18

# Creamos la carpeta de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias primero
COPY package*.json ./

# Instalamos las dependencias
# Nota: Quitamos '--production' para asegurar que se instalen herramientas de compilación si hacen falta
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto
EXPOSE 3001

# Arrancamos
CMD ["node", "server.js"]