// src/modules/analytics/pageView/pageView.types.ts

export interface PageViewTrendPoint {
  // "2026-08-06" for daily buckets (today/1m ranges), "2026-08" for
  // monthly buckets (6m/1y ranges) — see pageView.service.ts's bucketKey.
  label: string;
  count: number;
}

export interface PageViewTopPage {
  pageUrl: string;
  count: number;
}

export interface PageViewSummary {
  trend: PageViewTrendPoint[];
  topPages: PageViewTopPage[];
}
