import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ApiError } from '../errors/ApiError';
import { prisma } from '../../prisma/client';

export interface AuthPayload {
  id: number;
  type: 'user' | 'admin';
  roleId?: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

interface AdminStatusSnapshot {
  isLocked: boolean;
  status: string;
  roleId: number | null;
  cachedAt: number;
}

const adminStatusCache = new Map<number, AdminStatusSnapshot>();
const STATUS_CACHE_TTL_MS = 30_000; // 30 seconds

export function invalidateAdminStatusCache(adminId?: number) {
  if (adminId) {
    adminStatusCache.delete(adminId);
  } else {
    adminStatusCache.clear();
  }
}

async function getLiveAdminSnapshot(adminId: number): Promise<AdminStatusSnapshot> {
  const cached = adminStatusCache.get(adminId);
  if (cached && Date.now() - cached.cachedAt < STATUS_CACHE_TTL_MS) {
    return cached;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { isLocked: true, status: true, roleId: true },
  });

  if (!admin) {
    throw ApiError.unauthorized('Account no longer exists');
  }

  const snapshot: AdminStatusSnapshot = {
    isLocked: admin.isLocked,
    status: admin.status,
    roleId: admin.roleId,
    cachedAt: Date.now(),
  };
  adminStatusCache.set(adminId, snapshot);
  return snapshot;
}

// Returns the admin's CURRENT roleId (from DB/cache), after asserting
// the account is still active. Callers must use this value instead of
// trusting the roleId embedded in the JWT — that value is frozen at
// login time and goes stale the moment an admin's role is reassigned.
async function assertAdminStillActiveAndGetRoleId(adminId: number): Promise<number | null> {
  const snapshot = await getLiveAdminSnapshot(adminId);

  if (snapshot.isLocked) {
    throw ApiError.forbidden('This account has been locked');
  }
  if (snapshot.status !== 'active') {
    throw ApiError.forbidden(`Account is not active (current status: ${snapshot.status})`);
  }

  return snapshot.roleId;
}

export function requireAuth(allowedTypes?: Array<'user' | 'admin'>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Missing or invalid Authorization header'));
    }
    const token = header.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
      if (allowedTypes && !allowedTypes.includes(decoded.type)) {
        return next(ApiError.forbidden('You do not have access to this resource'));
      }

      if (decoded.type === 'admin') {
        const currentRoleId = await assertAdminStillActiveAndGetRoleId(decoded.id);
        req.auth = { ...decoded, roleId: currentRoleId ?? undefined };
        return next();
      }

      req.auth = decoded;
      next();
    } catch (err) {
      if (err instanceof ApiError) {
        return next(err);
      }
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
  };
}