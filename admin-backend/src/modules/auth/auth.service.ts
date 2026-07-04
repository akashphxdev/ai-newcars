// src/modules/admin-auth/auth.service.ts

import bcrypt from 'bcrypt';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { signToken } from '@/core/middleware/auth';
import { logger } from '@/core/utils/logger';
import { createLog } from '@/core/utils/createLog';
import type { AdminLoginParsed } from './auth.validation';
import type {
  AdminSafe,
  LoginStep1Response,
  LoginStep2Response,
  ResendOtpResponse,
} from './auth.types';

const OTP_EXPIRY_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 5;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sanitizeAdmin(admin: { passwordHash: string | null; [key: string]: unknown }): AdminSafe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = admin;
  return safe as unknown as AdminSafe;
}

function maskMobile(mobile: string): string {
  return mobile.replace(/^(\d{2})\d+(\d{2})$/, '$1XXXXXX$2');
}

function assertAccountAccessible(admin: {
  isLocked: boolean;
  lockType: string | null;
  lockedReason: string | null;
  status: string;
  accessStartDate: Date | null;
  accessEndDate: Date | null;
}): void {
  if (admin.isLocked) {
    const reason = admin.lockedReason ?? 'This account has been locked';
    throw ApiError.forbidden(reason);
  }

  if (admin.status !== 'active') {
    throw ApiError.forbidden(`Account is not active (current status: ${admin.status})`);
  }

  const now = new Date();
  if (admin.accessStartDate && admin.accessStartDate > now) {
    throw ApiError.forbidden(
      `Account access starts on ${admin.accessStartDate.toDateString()}. You cannot log in yet.`,
    );
  }
  if (admin.accessEndDate && admin.accessEndDate < now) {
    throw ApiError.forbidden(
      `Account access expired on ${admin.accessEndDate.toDateString()}. Please contact a super-admin.`,
    );
  }
}

export const adminAuthService = {
  async login(input: AdminLoginParsed, ipAddress?: string): Promise<LoginStep1Response> {
    const admin = await prisma.adminUser.findUnique({ where: { email: input.email } });

    if (!admin || !admin.passwordHash) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    assertAccountAccessible(admin);

    const isValid = await bcrypt.compare(input.password, admin.passwordHash);

    if (!isValid) {
      const attempts = admin.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: attempts,
          ...(shouldLock && {
            isLocked: true,
            lockType: 'auto',
            lockedAt: new Date(),
            lockedReason: 'Too many failed login attempts',
          }),
        },
      });

      if (shouldLock) {
        await createLog({
          adminId: admin.id,
          description: 'Account auto-locked after too many failed login attempts',
          ipAddress,
        });
        throw ApiError.forbidden(
          'Your account has been locked after too many failed login attempts. Contact a super-admin.',
        );
      }

      const remaining = MAX_FAILED_ATTEMPTS - attempts;
      throw ApiError.unauthorized(
        `Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`,
      );
    }

    if (admin.failedLoginAttempts > 0) {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { failedLoginAttempts: 0 },
      });
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.adminOtpVerification.create({
      data: {
        adminId: admin.id,
        mobile: admin.mobile,
        otpCode,
        purpose: 'login',
        ipAddress,
        expiresAt,
      },
    });

    logger.info(
      `[AdminAuth] OTP for "${admin.email}" (id ${admin.id}): ${otpCode} — expires in ${OTP_EXPIRY_MINUTES} min`,
    );

    return {
      adminId: admin.id,
      email: admin.email,
      maskedMobile: maskMobile(admin.mobile),
      message: 'OTP sent. Check the server terminal for the code (no SMS gateway connected yet).',
    };
  },

  async verifyOtp(
    adminId: number,
    otp: string,
    ipAddress?: string,
  ): Promise<LoginStep2Response> {
    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) throw ApiError.notFound('Admin not found');

    assertAccountAccessible(admin);

    const otpRecord = await prisma.adminOtpVerification.findFirst({
      where: {
        adminId,
        otpCode: otp,
        purpose: 'login',
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw ApiError.badRequest('Invalid OTP');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw ApiError.badRequest('OTP has expired. Please log in again to receive a new one.');
    }

    await prisma.adminOtpVerification.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress ?? null,
        failedLoginAttempts: 0,
      },
    });

    const token = signToken({ id: admin.id, type: 'admin', roleId: admin.roleId });

    await createLog({
      adminId: admin.id,
      description: 'Admin logged in successfully',
      ipAddress,
    });

    return {
      admin: sanitizeAdmin(admin),
      token,
    };
  },

  async resendOtp(adminId: number, ipAddress?: string): Promise<ResendOtpResponse> {
    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) throw ApiError.notFound('Admin not found');

    assertAccountAccessible(admin);

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.adminOtpVerification.create({
      data: {
        adminId: admin.id,
        mobile: admin.mobile,
        otpCode,
        purpose: 'login',
        ipAddress,
        expiresAt,
      },
    });

    logger.info(
      `[AdminAuth] Resent OTP for "${admin.email}" (id ${admin.id}): ${otpCode}`,
    );

    return { message: 'A new OTP has been sent. Check the server terminal.' };
  },

  async me(adminId: number): Promise<AdminSafe> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      include: { role: { select: { id: true, roleName: true } } },
    });
    if (!admin) throw ApiError.notFound('Admin not found');
    return sanitizeAdmin(admin);
  },

  // Logout — stateless JWT means there's nothing to revoke server-side yet.
  // This just records the action for the audit trail.
  async logout(adminId: number, ipAddress?: string): Promise<{ message: string }> {
    await createLog({
      adminId,
      description: 'Admin logged out',
      ipAddress,
    });
    return { message: 'Logged out successfully' };
  },
};