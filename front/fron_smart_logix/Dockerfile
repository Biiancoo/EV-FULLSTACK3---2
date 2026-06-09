# ─── STAGE 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependencias primero (caching de capas)
COPY package.json package-lock.json ./
RUN npm ci

# Copia el resto del código y construye
COPY . .
RUN npm run build

# ─── STAGE 2: Producción con Nginx ────────────────────────────────────────────
FROM nginx:stable-alpine

# Copia la build estática al directorio de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de nginx para SPA (Single Page Application)
# Redirige todas las rutas desconocidas al index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
