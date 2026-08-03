"use client";
// components/leads/SoftLeadCapture.tsx
//
// Shared low-friction lead capture for the calculator pages — mobile
// number only, no OTP (unlike NewCarLeadModal/PriceDropAlertModal).
// Used by all 6 calculators, per Rule #4 (2+ places -> common file).
import { useState } from "react";
import { PhoneIcon, CheckIcon, ShieldIcon } from "@/components/common/icons";
import { getCurrentUser } from "@/features/auth/currentUser";
import { submitSoftLead } from "@/features/leads/lead.api";
import type { SoftLeadCalculatorType } from "@/features/leads/lead.types";
import { inputClass } from "@/components/calculators/CalculatorFormControls";

export default function SoftLeadCapture({
  calculatorType,
  brandId,
  modelId,
  inputSummary,
}: {
  calculatorType: SoftLeadCalculatorType;
  brandId?: number;
  modelId?: number;
  /** Short human-readable snapshot of the result, e.g. "EMI ₹15,320/mo, ₹8L @ 9%, 5yr" — shown to admins, never fabricated beyond what's on screen. */
  inputSummary: string;
}) {
  const user = getCurrentUser();
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (mobileValue: string) => {
    if (!/^\d{10}$/.test(mobileValue)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitSoftLead({ mobile: mobileValue, brandId, modelId, calculatorType, inputSummary });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-brand-soft p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <CheckIcon className="size-4" />
        </span>
        <p className="text-[13px] font-semibold text-ink">Thanks! Our team will call you back shortly.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <PhoneIcon className="size-4" />
        </span>
        <div>
          <p className="text-[13.5px] font-bold text-ink">Want a callback about this?</p>
          <p className="text-[12px] text-muted">Our team can help with financing, offers, and availability.</p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-start">
        {user ? (
          <button
            type="button"
            onClick={() => handleSubmit(user.mobile)}
            disabled={submitting}
            className="cursor-pointer whitespace-nowrap rounded-xl bg-brand px-5 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Requesting..." : `Get a callback on ${user.mobile}`}
          </button>
        ) : (
          <>
            <input
              type="text"
              inputMode="numeric"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter 10-digit mobile number"
              className={`${inputClass} sm:max-w-64`}
            />
            <button
              type="button"
              onClick={() => handleSubmit(mobile)}
              disabled={submitting}
              className="cursor-pointer whitespace-nowrap rounded-xl bg-brand px-5 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Requesting..." : "Get a callback"}
            </button>
          </>
        )}
      </div>

      {error && <p className="mt-2 text-[11.5px] font-medium text-red-600">{error}</p>}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
        <ShieldIcon className="size-3" /> No OTP needed — we'll only use this number to call you back.
      </p>
    </div>
  );
}
