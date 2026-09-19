FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json

RUN npm ci --workspace=apps/backend

COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["npm", "run", "dev"]