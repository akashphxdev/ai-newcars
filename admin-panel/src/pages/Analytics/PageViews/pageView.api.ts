// src/pages/Analytics/PageViews/pageView.api.ts
//
// RTK Query — read-only analytics summary (trend + top pages) for a
// selected date range. Counters are written by the public website
// hitting POST /analytics/page-views on every page load; this slice
// only reads the aggregated PageViewDailyStat table, not through this
// admin-authenticated slice.

import { api } from "../../../store/baseApi";

export type PageViewRange = "today" | "1m" | "6m" | "1y";

export interface PageViewTrendPoint {
  // "2026-08-06" for daily buckets (today/1m ranges), "2026-08" for
  // monthly buckets (6m/1y ranges).
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

interface PageViewSummaryRawResponse {
  success: true;
  data: PageViewSummary;
}

export const pageViewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPageViewSummary: builder.query<PageViewSummary, PageViewRange>({
      query: (range) => ({ url: "/analytics/page-views/summary", method: "GET", params: { range } }),
      transformResponse: (res: PageViewSummaryRawResponse) => res.data,
      providesTags: ["PageView"],
    }),
  }),
});

export const { useGetPageViewSummaryQuery } = pageViewApi;
