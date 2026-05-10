# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && npm ci \
  && apt-get purge -y --auto-remove python3 build-essential \
  && rm -rf /var/lib/apt/lists/*

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/data/books.db
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server.js"]
