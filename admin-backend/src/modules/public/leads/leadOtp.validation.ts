// src/modules/public/leads/leadOtp.validation.ts

import { z } from 'zod';

// Same shape as modules/public/auth/auth.validation.ts's mobile/otp
// schemas — kept as a local copy (not imported) since this module has
// no other dependency on the auth module and duplicating two regexes
// isn't worth a cross-module coupling.
export const leadMobileSchema = z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number');
export const leadOtpSchema = z.string().regex(/^\d{6}$/, 'OTP must be 6 digits');

export const sendLeadOtpSchema = z.object({
  mobile: leadMobileSchema,
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  name: z.string().trim().max(100).optional(),
});

export type SendLeadOtpParsed = z.infer<typeof sendLeadOtpSchema>;
