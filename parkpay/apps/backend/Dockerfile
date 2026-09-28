FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json

RUN npm ci --workspace=apps/backend

COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

RUN npm run build


FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json

RUN npm ci --workspace=apps/backend --omit=dev && npm cache clean --force

COPY --from=build \
    /app/apps/backend/dist \
    ./apps/backend/dist

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["node", "dist/src/server.js"]