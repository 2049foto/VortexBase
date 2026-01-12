/**
 * VORTEX API - Main Entry Point
 * Bun + Elysia Backend for Vortex Protocol Phase 1 MVP
 * 
 * Base chain ONLY | Dust Token Consolidation | Farcaster Frame v2
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { bearer } from '@elysiajs/bearer';

import { env, CHAIN_ID, CHAIN_NAME } from './env';
import { logger, log } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { initSentry } from './utils/sentry';

// Initialize Sentry for error tracking (production only)
initSentry();

// Routes
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { scanRoutes } from './routes/scan';
import { riskRoutes } from './routes/risk';
import { consolidateRoutes } from './routes/consolidate';
import { leaderboardRoutes } from './routes/leaderboard';
import { xpRoutes } from './routes/xp';
import { questRoutes } from './routes/quests';
import { userRoutes } from './routes/user';
import { frameRoutes } from './routes/frames';

// Application startup time
const startTime = Date.now();

const app = new Elysia({ name: 'vortex-api' })
  // ============================================
  // GLOBAL MIDDLEWARE
  // ============================================
  
  // CORS - Allow frontend origin
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get('origin');
        // Allow configured frontend URL
        if (origin === env.FRONTEND_URL) return true;
        // Allow localhost in development
        if (env.NODE_ENV === 'development') {
          if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
            return true;
          }
        }
        return false;
      },
      credentials: true,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-ID',
        'X-Wallet-Address',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      maxAge: 86400, // 24 hours
    })
  )
  
  // Bearer token extraction
  .use(bearer())
  
  // Request logging with unique IDs
  .use(logger)
  
  // Global error handling
  .use(errorHandler)
  
  // Rate limiting (general - 1000 req/hour)
  .use(rateLimitMiddleware)

  // ============================================
  // API ROUTES
  // ============================================
  
  // Health check (no auth required)
  .use(healthRoutes)
  
  // Authentication routes
  .use(authRoutes)
  
  // Core functionality
  .use(scanRoutes)
  .use(riskRoutes)
  .use(consolidateRoutes)
  
  // Gamification
  .use(leaderboardRoutes)
  .use(xpRoutes)
  .use(questRoutes)
  
  // User profile
  .use(userRoutes)
  
  // Farcaster Frames
  .use(frameRoutes)

  // ============================================
  // ROOT ENDPOINT
  // ============================================
  .get('/', () => ({
    success: true,
    data: {
      name: 'Vortex Protocol API',
      version: '1.0.0',
      description: 'Dust Token Consolidation Engine on Base',
      chain: CHAIN_NAME,
      chainId: CHAIN_ID,
      docs: '/api/health',
    },
  }))

  // ============================================
  // START SERVER
  // ============================================
  .listen({
    port: env.PORT,
    hostname: env.HOST,
  });

// Startup banner
const startupDuration = Date.now() - startTime;

log.info({
  type: 'startup',
  port: env.PORT,
  host: env.HOST,
  env: env.NODE_ENV,
  chain: CHAIN_NAME,
  chainId: CHAIN_ID,
  startupMs: startupDuration,
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🌀 VORTEX PROTOCOL API                                      ║
║   ─────────────────────────────────────────────────────────   ║
║                                                               ║
║   🚀 Server:      http://${env.HOST}:${env.PORT.toString().padEnd(25)}║
║   📊 Environment: ${env.NODE_ENV.padEnd(38)}║
║   ⛓️  Chain:       ${CHAIN_NAME} (${CHAIN_ID})${''.padEnd(33)}║
║   ⏱️  Startup:     ${startupDuration}ms${''.padEnd(37 - startupDuration.toString().length)}║
║                                                               ║
║   📝 Health:      GET /api/health                             ║
║   🔐 Auth:        POST /api/auth/nonce                        ║
║   🔍 Scan:        POST /api/scan                              ║
║   💨 Consolidate: POST /api/consolidate                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export type App = typeof app;
