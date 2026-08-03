// features/leads/lead.api.ts
//
// Client-only — every submit call needs the logged-in user's token (if
// any) straight from localStorage, same pattern as features/reviews/review.api.ts.

import { apiFetch } from "@/lib/apiClient";
import { getCurrentUserToken } from "@/features/auth/currentUser";
import type {
  SendLeadOtpInput,
  SendLeadOtpResult,
  SubmitBuyNewCarLeadInput,
  SubmitPriceDropAlertLeadInput,
  SubmitInsuranceLeadInput,
  SubmitSoftLeadInput,
  SubmitLoanLeadInput,
  SubmitLeadResult,
} from "./lead.types";

function authHeaders(): HeadersInit | undefined {
  const token = getCurrentUserToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Auto-captured attribution — same utm/landing-page/device signals the
// schema already tracks for every lead type, so callers never have to
// pass these themselves.
function captureContext() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    landingPage: window.location.pathname,
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
  };
}

export async function sendLeadOtp(input: SendLeadOtpInput): Promise<SendLeadOtpResult> {
  return apiFetch<SendLeadOtpResult>("/leads/otp/send", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function submitBuyNewCarLead(input: SubmitBuyNewCarLeadInput): Promise<SubmitLeadResult> {
  return apiFetch<SubmitLeadResult>("/leads/buy/new-cars", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...input, ...captureContext() }),
  });
}

export async function submitPriceDropAlertLead(input: SubmitPriceDropAlertLeadInput): Promise<SubmitLeadResult> {
  return apiFetch<SubmitLeadResult>("/leads/buy/price-drop", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...input, ...captureContext() }),
  });
}

export async function submitInsuranceLead(input: SubmitInsuranceLeadInput): Promise<SubmitLeadResult> {
  return apiFetch<SubmitLeadResult>("/leads/buy/insurance", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...input, ...captureContext() }),
  });
}

// No OTP — soft leads are a deliberately low-friction capture off the
// calculator pages, mobile number only.
export async function submitSoftLead(input: SubmitSoftLeadInput): Promise<SubmitLeadResult> {
  return apiFetch<SubmitLeadResult>("/leads/buy/soft", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...input, ...captureContext() }),
  });
}

export async function submitLoanLead(input: SubmitLoanLeadInput): Promise<SubmitLeadResult> {
  return apiFetch<SubmitLeadResult>("/leads/buy/loan", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...input, ...captureContext() }),
  });
}
