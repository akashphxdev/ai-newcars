// src/modules/siteSetting/siteSetting.validation.ts

import { z } from 'zod';

const phoneShape = z
  .string()
  .trim()
  .max(20)
  .refine((v) => {
    const digitsOnly = v.replace(/[\s\-().]/g, '');
    return /^\+?[1-9]\d{6,14}$/.test(digitsOnly);
  }, 'Must be a valid phone number (7-15 digits, optional leading +)');

function hasAtLeastThreeLines(message: string): boolean {
  return message.split('\n').map((l) => l.trim()).filter(Boolean).length >= 3;
}

// Wraps a field schema so the field can be:
//  - omitted            -> undefined -> leave the stored value untouched
//  - ''  / explicit null -> null      -> clear the stored value
//  - a valid value       -> validated -> set the stored value
// Plain `.optional()` only supports the first case, which made it
// impossible to ever clear an already-set field from the UI.
function clearable<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (v) => (v === '' ? null : v),
    schema.nullable().optional(),
  );
}

export const upsertSiteSettingSchema = z
  .object({
    maintenanceMode: z.boolean().optional(),
    maintenanceMessage: clearable(z.string().trim().max(1000)),

    supportEmail: clearable(z.string().trim().email('Must be a valid email').max(255)),
    contactEmail: clearable(z.string().trim().email('Must be a valid email').max(255)),
    contactNumber: clearable(phoneShape),
    whatsappNumber: clearable(phoneShape),
    address: clearable(z.string().trim().max(1000)),

    facebookUrl: clearable(z.string().trim().url('Must be a valid URL').max(255)),
    instagramUrl: clearable(z.string().trim().url('Must be a valid URL').max(255)),
    twitterUrl: clearable(z.string().trim().url('Must be a valid URL').max(255)),
    youtubeUrl: clearable(z.string().trim().url('Must be a valid URL').max(255)),
    linkedinUrl: clearable(z.string().trim().url('Must be a valid URL').max(255)),
  })

  .refine(
    (data) => {
      if (data.maintenanceMode !== true) return true;
      return Boolean(data.maintenanceMessage && hasAtLeastThreeLines(data.maintenanceMessage));
    },
    {
      message: 'A maintenance message of at least 3 lines is required when turning maintenance mode on',
      path: ['maintenanceMessage'],
    },
  );

export type UpsertSiteSettingParsed = z.infer<typeof upsertSiteSettingSchema>;