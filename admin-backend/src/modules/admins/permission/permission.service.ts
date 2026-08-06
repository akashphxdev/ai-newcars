// src/modules/permission/permission.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { invalidateRoleCache } from '@/core/middleware/requirePermission';
import type { CreatePermissionParsed, PermissionListQueryParsed } from './permission.validation';

export async function listPermissions(query: PermissionListQueryParsed) {
  const permissions = await prisma.permission.findMany({
    where: query.module ? { module: query.module } : undefined,
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
  });

  // Group by module — much easier for the frontend to render as a checklist grid
  const grouped: Record<string, typeof permissions> = {};
  for (const p of permissions) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }

  return { flat: permissions, grouped };
}

export async function createPermission(
  input: CreatePermissionParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const permissionKey = `${input.module}.${input.action}`; // CHANGED: colon -> dot

  const existing = await prisma.permission.findUnique({ where: { permissionKey } });
  if (existing) {
    throw ApiError.conflict(`Permission "${permissionKey}" already exists`);
  }

  const permission = await prisma.permission.create({
    data: {
      module: input.module,
      action: input.action,
      permissionKey,
    },
  });

  await createLog({
    adminId: actorId,
    description: `Created permission "${permissionKey}"`,
    ipAddress,
  });

  return permission;
}

export async function deletePermission(id: number, actorId: number, ipAddress?: string | null) {
  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) {
    throw ApiError.notFound('Permission not found');
  }

  // Which roles held this permission has to be read before the delete,
  // purely so their cached permission sets can be invalidated afterwards
  // — the rows themselves are removed by the role_permissions foreign
  // key's ON DELETE CASCADE.
  //
  // This previously loaded every role, filtered its permissionIds JSON
  // array in JavaScript and wrote each one back. That was a
  // read-modify-write with no locking: a concurrent role edit between
  // the read and the write silently lost whichever change landed first.
  const rolesToClean = await prisma.rolePermission.findMany({
    where: { permissionId: id },
    select: { roleId: true },
  });

  await prisma.permission.delete({ where: { id } });

  for (const { roleId } of rolesToClean) {
    invalidateRoleCache(roleId);
  }

  await createLog({
    adminId: actorId,
    description: `Deleted permission "${permission.permissionKey}"${
      rolesToClean.length > 0 ? ` (removed from ${rolesToClean.length} role(s))` : ''
    }`,
    ipAddress,
  });

  return { message: 'Permission deleted successfully' };
}