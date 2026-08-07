// src/modules/public/analytics/pageView/pageView.public.service.ts

import { prisma } from '@/prisma/client';
import { startOfToday } from '@/core/utils/dateRanges';
import type { RecordPageViewParsed } from './pageView.public.validation';

// Best-effort — a logging failure must never break page rendering for
// the visitor. One row per (page, day) — every visit increments that
// day's counter instead of inserting a new row, so the table stays
// bounded by distinct-pages × days rather than growing with raw traffic.
// The "day" boundary is the server's LOCAL calendar day (startOfToday),
// matching how the admin dashboard reads these rows back (see
// dashboard.service.ts / pageView.service.ts's toLocalDateKey usage) —
// using UTC here instead would silently roll "today" back to yesterday
// for any server timezone ahead of UTC (e.g. IST).
export async function recordPageView(input: RecordPageViewParsed): Promise<void> {
  if (!input.pageUrl) return;

  const today = startOfToday();

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
