// src/modules/ai/log/aiLog.validation.ts

import { z } from 'zod';

export const aiLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // See AI_FEATURE_CODES in ../ai.constants.ts.
  featureKey: z.coerce.number().int().optional(),
  // 1 = success, 2 = failed — see AI_LOG_STATUS in aiFaq.service.ts
  // (the only writer today).
  status: z.coerce.number().int().optional(),
  // Free-text search inside the message.
  search: z.string().trim().min(1).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AiLogListQueryParsed = z.infer<typeof aiLogListQuerySchema>;
