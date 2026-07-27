// src/modules/public/auth/auth.validation.ts

import { z } from 'zod';

const mobileSchema = z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number');
const otpSchema = z.string().regex(/^\d{6}$/, 'OTP must be 6 digits');

export const signupRequestOtpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  mobile: mobileSchema,
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const signupVerifyOtpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  mobile: mobileSchema,
  otp: otpSchema,
});

export const loginRequestOtpSchema = z.object({
  mobile: mobileSchema,
});

export const loginVerifyOtpSchema = z.object({
  mobile: mobileSchema,
  otp: otpSchema,
});

export const resendOtpSchema = z.object({
  mobile: mobileSchema,
  purpose: z.enum(['signup', 'login']),
});

export type SignupRequestOtpParsed = z.infer<typeof signupRequestOtpSchema>;
export type SignupVerifyOtpParsed = z.infer<typeof signupVerifyOtpSchema>;
export type LoginRequestOtpParsed = z.infer<typeof loginRequestOtpSchema>;
export type LoginVerifyOtpParsed = z.infer<typeof loginVerifyOtpSchema>;
export type ResendOtpParsed = z.infer<typeof resendOtpSchema>;
