// src/modules/public/search/search.controller.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { sendSuccess } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import type { AuthPayload } from '@/core/middleware/auth';
import { searchCarsQuerySchema } from './search.validation';
import * as searchService from './search.service';

// Search works the same for guests and logged-in users — this is
// deliberately NOT requireAuth. When a valid user token IS present we
// still want to attach userId to the search_logs row (SearchLog.userId is
// nullable for exactly this reason), but a missing/invalid/expired token
// just means an anonymous log, never a rejected request.
function tryGetUserId(req: Request): number | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), env.jwtSecret) as AuthPayload;
    return decoded.type === 'user' ? decoded.id : null;
  } catch {
    return null;
  }
}

// GET /api/public/v1/search/cars
export async function searchCars(req: Request, res: Response) {
  const query = searchCarsQuerySchema.parse(req.query);
  const result = await searchService.searchCars(query, {
    userId: tryGetUserId(req),
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] ?? null,
  });
  return sendSuccess(res, result, 'Search results fetched successfully');
}
