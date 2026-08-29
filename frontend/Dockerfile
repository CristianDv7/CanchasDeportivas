FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm

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