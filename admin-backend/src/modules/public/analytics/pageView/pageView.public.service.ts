// src/modules/public/analytics/pageView/pageView.public.service.ts

import { prisma } from '@/prisma/client';
import type { RecordPageViewParsed } from './pageView.public.validation';

// Best-effort — a logging failure must never break page rendering for
// the visitor. One row per (page, day) — every visit increments that
// day's counter instead of inserting a new row, so the table stays
// bounded by distinct-pages × days rather than growing with raw traffic.
export async function recordPageView(input: RecordPageViewParsed): Promise<void> {
  if (!input.pageUrl) return;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    await prisma.pageViewDailyStat.upsert({
      where: { pageUrl_viewDate: { pageUrl: input.pageUrl, viewDate: today } },
      create: { pageUrl: input.pageUrl, viewDate: today, viewCount: 1 },
      update: { viewCount: { increment: 1 } },
    });
  } catch {
    // swallow — logging is secondary to serving the page
  }
}
