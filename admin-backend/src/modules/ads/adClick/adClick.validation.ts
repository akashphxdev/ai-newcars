// src/modules/ads/adClick/adClick.validation.ts

import { z } from 'zod';

const emptyToNull = (val: unknown) => (val === '' ? null : val);

export const adClickListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  campaignId: z.coerce.number().int().positive().optional(),
  placementId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['id', 'clickedAt']).default('clickedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const adClickIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Public, unauthenticated payload — the live site posts this whenever a
// visitor actually clicks an ad. userId/ipAddress are derived
// server-side, never client-supplied.
export const recordAdClickSchema = z.object({
  campaignId: z.coerce.number().int().positive('campaignId is required'),
  placementId: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable().optional()),
  impressionId: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable().optional()),
  pageUrl: z.preprocess(emptyToNull, z.string().trim().max(255).nullable().optional()),
  deviceType: z.preprocess(emptyToNull, z.string().trim().max(20).nullable().optional()),
  sessionId: z.preprocess(emptyToNull, z.string().trim().max(100).nullable().optional()),
  referrerUrl: z.preprocess(emptyToNull, z.string().trim().max(255).nullable().optional()),
  userAgent: z.preprocess(emptyToNull, z.string().trim().max(255).nullable().optional()),
});

export type AdClickListQueryParsed = z.infer<typeof adClickListQuerySchema>;
export type RecordAdClickParsed = z.infer<typeof recordAdClickSchema>;
