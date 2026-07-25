# ==========================================
# Multi-stage Dockerfile for rider-dispatch-service
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies including devDependencies for compilation
RUN npm ci

# Copy application source code
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Build production artifacts in dist/
RUN npm run build

# Prune devDependencies
RUN npm prune --production

# ------------------------------------------
# Stage 2: Production Stage
# ------------------------------------------
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and production node_modules from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose service port (default 3001)
EXPOSE 3001

USER node

# Start NestJS application
CMD ["node", "dist/main.js"]
