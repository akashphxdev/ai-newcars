"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CloseIcon, CheckIcon, TagIcon, PercentIcon, ShieldIcon, LockIcon } from "@/components/common/icons";
import { useLeadOtpFlow } from "./useLeadOtpFlow";
import { getCityOptions } from "@/features/cities/city.api";
import type { CityOption } from "@/features/cities/city.types";
import type { BuyNewCarLeadInterestType } from "@/features/leads/lead.types";
import { ApiError } from "@/lib/apiClient";

const inputClass =
  "w-full rounded-xl border border-border px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand";

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-faint">
    {children}
    {required && <span className="text-brand"> *</span>}
  </span>
);

// Copy differs by which CTA opened the modal — everything else about
// the flow (fields, OTP, thank-you screen) is identical.
const COPY: Record<
  BuyNewCarLeadInterestType,
  { title: string; subtitle: (carName: string) => string; button: string }
> = {
  enquiry: {
    title: "Interested in this car?",
    subtitle: () => "Share your details and we'll contact you shortly.",
    button: "Yes, I'm Interested",
  },
  offer_check: {
    title: "Get Best Offer",
    subtitle: (carName) => `Get the best price offers for ${carName}`,
    button: "Get Offer",
  },
};

const TRUST_BADGES = [
  { Icon: TagIcon, line1: "Best Price", line2: "Guaranteed" },
  { Icon: PercentIcon, line1: "Lowest", line2: "EMI Options" },
  { Icon: ShieldIcon, line1: "100% Secure", line2: "Private" },
];

// Dedicated modal for both "Enquire Now" and "Check Offers" — matches
// the reference design (car image left / form right, trust badges,
// dedicated thank-you screen) rather than the generic
// LeadCaptureModal, since the field set (Name/Mobile/City, no Email
// visible) and layout diverge enough that forcing it through the
// shared shell would just mean a lot of conditional branches in there
// instead of here.
export default function NewCarLeadModal({
  interestType,
  carName,
  imageUrl,
  priceLabel,
  onClose,
  onSubmit,
}: {
  interestType: BuyNewCarLeadInterestType;
  carName: string;
  imageUrl: string | null;
  priceLabel: string;
  onClose: () => void;
  onSubmit: (values: { name?: string; mobile: string; email?: string; otp?: string; cityId?: number }) => Promise<void>;
}) {
  const copy = COPY[interestType];
  const { isLoggedIn, currentUser, step, otp, setOtp, maskedEmail, sendingOtp, error, setError, requestOtp, reset } =
    useLeadOtpFlow();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedMobile, setSubmittedMobile] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [cityFocused, setCityFocused] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const [cityDropdownRect, setCityDropdownRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  // The city field lives inside an `overflow-y-auto` panel — a normal
  // `position: absolute` dropdown gets clipped at that panel's edge
  // (and painted behind the trust-badges section below it) no matter
  // what z-index it's given. Rendering it via a portal at `position:
  // fixed`, positioned off the input's own screen coordinates, escapes
  // that clipping entirely.
  const updateCityDropdownPosition = () => {
    const rect = cityInputRef.current?.getBoundingClientRect();
    if (rect) {
      setCityDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  useEffect(() => {
    getCityOptions()
      .then(setCities)
      .catch(() => {
        // City list is a convenience field, not critical to the page —
        // fail silently, the datalist just stays empty and the typed
        // value validation below catches it.
      });
  }, []);

  const resolveCityId = (): number | undefined => {
    const match = cities.find((c) => c.name.toLowerCase() === cityInput.trim().toLowerCase());
    return match?.id;
  };

  // Only ever computed off a non-empty query — the suggestion list stays
  // closed until the user actually types (see the `cityInput.trim().length
  // > 0` guard where this is rendered), so this never needs to fall back
  // to "show everything".
  const filteredCities = cities
    .filter((c) => c.name.toLowerCase().includes(cityInput.trim().toLowerCase()))
    .slice(0, 8);

  const finalize = async (otpCode?: string) => {
    const cityId = resolveCityId();
    if (!cityId) {
      setError("Please select a valid city from the list.");
      return;
    }
    const finalMobile = isLoggedIn ? currentUser!.mobile : mobile;
    const finalEmail = isLoggedIn ? (currentUser?.email ?? "") : email;
    // Logged-in submissions never showed a Name field (the account
    // already has one) — send it anyway so the admin list/detail can
    // still show who the lead is, not just a userId.
    const finalName = isLoggedIn ? currentUser?.name : name.trim() || undefined;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        name: finalName,
        mobile: finalMobile,
        email: finalEmail || undefined,
        otp: otpCode,
        cityId,
      });
      setSubmittedMobile(finalMobile);
      setSubmittedEmail(finalEmail);
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
    if (!resolveCityId()) {
      setError("Please select a valid city from the list.");
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-white/80 p-1 text-muted transition-colors hover:bg-page hover:text-ink"
        >
          <CloseIcon className="size-4.5" />
        </button>

        {done ? (
          <div className="flex w-full flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckIcon className="size-7" />
            </div>
            <h3 className="text-[17px] font-bold text-ink">Thank You!</h3>
            <p className="text-[13px] leading-relaxed text-muted">
              Your enquiry for <span className="font-semibold text-ink">{carName}</span> has been submitted
              successfully.
            </p>
            <div className="w-full max-w-sm rounded-xl bg-page px-4 py-3">
              <p className="text-[12.5px] text-muted">
                Our expert will contact you at <span className="font-semibold text-ink">{submittedMobile}</span>
                {submittedEmail && (
                  <>
                    {" "}
                    / <span className="font-semibold text-ink">{submittedEmail}</span>
                  </>
                )}{" "}
                shortly.
              </p>
            </div>
            <p className="text-[11.5px] text-faint">You will also receive updates on WhatsApp.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full max-w-sm cursor-pointer rounded-xl border border-border py-3 text-sm font-bold text-ink transition-colors hover:bg-page"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Left — car preview, full-bleed image, name/price overlaid at the top */}
            <div className="relative h-56 shrink-0 overflow-hidden bg-page sm:h-auto sm:w-[60%]">
              {imageUrl && (
                <Image src={imageUrl} alt={carName} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover" />
              )}
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/25 to-transparent px-4 pb-8 pt-4">
                <p className="text-[14px] font-bold text-white">{carName}</p>
                <p className="text-[12px] font-semibold text-white/90">Ex-Showroom Price {priceLabel}</p>
              </div>
            </div>

            {/* Right — form */}
            <div className="flex min-w-0 flex-1 flex-col bg-page">
              <div className="shrink-0 px-5 pb-2 pt-5">
                <h3 className="text-[15px] font-bold text-ink">{copy.title}</h3>
                <p className="mt-0.5 text-[12px] text-muted">{copy.subtitle(carName)}</p>
              </div>

              <div className="relative z-10 flex-1 overflow-y-auto px-5 py-3">
                {step === "otp" ? (
                  <form id="new-car-lead-form" onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
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
                      ← Change details
                    </button>
                    {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
                  </form>
                ) : (
                  <form id="new-car-lead-form" onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                    {isLoggedIn ? (
                      <p className="text-[13px] text-muted">
                        We&apos;ll reach out to <span className="font-semibold text-ink">{currentUser?.name}</span>{" "}
                        at <span className="font-semibold text-ink">{currentUser?.mobile}</span>.
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
                          <p className="mt-1 text-[11px] text-faint">We&apos;ll send a verification code here since you&apos;re not logged in.</p>
                        </div>
                      </>
                    )}

                    <div>
                      <Label required>City</Label>
                      <input
                        ref={cityInputRef}
                        value={cityInput}
                        onChange={(e) => {
                          setCityInput(e.target.value);
                          updateCityDropdownPosition();
                        }}
                        onFocus={() => {
                          setCityFocused(true);
                          updateCityDropdownPosition();
                        }}
                        onBlur={() => setCityFocused(false)}
                        placeholder="Type your city"
                        autoComplete="off"
                        className={inputClass}
                      />
                      {cityFocused &&
                        cityInput.trim().length > 0 &&
                        filteredCities.length > 0 &&
                        cityDropdownRect &&
                        createPortal(
                          <ul
                            style={{
                              position: "fixed",
                              top: cityDropdownRect.top,
                              left: cityDropdownRect.left,
                              width: cityDropdownRect.width,
                            }}
                            className="z-100 max-h-44 overflow-y-auto rounded-xl border border-border bg-white shadow-lg"
                          >
                            {filteredCities.map((c) => (
                              <li key={c.id}>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    // mousedown (not click) fires before the
                                    // input's blur, so the selection registers
                                    // before onBlur closes this list.
                                    e.preventDefault();
                                    setCityInput(c.name);
                                    setCityFocused(false);
                                  }}
                                  className="block w-full cursor-pointer px-3 py-2 text-left text-[13px] text-ink hover:bg-page"
                                >
                                  {c.name}
                                </button>
                              </li>
                            ))}
                          </ul>,
                          document.body,
                        )}
                    </div>

                    {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
                  </form>
                )}
              </div>

              {step !== "otp" && (
                <div className="grid shrink-0 grid-cols-3 gap-1 border-t border-border-soft px-3 py-3">
                  {TRUST_BADGES.map(({ Icon, line1, line2 }) => (
                    <div key={line1} className="flex flex-col items-center gap-1 text-center">
                      <span className="flex size-7 items-center justify-center rounded-full bg-orange-50 text-brand">
                        <Icon className="size-3.5" />
                      </span>
                      <p className="text-[10.5px] font-bold leading-tight text-ink">{line1}</p>
                      <p className="text-[9.5px] leading-tight text-faint">{line2}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="shrink-0 border-t border-border-soft px-5 py-4">
                <button
                  type="submit"
                  form="new-car-lead-form"
                  disabled={submitting || sendingOtp}
                  className="w-full cursor-pointer rounded-xl bg-brand py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {step === "otp"
                    ? submitting
                      ? "Verifying..."
                      : "Verify & Submit"
                    : sendingOtp
                      ? "Sending OTP..."
                      : submitting
                        ? "Submitting..."
                        : copy.button}
                </button>
                <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
                  <LockIcon className="size-3" /> Your information is safe with us
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
