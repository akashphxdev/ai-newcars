"use client";
import { useState } from "react";
import { CloseIcon } from "@/components/common/icons";
import { useLeadOtpFlow } from "./useLeadOtpFlow";
import { ApiError } from "@/lib/apiClient";

const inputClass =
  "w-full rounded-xl border border-border px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand";

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-faint">
    {children}
    {required && <span className="text-brand"> *</span>}
  </span>
);

export interface LeadFormValues {
  name?: string;
  mobile: string;
  email?: string;
  otp?: string;
}

// One shared modal shell (header, guest-vs-logged-in branching, OTP
// step, footer button) for every lead type — callers only supply their
// own copy and a submit function already bound to their lead-specific
// fields (brandId/modelId/interestType etc via closure). Same "one
// reusable shell + caller-injected fields" pattern as CarModelHero's
// sibling components, kept in one place per the "extract shared code"
// rule rather than duplicating this shell per lead type.
export default function LeadCaptureModal({
  title,
  showNameField = true,
  successMessage = "We've received your request — our team will reach out to you shortly.",
  onClose,
  onSubmit,
}: {
  title: string;
  showNameField?: boolean;
  successMessage?: string;
  onClose: () => void;
  onSubmit: (values: LeadFormValues) => Promise<void>;
}) {
  const { isLoggedIn, currentUser, step, otp, setOtp, maskedEmail, sendingOtp, error, setError, requestOtp, reset } =
    useLeadOtpFlow();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const finalize = async (otpCode?: string) => {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim() || undefined,
        mobile: isLoggedIn ? currentUser!.mobile : mobile,
        email: isLoggedIn ? (currentUser?.email ?? undefined) : email,
        otp: otpCode,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl">
        <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-border-soft px-5 py-4">
          <h3 className="text-[15px] font-bold text-ink">{done ? "Thank you!" : title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-page hover:text-ink"
          >
            <CloseIcon className="size-4.5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {done ? (
            <p className="text-[13px] leading-relaxed text-muted">{successMessage}</p>
          ) : step === "otp" ? (
            <form id="lead-capture-form" onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
              <p className="text-[12.5px] text-muted">
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
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer self-start text-[12px] font-semibold text-brand hover:underline"
              >
                ← Change mobile/email
              </button>
              {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
            </form>
          ) : (
            <form id="lead-capture-form" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              {isLoggedIn ? (
                <p className="text-[13px] text-muted">
                  We&apos;ll reach out to <span className="font-semibold text-ink">{currentUser?.name}</span> at{" "}
                  <span className="font-semibold text-ink">{currentUser?.mobile}</span>.
                </p>
              ) : (
                <>
                  {showNameField && (
                    <div>
                      <Label>Your Name</Label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        maxLength={100}
                        className={inputClass}
                      />
                    </div>
                  )}
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
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-faint">
                      We&apos;ll send a verification code here since you&apos;re not logged in.
                    </p>
                  </div>
                </>
              )}
              {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
            </form>
          )}
        </div>

        {!done && (
          <div className="shrink-0 border-t border-border-soft px-5 py-4">
            <button
              type="submit"
              form="lead-capture-form"
              disabled={submitting || sendingOtp}
              className="w-full cursor-pointer rounded-xl bg-brand py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step === "otp"
                ? submitting
                  ? "Verifying..."
                  : "Verify & Submit"
                : sendingOtp
                  ? "Sending OTP..."
                  : isLoggedIn
                    ? submitting
                      ? "Submitting..."
                      : "Submit"
                    : "Send OTP"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
