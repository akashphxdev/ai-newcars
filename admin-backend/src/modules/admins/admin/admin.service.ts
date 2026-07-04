// src/modules/admin/admin.service.ts

import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { invalidateAdminStatusCache } from '@/core/middleware/auth';
import { ADMIN_SAFE_SELECT } from './admin.types';
import type {
  AdminListQueryParsed,
  CreateAdminParsed,
  UpdateAdminParsed,
} from './admin.validation';

const SALT_ROUNDS = 12;

export async function listAdmins(query: AdminListQueryParsed) {
  const { page, limit, search, roleId, status, isLocked, sortBy, sortOrder } = query;

  const where: Prisma.AdminUserWhereInput = {
    ...(roleId ? { roleId } : {}),
    ...(status ? { status } : {}),
    ...(typeof isLocked === 'boolean' ? { isLocked } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.adminUser.findMany({
      where,
      select: ADMIN_SAFE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminUser.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAdminById(id: number) {
  const admin = await prisma.adminUser.findUnique({
    where: { id },
    select: ADMIN_SAFE_SELECT,
  });

  if (!admin) {
    throw ApiError.notFound('Admin not found');
  }

  return admin;
}

export async function createAdmin(input: CreateAdminParsed, createdBy: number) {
  const existing = await prisma.adminUser.findFirst({
    where: { OR: [{ email: input.email }, { mobile: input.mobile }] },
    select: { id: true, email: true, mobile: true },
  });

  if (existing) {
    const field = existing.email === input.email ? 'email' : 'mobile';
    throw ApiError.conflict(`An admin with this ${field} already exists`);
  }

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) {
    throw ApiError.badRequest('Invalid roleId — role does not exist');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Default access window: starts now, ends 2 years from now.
  // Explicit values from the request always take priority.
  const now = new Date();
  const defaultEndDate = new Date(now);
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 2);

  const admin = await prisma.adminUser.create({
    data: {
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      passwordHash,
      roleId: input.roleId,
      status: input.status ?? 'active',
      accessStartDate: input.accessStartDate ?? now,
      accessEndDate: input.accessEndDate ?? defaultEndDate,
      createdBy,
    },
    select: ADMIN_SAFE_SELECT,
  });

  await createLog({
    adminId: createdBy,
    description: `Created new admin "${admin.name}" (id ${admin.id}, role: ${role.roleName})`,
  });

  return admin;
}

export async function updateAdmin(id: number, input: UpdateAdminParsed, actorId: number) {
  const existing = await getAdminById(id);

  if (id === actorId && input.status && input.status !== existing.status) {
    throw ApiError.badRequest('You cannot change your own account status');
  }

  if (input.email || input.mobile) {
    const conflict = await prisma.adminUser.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(input.email ? [{ email: input.email }] : []),
          ...(input.mobile ? [{ mobile: input.mobile }] : []),
        ],
      },
      select: { id: true, email: true, mobile: true },
    });
    if (conflict) {
      const field = conflict.email === input.email ? 'email' : 'mobile';
      throw ApiError.conflict(`Another admin with this ${field} already exists`);
    }
  }

  if (input.roleId) {
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) {
      throw ApiError.badRequest('Invalid roleId — role does not exist');
    }
  }

  const admin = await prisma.adminUser.update({
    where: { id },
    data: { ...input },
    select: ADMIN_SAFE_SELECT,
  });

  // Status/lock/role all affect what this admin's existing token is
  // allowed to do (see requireAuth's live status + roleId check) — drop
  // the cached snapshot so the change is picked up on their very next
  // request instead of waiting out the cache's TTL.
  if (input.status || input.roleId) {
    invalidateAdminStatusCache(id);
  }

  await createLog({
    adminId: actorId,
    description: `Updated admin "${admin.name}" (id ${admin.id}) — fields: ${Object.keys(input).join(', ')}`,
  });

  return admin;
}

// ADDED: lightweight, atomic status change — used by the quick
// active/inactive/suspended toggle on the admin listing row, separate
// from the full edit form. Same self-protection rule as updateAdmin:
// an admin can never change their own status (avoids accidental
// self-lockout), and the target account itself must exist.
export async function updateAdminStatus(
  id: number,
  status: 'active' | 'inactive' | 'suspended',
  actorId: number,
  ipAddress?: string | null,
) {
  if (id === actorId) {
    throw ApiError.badRequest('You cannot change your own account status');
  }

  const existing = await getAdminById(id);

  if (existing.status === status) {
    return existing;
  }

  const admin = await prisma.adminUser.update({
    where: { id },
    data: { status },
    select: ADMIN_SAFE_SELECT,
  });

  invalidateAdminStatusCache(id);

  await createLog({
    adminId: actorId,
    description: `Changed status of admin "${admin.name}" (id ${admin.id}) from "${existing.status}" to "${status}"`,
    ipAddress: ipAddress ?? undefined,
  });

  return admin;
}

export async function changeAdminPassword(id: number, newPassword: string, actorId: number) {
  const target = await getAdminById(id);
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.adminUser.update({
    where: { id },
    data: { passwordHash, failedLoginAttempts: 0 },
  });

  await createLog({
    adminId: actorId,
    description: `Changed password for admin "${target.name}" (id ${id})`,
  });

  return { message: 'Password updated successfully' };
}

export async function lockAdmin(id: number, lockedBy: number, reason?: string) {
  if (id === lockedBy) {
    throw ApiError.badRequest('You cannot lock your own account');
  }

  await getAdminById(id);

  const admin = await prisma.adminUser.update({
    where: { id },
    data: {
      isLocked: true,
      lockType: 'manual',
      lockedBy,
      lockedAt: new Date(),
      lockedReason: reason,
    },
    select: ADMIN_SAFE_SELECT,
  });

  invalidateAdminStatusCache(id);

  await createLog({
    adminId: lockedBy,
    description: `Locked admin "${admin.name}" (id ${admin.id})${reason ? ` — reason: ${reason}` : ''}`,
  });

  return admin;
}

export async function unlockAdmin(id: number, unlockedBy: number) {
  await getAdminById(id);

  const admin = await prisma.adminUser.update({
    where: { id },
    data: {
      isLocked: false,
      lockType: null,
      lockedBy: null,
      lockedAt: null,
      lockedReason: null,
      unlockedBy,
      unlockedAt: new Date(),
      failedLoginAttempts: 0,
    },
    select: ADMIN_SAFE_SELECT,
  });

  invalidateAdminStatusCache(id);

  await createLog({
    adminId: unlockedBy,
    description: `Unlocked admin "${admin.name}" (id ${admin.id})`,
  });

  return admin;
}

export async function deactivateAdmin(id: number, requestedBy: number) {
  if (id === requestedBy) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  await getAdminById(id);

  const admin = await prisma.adminUser.update({
    where: { id },
    data: { status: 'inactive' },
    select: ADMIN_SAFE_SELECT,
  });

  invalidateAdminStatusCache(id);

  await createLog({
    adminId: requestedBy,
    description: `Deactivated admin "${admin.name}" (id ${admin.id})`,
  });

  return admin;
}