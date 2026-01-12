# Vortex Protocol API - Production Dockerfile
# Base: Bun runtime for optimal performance

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM oven/bun:1.1-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# ============================================
# Stage 2: Build
# ============================================
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./

# Copy source code
COPY src ./src
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Type check
RUN bun run typecheck

# Build the application
RUN bun build src/index.ts --outdir=dist --target=bun

# ============================================
# Stage 3: Production
# ============================================
FROM oven/bun:1.1-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vortex

# Copy built application
COPY --from=builder --chown=vortex:nodejs /app/dist ./dist
COPY --from=deps --chown=vortex:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=vortex:nodejs /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Use non-root user
USER vortex

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3001/api/health').then(r => process.exit(r.ok ? 0 : 1))"

# Start the application
CMD ["bun", "run", "dist/index.js"]
