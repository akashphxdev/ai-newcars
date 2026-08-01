// src/modules/public/leads/priceDropAlert/priceDropAlert.public.validation.ts

import { z } from 'zod';
import { leadMobileSchema, leadOtpSchema } from '../leadOtp.validation';

// No `name` field — PriceDropAlertLead has no name column (it's a
// subscription, not a contact-me lead). alertType isn't client-supplied
// either — only 'email' delivery actually works today (no SMS gateway),
// so the service hardcodes it rather than exposing a channel choice
// that doesn't function yet.
export const createPriceDropAlertLeadSchema = z.object({
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

export type CreatePriceDropAlertLeadParsed = z.infer<typeof createPriceDropAlertLeadSchema>;
