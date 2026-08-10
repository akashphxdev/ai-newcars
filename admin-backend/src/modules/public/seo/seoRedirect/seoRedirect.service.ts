// src/modules/public/seo/seoRedirect/seoRedirect.service.ts

import { prisma } from '@/prisma/client';
import type { PublicSeoRedirectRecord } from './seoRedirect.types';

// Full active list, not a per-path lookup — proxy.ts runs on every
// request and can't afford a DB round-trip each time; it fetches this
// once (cached via publicCache) and matches the request path in memory,
// same shape as site-setting's maintenance-mode check.
export async function listActiveRedirects(): Promise<PublicSeoRedirectRecord[]> {
  return prisma.seoRedirect.findMany({
    where: { isActive: true },
    select: { oldPath: true, newPath: true, redirectType: true },
    orderBy: { createdAt: 'desc' },
  });
}
