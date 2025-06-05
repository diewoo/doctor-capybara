# Usa una imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala dependencias
RUN npm install --production

# Copia el resto del código
COPY . .

# Construye la app
RUN npm run build

# Expone el puerto (ajusta si usas otro)
EXPOSE 3001

# Comando para iniciar la app
CMD ["node", "dist/main"]