// src/modules/auth/auth.types.ts

export interface AdminSafe {
  id: number;
  name: string;
  email: string;
  mobile: string;
  roleId: number;
  status: string;
  accessStartDate: Date | null;
  accessEndDate: Date | null;
  isLocked: boolean;
  lockType: string | null;
  lockedBy: number | null;
  lockedAt: Date | null;
  lockedReason: string | null;
  unlockedBy: number | null;
  unlockedAt: Date | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  failedLoginAttempts: number;
  createdBy: number | null;
  createdAt: Date;
  role?: {
    id: number;
    roleName: string;
  };
}

export interface LoginStep1Response {
  adminId: number;
  email: string;
  maskedMobile: string;
  message: string;
}

export interface LoginStep2Response {
  admin: AdminSafe;
  token: string;
}

export interface ResendOtpResponse {
  message: string;
}

export type AccountLockReason =
  | 'Too many failed login attempts'
  | 'Manually locked by admin';