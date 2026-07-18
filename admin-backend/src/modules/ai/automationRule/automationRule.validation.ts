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
  language: z.enum(['english', 'hindi', 'hinglish']).default('english'),
  autoPublish: z.boolean().default(false),
  maxTotal: z.coerce.number().int().positive().nullable().optional(),
  autoDelete: z.boolean().default(false),
  keepLatest: z.coerce.number().int().positive().nullable().optional(),
  deleteStrategy: z.enum(['latest', 'lowestViews']).default('latest'),
});

// Dashboard's on/off switch — only ever touches `enabled`, never the
// rest of the rule's config, so it can't accidentally clobber a
// carefully-tuned frequency/countPerRun/etc. that was set on the
// Settings page.
export const toggleAutomationRuleSchema = z.object({
  enabled: z.boolean(),
});

export type FeatureKeyParamParsed = z.infer<typeof featureKeyParamSchema>;
export type UpsertAutomationRuleParsed = z.infer<typeof upsertAutomationRuleSchema>;
export type ToggleAutomationRuleParsed = z.infer<typeof toggleAutomationRuleSchema>;