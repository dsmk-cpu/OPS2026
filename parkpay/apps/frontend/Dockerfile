FROM node:24-trixie-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN npm ci --workspace=apps/frontend

COPY apps/frontend ./apps/frontend

WORKDIR /app/apps/frontend

RUN npm run build


FROM nginx:alpine AS runtime

RUN apk update && apk upgrade --no-cache

COPY --from=build \
    /app/apps/frontend/dist \
    /usr/share/nginx/html

COPY apps/frontend/default.conf.template \
    /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]