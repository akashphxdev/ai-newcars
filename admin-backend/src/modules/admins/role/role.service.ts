// src/modules/role/role.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { invalidateRoleCache } from '@/core/middleware/requirePermission';
import type { CreateRoleParsed, UpdateRoleParsed } from './role.validation';
const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

const ROLE_SELECT = {
  id: true,
  roleName: true,
  parentRoleId: true,
  permissionIds: true,
  createdAt: true,
  parentRole: { select: { id: true, roleName: true } },
} as const;

export async function listRoles() {
  const roles = await prisma.role.findMany({
    select: ROLE_SELECT,
    orderBy: { roleName: 'asc' },
  });

  const parentRoles = roles.filter((r) => r.parentRoleId === null);
  const childRolesByParent: Record<number, typeof roles> = {};

  for (const role of roles) {
    if (role.parentRoleId !== null) {
      if (!childRolesByParent[role.parentRoleId]) childRolesByParent[role.parentRoleId] = [];
      childRolesByParent[role.parentRoleId].push(role);
    }
  }

  return { all: roles, parentRoles, childRolesByParent };
}

export async function getRoleById(id: number) {
  const role = await prisma.role.findUnique({
    where: { id },
    select: ROLE_SELECT,
  });

  if (!role) {
    throw ApiError.notFound('Role not found');
  }

  return role;
}

async function validatePermissionIds(permissionIds: number[]) {
  if (permissionIds.length === 0) return;

  const found = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { id: true },
  });

  if (found.length !== permissionIds.length) {
    const foundIds = new Set(found.map((p) => p.id));
    const missing = permissionIds.filter((id) => !foundIds.has(id));
    throw ApiError.badRequest(`Invalid permissionIds: ${missing.join(', ')}`);
  }
}

export async function createRole(input: CreateRoleParsed, actorId: number, ipAddress?: string | null) {
  const existingName = await prisma.role.findFirst({ where: { roleName: input.roleName } });
  if (existingName) {
    throw ApiError.conflict(`A role named "${input.roleName}" already exists`);
  }

  if (input.parentRoleId) {
    const parent = await prisma.role.findUnique({ where: { id: input.parentRoleId } });
    if (!parent) {
      throw ApiError.badRequest('Invalid parentRoleId — role does not exist');
    }
    if (parent.parentRoleId !== null) {
      throw ApiError.badRequest(
        'This role is already a sub-role and cannot have further sub-roles (only 2 levels are supported)',
      );
    }
  }

  await validatePermissionIds(input.permissionIds);

  const role = await prisma.role.create({
    data: {
      roleName: input.roleName,
      parentRoleId: input.parentRoleId ?? null,
      permissionIds: input.permissionIds,
      createdBy: actorId,
    },
    select: ROLE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created role "${role.roleName}"${
      input.parentRoleId ? ` (sub-role of role id ${input.parentRoleId})` : ''
    } with ${input.permissionIds.length} permission(s)`,
    ipAddress,
  });

  return role;
}

export async function updateRole(
  id: number,
  input: UpdateRoleParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await getRoleById(id);

  if (existing.roleName === SUPER_ADMIN_ROLE_NAME && input.roleName && input.roleName !== existing.roleName) {
    throw ApiError.forbidden('The Super Admin role name cannot be changed');
  }

  if (input.roleName) {
    const nameTaken = await prisma.role.findFirst({
      where: { roleName: input.roleName, id: { not: id } },
    });
    if (nameTaken) {
      throw ApiError.conflict(`A role named "${input.roleName}" already exists`);
    }
  }

  if (input.permissionIds) {
    await validatePermissionIds(input.permissionIds);
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...(input.roleName ? { roleName: input.roleName } : {}),
      ...(input.permissionIds ? { permissionIds: input.permissionIds } : {}),
    },
    select: ROLE_SELECT,
  });

  // Permissions changed -> any cached permission set for this role is stale
  invalidateRoleCache(id);

  await createLog({
    adminId: actorId,
    description: `Updated role "${existing.roleName}" (id ${id})`,
    ipAddress,
  });

  return role;
}

export async function deleteRole(id: number, actorId: number, ipAddress?: string | null) {
  const role = await getRoleById(id);

  // Guard: never allow the Super Admin role itself to be deleted — the
  // permission bypass depends on this exact role existing.
  if (role.roleName === SUPER_ADMIN_ROLE_NAME) {
    throw ApiError.forbidden('The Super Admin role cannot be deleted');
  }

  const childCount = await prisma.role.count({ where: { parentRoleId: id } });
  if (childCount > 0) {
    throw ApiError.badRequest('Cannot delete a role that has sub-roles. Delete or reassign sub-roles first.');
  }

  const adminCount = await prisma.adminUser.count({ where: { roleId: id } });
  if (adminCount > 0) {
    throw ApiError.badRequest('Cannot delete a role that is assigned to one or more admins.');
  }

  await prisma.role.delete({ where: { id } });
  invalidateRoleCache(id);

  await createLog({
    adminId: actorId,
    description: `Deleted role "${role.roleName}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Role deleted successfully' };
}