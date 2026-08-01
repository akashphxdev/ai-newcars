// components/leads/useLeadOtpFlow.ts
//
// Shared by every lead-capture modal — encapsulates the "logged-in
// users skip straight to submit, guests must OTP-verify their email
// first" branching so each modal only has to render its own fields and
// call requestOtp()/reset(). Only ever mounted client-side (inside a
// modal opened by a click), so reading localStorage in the initial
// render is safe — no SSR/hydration path renders this hook.
"use client";

import { useState } from "react";
import { getCurrentUser, getCurrentUserToken } from "@/features/auth/currentUser";
import { sendLeadOtp } from "@/features/leads/lead.api";
import { ApiError } from "@/lib/apiClient";

export type LeadOtpStep = "form" | "otp";

export function useLeadOtpFlow() {
  const isLoggedIn = !!getCurrentUserToken();
  const currentUser = getCurrentUser();

  const [step, setStep] = useState<LeadOtpStep>("form");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState("");

  async function requestOtp(mobile: string, email: string, name?: string) {
    setError("");
    setSendingOtp(true);
    try {
      const res = await sendLeadOtp({ mobile, email, name });
      setMaskedEmail(res.maskedEmail);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  function reset() {
    setStep("form");
    setOtp("");
    setMaskedEmail("");
    setError("");
  }

  return { isLoggedIn, currentUser, step, otp, setOtp, maskedEmail, sendingOtp, error, setError, requestOtp, reset };
}
