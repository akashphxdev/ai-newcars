// src/modules/public/brands/brand/brand.validation.ts

import { z } from 'zod';

export const brandListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export type BrandListQueryParsed = z.infer<typeof brandListQuerySchema>;
