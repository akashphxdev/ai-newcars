// src/modules/analytics/searchLog/searchLog.validation.ts

import { z } from 'zod';

// Query-string booleans arrive as the strings "true"/"false" — plain
// z.coerce.boolean() incorrectly coerces the STRING "false" to `true`.
// Same fix as brand.validation.ts / offer.validation.ts's `booleanish`.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const searchLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against the recorded search text itself.
  search: z.string().trim().min(1).optional(),
  // Surfaces "searches that came up empty" — a content-gap signal admins
  // actually care about, not just a raw log dump.
  noResultsOnly: booleanish.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['id', 'createdAt', 'resultsCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchLogIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type SearchLogListQueryParsed = z.infer<typeof searchLogListQuerySchema>;
