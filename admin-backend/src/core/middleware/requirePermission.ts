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

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { roleName: true, permissionIds: true },
  });

  if (!role) {
    const empty = { permissionKeys: new Set<string>(), isSuperAdmin: false };
    roleCache.set(roleId, { ...empty, cachedAt: Date.now() });
    return empty;
  }

  const isSuperAdmin = role.roleName === SUPER_ADMIN_ROLE_NAME;

  // permissionIds is stored as a JSON array of permission row IDs
  const ids = Array.isArray(role.permissionIds) ? (role.permissionIds as number[]) : [];

  if (ids.length === 0) {
    const result = { permissionKeys: new Set<string>(), isSuperAdmin };
    roleCache.set(roleId, { ...result, cachedAt: Date.now() });
    return result;
  }

  const permissions = await prisma.permission.findMany({
    where: { id: { in: ids } },
    select: { permissionKey: true },
  });

  const result = { permissionKeys: new Set(permissions.map((p) => p.permissionKey)), isSuperAdmin };
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