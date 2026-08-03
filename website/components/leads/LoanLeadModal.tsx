"use client";
// components/leads/LoanLeadModal.tsx
//
// Dedicated 2-step wizard (Loan Details → Contact Details) — same
// "hard lead wizard" pattern as InsuranceLeadModal (shared
// StepIndicator/LeadFormControls, useLeadOtpFlow for the OTP
// mechanics), just fewer steps since a loan enquiry doesn't need
// vehicle-registration fields the way an insurance quote does.
import { useEffect, useState } from "react";
import Image from "next/image";
import { CloseIcon, CheckIcon, ShieldIcon, LockIcon, ChevronIcon, CompareIcon, PercentIcon, ClockIcon, PhoneIcon } from "@/components/common/icons";
import { useLeadOtpFlow } from "./useLeadOtpFlow";
import StepIndicator from "./StepIndicator";
import { inputClass, selectClass, Label } from "./LeadFormControls";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import type { MileageCalculatorVariant } from "@/features/calculators/mileageCalculator.types";
import { getLenderOptions } from "@/features/lenders/lender.api";
import type { LenderOption } from "@/features/lenders/lender.types";
import { getSiteSettings } from "@/features/siteSettings/siteSetting.api";
import { formatRupee } from "@/lib/calculatorFormat";
import { ApiError } from "@/lib/apiClient";

const TENURE_OPTIONS = [1, 2, 3, 4, 5, 7];
const DEFAULT_INTEREST_RATE = 9;

type WizardStep = "loan" | "contact";
const STEPS = [
  { key: "loan", label: "Loan Details" },
  { key: "contact", label: "Your Details" },
];

const BENEFITS = [
  { Icon: CompareIcon, title: "Compare Top Lenders", sub: "Compare offers from leading banks & NBFCs" },
  { Icon: PercentIcon, title: "Lowest Interest Rates", sub: "Get the best rate for your loan" },
  { Icon: ClockIcon, title: "Quick & Easy", sub: "100% digital process in just 2 minutes" },
  { Icon: ShieldIcon, title: "Trusted & Secure", sub: "Your data is safe and secure with us" },
];

export interface LoanLeadSubmitValues {
  name?: string;
  mobile: string;
  email?: string;
  otp?: string;
  variantId?: number;
  lenderId?: number;
  loanAmount?: number;
  tenureYears?: number;
  interestRate?: number;
  monthlyIncome?: number;
}

export default function LoanLeadModal({
  brandName,
  carName,
  modelId,
  imageUrl,
  // Pre-fill from a calculator that already worked these numbers out
  // (EMI/Down Payment Calculator) — the whole point of offering this
  // CTA there is that the visitor shouldn't have to re-enter what
  // they've already calculated. Still fully editable.
  initialLoanAmount,
  initialTenureYears,
  initialInterestRate,
  onClose,
  onSubmit,
}: {
  brandName: string;
  carName: string;
  modelId: number;
  imageUrl: string | null;
  initialLoanAmount?: number;
  initialTenureYears?: number;
  initialInterestRate?: number;
  onClose: () => void;
  onSubmit: (values: LoanLeadSubmitValues) => Promise<void>;
}) {
  const { isLoggedIn, currentUser, step: otpStep, otp, setOtp, maskedEmail, sendingOtp, error, setError, requestOtp, reset: resetOtp } =
    useLeadOtpFlow();

  const [wizardStep, setWizardStep] = useState<WizardStep>("loan");

  // Step 1 — Loan Details
  const [variants, setVariants] = useState<MileageCalculatorVariant[]>([]);
  const [variantId, setVariantId] = useState<number | "">("");
  const [lenders, setLenders] = useState<LenderOption[]>([]);
  const [lenderId, setLenderId] = useState<number | "">("");
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount ? String(Math.round(initialLoanAmount)) : "");
  const [tenureYears, setTenureYears] = useState<number | "">(initialTenureYears ?? "");
  const [interestRate, setInterestRate] = useState(initialInterestRate ?? DEFAULT_INTEREST_RATE);
  const [monthlyIncome, setMonthlyIncome] = useState("");

  // Step 2 — Contact Details
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedMobile, setSubmittedMobile] = useState("");
  const [supportNumber, setSupportNumber] = useState<string | null>(null);

  useEffect(() => {
    getVariantsByModel(modelId)
      .then(setVariants)
      .catch(() => {});
    getLenderOptions()
      .then(setLenders)
      .catch(() => {
        // Convenience field, not critical — dropdown just stays empty.
      });
    getSiteSettings()
      .then((s) => setSupportNumber(s.contactNumber))
      .catch(() => {});
  }, [modelId]);

  const loanStepValid = Number(loanAmount) > 0 && tenureYears !== "";

  const goToContact = () => {
    if (!loanStepValid) {
      setError("Please enter loan amount and tenure.");
      return;
    }
    setError("");
    setWizardStep("contact");
  };

  const goBack = () => {
    setError("");
    setWizardStep("loan");
  };

  const finalize = async (otpCode?: string) => {
    const finalMobile = isLoggedIn ? currentUser!.mobile : mobile;
    const finalEmail = isLoggedIn ? (currentUser?.email ?? "") : email;
    const finalName = isLoggedIn ? currentUser?.name : name.trim() || undefined;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        name: finalName,
        mobile: finalMobile,
        email: finalEmail || undefined,
        otp: otpCode,
        variantId: variantId || undefined,
        lenderId: lenderId || undefined,
        loanAmount: Number(loanAmount) || undefined,
        tenureYears: tenureYears || undefined,
        interestRate,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
      });
      setSubmittedMobile(finalMobile);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!termsAccepted) {
      setError("Please agree to the Terms & Privacy Policy to continue.");
      return;
    }
    if (isLoggedIn) {
      await finalize();
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required to verify without logging in.");
      return;
    }
    await requestOtp(mobile, email.trim(), name.trim() || undefined);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    await finalize(otp);
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === wizardStep);
  const showSidebar = !done && otpStep !== "otp";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border shadow-2xl sm:max-h-[80vh] sm:max-w-3xl sm:rounded-2xl lg:max-w-5xl">
        {/* Full-panel car image, faded behind everything — same treatment as InsuranceLeadModal. */}
        <div className="absolute inset-0 z-0 bg-white">
          {imageUrl && <Image src={imageUrl} alt={carName} fill sizes="1024px" className="object-cover opacity-35" />}
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 justify-center pb-1 pt-2 sm:hidden">
            <span className="h-1 w-10 rounded-full bg-border" />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-soft bg-white/45 px-5 py-3 backdrop-blur-sm sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <PercentIcon className="size-4" />
              </span>
              <h3 className="truncate text-[14.5px] font-bold text-ink">{done ? "Thank you!" : `Apply for Loan — ${carName}`}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-page hover:text-ink"
            >
              <CloseIcon className="size-4.5" />
            </button>
          </div>

          {!done && otpStep !== "otp" && (
            <div className="shrink-0 border-b border-border-soft bg-white/45 px-5 py-3 backdrop-blur-sm sm:px-6">
              <StepIndicator steps={STEPS} currentIndex={currentStepIndex} />
            </div>
          )}

          <div className="overflow-y-auto px-5 py-4 sm:px-6">
            {done ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <CheckIcon className="size-7" />
                </div>
                <p className="text-[13px] leading-relaxed text-ink">
                  Your request has been submitted! Our loan team will reach out to you at{" "}
                  <span className="font-semibold text-ink">{submittedMobile}</span> with the best offers shortly.
                </p>
              </div>
            ) : otpStep === "otp" ? (
              <form id="loan-lead-form" onSubmit={handleOtpSubmit} className="mx-auto flex max-w-sm flex-col gap-4">
                <p className="text-[12.5px] text-ink">
                  Enter the 6-digit code sent to <span className="font-semibold text-ink">{maskedEmail}</span>.
                </p>
                <div>
                  <Label required>OTP</Label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="6-digit code"
                    className={inputClass}
                  />
                </div>
                <button type="button" onClick={resetOtp} className="cursor-pointer self-start text-[12px] font-semibold text-brand hover:underline">
                  ← Change details
                </button>
                {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
              </form>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_250px]">
                <div className="rounded-2xl border border-border bg-white/35 p-4">
                  {wizardStep === "loan" ? (
                    <div className="flex flex-col gap-3.5">
                      <div>
                        <h4 className="text-[14px] font-bold text-ink">Tell us about the loan you need</h4>
                        <p className="text-[11.5px] text-muted">For {brandName} {carName}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Variant (Optional)</Label>
                          <select value={variantId} onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : "")} className={selectClass}>
                            <option value="">Select Variant</option>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.variantName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Preferred Lender (Optional)</Label>
                          <select value={lenderId} onChange={(e) => setLenderId(e.target.value ? Number(e.target.value) : "")} className={selectClass}>
                            <option value="">No preference</option>
                            {lenders.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label required>Loan Amount</Label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(e.target.value.replace(/\D/g, ""))}
                            placeholder="e.g. 800000"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <Label>Monthly Income (Optional)</Label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={monthlyIncome}
                            onChange={(e) => setMonthlyIncome(e.target.value.replace(/\D/g, ""))}
                            placeholder="e.g. 50000"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div>
                        <Label required>Loan Tenure</Label>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                          {TENURE_OPTIONS.map((y) => (
                            <button
                              key={y}
                              type="button"
                              onClick={() => setTenureYears(y)}
                              className={`cursor-pointer rounded-xl border bg-white/60 px-2 py-2 text-[12.5px] font-bold backdrop-blur-sm transition-colors ${
                                tenureYears === y ? "border-brand text-brand" : "border-border text-ink hover:border-brand"
                              }`}
                            >
                              {y} {y === 1 ? "Year" : "Years"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <Label>Interest Rate (p.a.)</Label>
                          <span className="text-[11px] font-medium text-muted">Typical Range: 8% - 12%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInterestRate((r) => Math.max(1, +(r - 0.1).toFixed(2)))}
                            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-white/60 text-ink backdrop-blur-sm transition-colors hover:border-brand hover:text-brand"
                            aria-label="Decrease interest rate"
                          >
                            −
                          </button>
                          <div className="flex-1 rounded-xl border border-border bg-white/60 py-2.5 text-center text-[13px] font-bold text-ink backdrop-blur-sm">
                            {interestRate.toFixed(2)}%
                          </div>
                          <button
                            type="button"
                            onClick={() => setInterestRate((r) => Math.min(20, +(r + 0.1).toFixed(2)))}
                            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-white/60 text-ink backdrop-blur-sm transition-colors hover:border-brand hover:text-brand"
                            aria-label="Increase interest rate"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {Number(loanAmount) > 0 && (
                        <p className="text-[11.5px] text-muted">
                          Requesting {formatRupee(Number(loanAmount))} over {tenureYears || "—"} years — our loan team will confirm the exact rate.
                        </p>
                      )}
                      {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
                    </div>
                  ) : (
                    <form id="loan-lead-form" onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                      <h4 className="text-[14px] font-bold text-ink">Your Details</h4>
                      {isLoggedIn ? (
                        <p className="text-[13px] text-ink">
                          We&apos;ll reach out to <span className="font-semibold text-ink">{currentUser?.name}</span> at{" "}
                          <span className="font-semibold text-ink">{currentUser?.mobile}</span>.
                        </p>
                      ) : (
                        <>
                          <div>
                            <Label>Full Name</Label>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100} className={inputClass} />
                          </div>
                          <div>
                            <Label required>Mobile Number</Label>
                            <input
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              inputMode="numeric"
                              placeholder="10-digit mobile number"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <Label required>Email</Label>
                            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className={inputClass} />
                            <p className="mt-1 text-[11px] text-muted">We&apos;ll send a verification code here since you&apos;re not logged in.</p>
                          </div>
                        </>
                      )}

                      <label className="flex cursor-pointer items-start gap-2 text-[12px] text-ink">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
                        />
                        I agree to the Terms &amp; Privacy Policy.
                      </label>

                      {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
                    </form>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    {wizardStep === "contact" && (
                      <button
                        type="button"
                        onClick={goBack}
                        className="flex cursor-pointer items-center gap-1 rounded-xl border border-border bg-white/50 px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
                      >
                        <ChevronIcon dir="left" className="size-3.5" /> Back
                      </button>
                    )}
                    {wizardStep === "contact" ? (
                      <button
                        type="submit"
                        form="loan-lead-form"
                        disabled={submitting || sendingOtp}
                        className="flex-1 cursor-pointer rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingOtp ? "Sending OTP..." : submitting ? "Submitting..." : "Apply for Loan"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goToContact}
                        className="flex-1 cursor-pointer rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] sm:flex-none sm:self-end sm:px-8"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>

                {showSidebar && (
                  <div className="hidden flex-col gap-3 lg:flex">
                    <div className="rounded-2xl border border-border bg-white/35 p-4">
                      <h4 className="mb-3 text-[13px] font-bold text-ink">Why apply through TimesAuto?</h4>
                      <div className="flex flex-col gap-3">
                        {BENEFITS.map(({ Icon, title, sub }) => (
                          <div key={title} className="flex items-start gap-2.5">
                            <span className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                              <Icon className="size-3.5" />
                            </span>
                            <div>
                              <p className="text-[12.5px] font-bold text-ink">{title}</p>
                              <p className="text-[11px] leading-snug text-muted">{sub}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {supportNumber && (
                      <div className="rounded-2xl bg-brand-soft p-4">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                            <PhoneIcon className="size-3.5" />
                          </span>
                          <p className="text-[12.5px] font-bold text-ink">Need Help?</p>
                        </div>
                        <p className="mt-2 text-[11px] leading-snug text-ink/80">Our experts are here to assist you</p>
                        <a href={`tel:${supportNumber}`} className="mt-1 block text-[14px] font-extrabold text-brand no-underline">
                          {supportNumber}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!done && otpStep === "otp" && (
            <div className="shrink-0 border-t border-border-soft bg-white/45 px-5 py-3 backdrop-blur-sm sm:px-6">
              <button
                type="submit"
                form="loan-lead-form"
                disabled={submitting}
                className="mx-auto block w-full max-w-sm cursor-pointer rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Verifying..." : "Verify & Submit"}
              </button>
            </div>
          )}

          {!done && (
            <p className="flex shrink-0 items-center justify-center gap-1.5 border-t border-border-soft bg-white/45 px-5 py-2 text-center text-[11px] text-muted backdrop-blur-sm sm:px-6">
              <LockIcon className="size-3" /> Your information is safe with us
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
