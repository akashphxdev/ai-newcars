// src/modules/admin-log/admin-log.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import type { AdminLogListQueryParsed } from './admin-log.validation';

export async function listAdminLogs(query: AdminLogListQueryParsed) {
  const { page, limit, adminId, search, fromDate, toDate, sortOrder } = query;

  const where: Prisma.AdminLogWhereInput = {
    ...(adminId ? { adminId } : {}),
    ...(search ? { description: { contains: search, mode: 'insensitive' } } : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminLog.count({ where }),
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

// Quick activity feed for a single admin — handy for an admin's profile/detail page.
export async function listLogsForAdmin(adminId: number, limit = 20) {
  return prisma.adminLog.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}