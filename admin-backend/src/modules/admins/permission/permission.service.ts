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

export async function createPermission(input: CreatePermissionParsed, actorId: number) {
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
  });

  return permission;
}

export async function deletePermission(id: number, actorId: number) {
  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) {
    throw ApiError.notFound('Permission not found');
  }

  // FIXED: previously this only deleted the Permission row, leaving its
  // id behind inside any role's `permissionIds` JSON array — a dangling
  // reference to nothing. Harmless at runtime (requirePermission always
  // re-looks-up ids against the DB) but left role data inconsistent.
  // Find every role that references this id and strip it out first.
  const affectedRoles = await prisma.role.findMany({
    select: { id: true, permissionIds: true },
  });

  const rolesToClean = affectedRoles.filter((role) => {
    const ids = Array.isArray(role.permissionIds) ? (role.permissionIds as number[]) : [];
    return ids.includes(id);
  });

  if (rolesToClean.length > 0) {
    await prisma.$transaction(
      rolesToClean.map((role) => {
        const ids = (role.permissionIds as number[]).filter((pId) => pId !== id);
        return prisma.role.update({
          where: { id: role.id },
          data: { permissionIds: ids },
        });
      }),
    );

    for (const role of rolesToClean) {
      invalidateRoleCache(role.id);
    }
  }

  await prisma.permission.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted permission "${permission.permissionKey}"${
      rolesToClean.length > 0 ? ` (removed from ${rolesToClean.length} role(s))` : ''
    }`,
  });

  return { message: 'Permission deleted successfully' };
}