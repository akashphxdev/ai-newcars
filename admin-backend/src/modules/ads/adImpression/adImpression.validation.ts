// src/modules/ads/adImpression/adImpression.validation.ts

import { z } from 'zod';

const emptyToNull = (val: unknown) => (val === '' ? null : val);

export const adImpressionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  campaignId: z.coerce.number().int().positive().optional(),
  placementId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['id', 'viewedAt']).default('viewedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const adImpressionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Public, unauthenticated payload — the live site posts this whenever a
// visitor actually sees an ad render. userId/ipAddress are derived
// server-side (session / req.ip), never client-supplied.
export const recordAdImpressionSchema = z.object({
  campaignId: z.coerce.number().int().positive('campaignId is required'),
  placementId: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable().optional()),
  pageUrl: z.preprocess(emptyToNull, z.string().trim().max(255).nullable().optional()),
  deviceType: z.preprocess(emptyToNull, z.string().trim().max(20).nullable().optional()),
  sessionId: z.preprocess(emptyToNull, z.string().trim().max(100).nullable().optional()),
  referrerUrl: z.preprocess(emptyToNull, z.string().trim().max(255).nullable().optional()),
  userAgent: z.preprocess(emptyToNull, z.string().trim().max(255).nullable().optional()),
});

export type AdImpressionListQueryParsed = z.infer<typeof adImpressionListQuerySchema>;
export type RecordAdImpressionParsed = z.infer<typeof recordAdImpressionSchema>;
