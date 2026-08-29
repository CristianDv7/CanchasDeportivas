FROM node:22-alpine
WORKDIR /app

# packageManager en package.json fija pnpm@11.24.0, que requiere Node >=22.13
# (usa node:sqlite) — node:20-alpine no alcanza. Corepack (viene con Node)
# activa esa versión exacta, en vez de "npm install -g pnpm" (instala la
# última publicada, sin relación con la fijada acá).
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

# No preguntar confirmaciones en build (por si queda algún node_modules residual)
ENV CI=true

# Copiar TODO el workspace
COPY . .

# Instalar todo el workspace
RUN pnpm install

ARG APP_NAME=shell
ENV APP_NAME=${APP_NAME}

WORKDIR /app/apps/${APP_NAME}

EXPOSE 3000 3001 3002 3003

CMD ["pnpm", "run", "dev"]