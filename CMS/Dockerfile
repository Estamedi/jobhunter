# Stage 1: Build Strapi (admin panel + compiled TS)
FROM docker.io/library/node:22.15.0-alpine AS builder

WORKDIR /app

# Toolchain for native modules (better-sqlite3) on musl
RUN apk add --no-cache build-base python3

RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
RUN pnpm run build

# Stage 2: Run Strapi
FROM docker.io/library/node:22.15.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

COPY --from=builder --chown=node:node /app ./

# Writable dirs for the SQLite DB and media uploads (mounted as volumes)
RUN mkdir -p .tmp public/uploads && chown -R node:node .tmp public

USER node

EXPOSE 1337

CMD ["node_modules/.bin/strapi", "start"]
