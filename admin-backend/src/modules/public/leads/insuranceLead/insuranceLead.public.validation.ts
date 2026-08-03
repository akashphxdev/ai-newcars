// src/modules/public/leads/insuranceLead/insuranceLead.public.validation.ts

import { z } from 'zod';
import { leadMobileSchema, leadOtpSchema } from '../leadOtp.validation';

// Matches admin's INSURANCE_TYPES (modules/buyLeads/insuranceLeads/insuranceLead.validation.ts).
export const PUBLIC_INSURANCE_TYPES = ['new', 'renew', 'expired'] as const;

const currentYear = new Date().getFullYear();

export const createInsuranceLeadSchema = z.object({
  name: z.string().trim().max(100).optional(),
  mobile: leadMobileSchema,
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  otp: leadOtpSchema.optional(),
  registrationNumber: z.string().trim().max(20).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  variantId: z.coerce.number().int().positive().optional(),
  registrationYear: z.coerce.number().int().min(1980).max(currentYear).optional(),
  registrationStateId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  insuranceType: z.enum(PUBLIC_INSURANCE_TYPES),
  // Only meaningful when insuranceType is "renew" — the service doesn't
  // enforce that (a stray value on another type is harmless), the
  // website's Step 2 only shows/collects these for "Renew Existing Policy".
  currentInsuranceCompany: z.string().trim().max(150).optional(),
  policyExpiryDate: z.coerce.date().optional(),
  hadClaim: z.boolean().optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(150).optional(),
  landingPage: z.string().trim().max(255).optional(),
  deviceType: z.string().trim().max(20).optional(),
});

export type CreateInsuranceLeadParsed = z.infer<typeof createInsuranceLeadSchema>;
