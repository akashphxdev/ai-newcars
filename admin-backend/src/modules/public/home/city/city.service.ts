// src/modules/public/home/city/city.service.ts

import { prisma } from '@/prisma/client';
import type { HomeCityListQueryParsed } from './city.validation';
import type { PublicHomeCityRecord } from './city.types';

// isTopCity is the existing admin-managed flag (Locations > Cities) that
// marks which cities should surface in curated/featured spots like this.
export async function listHomeCities(query: HomeCityListQueryParsed): Promise<PublicHomeCityRecord[]> {
  const { limit } = query;

  return prisma.city.findMany({
    where: { isTopCity: true },
    select: { id: true, name: true, slug: true, logoUrl: true },
    orderBy: { name: 'asc' },
    take: limit,
  });
}
