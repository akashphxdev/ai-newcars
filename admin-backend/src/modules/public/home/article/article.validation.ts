// src/modules/public/home/article/article.validation.ts

import { z } from 'zod';

export const homeArticleListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(6),
});

export type HomeArticleListQueryParsed = z.infer<typeof homeArticleListQuerySchema>;
