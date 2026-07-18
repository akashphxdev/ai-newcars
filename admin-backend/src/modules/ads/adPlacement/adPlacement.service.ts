// src/modules/ads/adPlacement/adPlacement.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  AdPlacementListQueryParsed,
  CreateAdPlacementParsed,
  UpdateAdPlacementParsed,
} from './adPlacement.validation';
import type { AdPlacementRecord } from './adPlacement.types';

const AD_PLACEMENT_SELECT = {
  id: true,
  name: true,
  slug: true,
  pageType: true,
  adType: true,
  dimensions: true,
  isActive: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  updatedAt: true,
  _count: { select: { campaigns: true } },
} as const;

function shapePlacement<T extends { _count: { campaigns: number } }>(
  placement: T,
): Omit<T, '_count'> & { campaignCount: number } {
  const { _count, ...rest } = placement;
  return { ...rest, campaignCount: _count.campaigns };
}

async function assertSlugAvailable(slug: string, excludeId?: number) {
  const conflict = await prisma.adPlacement.findFirst({
    where: { slug, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`An ad placement with the slug "${slug}" already exists`);
  }
}

export async function listAdPlacements(query: AdPlacementListQueryParsed) {
  const { page, limit, search, pageType, adType, isActive, sortBy, sortOrder } = query;

  const where: Prisma.AdPlacementWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(pageType !== undefined ? { pageType } : {}),
    ...(adType !== undefined ? { adType } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.adPlacement.findMany({
      where,
      select: AD_PLACEMENT_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adPlacement.count({ where }),
  ]);

  return {
    items: items.map(shapePlacement),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAdPlacementById(id: number): Promise<AdPlacementRecord> {
  const placement = await prisma.adPlacement.findUnique({
    where: { id },
    select: AD_PLACEMENT_SELECT,
  });

  if (!placement) {
    throw ApiError.notFound('Ad placement not found');
  }

  return shapePlacement(placement);
}

export async function createAdPlacement(
  input: CreateAdPlacementParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<AdPlacementRecord> {
  await assertSlugAvailable(input.slug);

  const placement = await prisma.adPlacement.create({
    data: {
      name: input.name,
      slug: input.slug,
      pageType: input.pageType,
      adType: input.adType,
      dimensions: input.dimensions,
      isActive: input.isActive,
      createdBy: actorId,
      updatedBy: actorId,
    },
    select: AD_PLACEMENT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created ad placement "${placement.name}" (id ${placement.id}, slug "${placement.slug}")`,
    ipAddress,
  });

  return shapePlacement(placement);
}

export async function updateAdPlacement(
  id: number,
  input: UpdateAdPlacementParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<AdPlacementRecord> {
  const existing = await getAdPlacementById(id);

  if (input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  const placement = await prisma.adPlacement.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      pageType: input.pageType,
      adType: input.adType,
      dimensions: input.dimensions,
      isActive: input.isActive,
      updatedBy: actorId,
    },
    select: AD_PLACEMENT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated ad placement "${placement.name}" (id ${placement.id})`,
    ipAddress,
  });

  return shapePlacement(placement);
}

export async function updateAdPlacementStatus(
  id: number,
  isActive: boolean,
  actorId: number,
  ipAddress?: string | null,
): Promise<AdPlacementRecord> {
  const existing = await getAdPlacementById(id);

  const placement = await prisma.adPlacement.update({
    where: { id },
    data: { isActive, updatedBy: actorId },
    select: AD_PLACEMENT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} ad placement "${existing.name}" (id ${id})`,
    ipAddress,
  });

  return shapePlacement(placement);
}

export async function deleteAdPlacement(id: number, actorId: number, ipAddress?: string | null) {
  const placement = await getAdPlacementById(id);

  const campaignCount = await prisma.adCampaign.count({ where: { placementId: id } });
  if (campaignCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this placement — ${campaignCount} campaign(s) are linked to it. Delete or reassign them first.`,
    );
  }

  await prisma.adPlacement.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted ad placement "${placement.name}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Ad placement deleted successfully' };
}
