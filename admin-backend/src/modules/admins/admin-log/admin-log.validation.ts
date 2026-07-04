// src/modules/admin-log/admin-log.validation.ts

import { z } from 'zod';

export const adminLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Filter by which admin performed the action
  adminId: z.coerce.number().int().positive().optional(),
  // Free-text search inside the description (e.g. "locked", "created role")
  search: z.string().trim().min(1).optional(),
  // Date range filters (inclusive)
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminLogListQueryParsed = z.infer<typeof adminLogListQuerySchema>;