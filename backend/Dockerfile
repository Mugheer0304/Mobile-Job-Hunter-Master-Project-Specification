# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# OpenSSL is required so `prisma generate` picks the correct engine target
# (debian-openssl-3.0.x) that matches the runtime image.
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime stage (non-root, slim) ----
FROM node:20-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Prisma's query/schema engine needs OpenSSL to load at runtime.
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma

# Run as the non-root "node" user bundled with the base image.
# Database migrations are run by a Kubernetes initContainer (as root); this
# container only serves the API.
USER node

EXPOSE 4000
CMD ["node", "dist/server.js"]
