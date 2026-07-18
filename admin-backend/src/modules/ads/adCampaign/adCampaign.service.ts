// src/modules/ads/adCampaign/adCampaign.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  AdCampaignListQueryParsed,
  CreateAdCampaignParsed,
  UpdateAdCampaignParsed,
  CampaignStatus,
} from './adCampaign.validation';
import type { AdCampaignRecord } from './adCampaign.types';

const AD_CAMPAIGN_SELECT = {
  id: true,
  placementId: true,
  placement: { select: { id: true, name: true, slug: true } },
  advertiserId: true,
  advertiser: { select: { id: true, name: true } },
  name: true,
  creativeImageUrl: true,
  targetUrl: true,
  priority: true,
  startDate: true,
  endDate: true,
  status: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  updatedAt: true,
} as const;

async function assertPlacementExists(placementId: number) {
  const placement = await prisma.adPlacement.findUnique({ where: { id: placementId }, select: { id: true } });
  if (!placement) {
    throw ApiError.badRequest('Selected placement does not exist');
  }
}

async function assertAdvertiserExists(advertiserId: number) {
  const advertiser = await prisma.advertiser.findUnique({ where: { id: advertiserId }, select: { id: true } });
  if (!advertiser) {
    throw ApiError.badRequest('Selected advertiser does not exist');
  }
}

// Two campaigns on the same placement with the same priority have no
// defined tie-breaker for which shows first — same reasoning as
// StoryItem's displayOrder being unique per group. There's no DB-level
// unique constraint for this (placementId, priority) pair, so it's
// enforced here instead.
async function assertPriorityAvailable(placementId: number, priority: number, excludeId?: number) {
  const conflict = await prisma.adCampaign.findFirst({
    where: { placementId, priority, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true, name: true },
  });
  if (conflict) {
    throw ApiError.conflict(
      `Priority ${priority} is already used by campaign "${conflict.name}" on this placement — pick a different priority.`,
    );
  }
}

export async function listAdCampaigns(query: AdCampaignListQueryParsed) {
  const { page, limit, search, placementId, advertiserId, status, sortBy, sortOrder } = query;

  const where: Prisma.AdCampaignWhereInput = {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(placementId ? { placementId } : {}),
    ...(advertiserId ? { advertiserId } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.adCampaign.findMany({
      where,
      select: AD_CAMPAIGN_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adCampaign.count({ where }),
  ]);

  return {
    items: items as unknown as AdCampaignRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAdCampaignById(id: number): Promise<AdCampaignRecord> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id },
    select: AD_CAMPAIGN_SELECT,
  });

  if (!campaign) {
    throw ApiError.notFound('Ad campaign not found');
  }

  return campaign as unknown as AdCampaignRecord;
}

export async function createAdCampaign(
  input: CreateAdCampaignParsed,
  actorId: number,
  creativeImageFilename?: string,
  ipAddress?: string | null,
): Promise<AdCampaignRecord> {
  await assertPlacementExists(input.placementId);
  if (input.advertiserId) {
    await assertAdvertiserExists(input.advertiserId);
  }
  await assertPriorityAvailable(input.placementId, input.priority);

  if (!creativeImageFilename) {
    throw ApiError.badRequest('A creative image is required (expected field name "creativeImage")');
  }

  const campaign = await prisma.adCampaign.create({
    data: {
      placementId: input.placementId,
      advertiserId: input.advertiserId ?? null,
      name: input.name,
      creativeImageUrl: buildPublicPath('ad-campaigns', creativeImageFilename),
      targetUrl: input.targetUrl,
      priority: input.priority,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      status: input.status,
      createdBy: actorId,
      updatedBy: actorId,
    },
    select: AD_CAMPAIGN_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created ad campaign "${campaign.name}" (id ${campaign.id})`,
    ipAddress,
  });

  return campaign as unknown as AdCampaignRecord;
}

export async function updateAdCampaign(
  id: number,
  input: UpdateAdCampaignParsed,
  actorId: number,
  creativeImageFilename?: string,
  ipAddress?: string | null,
): Promise<AdCampaignRecord> {
  const existing = await getAdCampaignById(id);

  await assertPlacementExists(input.placementId);
  if (input.advertiserId) {
    await assertAdvertiserExists(input.advertiserId);
  }
  if (input.placementId !== existing.placementId || input.priority !== existing.priority) {
    await assertPriorityAvailable(input.placementId, input.priority, id);
  }

  const newCreativeImageUrl = creativeImageFilename
    ? buildPublicPath('ad-campaigns', creativeImageFilename)
    : undefined;

  const campaign = await prisma.adCampaign.update({
    where: { id },
    data: {
      placementId: input.placementId,
      advertiserId: input.advertiserId ?? null,
      name: input.name,
      targetUrl: input.targetUrl,
      priority: input.priority,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      status: input.status,
      updatedBy: actorId,
      // Same operation as the rest of the fields — a failed image
      // upload can no longer leave the campaign's other edits saved
      // while reporting the whole request as failed.
      ...(newCreativeImageUrl ? { creativeImageUrl: newCreativeImageUrl } : {}),
    },
    select: AD_CAMPAIGN_SELECT,
  });

  // Old creative file is orphaned only once the update above has
  // committed successfully with the new one.
  if (newCreativeImageUrl && existing.creativeImageUrl) {
    await deleteUploadedFile(existing.creativeImageUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Updated ad campaign "${campaign.name}" (id ${campaign.id})`,
    ipAddress,
  });

  return campaign as unknown as AdCampaignRecord;
}

export async function updateAdCampaignStatus(
  id: number,
  status: CampaignStatus,
  actorId: number,
  ipAddress?: string | null,
): Promise<AdCampaignRecord> {
  const existing = await getAdCampaignById(id);

  const campaign = await prisma.adCampaign.update({
    where: { id },
    data: { status, updatedBy: actorId },
    select: AD_CAMPAIGN_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Set ad campaign "${existing.name}" (id ${id}) status to "${status}"`,
    ipAddress,
  });

  return campaign as unknown as AdCampaignRecord;
}

export async function deleteAdCampaign(id: number, actorId: number, ipAddress?: string | null) {
  const campaign = await getAdCampaignById(id);

  // ad_impressions/ad_clicks FKs are ON DELETE RESTRICT (see
  // migration.sql) — block the delete instead of letting the DB reject
  // it with a raw constraint error.
  const [impressionCount, clickCount] = await Promise.all([
    prisma.adImpression.count({ where: { campaignId: id } }),
    prisma.adClick.count({ where: { campaignId: id } }),
  ]);
  if (impressionCount > 0 || clickCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this campaign — it already has ${impressionCount} impression(s) and ${clickCount} click(s) logged against it.`,
    );
  }

  await prisma.adCampaign.delete({ where: { id } });

  await deleteUploadedFile(campaign.creativeImageUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted ad campaign "${campaign.name}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Ad campaign deleted successfully' };
}
