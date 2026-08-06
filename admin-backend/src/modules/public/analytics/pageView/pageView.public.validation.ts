// src/modules/public/analytics/pageView/pageView.public.validation.ts

import { z } from 'zod';

export const recordPageViewSchema = z.object({
  pageUrl: z.string().trim().max(255).optional(),
});

export type RecordPageViewParsed = z.infer<typeof recordPageViewSchema>;
