// src/modules/ads/adImpression/adImpression.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { AdImpressionListQueryParsed, RecordAdImpressionParsed } from './adImpression.validation';
import type { AdImpressionRecord } from './adImpression.types';

const AD_IMPRESSION_SELECT = {
  id: true,
  campaignId: true,
  campaign: { select: { id: true, name: true } },
  placementId: true,
  placement: { select: { id: true, name: true } },
  userId: true,
  user: { select: { id: true, name: true } },
  pageUrl: true,
  deviceType: true,
  ipAddress: true,
  sessionId: true,
  referrerUrl: true,
  userAgent: true,
  viewedAt: true,
} as const;

// BigInt ids aren't JSON-serializable as-is — narrow to a regular
// number for the API response (auto-increment event ids realistically
// never approach Number.MAX_SAFE_INTEGER).
function shapeImpression<T extends { id: bigint }>(row: T): Omit<T, 'id'> & { id: number } {
  return { ...row, id: Number(row.id) };
}

export async function listAdImpressions(query: AdImpressionListQueryParsed) {
  const { page, limit, campaignId, placementId, sortBy, sortOrder } = query;

  const where: Prisma.AdImpressionWhereInput = {
    ...(campaignId ? { campaignId } : {}),
    ...(placementId ? { placementId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.adImpression.findMany({
      where,
      select: AD_IMPRESSION_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adImpression.count({ where }),
  ]);

  return {
    items: items.map(shapeImpression) as unknown as AdImpressionRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function assertCampaignExists(campaignId: number) {
  const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId }, select: { id: true } });
  if (!campaign) {
    throw ApiError.badRequest('Invalid campaignId — campaign does not exist');
  }
}

// Public — called by the live site whenever a visitor actually sees an
// ad render. userId/ipAddress come from the request itself (session,
// req.ip), never trusted from the client body.
export async function recordAdImpression(
  input: RecordAdImpressionParsed,
  userId: number | null,
  ipAddress: string | null,
): Promise<{ id: number }> {
  await assertCampaignExists(input.campaignId);

  const impression = await prisma.adImpression.create({
    data: {
      campaignId: input.campaignId,
      placementId: input.placementId ?? null,
      userId: userId ?? null,
      pageUrl: input.pageUrl ?? null,
      deviceType: input.deviceType ?? null,
      ipAddress: ipAddress ?? null,
      sessionId: input.sessionId ?? null,
      referrerUrl: input.referrerUrl ?? null,
      userAgent: input.userAgent ?? null,
    },
    select: { id: true },
  });

  return { id: Number(impression.id) };
}

export async function deleteAdImpression(id: number, actorId: number) {
  const existing = await prisma.adImpression.findUnique({ where: { id: BigInt(id) }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound('Impression not found');
  }

  await prisma.adImpression.delete({ where: { id: BigInt(id) } });

  await createLog({
    adminId: actorId,
    description: `Deleted ad impression (id ${id})`,
  });

  return { message: 'Impression deleted successfully' };
}
