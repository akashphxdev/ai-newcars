// src/modules/public/home/bodyType/bodyType.service.ts

import { prisma } from '@/prisma/client';
import type { HomeBodyTypeListQueryParsed } from './bodyType.validation';
import type { PublicHomeBodyTypeRecord } from './bodyType.types';

// BodyType has no isActive/displayOrder column (small fixed lookup
// table) — every row is shown, alphabetical is the only ordering.
export async function listHomeBodyTypes(query: HomeBodyTypeListQueryParsed): Promise<PublicHomeBodyTypeRecord[]> {
  const { limit } = query;

  return prisma.bodyType.findMany({
    select: { id: true, name: true, slug: true, iconUrl: true },
    orderBy: { name: 'asc' },
    take: limit,
  });
}
