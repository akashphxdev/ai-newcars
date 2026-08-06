// src/modules/public/leads/launchNotify/launchNotify.public.validation.ts

import { z } from 'zod';
import { leadMobileSchema, leadOtpSchema } from '../leadOtp.validation';

// Same shape as priceDropAlert.public.validation.ts — a subscription, not
// a contact-me lead, so no `name` field.
export const createLaunchNotifyLeadSchema = z.object({
  mobile: leadMobileSchema,
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  otp: leadOtpSchema.optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive('modelId is required'),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(150).optional(),
  landingPage: z.string().trim().max(255).optional(),
  deviceType: z.string().trim().max(20).optional(),
});

export type CreateLaunchNotifyLeadParsed = z.infer<typeof createLaunchNotifyLeadSchema>;
