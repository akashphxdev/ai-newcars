// features/auth/auth.api.ts
//
// Client-side auth calls (signup/login are only ever triggered from the
// browser, via AuthModal) — same apiFetch() used everywhere else, just
// with a POST body instead of a cached GET.

import { apiFetch } from "@/lib/apiClient";
import type { SignupRequestOtpResponse, LoginRequestOtpResponse, VerifyOtpResponse } from "./auth.types";

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function signupRequestOtp(input: { name: string; mobile: string; email: string }) {
  return post<SignupRequestOtpResponse>("/auth/signup/send-otp", input);
}

export function signupVerifyOtp(input: { name: string; mobile: string; otp: string }) {
  return post<VerifyOtpResponse>("/auth/signup/verify-otp", input);
}

export function loginRequestOtp(input: { mobile: string }) {
  return post<LoginRequestOtpResponse>("/auth/login/send-otp", input);
}

export function loginVerifyOtp(input: { mobile: string; otp: string }) {
  return post<VerifyOtpResponse>("/auth/login/verify-otp", input);
}

export function resendOtp(input: { mobile: string; purpose: "signup" | "login" }) {
  return post<{ message: string }>("/auth/resend-otp", input);
}
