// src/modules/users/user/user.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { USER_SAFE_SELECT } from './user.types';
import type { UserListQueryParsed } from './user.validation';

export async function listUsers(query: UserListQueryParsed) {
  const { page, limit, search, status, isLocked, sortBy, sortOrder } = query;

  const where: Prisma.UserWhereInput = {
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

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [items, total, newToday] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SAFE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
    // Always counts ALL of today's signups regardless of the current
    // filters — a stat card, not a filtered result.
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    newToday,
  };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SAFE_SELECT });
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

export async function updateUserStatus(
  id: number,
  status: 'active' | 'inactive' | 'suspended',
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await getUserById(id);
  if (existing.status === status) return existing;

  const user = await prisma.user.update({ where: { id }, data: { status }, select: USER_SAFE_SELECT });

  await createLog({
    adminId: actorId,
    description: `Changed status of user "${user.name}" (id ${user.id}) from "${existing.status}" to "${status}"`,
    ipAddress,
  });

  return user;
}

export async function lockUser(id: number, actorId: number, reason: string | undefined, ipAddress?: string | null) {
  await getUserById(id);

  const user = await prisma.user.update({
    where: { id },
    data: { isLocked: true, lockedAt: new Date(), lockedReason: reason ?? 'Locked from admin panel' },
    select: USER_SAFE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Locked user "${user.name}" (id ${user.id})${reason ? ` — reason: ${reason}` : ''}`,
    ipAddress,
  });

  return user;
}

export async function unlockUser(id: number, actorId: number, ipAddress?: string | null) {
  await getUserById(id);

  const user = await prisma.user.update({
    where: { id },
    data: { isLocked: false, lockedAt: null, lockedReason: null, failedLoginAttempts: 0 },
    select: USER_SAFE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Unlocked user "${user.name}" (id ${user.id})`,
    ipAddress,
  });

  return user;
}

// Soft delete — same convention as admin.service.ts's deactivateAdmin:
// sets status to 'inactive' rather than removing the row, so leads,
// listings, reviews, etc. tied to this user stay intact.
export async function deleteUser(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await getUserById(id);

  const user = await prisma.user.update({ where: { id }, data: { status: 'inactive' }, select: USER_SAFE_SELECT });

  await createLog({
    adminId: actorId,
    description: `Deactivated user "${existing.name}" (id ${id})`,
    ipAddress,
  });

  return user;
}
