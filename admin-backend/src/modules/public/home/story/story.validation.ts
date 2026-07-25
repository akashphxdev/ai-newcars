// src/modules/public/home/story/story.validation.ts

import { z } from 'zod';

export const homeStoryListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export type HomeStoryListQueryParsed = z.infer<typeof homeStoryListQuerySchema>;
