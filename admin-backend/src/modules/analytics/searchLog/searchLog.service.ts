// src/modules/analytics/searchLog/searchLog.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { SearchLogListQueryParsed } from './searchLog.validation';
import type { SearchLogRecord } from './searchLog.types';

const SEARCH_LOG_SELECT = {
  id: true,
  userId: true,
  user: { select: { id: true, name: true } },
  searchQuery: true,
  resultsCount: true,
  pageUrl: true,
  deviceType: true,
  ipAddress: true,
  sessionId: true,
  userAgent: true,
  createdAt: true,
} as const;

// BigInt ids aren't JSON-serializable as-is — narrow to a regular number
// for the API response, same fix as adClick.service.ts's shapeClick.
function shapeLog<T extends { id: bigint }>(row: T): Omit<T, 'id'> & { id: number } {
  return { ...row, id: Number(row.id) };
}

export async function listSearchLogs(query: SearchLogListQueryParsed) {
  const { page, limit, search, noResultsOnly, dateFrom, dateTo, sortBy, sortOrder } = query;

  const where: Prisma.SearchLogWhereInput = {
    ...(search ? { searchQuery: { contains: search, mode: 'insensitive' } } : {}),
    ...(noResultsOnly ? { resultsCount: 0 } : {}),
    ...(dateFrom || dateTo
      ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.searchLog.findMany({
      where,
      select: SEARCH_LOG_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.searchLog.count({ where }),
  ]);

  return {
    items: items.map(shapeLog) as unknown as SearchLogRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function deleteSearchLog(id: number, actorId: number) {
  const existing = await prisma.searchLog.findUnique({ where: { id: BigInt(id) }, select: { id: true, searchQuery: true } });
  if (!existing) {
    throw ApiError.notFound('Search log not found');
  }

  await prisma.searchLog.delete({ where: { id: BigInt(id) } });

  await createLog({
    adminId: actorId,
    description: `Deleted search log (id ${id}) for query "${existing.searchQuery ?? ''}"`,
  });

  return { message: 'Search log deleted successfully' };
}
