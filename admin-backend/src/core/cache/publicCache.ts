// src/core/cache/publicCache.ts
//
// Cache-aside middleware for public GET endpoints. On a hit it responds
// straight from Redis (DB never touched); on a miss it lets the request
// through and caches whatever the route handler sends via res.json,
// for ttlSeconds. If Redis is down, it just skips caching — never
// blocks or fails the request because of it.

import { Request, Response, NextFunction } from 'express';
import { redis } from './redisClient';
import { logger } from '@/core/utils/logger';

const CACHE_PREFIX = 'public-cache:';

export function publicCache(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    // The cache key is URL-only — it can't tell two different callers
    // of the same URL apart. That's fine for pure public data, but a
    // request carrying a Bearer token (e.g. reviews' optional-auth
    // "hasMarkedHelpful" field) can get a viewer-specific response, and
    // caching that would leak one user's state to the next caller who
    // hits the same URL. Skip caching entirely whenever auth is present
    // — safe for every other route too, since none of them vary by it.
    if (req.headers.authorization) {
      return next();
    }

    const key = CACHE_PREFIX + req.originalUrl;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).type('application/json').send(cached);
      }
    } catch (err) {
      logger.warn(`publicCache read skipped: ${(err as Error).message}`);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis
          .set(key, JSON.stringify(body), 'EX', ttlSeconds)
          .catch((err) => logger.warn(`publicCache write skipped: ${(err as Error).message}`));
      }
      return originalJson(body);
    };

    res.setHeader('X-Cache', 'MISS');
    next();
  };
}
