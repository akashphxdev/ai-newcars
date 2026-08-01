// src/modules/public/leads/insuranceLead/insuranceLead.public.validation.ts

import { z } from 'zod';
import { leadMobileSchema, leadOtpSchema } from '../leadOtp.validation';

export const createInsuranceLeadSchema = z.object({
  name: z.string().trim().max(100).optional(),
  mobile: leadMobileSchema,
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  otp: leadOtpSchema.optional(),
  registrationNumber: z.string().trim().max(20).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  cityId: z.coerce.number().int().positive().optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(150).optional(),
  landingPage: z.string().trim().max(255).optional(),
  deviceType: z.string().trim().max(20).optional(),
});

export type CreateInsuranceLeadParsed = z.infer<typeof createInsuranceLeadSchema>;
