# ==========================================
# Multi-stage Dockerfile for ridetrack-frontend (Next.js)
# ==========================================

# ------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package manifests first for optimal caching
COPY package*.json ./

# Install dependencies including devDependencies required for Next.js build
RUN npm ci

# Copy full application source code
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build production bundle (.next directory)
RUN npm run build

# ------------------------------------------
# Stage 2: Production Stage
# ------------------------------------------
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application assets and production node_modules from builder stage
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/next.config.js ./

# Expose Next.js frontend port
EXPOSE 3003

# Run container as non-root user
USER node

# Start Next.js production server binding to 0.0.0.0 and port 3003
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3003"]
