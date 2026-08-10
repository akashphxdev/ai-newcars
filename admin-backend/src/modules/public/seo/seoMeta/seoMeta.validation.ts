// src/modules/public/seo/seoMeta/seoMeta.validation.ts

import { z } from 'zod';

// Mirrors SEO_PAGE_TYPE_CODES / STATIC_PAGE_TYPE in the admin module
// (src/modules/seo/seoMeta/seoMeta.validation.ts). Duplicated rather than
// imported — public modules never import from admin modules (same
// convention as brand.service.ts's FUEL_FILTER_CODES).
//   1 = Brand listing, 2 = Model detail, 3 = Variant detail,
//   4 = Static page, 5 = News category listing, 6 = Body type listing
const SEO_PAGE_TYPE_CODES = [1, 2, 3, 4, 5, 6] as const;
export const STATIC_PAGE_TYPE = 4;

export const seoMetaQuerySchema = z.object({
  pageType: z.coerce
    .number()
    .int()
    .refine((v) => (SEO_PAGE_TYPE_CODES as readonly number[]).includes(v), 'Invalid pageType'),
  entityId: z.coerce.number().int().positive().optional(),
  staticPageSlug: z.string().trim().toLowerCase().max(100).optional(),
});

export type SeoMetaQueryParsed = z.infer<typeof seoMetaQuerySchema>;
