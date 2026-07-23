// src/core/cache/redisClient.ts
//
// Singleton Redis connection used only by the public API's response
// cache (see publicCache.ts). Same "reuse across hot-reloads in dev"
// pattern as prisma/client.ts.

import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/core/utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export const redis =
  global.__redis ||
  new Redis(env.redisUrl, {
    // Caching is a nice-to-have for the public API, not a hard
    // dependency — cap reconnect attempts instead of retrying forever,
    // and let publicCache.ts fall through to the DB on failure.
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) => Math.min(attempt * 500, 5000),
    lazyConnect: true,
    // Fail fast instead of queueing commands while disconnected — a
    // GET/SET that can't reach Redis should reject immediately so
    // publicCache.ts can fall through to the DB without stalling the request.
    enableOfflineQueue: false,
  });

if (!env.isProd) {
  global.__redis = redis;
}

let hasWarnedOffline = false;
redis.on('error', (err) => {
  if (!hasWarnedOffline) {
    logger.warn(`Redis unavailable, public API will run uncached: ${err.message}`);
    hasWarnedOffline = true;
  }
});
redis.on('connect', () => {
  hasWarnedOffline = false;
  logger.info('Redis connected (public API cache)');
});

// Fire the connection at startup without blocking server boot on it.
redis.connect().catch(() => {
  // swallowed — the 'error' listener above already logs this, and
  // publicCache.ts treats a down Redis as "skip caching", not a crash.
});
