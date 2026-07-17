// src/modules/ai/log/aiLog.service.ts
//
// Read-only — the only writer is createAiLog.ts, called from the
// generator jobs themselves (e.g. aiFaq.service.ts). This module just
// exposes that history to the admin panel.

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import type { AiLogListQueryParsed } from './aiLog.validation';
import type { AiLogRecord } from './aiLog.types';

const AI_LOG_SELECT = {
  id: true,
  featureKey: true,
  action: true,
  status: true,
  message: true,
  meta: true,
  durationMs: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
} as const;

// BigInt id isn't JSON-serializable as-is — narrow to a regular number
// for the API response (same convention as adClick.service.ts's
// shapeClick — log-row ids realistically never approach
// Number.MAX_SAFE_INTEGER).
function shapeLog<T extends { id: bigint; meta: Prisma.JsonValue | null }>(
  row: T,
): Omit<T, 'id' | 'meta'> & { id: number; meta: Record<string, unknown> | null } {
  return {
    ...row,
    id: Number(row.id),
    meta: (row.meta as Record<string, unknown> | null) ?? null,
  };
}

export async function listAiLogs(query: AiLogListQueryParsed) {
  const { page, limit, featureKey, status, search, fromDate, toDate, sortOrder } = query;

  const where: Prisma.AiLogWhereInput = {
    ...(featureKey ? { featureKey } : {}),
    ...(status ? { status } : {}),
    ...(search ? { message: { contains: search, mode: 'insensitive' } } : {}),
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
    prisma.aiLog.findMany({
      where,
      select: AI_LOG_SELECT,
      orderBy: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aiLog.count({ where }),
  ]);

  return {
    items: items.map(shapeLog) as unknown as AiLogRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}