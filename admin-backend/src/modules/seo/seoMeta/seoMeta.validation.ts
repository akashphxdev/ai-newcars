// src/modules/seo/seoMeta/seoMeta.validation.ts

import { z } from 'zod';

// Numeric codes only — labels live on the frontend
// (admin-panel/src/lib/lookups.ts's SEO_PAGE_TYPE_OPTIONS). Backend just
// needs to know which codes are currently valid. Same convention as
// adPlacement.validation.ts's PAGE_TYPE_CODES (different meaning — do not
// reuse that constant for SEO).
//   1 = Brand listing (entityId -> Brand.id, e.g. "/tata-motors-cars"),
//   2 = Model detail, 3 = Variant detail, 4 = Static page (home, about,
//   compare, calculators, etc. — no CarModel/CarVariant row to attach to),
//   5 = News category listing (entityId -> ArticleCategory.id),
//   6 = Body type listing (entityId -> BodyType.id, e.g. "/suv-cars")
export const SEO_PAGE_TYPE_CODES = [1, 2, 3, 4, 5, 6] as const;
export const STATIC_PAGE_TYPE = 4;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

const seoPageTypeCodeSchema = z
  .coerce.number()
  .int()
  .refine((v) => (SEO_PAGE_TYPE_CODES as readonly number[]).includes(v), 'Invalid pageType code');

// Shared rule for every JSON-LD schema field (vehicleSchema, faqSchema,
// reviewSchema, articleSchema, authorSchema, breadcrumbSchema). Each one
// is optional/nullable — a page rarely needs all six — but whatever IS
// provided must be valid, parseable JSON, since it gets injected as-is
// into a <script type="application/ld+json"> tag on the live site.
const schemaJsonField = z
  .string()
  .trim()
  .max(20000, 'Schema JSON is too large')
  .refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Must be valid JSON')
  .optional()
  .nullable();

export const seoMetaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  pageType: z.coerce.number().int().optional(),
  entityId: z.coerce.number().int().optional(),
  status: booleanish.optional(),
  sortBy: z.enum(['id', 'pageType', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const seoMetaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const seoMetaShape = {
  pageType: seoPageTypeCodeSchema,
  // NULL = default template for the pageType (applies to every entity of
  // that type unless a specific entityId row overrides it). Always null
  // when pageType is the static-page type — see the refine below.
  entityId: z.coerce.number().int().positive().nullable().optional(),
  // Required (and the actual unique key) when pageType = STATIC_PAGE_TYPE.
  // Ignored otherwise.
  staticPageSlug: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "about-us")')
    .optional()
    .nullable(),
  // Core fields — a row with no title/description isn't doing its job,
  // so these are required rather than "fill in whenever".
  metaTitle: z.string().trim().min(10, 'Meta title must be at least 10 characters').max(255),
  metaDescription: z.string().trim().min(20, 'Meta description must be at least 20 characters').max(500),
  metaKeywords: z.string().trim().max(500).optional().nullable(),
  canonicalUrl: z.string().trim().max(255).optional().nullable(),
  h1Tag: z.string().trim().max(255).optional().nullable(),
  ogTitle: z.string().trim().max(255).optional().nullable(),
  ogDescription: z.string().trim().max(500).optional().nullable(),
  ogImage: z.string().trim().max(255).optional().nullable(),
  robotsMeta: z.string().trim().max(100).optional().nullable(),

  // ---- structured data / JSON-LD — each optional, validated as JSON if present ----
  vehicleSchema: schemaJsonField,
  faqSchema: schemaJsonField,
  reviewSchema: schemaJsonField,
  articleSchema: schemaJsonField,
  authorSchema: schemaJsonField,
  breadcrumbSchema: schemaJsonField,

  status: booleanish.default(true),
};

const seoMetaRefinement = (data: { pageType: number; entityId?: number | null; staticPageSlug?: string | null }, ctx: z.RefinementCtx) => {
  if (data.pageType === STATIC_PAGE_TYPE) {
    if (!data.staticPageSlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['staticPageSlug'],
        message: 'Static page slug is required when page type is "Static page"',
      });
    }
    if (data.entityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entityId'],
        message: 'Entity ID must be empty for static pages — use the page slug instead',
      });
    }
  }
};

export const createSeoMetaSchema = z.object(seoMetaShape).superRefine(seoMetaRefinement);
export const updateSeoMetaSchema = z.object(seoMetaShape).superRefine(seoMetaRefinement);

// Dedicated status-only payload for the row-level Active/Inactive toggle.
export const updateSeoMetaStatusSchema = z.object({
  status: z.boolean(),
});

export type SeoMetaListQueryParsed = z.infer<typeof seoMetaListQuerySchema>;
export type CreateSeoMetaParsed = z.infer<typeof createSeoMetaSchema>;
export type UpdateSeoMetaParsed = z.infer<typeof updateSeoMetaSchema>;
export type UpdateSeoMetaStatusParsed = z.infer<typeof updateSeoMetaStatusSchema>;