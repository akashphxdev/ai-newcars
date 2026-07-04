// src/modules/auth/auth.validation.ts

import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const adminVerifyOtpSchema = z.object({
  adminId: z.coerce.number().int().positive(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const adminResendOtpSchema = z.object({
  adminId: z.coerce.number().int().positive(),
});

export type AdminLoginParsed = z.infer<typeof adminLoginSchema>;
export type AdminVerifyOtpParsed = z.infer<typeof adminVerifyOtpSchema>;