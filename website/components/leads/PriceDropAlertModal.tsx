"use client";
import { useState } from "react";
import Image from "next/image";
import { BellIcon, CloseIcon } from "@/components/common/icons";
import { useLeadOtpFlow } from "./useLeadOtpFlow";
import { ApiError } from "@/lib/apiClient";

const inputClass =
  "w-full rounded-xl border border-white/30 bg-white/95 px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand";

// Dedicated widget (not LeadCaptureModal) — the compact single-purpose
// design here (icon, email-first, no name field) is meaningfully
// different from the fuller Enquire/Check-Offers form, so it isn't
// forced through that shared shell. Still reuses useLeadOtpFlow for the
// actual guest-vs-logged-in + OTP mechanics (Rule: share logic, not
// unrelated JSX).
export default function PriceDropAlertModal({
  carName,
  imageUrl,
  onClose,
  onSubmit,
}: {
  carName: string;
  imageUrl: string | null;
  onClose: () => void;
  onSubmit: (values: { mobile: string; email?: string; otp?: string }) => Promise<void>;
}) {
  const { isLoggedIn, currentUser, step, otp, setOtp, maskedEmail, sendingOtp, error, setError, requestOtp, reset } =
    useLeadOtpFlow();

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const finalize = async (otpCode?: string) => {
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
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
    if (!email.trim()) {
      setError("Email is required to verify without logging in.");
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    await requestOtp(mobile, email.trim());
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border shadow-2xl">
        {imageUrl && (
          <Image src={imageUrl} alt={carName} fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-white/20 p-1 text-white transition-colors hover:bg-white/30"
        >
          <CloseIcon className="size-4.5" />
        </button>

        <div className="relative flex flex-col items-center gap-1 px-6 pb-2 pt-8 text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-white/15 text-white">
            <BellIcon className="size-6" />
          </div>
          <h3 className="text-[16px] font-bold text-white">{done ? "You're all set!" : "Never Miss a Deal!"}</h3>
          {!done && (
            <p className="text-[12.5px] leading-relaxed text-white/80">
              Get notified the moment {carName}&apos;s price drops.
            </p>
          )}
        </div>

        <div className="relative px-6 pb-6 pt-3">
          {done ? (
            <p className="text-center text-[13px] leading-relaxed text-white/80">
              We&apos;ll email you the moment the price drops on this car.
            </p>
          ) : step === "otp" ? (
            <form id="price-drop-form" onSubmit={handleOtpSubmit} className="flex flex-col gap-3">
              <p className="text-center text-[12.5px] text-white/80">
                Enter the 6-digit code sent to <span className="font-semibold text-white">{maskedEmail}</span>.
              </p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="6-digit code"
                className={`${inputClass} text-center tracking-[0.3em]`}
              />
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer self-center text-[12px] font-semibold text-white hover:underline"
              >
                ← Change email/mobile
              </button>
              {error && <p className="text-center text-[12px] font-medium text-red-300">{error}</p>}
            </form>
          ) : (
            <form id="price-drop-form" onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              {isLoggedIn ? (
                <p className="text-center text-[13px] text-white/80">
                  We&apos;ll notify{" "}
                  <span className="font-semibold text-white">{currentUser?.email ?? currentUser?.mobile}</span> when
                  the price drops.
                </p>
              ) : (
                <>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email address"
                    className={inputClass}
                  />
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    placeholder="Mobile number"
                    className={inputClass}
                  />
                </>
              )}
              {error && <p className="text-center text-[12px] font-medium text-red-300">{error}</p>}
            </form>
          )}

          {!done && (
            <button
              type="submit"
              form="price-drop-form"
              disabled={submitting || sendingOtp}
              className="mt-4 w-full cursor-pointer rounded-xl bg-brand py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step === "otp"
                ? submitting
                  ? "Verifying..."
                  : "Verify & Notify Me"
                : sendingOtp
                  ? "Sending OTP..."
                  : isLoggedIn
                    ? submitting
                      ? "Submitting..."
                      : "Notify Me"
                    : "Notify Me"}
            </button>
          )}

          {!done && (
            <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-white/70">
              <BellIcon className="size-3" /> Easy unsubscribe anytime
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
