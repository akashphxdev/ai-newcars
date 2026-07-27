// src/modules/public/auth/auth.service.ts
//
// Website (public) user auth — email-OTP based, no password. Mobile is
// the account's unique identifier (collected + required at signup);
// email is where every OTP is actually delivered. The OTP row stores
// BOTH, so verification is checked against what WE sent it to, not
// whatever the client claims at verify time — otherwise anyone who
// knows a victim's mobile number could request an OTP with their own
// email, receive it legitimately, and register/hijack that mobile.

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { signToken } from '@/core/middleware/auth';
import { sendMail } from '@/core/utils/mailer';
import { generateOtp } from '@/core/utils/otp';
import { maskEmail } from '@/core/utils/mask';
import type {
  SignupRequestOtpParsed,
  SignupVerifyOtpParsed,
  LoginRequestOtpParsed,
  LoginVerifyOtpParsed,
  ResendOtpParsed,
} from './auth.validation';
import type {
  UserSafe,
  SignupRequestOtpResponse,
  LoginRequestOtpResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
} from './auth.types';

const OTP_EXPIRY_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 5;
// Public users have no super-admin to ask for an unlock, so this lock is
// temporary and self-clears — unlike AdminUser's permanent, manual-only
// lock in modules/auth/auth.service.ts.
const LOCK_DURATION_MINUTES = 15;

function sanitizeUser(user: { passwordHash: string | null; [key: string]: unknown }): UserSafe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe as unknown as UserSafe;
}

// Login OTP — kept deliberately simple/plain (per earlier feedback: no
// heavy styling for this one).
function buildLoginOtpEmailHtml(name: string | null, otpCode: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background: #f4f5f9; padding: 40px 24px;">
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="font-size: 22px; font-weight: 600; color: #111827;">Times<span style="color: #f2650f;">Auto</span></span>
    </div>
    <div style="background: #ffffff; border-radius: 16px; padding: 32px 28px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <p style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px;">${greeting}</p>
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">Use the code below to log in to your account.</p>
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

// Signup OTP — the "first impression" email, styled to match the brand
// (dark hero banner, card sections, footer) rather than the plain
// login one. No real hero photo is embedded (no image asset to pull
// from) — a dark gradient stands in for it.
function buildSignupOtpEmailHtml(name: string | null, otpCode: string): string {
  const greetingName = name ? `Hi ${name} 👋` : 'Hi there 👋';

  const socialBadge = (label: string) => `
    <td style="padding: 0 5px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="width: 30px; height: 30px; border-radius: 50%; background: #2a2a35; text-align: center; vertical-align: middle; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 500; color: #e5e7eb;">
            ${label}
          </td>
        </tr>
      </table>
    </td>`;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

    <div style="background: linear-gradient(135deg, #1c1c26 0%, #111114 100%); padding: 32px 24px; text-align: center;">
      <p style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff;">Times<span style="color: #f2650f;">Auto</span></p>
      <p style="margin: 6px 0 0; font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #9ca3af;">India's Auto Guide</p>
    </div>

    <div style="padding: 32px 28px;">
      <p style="font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 14px;">${greetingName}</p>
      <p style="font-size: 13.5px; line-height: 1.6; color: #4b5563; margin: 0 0 24px;">
        Thank you for signing up with <span style="color: #f2650f; font-weight: 600;">TimesAuto</span>. Please use the following OTP to verify your email address.
      </p>

      <div style="background: #fdf1e9; border-radius: 14px; padding: 20px; text-align: center; margin: 0 0 20px;">
        <p style="margin: 0 0 8px; font-size: 11px; font-weight: 500; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px;">Your OTP Code</p>
        <p style="margin: 0; font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #f2650f;">${otpCode}</p>
        <p style="margin: 10px 0 0; font-size: 12px; color: #6b7280;">
          This OTP is valid for <span style="color: #f2650f; font-weight: 600;">${OTP_EXPIRY_MINUTES} minutes</span>.
        </p>
      </div>

      <div style="background: #f9fafb; border-radius: 14px; padding: 16px 18px; margin: 0 0 20px;">
        <p style="margin: 0 0 8px; font-size: 12.5px; font-weight: 600; color: #111827;">🛡️ Security Tips</p>
        <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">• Do not share this OTP with anyone.</p>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">• TimesAuto will never ask for your OTP.</p>
      </div>

      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 6px;">If you didn't request this, please ignore this email.</p>
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Need help? <a href="#" style="color: #f2650f; font-weight: 500; text-decoration: none;">Contact our support team</a>.
      </p>
    </div>

    <div style="background: #111114; padding: 24px; text-align: center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;">
        <tr>
          ${['f', 'IG', '▶', 'X', 'in'].map(socialBadge).join('')}
        </tr>
      </table>
      <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280;">© 2026 TimesAuto. All rights reserved.</p>
      <p style="margin: 0; font-size: 11px; color: #6b7280;">
        <span style="color: #f2650f; font-weight: 500;">TimesAuto</span> | India's Auto Guide
      </p>
    </div>
  </div>`;
}

// Throws if the account is locked (and the lock hasn't expired yet) or
// inactive. If a temporary lock HAS expired, clears it here so the
// caller proceeds as if it were never locked.
async function assertUserAccessibleAndUnlock(user: {
  id: number;
  isLocked: boolean;
  lockedAt: Date | null;
  status: string;
}): Promise<void> {
  if (user.isLocked && user.lockedAt) {
    const unlocksAt = new Date(user.lockedAt.getTime() + LOCK_DURATION_MINUTES * 60 * 1000);
    if (unlocksAt > new Date()) {
      const minutesLeft = Math.ceil((unlocksAt.getTime() - Date.now()) / 60000);
      throw ApiError.forbidden(
        `Too many failed attempts. Please try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { isLocked: false, lockedAt: null, lockedReason: null, failedLoginAttempts: 0 },
    });
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden(`Account is not active (current status: ${user.status})`);
  }
}

async function registerFailedOtpAttempt(user: { id: number; failedLoginAttempts: number }): Promise<void> {
  const attempts = user.failedLoginAttempts + 1;
  const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: attempts,
      ...(shouldLock && { isLocked: true, lockedAt: new Date(), lockedReason: 'Too many failed OTP attempts' }),
    },
  });
}

export const userAuthService = {
  async signupRequestOtp(
    input: SignupRequestOtpParsed,
    ipAddress?: string | null,
  ): Promise<SignupRequestOtpResponse> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: input.mobile }, { email: input.email }] },
    });
    if (existing) {
      throw ApiError.conflict('An account with this mobile number or email already exists. Please log in instead.');
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.userOtpVerification.create({
      data: { mobile: input.mobile, email: input.email, otpCode, purpose: 'signup', ipAddress, expiresAt },
    });

    await sendMail({
      to: input.email,
      subject: 'Welcome to TimesAuto — verify your email',
      html: buildSignupOtpEmailHtml(input.name, otpCode),
    });

    return { mobile: input.mobile, maskedEmail: maskEmail(input.email), message: 'OTP sent to your email.' };
  },

  async signupVerifyOtp(input: SignupVerifyOtpParsed, ipAddress?: string | null): Promise<VerifyOtpResponse> {
    const record = await prisma.userOtpVerification.findFirst({
      where: { mobile: input.mobile, otpCode: input.otp, purpose: 'signup', verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || !record.email) {
      throw ApiError.badRequest('Invalid OTP');
    }
    if (record.expiresAt < new Date()) {
      throw ApiError.badRequest('OTP has expired. Please sign up again.');
    }

    // Re-check uniqueness — catches both a stale request (account created
    // via another route since the OTP was sent) and a race between two
    // concurrent signups for the same mobile/email.
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: input.mobile }, { email: record.email }] },
    });
    if (existing) {
      throw ApiError.conflict('An account with this mobile number or email already exists. Please log in instead.');
    }

    await prisma.userOtpVerification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });

    const user = await prisma.user.create({
      data: {
        name: input.name,
        mobile: input.mobile,
        email: record.email,
        isVerified: true,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress ?? null,
      },
    });

    const token = signToken({ id: user.id, type: 'user' });
    return { user: sanitizeUser(user), token };
  },

  async loginRequestOtp(input: LoginRequestOtpParsed, ipAddress?: string | null): Promise<LoginRequestOtpResponse> {
    const user = await prisma.user.findUnique({ where: { mobile: input.mobile } });
    if (!user) {
      throw ApiError.notFound('No account found with this mobile number. Please sign up.');
    }
    if (!user.email) {
      throw ApiError.badRequest('This account has no email on file. Please contact support.');
    }

    await assertUserAccessibleAndUnlock(user);

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.userOtpVerification.create({
      data: { mobile: user.mobile, email: user.email, otpCode, purpose: 'login', ipAddress, expiresAt },
    });

    await sendMail({
      to: user.email,
      subject: 'Your TimesAuto login OTP',
      html: buildLoginOtpEmailHtml(user.name, otpCode),
    });

    return { maskedEmail: maskEmail(user.email), message: 'OTP sent to your registered email.' };
  },

  async loginVerifyOtp(input: LoginVerifyOtpParsed, ipAddress?: string | null): Promise<VerifyOtpResponse> {
    const user = await prisma.user.findUnique({ where: { mobile: input.mobile } });
    if (!user) throw ApiError.notFound('No account found with this mobile number. Please sign up.');

    await assertUserAccessibleAndUnlock(user);

    const record = await prisma.userOtpVerification.findFirst({
      where: { mobile: input.mobile, otpCode: input.otp, purpose: 'login', verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      await registerFailedOtpAttempt(user);
      throw ApiError.badRequest('Invalid OTP');
    }
    if (record.expiresAt < new Date()) {
      throw ApiError.badRequest('OTP has expired. Please log in again.');
    }

    await prisma.userOtpVerification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress ?? null, failedLoginAttempts: 0 },
    });

    const token = signToken({ id: updated.id, type: 'user' });
    return { user: sanitizeUser(updated), token };
  },

  async resendOtp(input: ResendOtpParsed, ipAddress?: string | null): Promise<ResendOtpResponse> {
    if (input.purpose === 'signup') {
      const record = await prisma.userOtpVerification.findFirst({
        where: { mobile: input.mobile, purpose: 'signup', verifiedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (!record || !record.email) {
        throw ApiError.badRequest('No pending signup found for this mobile number. Please start signup again.');
      }

      const otpCode = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      await prisma.userOtpVerification.create({
        data: { mobile: input.mobile, email: record.email, otpCode, purpose: 'signup', ipAddress, expiresAt },
      });
      await sendMail({
        to: record.email,
        subject: 'Welcome to TimesAuto — verify your email',
        html: buildSignupOtpEmailHtml(null, otpCode),
      });
      return { message: 'A new OTP has been sent to your email.' };
    }

    const user = await prisma.user.findUnique({ where: { mobile: input.mobile } });
    if (!user || !user.email) {
      throw ApiError.notFound('No account found with this mobile number.');
    }
    await assertUserAccessibleAndUnlock(user);

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await prisma.userOtpVerification.create({
      data: { mobile: user.mobile, email: user.email, otpCode, purpose: 'login', ipAddress, expiresAt },
    });
    await sendMail({
      to: user.email,
      subject: 'Your TimesAuto login OTP',
      html: buildLoginOtpEmailHtml(user.name, otpCode),
    });
    return { message: 'A new OTP has been sent to your email.' };
  },

  async me(userId: number): Promise<UserSafe> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  },
};
