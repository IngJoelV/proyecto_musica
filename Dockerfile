FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# ESTA LÍNEA NOS MOSTRARÁ QUÉ ARCHIVOS SE COPIARON EN LOS LOGS
RUN ls -la 
EXPOSE 3001
CMD ["node", "server.js"]