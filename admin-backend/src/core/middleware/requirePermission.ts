// src/core/middleware/requirePermission.ts

import { NextFunction, Request, Response } from 'express';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
const SUPER_ADMIN_ROLE_NAME = 'Super Admin';
const roleCache = new Map<number, { permissionKeys: Set<string>; isSuperAdmin: boolean; cachedAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

export function invalidateRoleCache(roleId?: number) {
  if (roleId) {
    roleCache.delete(roleId);
  } else {
    roleCache.clear();
  }
}

async function getRolePermissionState(
  roleId: number,
): Promise<{ permissionKeys: Set<string>; isSuperAdmin: boolean }> {
  const cached = roleCache.get(roleId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  // One join replaces what used to be two round-trips: fetch the role's
  // permissionIds JSON array, then look those ids up in permissions.
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      roleName: true,
      permissions: { select: { permission: { select: { permissionKey: true } } } },
    },
  });

  if (!role) {
    const empty = { permissionKeys: new Set<string>(), isSuperAdmin: false };
    roleCache.set(roleId, { ...empty, cachedAt: Date.now() });
    return empty;
  }

  const result = {
    permissionKeys: new Set(role.permissions.map((rp) => rp.permission.permissionKey)),
    isSuperAdmin: role.roleName === SUPER_ADMIN_ROLE_NAME,
  };
  roleCache.set(roleId, { ...result, cachedAt: Date.now() });
  return result;
}

// CHANGED: now takes ONE argument — the full permission key in
// "module.action" format (e.g. "admins.view") — instead of two
// separate (module, action) arguments.
export function requirePermission(permissionKey: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        return next(ApiError.unauthorized('Missing authentication'));
      }

      if (!req.auth.roleId) {
        return next(ApiError.forbidden('No role assigned to this account'));
      }

      const { permissionKeys, isSuperAdmin } = await getRolePermissionState(req.auth.roleId);

      // Super Admin always passes, regardless of its permissionIds.
      if (isSuperAdmin) {
        return next();
      }

      if (!permissionKeys.has(permissionKey)) {
        return next(ApiError.forbidden(`You do not have permission to perform this action (${permissionKey})`));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}