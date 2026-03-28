# Stage 1: Build & Dependencies
FROM node:18-slim AS builder

WORKDIR /app

# Install build dependencies for native modules (sharp, etc.)
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Production Dependencies Cleanup
FROM node:18-slim AS pruner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
# Prune devDependencies to keep image small
RUN npm prune --production

# Stage 3: Runtime
FROM node:18-slim
WORKDIR /app

# Install runtime dependencies (OpenSSL is required by Prisma)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Security: Run as non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodeuser
RUN mkdir -p uploads && chown -R nodeuser:nodejs /app

COPY --from=pruner /app/node_modules ./node_modules
COPY --from=pruner /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY . .

# Set production environment
ENV NODE_ENV=production
USER nodeuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3001/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]
