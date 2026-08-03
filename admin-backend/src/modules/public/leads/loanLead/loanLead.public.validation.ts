// src/modules/public/leads/loanLead/loanLead.public.validation.ts

import { z } from 'zod';
import { leadMobileSchema, leadOtpSchema } from '../leadOtp.validation';

export const createLoanLeadSchema = z.object({
  name: z.string().trim().max(100).optional(),
  mobile: leadMobileSchema,
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  otp: leadOtpSchema.optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  variantId: z.coerce.number().int().positive().optional(),
  lenderId: z.coerce.number().int().positive().optional(),
  loanAmount: z.coerce.number().min(0).optional(),
  tenureYears: z.coerce.number().int().min(1).max(30).optional(),
  interestRate: z.coerce.number().min(0).max(99.99).optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(150).optional(),
  landingPage: z.string().trim().max(255).optional(),
  deviceType: z.string().trim().max(20).optional(),
});

export type CreateLoanLeadParsed = z.infer<typeof createLoanLeadSchema>;
