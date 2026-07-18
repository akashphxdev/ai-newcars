// src/modules/ai/imagePool/imagePool.validation.ts

import { z } from 'zod';
import { AI_FEATURE_CODES } from '../ai.constants';

const featureKeyField = z.coerce
  .number()
  .int()
  .refine((v) => (AI_FEATURE_CODES as readonly number[]).includes(v), 'Invalid featureKey code');

export const imagePoolListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  featureKey: featureKeyField.optional(),
  isUsed: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const uploadImagePoolSchema = z.object({
  featureKey: featureKeyField,
});

export const imagePoolIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ImagePoolListQueryParsed = z.infer<typeof imagePoolListQuerySchema>;
export type UploadImagePoolParsed = z.infer<typeof uploadImagePoolSchema>;
export type ImagePoolIdParamParsed = z.infer<typeof imagePoolIdParamSchema>;