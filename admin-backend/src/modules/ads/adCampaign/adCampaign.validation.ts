// src/modules/ads/adCampaign/adCampaign.validation.ts

import { z } from 'zod';

export const CAMPAIGN_STATUSES = ['active', 'paused', 'expired'] as const;

const emptyToNull = (val: unknown) => (val === '' ? null : val);

export const adCampaignListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  placementId: z.coerce.number().int().positive().optional(),
  advertiserId: z.coerce.number().int().positive().optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  sortBy: z.enum(['id', 'name', 'priority', 'startDate', 'endDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const adCampaignIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// creativeImageUrl is never client-supplied — it always rides along as
// an uploaded file (the `creativeImage` field), same convention as
// article.validation.ts's coverImageUrl.
const adCampaignShape = {
  placementId: z.coerce.number().int().positive('Placement is required'),
  advertiserId: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable().optional()),
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
  targetUrl: z.string().trim().url('Must be a valid URL').max(255),
  priority: z.coerce.number().int().min(0, 'Priority must be 0 or greater').default(0),
  startDate: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
  endDate: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
  status: z.enum(CAMPAIGN_STATUSES).default('active'),
};

function withDateOrderRule<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data: unknown, ctx: z.RefinementCtx) => {
    const d = data as { startDate?: Date | null; endDate?: Date | null };
    if (d.startDate && d.endDate && d.startDate.getTime() > d.endDate.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startDate must be on or before endDate',
        path: ['endDate'],
      });
    }
  });
}

export const createAdCampaignSchema = withDateOrderRule(z.object(adCampaignShape));
export const updateAdCampaignSchema = withDateOrderRule(z.object(adCampaignShape));

// Dedicated status-only payload for the row-level quick-toggle — same
// convention as article.validation.ts's updateArticleStatusSchema.
export const updateAdCampaignStatusSchema = z.object({
  status: z.enum(CAMPAIGN_STATUSES),
});

export type AdCampaignListQueryParsed = z.infer<typeof adCampaignListQuerySchema>;
export type CreateAdCampaignParsed = z.infer<typeof createAdCampaignSchema>;
export type UpdateAdCampaignParsed = z.infer<typeof updateAdCampaignSchema>;
export type UpdateAdCampaignStatusParsed = z.infer<typeof updateAdCampaignStatusSchema>;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
