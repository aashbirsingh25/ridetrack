# ==========================================
# Multi-stage Dockerfile for live-tracking-service
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies including devDependencies required for compilation
RUN npm ci

# Copy application configuration and source code
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript in dist directory
RUN npm run build

# Prune devDependencies to keep final production bundle lightweight
RUN npm prune --production

# ------------------------------------------
# Stage 2: Production Stage
# ------------------------------------------
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment node_env to production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Copy built artifacts and production dependencies from builder stage
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Expose microservice port (default 3002)
EXPOSE 3002

# Run application using non-root node user for security best practices
USER node

# Start NestJS application
CMD ["node", "dist/main.js"]
