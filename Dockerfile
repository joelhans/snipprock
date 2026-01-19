# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:20-alpine AS build

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# --- Serve stage ---
FROM nginx:alpine AS serve

# Remove default config and add a minimal static server config
RUN rm -f /etc/nginx/conf.d/default.conf

# nginx config: serve built assets and handle routing to index.html
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location / {' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '  add_header Cache-Control "public, max-age=31536000, immutable";' \
  '}' \
  > /etc/nginx/conf.d/snipprok.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
