// src/modules/public/home/banner/banner.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import type { PublicBannerRecord, BannerClickResult } from './banner.types';

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

// Called by the website whenever a visitor clicks a banner's CTA — same
// simple increment-and-return pattern as storyItem.service.ts's
// incrementStoryItemViewCount (no separate event-log table, unlike ads'
// AdClick — Banner's click_count is a plain counter).
export async function incrementBannerClickCount(id: number): Promise<BannerClickResult> {
  const banner = await prisma.banner
    .update({
      where: { id },
      data: { clickCount: { increment: 1 } },
      select: { id: true, clickCount: true },
    })
    .catch(() => null);

  if (!banner) {
    throw ApiError.notFound('Banner not found');
  }

  return banner;
}
