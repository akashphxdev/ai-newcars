// src/modules/public/leads/softLead/softLead.public.validation.ts

import { z } from 'zod';
import { leadMobileSchema } from '../leadOtp.validation';

// Matches the website's calculator pages — same enum as the admin
// side's SOFT_LEAD_CALCULATOR_TYPES (modules/buyLeads/softLeads/softLead.validation.ts).
export const PUBLIC_SOFT_LEAD_CALCULATOR_TYPES = [
  'emi',
  'mileage',
  'down_payment',
  'affordability',
  'ev_charging',
  'fuel_comparison',
] as const;

// No `otp` field at all — soft leads are intentionally low-friction
// (mobile number only, no verification), unlike the hard lead tables
// which require OTP for guests. See softLead.public.service.ts.
export const createSoftLeadSchema = z.object({
  mobile: leadMobileSchema,
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  calculatorType: z.enum(PUBLIC_SOFT_LEAD_CALCULATOR_TYPES),
  inputSummary: z.string().trim().max(255).optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(150).optional(),
  landingPage: z.string().trim().max(255).optional(),
  deviceType: z.string().trim().max(20).optional(),
});

export type CreateSoftLeadParsed = z.infer<typeof createSoftLeadSchema>;
