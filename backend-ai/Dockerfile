# Usa una imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /backend-ai

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Construye la app
RUN npm run build

# Expone el puerto (ajusta si usas otro)
EXPOSE 8080

# Comando para iniciar la app
CMD ["node", "dist/main"]