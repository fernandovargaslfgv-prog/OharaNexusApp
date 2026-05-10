# Usamos una imagen ligera de Node.js
FROM node:20-alpine

# Creamos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Construimos la aplicación de Next.js
RUN npm run build

# Exponemos el puerto 3000
EXPOSE 3000

# Arrancamos la app
CMD ["npm", "start"]