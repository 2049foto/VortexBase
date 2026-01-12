/**
 * VORTEX API - Logger Middleware
 */

import { Elysia } from 'elysia';
import pino from 'pino';

export const log = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export const logger = new Elysia({ name: 'logger' })
  .derive(({ request }) => {
    const requestId = crypto.randomUUID();
    const startTime = performance.now();

    return {
      requestId,
      startTime,
      log: log.child({ requestId }),
    };
  })
  .onBeforeHandle(({ request, log, requestId }) => {
    log.info({
      type: 'request',
      method: request.method,
      url: request.url,
      requestId,
    });
  })
  .onAfterHandle(({ request, log, startTime, set }) => {
    const duration = Math.round(performance.now() - startTime);
    log.info({
      type: 'response',
      method: request.method,
      url: request.url,
      status: set.status || 200,
      duration: `${duration}ms`,
    });
  });
