// src/modules/ai/setting/setting.validation.ts

import { z } from 'zod';
import { AI_PROVIDER_CODES } from '../ai.constants';


const providerField = z.coerce
  .number({ required_error: 'Provider is required', invalid_type_error: 'Provider is required' })
  .int()
  .refine((v) => (AI_PROVIDER_CODES as readonly number[]).includes(v), 'Invalid provider code');

// Deliberately no "baseUrl or apiKey required" refine here — a save
// that only changes the model/language/automation rules can validly
// omit both (keeping whatever connection detail is already stored).
// That check instead lives in setting.service.ts's upsertSettings,
// where it can see what's already saved before rejecting.
export const upsertAiSettingSchema = z.object({
  provider: providerField,
  baseUrl: z.string().trim().url('Must be a valid URL').max(255).optional(),
  apiKey: z.string().trim().min(1).max(500).optional(),
  model: z.string().trim().min(1, 'Model is required').max(100),
  language: z.enum(['english', 'hindi', 'hinglish']).default('english'),
  autoSaveMode: z.enum(['draft', 'preview']).default('draft'),
});

export const testAiConnectionSchema = z.object({
  provider: providerField,
  baseUrl: z.string().trim().url('Must be a valid URL').max(255).optional(),
  apiKey: z.string().trim().max(500).optional(),
  model: z.string().trim().min(1, 'Model is required').max(100),
});

export type UpsertAiSettingParsed = z.infer<typeof upsertAiSettingSchema>;
export type TestAiConnectionParsed = z.infer<typeof testAiConnectionSchema>;