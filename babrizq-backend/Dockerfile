# ------------------------------------------------------------------
# Bab Rizq backend — multi-stage Dockerfile
# ------------------------------------------------------------------

# ---- Stage 1: install dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Stage 2: build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client and compile TypeScript
RUN npx prisma generate && npm run build

# ---- Stage 3: production runtime ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
# Run migrations on boot, then start the API (migrate deploy is idempotent)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
