// src/core/utils/otp.ts
//
// Shared by both admin and public-user OTP-based auth flows.

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
