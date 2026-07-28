// src/modules/public/search/search.validation.ts

import { z } from 'zod';

// Free-form strings, not enums — same convention as adImpression.validation.ts's
// deviceType (labels/values decided by whatever the frontend actually sends).
export const searchCarsQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(100),
  limit: z.coerce.number().int().min(1).max(20).default(8),
  pageUrl: z.string().trim().max(255).optional(),
  deviceType: z.string().trim().max(20).optional(),
  sessionId: z.string().trim().max(100).optional(),
});

export type SearchCarsQueryParsed = z.infer<typeof searchCarsQuerySchema>;
