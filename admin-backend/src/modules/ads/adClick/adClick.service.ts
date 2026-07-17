// src/modules/ads/adClick/adClick.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { AdClickListQueryParsed, RecordAdClickParsed } from './adClick.validation';
import type { AdClickRecord } from './adClick.types';

const AD_CLICK_SELECT = {
  id: true,
  campaignId: true,
  campaign: { select: { id: true, name: true } },
  placementId: true,
  placement: { select: { id: true, name: true } },
  impressionId: true,
  userId: true,
  user: { select: { id: true, name: true } },
  pageUrl: true,
  deviceType: true,
  ipAddress: true,
  sessionId: true,
  referrerUrl: true,
  userAgent: true,
  clickedAt: true,
} as const;

// BigInt ids aren't JSON-serializable as-is — narrow to a regular
// number for the API response (auto-increment event ids realistically
// never approach Number.MAX_SAFE_INTEGER).
function shapeClick<T extends { id: bigint; impressionId: bigint | null }>(
  row: T,
): Omit<T, 'id' | 'impressionId'> & { id: number; impressionId: number | null } {
  return { ...row, id: Number(row.id), impressionId: row.impressionId ? Number(row.impressionId) : null };
}

export async function listAdClicks(query: AdClickListQueryParsed) {
  const { page, limit, campaignId, placementId, sortBy, sortOrder } = query;

  const where: Prisma.AdClickWhereInput = {
    ...(campaignId ? { campaignId } : {}),
    ...(placementId ? { placementId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.adClick.findMany({
      where,
      select: AD_CLICK_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adClick.count({ where }),
  ]);

  return {
    items: items.map(shapeClick) as unknown as AdClickRecord[],
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

// Public — called by the live site whenever a visitor actually clicks
// an ad. userId/ipAddress come from the request itself, never trusted
// from the client body.
export async function recordAdClick(
  input: RecordAdClickParsed,
  userId: number | null,
  ipAddress: string | null,
): Promise<{ id: number }> {
  await assertCampaignExists(input.campaignId);

  const click = await prisma.adClick.create({
    data: {
      campaignId: input.campaignId,
      placementId: input.placementId ?? null,
      impressionId: input.impressionId ?? null,
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

  return { id: Number(click.id) };
}

export async function deleteAdClick(id: number, actorId: number) {
  const existing = await prisma.adClick.findUnique({ where: { id: BigInt(id) }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound('Click not found');
  }

  await prisma.adClick.delete({ where: { id: BigInt(id) } });

  await createLog({
    adminId: actorId,
    description: `Deleted ad click (id ${id})`,
  });

  return { message: 'Click deleted successfully' };
}
