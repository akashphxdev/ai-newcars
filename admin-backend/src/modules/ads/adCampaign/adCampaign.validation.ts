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

export const CREATIVE_TYPES = ['image', 'script'] as const;

// creativeImageUrl is never client-supplied — it always rides along as
// an uploaded file (the `creativeImage` field), same convention as
// article.validation.ts's coverImageUrl.
const adCampaignShape = {
  placementId: z.coerce.number().int().positive('Placement is required'),
  advertiserId: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable().optional()),
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
  creativeType: z.enum(CREATIVE_TYPES).default('image'),
  // Required for an image campaign, meaningless for a script one — which
  // one applies is settled by withCreativeRule below.
  targetUrl: z.preprocess(emptyToNull, z.string().trim().url('Must be a valid URL').max(255).nullable().optional()),
  // The network's snippet, pasted whole. Parsed server-side rather than
  // stored as markup; see adScript.util.ts.
  scriptSnippet: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable().optional()),
  priority: z.coerce.number().int().min(0, 'Priority must be 0 or greater').default(0),
  startDate: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
  endDate: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
  status: z.enum(CAMPAIGN_STATUSES).default('active'),
};

// An image campaign needs somewhere to send the click; a script campaign
// needs the tag. Checked here so the service never has to guess which
// half of the shape is the real one.
function withCreativeRule<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data: unknown, ctx: z.RefinementCtx) => {
    const d = data as { creativeType?: string; targetUrl?: string | null; scriptSnippet?: string | null };
    if (d.creativeType === 'script') {
      if (!d.scriptSnippet) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Paste the ad network snippet',
          path: ['scriptSnippet'],
        });
      }
    } else if (!d.targetUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target URL is required for an image campaign',
        path: ['targetUrl'],
      });
    }
  });
}

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

export const createAdCampaignSchema = withCreativeRule(withDateOrderRule(z.object(adCampaignShape)));
export const updateAdCampaignSchema = withCreativeRule(withDateOrderRule(z.object(adCampaignShape)));

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
export type CreativeType = (typeof CREATIVE_TYPES)[number];
