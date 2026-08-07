// src/modules/analytics/pageView/pageView.validation.ts

import { z } from 'zod';

export const PAGE_VIEW_RANGES = ['today', '1m', '6m', '1y'] as const;

export const pageViewStatsQuerySchema = z.object({
  range: z.enum(PAGE_VIEW_RANGES).default('1m'),
});

export type PageViewStatsQueryParsed = z.infer<typeof pageViewStatsQuerySchema>;
