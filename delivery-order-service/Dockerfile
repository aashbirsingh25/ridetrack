# ==========================================
# Multi-stage Dockerfile for delivery-order-service
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies including devDependencies required for compilation
RUN npm ci

# Copy application source code
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript in dist directory
RUN npm run build

# Prune devDependencies to keep final bundle lean
RUN npm prune --production

# ------------------------------------------
# Stage 2: Production Stage
# ------------------------------------------
FROM node:18-alpine AS runner

WORKDIR /app

# Set production environment node_env
ENV NODE_ENV=production
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Copy built artifacts and production dependencies from builder stage
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Expose service port (default 3000)
EXPOSE 3000

# Run the compiled application using non-root user for security best practices
USER node

# Start NestJS application
CMD ["node", "dist/main.js"]
