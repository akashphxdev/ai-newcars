// src/core/utils/mask.ts
//
// Shared by both admin and public-user OTP-based auth flows — masks an
// email for on-screen display (e.g. "6-digit code sent to aa***na@gmail.com")
// without ever showing the full address.

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 4) return `${local.slice(0, 1)}***@${domain ?? ''}`;
  return `${local.slice(0, 2)}***${local.slice(-2)}@${domain}`;
}
