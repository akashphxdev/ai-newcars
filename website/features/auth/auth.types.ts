// features/auth/auth.types.ts
//
// Mirrors admin-backend's modules/public/auth types.

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  isVerified: boolean;
  status: string;
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
  user: AuthUser;
  token: string;
}
