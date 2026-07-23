// src/modules/public/home/banner/banner.service.ts

import { prisma } from '@/prisma/client';
import type { PublicBannerRecord } from './banner.types';

const PUBLIC_BANNER_SELECT = {
  id: true,
  tagLabel: true,
  heading: true,
  highlightText: true,
  description: true,
  mediaType: true,
  imageUrl: true,
  videoUrl: true,
  ctaText: true,
  ctaLink: true,
  displayOrder: true,
} as const;

// Active banners only, in display order — no query params, no
// pagination, this is a small always-active-content list. Backed by
// the existing @@index([isActive, displayOrder]) on Banner.
export async function listActiveBanners(): Promise<PublicBannerRecord[]> {
  return prisma.banner.findMany({
    where: { isActive: true },
    select: PUBLIC_BANNER_SELECT,
    orderBy: { displayOrder: 'asc' },
  });
}
