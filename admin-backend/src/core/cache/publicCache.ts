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
