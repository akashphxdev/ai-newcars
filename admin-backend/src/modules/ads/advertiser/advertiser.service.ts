// src/modules/ads/advertiser/advertiser.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  AdvertiserListQueryParsed,
  CreateAdvertiserParsed,
  UpdateAdvertiserParsed,
} from './advertiser.validation';
import type { AdvertiserListItem } from './advertiser.types';

const ADVERTISER_SELECT = {
  id: true,
  name: true,
  contactName: true,
  contactMobile: true,
  contactEmail: true,
  isActive: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  updatedAt: true,
  _count: { select: { campaigns: true } },
} as const;

function shapeAdvertiser<T extends { _count: { campaigns: number } }>(
  advertiser: T,
): Omit<T, '_count'> & { campaignCount: number } {
  const { _count, ...rest } = advertiser;
  return { ...rest, campaignCount: _count.campaigns };
}

export async function listAdvertisers(query: AdvertiserListQueryParsed) {
  const { page, limit, search, isActive, sortBy, sortOrder } = query;

  const where: Prisma.AdvertiserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
            { contactEmail: { contains: search, mode: 'insensitive' } },
            { contactMobile: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.advertiser.findMany({
      where,
      select: ADVERTISER_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.advertiser.count({ where }),
  ]);

  return {
    items: items.map(shapeAdvertiser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAdvertiserById(id: number): Promise<AdvertiserListItem> {
  const advertiser = await prisma.advertiser.findUnique({
    where: { id },
    select: ADVERTISER_SELECT,
  });

  if (!advertiser) {
    throw ApiError.notFound('Advertiser not found');
  }

  return shapeAdvertiser(advertiser);
}

export async function createAdvertiser(
  input: CreateAdvertiserParsed,
  actorId: number,
): Promise<AdvertiserListItem> {
  const advertiser = await prisma.advertiser.create({
    data: {
      name: input.name,
      contactName: input.contactName,
      contactMobile: input.contactMobile,
      contactEmail: input.contactEmail,
      isActive: input.isActive,
      createdBy: actorId,
      updatedBy: actorId,
    },
    select: ADVERTISER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created advertiser "${advertiser.name}" (id ${advertiser.id})`,
  });

  return shapeAdvertiser(advertiser);
}

export async function updateAdvertiser(
  id: number,
  input: UpdateAdvertiserParsed,
  actorId: number,
): Promise<AdvertiserListItem> {
  await getAdvertiserById(id);

  const advertiser = await prisma.advertiser.update({
    where: { id },
    data: {
      name: input.name,
      contactName: input.contactName,
      contactMobile: input.contactMobile,
      contactEmail: input.contactEmail,
      isActive: input.isActive,
      updatedBy: actorId,
    },
    select: ADVERTISER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated advertiser "${advertiser.name}" (id ${advertiser.id})`,
  });

  return shapeAdvertiser(advertiser);
}

export async function updateAdvertiserStatus(
  id: number,
  isActive: boolean,
  actorId: number,
): Promise<AdvertiserListItem> {
  const existing = await getAdvertiserById(id);

  const advertiser = await prisma.advertiser.update({
    where: { id },
    data: { isActive, updatedBy: actorId },
    select: ADVERTISER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} advertiser "${existing.name}" (id ${id})`,
  });

  return shapeAdvertiser(advertiser);
}

export async function deleteAdvertiser(id: number, actorId: number) {
  const advertiser = await getAdvertiserById(id);

  await prisma.advertiser.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description:
      advertiser.campaignCount > 0
        ? `Deleted advertiser "${advertiser.name}" (id ${id}) — ${advertiser.campaignCount} linked campaign(s) had their advertiser cleared`
        : `Deleted advertiser "${advertiser.name}" (id ${id})`,
  });

  return { message: 'Advertiser deleted successfully' };
}
