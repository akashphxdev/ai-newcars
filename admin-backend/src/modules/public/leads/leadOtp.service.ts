// src/modules/public/leads/leadOtp.service.ts
//
// Shared by every guest lead-submission flow (Buy Leads today, Sell
// Leads later) — a guest must verify their mobile (via an email-delivered
// OTP, since no SMS gateway is set up yet — deliberately isolated to
// this one send function so swapping to SMS later is a one-file change)
// before a lead gets created without a logged-in account. Reuses the
// same UserOtpVerification table as modules/public/auth, under its own
// 'lead_verify' purpose so it never collides with signup/login OTPs.

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { sendMail } from '@/core/utils/mailer';
import { generateOtp } from '@/core/utils/otp';
import { maskEmail } from '@/core/utils/mask';

const OTP_EXPIRY_MINUTES = 5;
export const LEAD_OTP_PURPOSE = 'lead_verify';

function buildLeadOtpEmailHtml(name: string | null, otpCode: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background: #f4f5f9; padding: 40px 24px;">
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="font-size: 22px; font-weight: 600; color: #111827;">Times<span style="color: #f2650f;">Auto</span></span>
    </div>
    <div style="background: #ffffff; border-radius: 16px; padding: 32px 28px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <p style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px;">${greeting}</p>
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">Use the code below to verify your request.</p>
      <div style="background: #f4f5f9; border-radius: 12px; padding: 18px; margin: 0 0 20px;">
        <p style="margin: 0 0 6px; font-size: 11px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px;">Your OTP</p>
        <p style="margin: 0; font-size: 30px; font-weight: 600; letter-spacing: 8px; color: #111827;">${otpCode}</p>
      </div>
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        This code expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.
      </p>
    </div>
    <p style="text-align: center; font-size: 11px; color: #c0bab0; margin-top: 24px;">
      © 2026 TimesAuto · India's Auto Guide
    </p>
  </div>`;
}

export async function sendLeadOtp(
  input: { mobile: string; email: string; name?: string | null },
  ipAddress?: string | null,
): Promise<{ maskedEmail: string; message: string }> {
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.userOtpVerification.create({
    data: {
      mobile: input.mobile,
      email: input.email,
      otpCode,
      purpose: LEAD_OTP_PURPOSE,
      ipAddress: ipAddress ?? undefined,
      expiresAt,
    },
  });

  await sendMail({
    to: input.email,
    subject: 'Your TimesAuto verification code',
    html: buildLeadOtpEmailHtml(input.name ?? null, otpCode),
  });

  return { maskedEmail: maskEmail(input.email), message: 'OTP sent to your email.' };
}

// Throws on invalid/expired OTP — callers create the lead only after
// this resolves without throwing.
export async function verifyLeadOtp(mobile: string, otp: string): Promise<void> {
  const record = await prisma.userOtpVerification.findFirst({
    where: { mobile, otpCode: otp, purpose: LEAD_OTP_PURPOSE, verifiedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw ApiError.badRequest('Invalid OTP');
  }
  if (record.expiresAt < new Date()) {
    throw ApiError.badRequest('OTP has expired. Please request a new one.');
  }

  await prisma.userOtpVerification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
}
