// src/modules/public/home/bodyType/bodyType.validation.ts

import { z } from 'zod';

export const homeBodyTypeListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type HomeBodyTypeListQueryParsed = z.infer<typeof homeBodyTypeListQuerySchema>;
