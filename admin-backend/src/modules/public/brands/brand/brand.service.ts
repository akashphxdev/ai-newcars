// src/modules/public/brands/brand/brand.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import type { BrandListQueryParsed } from './brand.validation';
import type { PublicHomeBrandRecord } from '@/modules/public/home/brand/brand.types';

// "View all brands" page — every active brand in one shot. Brand counts
// are naturally small and bounded (unlike articles/cars), so a plain
// unpaginated list with an optional name search is enough; no need for
// page/limit like the admin listing.
export async function listAllBrands(query: BrandListQueryParsed): Promise<PublicHomeBrandRecord[]> {
  const { search } = query;

  const where: Prisma.BrandWhereInput = {
    isActive: true,
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };

  return prisma.brand.findMany({
    where,
    select: { id: true, name: true, slug: true, logoUrl: true },
    orderBy: { name: 'asc' },
  });
}
