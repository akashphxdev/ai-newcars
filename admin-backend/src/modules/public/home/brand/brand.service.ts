// src/modules/public/home/brand/brand.service.ts

import { prisma } from '@/prisma/client';
import type { HomeBrandListQueryParsed } from './brand.validation';
import type { PublicHomeBrandRecord } from './brand.types';

// Brand has no "featured/display order" column yet (unlike Banner) — the
// only available ordering is alphabetical. Add a displayOrder field if
// editorial control over which brands appear first is needed later.
export async function listHomeBrands(query: HomeBrandListQueryParsed): Promise<PublicHomeBrandRecord[]> {
  const { limit } = query;

  return prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, logoUrl: true },
    orderBy: { name: 'asc' },
    take: limit,
  });
}
