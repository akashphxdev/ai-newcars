// src/modules/public/search/search.service.ts

import { prisma } from '@/prisma/client';
import type { SearchCarsQueryParsed } from './search.validation';
import type { SearchCarsResult } from './search.types';

const SEARCH_SELECT = {
  id: true,
  name: true,
  slug: true,
  coverImageUrl: true,
  priceMin: true,
  brand: { select: { name: true, slug: true } },
} as const;

export interface SearchMeta {
  userId: number | null;
  ipAddress: string | null;
  userAgent: string | null;
}

// Header search bar — matches on model name OR brand name, whichever the
// user is typing. Not a full-text/fuzzy engine (no pg_trgm index on
// CarModel.name yet) — fine at the current catalog size, but flag for a
// trigram index if the car count grows much larger and this gets slow.
export async function searchCars(query: SearchCarsQueryParsed, meta: SearchMeta): Promise<SearchCarsResult> {
  const { q, limit } = query;

  const cars = await prisma.carModel.findMany({
    where: {
      OR: [{ name: { contains: q, mode: 'insensitive' } }, { brand: { name: { contains: q, mode: 'insensitive' } } }],
      // "Available" models without a variant yet aren't publicly viewable
      // (see cars/car/car.service.ts) — don't surface them here either,
      // since their detail page would 404. "Upcoming" models are exempt.
      NOT: { launchStatus: 'available', variants: { none: {} } },
    },
    select: SEARCH_SELECT,
    orderBy: [{ ratingAvg: 'desc' }, { name: 'asc' }],
    take: limit,
  });

  const results = cars.map((c) => ({ ...c, priceMin: c.priceMin?.toString() ?? null }));

  // Best-effort — a logging failure must never break the search response
  // the user is actively waiting on.
  try {
    await prisma.searchLog.create({
      data: {
        userId: meta.userId,
        searchQuery: q,
        resultsCount: results.length,
        pageUrl: query.pageUrl ?? null,
        deviceType: query.deviceType ?? null,
        ipAddress: meta.ipAddress,
        sessionId: query.sessionId ?? null,
        userAgent: meta.userAgent,
      },
    });
  } catch {
    // swallow — logging is secondary to serving results
  }

  return { query: q, results };
}
