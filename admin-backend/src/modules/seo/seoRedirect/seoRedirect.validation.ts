// src/modules/seo/seoRedirect/seoRedirect.validation.ts

import { z } from 'zod';

const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const REDIRECT_TYPES = [301, 302] as const;

// Path-only (no host/query) — matches how the website will look these
// up: pathname against pathname, same convention as lib/routes.ts on
// the frontend.
const pathSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(255)
    .regex(/^\//, `${label} must start with "/"`);

export const seoRedirectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['id', 'oldPath', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const seoRedirectIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const seoRedirectShape = {
  oldPath: pathSchema('Old path'),
  newPath: pathSchema('New path'),
  redirectType: z.coerce
    .number()
    .int()
    .refine((v) => (REDIRECT_TYPES as readonly number[]).includes(v), 'Invalid redirect type'),
  isActive: booleanish.default(true),
};

// A redirect pointing at itself is never intentional — it's either a
// copy-paste mistake or (if actually live) an infinite-redirect loop on
// the site.
const seoRedirectRefinement = (data: { oldPath: string; newPath: string }, ctx: z.RefinementCtx) => {
  if (data.oldPath === data.newPath) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['newPath'],
      message: 'New path must be different from old path',
    });
  }
};

export const createSeoRedirectSchema = z.object(seoRedirectShape).superRefine(seoRedirectRefinement);
export const updateSeoRedirectSchema = z.object(seoRedirectShape).superRefine(seoRedirectRefinement);

// Dedicated status-only payload for the row-level Active/Inactive toggle.
export const updateSeoRedirectStatusSchema = z.object({
  isActive: z.boolean(),
});

export type SeoRedirectListQueryParsed = z.infer<typeof seoRedirectListQuerySchema>;
export type CreateSeoRedirectParsed = z.infer<typeof createSeoRedirectSchema>;
export type UpdateSeoRedirectParsed = z.infer<typeof updateSeoRedirectSchema>;
export type UpdateSeoRedirectStatusParsed = z.infer<typeof updateSeoRedirectStatusSchema>;
