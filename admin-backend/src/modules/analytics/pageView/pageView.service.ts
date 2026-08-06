// src/modules/analytics/pageView/pageView.service.ts

import { prisma } from '@/prisma/client';
import { startOfToday, toLocalDateKey } from '@/core/utils/dateRanges';
import type { PageViewStatsQueryParsed } from './pageView.validation';
import type { PageViewSummary, PageViewTrendPoint, PageViewTopPage } from './pageView.types';

const TOP_PAGES_LIMIT = 10;

// LOCAL calendar day throughout (not UTC) — matches how
// pageView.public.service.ts writes viewDate (startOfToday), so "today"
// always lands in the last bucket instead of rolling back a day for
// server timezones ahead of UTC (e.g. IST).
function rangeStartDate(range: PageViewStatsQueryParsed['range']): Date {
  const start = startOfToday();

  switch (range) {
    case 'today':
      return start;
    case '1m':
      start.setDate(start.getDate() - 29);
      return start;
    case '6m':
      start.setMonth(start.getMonth() - 6);
      return start;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      return start;
  }
}

// Daily buckets for "today"/"1m" (short enough ranges that a per-day bar
// is still readable); monthly buckets for "6m"/"1y" — 180+ daily bars
// would be unreadable on a small dashboard chart.
function bucketKey(date: Date, range: PageViewStatsQueryParsed['range']): string {
  if (range === '6m' || range === '1y') return toLocalDateKey(date).slice(0, 7);
  return toLocalDateKey(date);
}

// The underlying table is bounded by distinct-pages × days, not raw
// traffic volume (see pageView.public.service.ts's upsert-per-day
// write), so pulling every row in-range and bucketing here in JS stays
// cheap even at a year's range — no raw SQL date-truncation needed.
export async function getPageViewSummary(query: PageViewStatsQueryParsed): Promise<PageViewSummary> {
  const { range } = query;
  const startDate = rangeStartDate(range);

  const rows = await prisma.pageViewDailyStat.findMany({
    where: { viewDate: { gte: startDate } },
    select: { pageUrl: true, viewDate: true, viewCount: true },
  });

  const trendMap = new Map<string, number>();
  const topPagesMap = new Map<string, number>();

  for (const row of rows) {
    const key = bucketKey(row.viewDate, range);
    trendMap.set(key, (trendMap.get(key) ?? 0) + row.viewCount);
    topPagesMap.set(row.pageUrl, (topPagesMap.get(row.pageUrl) ?? 0) + row.viewCount);
  }

  const trend: PageViewTrendPoint[] = Array.from(trendMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const topPages: PageViewTopPage[] = Array.from(topPagesMap.entries())
    .map(([pageUrl, count]) => ({ pageUrl, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_PAGES_LIMIT);

  return { trend, topPages };
}
