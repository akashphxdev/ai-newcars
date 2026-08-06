// src/modules/public/wishlist/wishlist.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import type { WishlistItemRecord } from './wishlist.types';

const WISHLIST_SELECT = {
  id: true,
  modelId: true,
  createdAt: true,
  model: {
    select: {
      id: true,
      name: true,
      slug: true,
      launchStatus: true,
      priceMin: true,
      priceMax: true,
      coverImageUrl: true,
      brand: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

type RawWishlistItem = Prisma.WishlistGetPayload<{ select: typeof WISHLIST_SELECT }>;

function shapeWishlistItem(row: RawWishlistItem): WishlistItemRecord {
  return {
    id: row.id,
    modelId: row.modelId,
    createdAt: row.createdAt,
    model: {
      ...row.model,
      priceMin: row.model.priceMin?.toString() ?? null,
      priceMax: row.model.priceMax?.toString() ?? null,
    },
  };
}

export async function listMyWishlist(userId: number): Promise<WishlistItemRecord[]> {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    select: WISHLIST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
  return items.map(shapeWishlistItem);
}

// Idempotent — clicking an already-wishlisted heart again (e.g. a second
// tab, a race on double-click) confirms the existing row instead of
// throwing a 409, backed by the same @@unique([userId, modelId]) the DB
// enforces.
export async function addToWishlist(userId: number, modelId: number): Promise<{ id: number; modelId: number; duplicate: boolean }> {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }

  const existing = await prisma.wishlist.findUnique({ where: { userId_modelId: { userId, modelId } }, select: { id: true } });
  if (existing) {
    return { id: existing.id, modelId, duplicate: true };
  }

  const created = await prisma.wishlist.create({ data: { userId, modelId }, select: { id: true } });
  return { id: created.id, modelId, duplicate: false };
}

export async function removeFromWishlist(userId: number, modelId: number): Promise<void> {
  await prisma.wishlist.deleteMany({ where: { userId, modelId } });
}
