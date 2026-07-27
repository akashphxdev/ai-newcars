// src/modules/public/auth/auth.types.ts

export interface UserSafe {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  cityId: number | null;
  isVerified: boolean;
  status: string;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockedAt: Date | null;
  lockedReason: string | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
}

export interface SignupRequestOtpResponse {
  mobile: string;
  maskedEmail: string;
  message: string;
}

export interface LoginRequestOtpResponse {
  maskedEmail: string;
  message: string;
}

export interface VerifyOtpResponse {
  user: UserSafe;
  token: string;
}

export interface ResendOtpResponse {
  message: string;
}
