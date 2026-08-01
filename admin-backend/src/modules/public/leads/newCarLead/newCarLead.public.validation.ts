// src/modules/public/leads/newCarLead/newCarLead.public.validation.ts

import { z } from 'zod';
import { leadMobileSchema, leadOtpSchema } from '../leadOtp.validation';

// Matches the website's car-detail-page CTAs — same enum as the admin
// side's BUY_NEW_CAR_LEAD_INTEREST_TYPES (modules/buyLeads/newCarLeads/buyNewCarLead.validation.ts).
export const PUBLIC_INTEREST_TYPES = ['enquiry', 'offer_check'] as const;

export const createBuyNewCarLeadSchema = z.object({
  name: z.string().trim().max(100).optional(),
  mobile: leadMobileSchema,
  // Required only for guests (no Authorization header) — enforced in
  // the service, not here, since the schema has no visibility into
  // whether a token was sent.
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  otp: leadOtpSchema.optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  variantId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  interestType: z.enum(PUBLIC_INTEREST_TYPES).optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(150).optional(),
  landingPage: z.string().trim().max(255).optional(),
  deviceType: z.string().trim().max(20).optional(),
});

export type CreateBuyNewCarLeadParsed = z.infer<typeof createBuyNewCarLeadSchema>;
