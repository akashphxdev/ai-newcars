// src/modules/ai/aiFaq/aiFaq.validation.ts

import { z } from 'zod';
import { AI_FAQ_STATUS_CODES } from '../ai.constants';

const statusCodeSchema = z.coerce
  .number()
  .int()
  .refine((v) => (AI_FAQ_STATUS_CODES as readonly number[]).includes(v), 'Invalid status code');

export const aiFaqListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  status: statusCodeSchema.optional(),
  sortBy: z.enum(['createdAt', 'id']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const aiFaqIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Editing only ever touches the generated text — modelId is fixed at
// generation time (variantId is deliberately not part of this app's
// logic; that column is going away from the schema separately).
export const updateAiFaqSchema = z.object({
  question: z.string().trim().min(5, 'Question must be at least 5 characters').max(255),
  answer: z.string().trim().min(2, 'Answer is required'),
});

export type AiFaqListQueryParsed = z.infer<typeof aiFaqListQuerySchema>;
export type AiFaqIdParamParsed = z.infer<typeof aiFaqIdParamSchema>;
export type UpdateAiFaqParsed = z.infer<typeof updateAiFaqSchema>;
