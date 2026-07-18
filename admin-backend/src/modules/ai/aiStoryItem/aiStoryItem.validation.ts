// src/modules/ai/aiStoryItem/aiStoryItem.validation.ts

import { z } from 'zod';
import { AI_STORY_ITEM_STATUS_CODES } from '../ai.constants';

const statusCodeSchema = z.coerce
  .number()
  .int()
  .refine((v) => (AI_STORY_ITEM_STATUS_CODES as readonly number[]).includes(v), 'Invalid status code');

export const aiStoryItemListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  groupId: z.coerce.number().int().positive().optional(),
  status: statusCodeSchema.optional(),
  sortBy: z.enum(['createdAt', 'id']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const aiStoryItemIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Editing only ever touches the generated caption — group/media/link
// are fixed at generation time.
export const updateAiStoryItemSchema = z.object({
  description: z.string().trim().min(2, 'Description is required').max(300),
});

export type AiStoryItemListQueryParsed = z.infer<typeof aiStoryItemListQuerySchema>;
export type AiStoryItemIdParamParsed = z.infer<typeof aiStoryItemIdParamSchema>;
export type UpdateAiStoryItemParsed = z.infer<typeof updateAiStoryItemSchema>;
