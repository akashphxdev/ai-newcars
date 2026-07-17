// src/modules/ai/automationRule/automationRule.validation.ts

import { z } from 'zod';
import { AI_FEATURE_CODES } from '../ai.constants';

export const featureKeyParamSchema = z.object({
  featureKey: z.coerce
    .number()
    .int()
    .refine((v) => (AI_FEATURE_CODES as readonly number[]).includes(v), 'Invalid featureKey code'),
});

export const upsertAutomationRuleSchema = z.object({
  enabled: z.boolean().default(false),
  frequencyMinutes: z.coerce.number().int().positive('Frequency must be a positive number of minutes').default(180),
  countPerRun: z.coerce.number().int().positive().default(1),
  imageFolder: z.string().trim().max(255).nullable().optional(),
  autoPickImages: z.boolean().default(false),
  autoDelete: z.boolean().default(false),
  keepLatest: z.coerce.number().int().positive().nullable().optional(),
});

export type FeatureKeyParamParsed = z.infer<typeof featureKeyParamSchema>;
export type UpsertAutomationRuleParsed = z.infer<typeof upsertAutomationRuleSchema>;