"use client";
// components/leads/InsuranceLeadModal.tsx
//
// Dedicated 3-step wizard (Vehicle → Insurance → Contact) — not the
// generic LeadCaptureModal, since insurance collects meaningfully more
// fields (registration year/state/city, insurance type, renewal
// details) than any other lead type. Still reuses useLeadOtpFlow for
// the actual guest-vs-logged-in + OTP mechanics (Rule: share logic,
// not unrelated JSX), same as every other lead modal.
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CloseIcon,
  CheckIcon,
  ShieldIcon,
  LockIcon,
  ChevronIcon,
  CompareIcon,
  PercentIcon,
  ClockIcon,
  PhoneIcon,
} from "@/components/common/icons";
import { useLeadOtpFlow } from "./useLeadOtpFlow";
import StepIndicator from "./StepIndicator";
import { inputClass, selectClass, Label } from "./LeadFormControls";
import { getCityOptions } from "@/features/cities/city.api";
import type { CityOption } from "@/features/cities/city.types";
import { getStateOptions } from "@/features/states/state.api";
import type { StateOption } from "@/features/states/state.types";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import { FUEL_TYPES, FUEL_TYPE_LABELS } from "@/features/calculators/mileageCalculator.types";
import type { FuelType, MileageCalculatorVariant } from "@/features/calculators/mileageCalculator.types";
import { getSiteSettings } from "@/features/siteSettings/siteSetting.api";
import type { InsuranceType } from "@/features/leads/lead.types";
import { ApiError } from "@/lib/apiClient";

type WizardStep = "vehicle" | "insurance" | "contact";
const STEPS: { key: WizardStep; label: string }[] = [
  { key: "vehicle", label: "Vehicle Details" },
  { key: "insurance", label: "Policy Details" },
  { key: "contact", label: "Your Details" },
];

const INSURANCE_TYPE_OPTIONS: { value: InsuranceType; label: string }[] = [
  { value: "new", label: "New Car" },
  { value: "renew", label: "Renew Existing Policy" },
  { value: "expired", label: "Expired Policy" },
];

const BENEFITS = [
  { Icon: CompareIcon, title: "Compare Top Plans", sub: "Compare quotes from leading insurers" },
  { Icon: PercentIcon, title: "Save Up To 70%", sub: "Get the best price for your insurance" },
  { Icon: ClockIcon, title: "Quick & Easy", sub: "100% digital process in just 2 minutes" },
  { Icon: ShieldIcon, title: "Trusted & Secure", sub: "Your data is safe and secure with us" },
];

const CURRENT_YEAR = new Date().getFullYear();
const REGISTRATION_YEARS = Array.from({ length: 26 }, (_, i) => CURRENT_YEAR - i);

export interface InsuranceLeadSubmitValues {
  name?: string;
  mobile: string;
  email?: string;
  otp?: string;
  variantId?: number;
  registrationYear?: number;
  registrationStateId?: number;
  cityId?: number;
  insuranceType: InsuranceType;
  currentInsuranceCompany?: string;
  policyExpiryDate?: string;
  hadClaim?: boolean;
}

export default function InsuranceLeadModal({
  brandName,
  carName,
  modelId,
  imageUrl,
  onClose,
  onSubmit,
}: {
  brandName: string;
  carName: string;
  modelId: number;
  imageUrl: string | null;
  onClose: () => void;
  onSubmit: (values: InsuranceLeadSubmitValues) => Promise<void>;
}) {
  const { isLoggedIn, currentUser, step: otpStep, otp, setOtp, maskedEmail, sendingOtp, error, setError, requestOtp, reset: resetOtp } =
    useLeadOtpFlow();

  const [wizardStep, setWizardStep] = useState<WizardStep>("vehicle");

  // Step 1 — Vehicle Details
  const [variants, setVariants] = useState<MileageCalculatorVariant[]>([]);
  const [fuelType, setFuelType] = useState<FuelType | "">("");
  const [variantId, setVariantId] = useState<number | "">("");
  const [registrationYear, setRegistrationYear] = useState<number | "">("");
  const [states, setStates] = useState<StateOption[]>([]);
  const [stateId, setStateId] = useState<number | "">("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [cityId, setCityId] = useState<number | "">("");

  // Step 2 — Policy Details
  const [insuranceType, setInsuranceType] = useState<InsuranceType | "">("");
  const [currentInsuranceCompany, setCurrentInsuranceCompany] = useState("");
  const [policyExpiryDate, setPolicyExpiryDate] = useState("");
  const [hadClaim, setHadClaim] = useState<boolean | "">("");

  // Step 3 — Your Details
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
    getStateOptions()
      .then(setStates)
      .catch(() => {
        // Convenience field, not critical — dropdown just stays empty.
      });
    getCityOptions()
      .then(setCities)
      .catch(() => {});
    getSiteSettings()
      .then((s) => setSupportNumber(s.contactNumber))
      .catch(() => {});
  }, [modelId]);

  // Only fuel types this model is actually sold in — same
  // no-fabricated-options principle as the Fuel Comparison Calculator.
  const availableFuelTypes = useMemo(
    () => FUEL_TYPES.filter((ft) => variants.some((v) => (ft === "ev" ? v.isElectric : !v.isElectric && v.fuelType?.toLowerCase() === ft))),
    [variants],
  );

  const filteredVariants = useMemo(
    () => (fuelType ? variants.filter((v) => (fuelType === "ev" ? v.isElectric : !v.isElectric && v.fuelType?.toLowerCase() === fuelType)) : variants),
    [variants, fuelType],
  );

  useEffect(() => {
    setVariantId("");
  }, [fuelType]);

  // City list narrows to the selected state — same cascading pattern as
  // Brand → Model → Variant elsewhere on the site.
  const filteredCities = useMemo(() => (stateId ? cities.filter((c) => c.stateId === stateId) : []), [cities, stateId]);

  useEffect(() => {
    setCityId("");
  }, [stateId]);

  const vehicleStepValid = registrationYear !== "" && stateId !== "" && cityId !== "";
  const insuranceStepValid = insuranceType !== "" && (insuranceType !== "renew" || hadClaim !== "");

  const goToInsurance = () => {
    if (!vehicleStepValid) {
      setError("Please fill all required fields.");
      return;
    }
    setError("");
    setWizardStep("insurance");
  };

  const goToContact = () => {
    if (!insuranceStepValid) {
      setError("Please fill all required fields.");
      return;
    }
    setError("");
    setWizardStep("contact");
  };

  const goBack = (to: WizardStep) => {
    setError("");
    setWizardStep(to);
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
        registrationYear: registrationYear || undefined,
        registrationStateId: stateId || undefined,
        cityId: cityId || undefined,
        insuranceType: insuranceType as InsuranceType,
        currentInsuranceCompany: insuranceType === "renew" ? currentInsuranceCompany.trim() || undefined : undefined,
        policyExpiryDate: insuranceType === "renew" ? policyExpiryDate || undefined : undefined,
        hadClaim: insuranceType === "renew" && hadClaim !== "" ? hadClaim : undefined,
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
        {/* Full-panel car image, faded behind everything — a light wash
            keeps all foreground text dark/readable on top of it. */}
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
                <ShieldIcon className="size-4" />
              </span>
              <h3 className="truncate text-[14.5px] font-bold text-ink">{done ? "Thank you!" : `Get Insurance Quote — ${carName}`}</h3>
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
                  Your request has been submitted! Our insurance team will reach out to you at{" "}
                  <span className="font-semibold text-ink">{submittedMobile}</span> with the best quotes shortly.
                </p>
              </div>
            ) : otpStep === "otp" ? (
              <form id="insurance-lead-form" onSubmit={handleOtpSubmit} className="mx-auto flex max-w-sm flex-col gap-4">
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
                <button
                  type="button"
                  onClick={resetOtp}
                  className="cursor-pointer self-start text-[12px] font-semibold text-brand hover:underline"
                >
                  ← Change details
                </button>
                {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
              </form>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_250px]">
                <div className="rounded-2xl border border-border bg-white/35 p-4">
                  {wizardStep === "vehicle" ? (
                    <div className="flex flex-col gap-3.5">
                      <div>
                        <h4 className="text-[14px] font-bold text-ink">Tell us about your vehicle</h4>
                        <p className="text-[11.5px] text-muted">
                          All fields marked <span className="text-brand">*</span> are mandatory
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Car Brand</Label>
                          <input type="text" readOnly value={brandName} className={`${inputClass} bg-page/60`} />
                        </div>
                        <div>
                          <Label>Car Model</Label>
                          <input type="text" readOnly value={carName} className={`${inputClass} bg-page/60`} />
                        </div>
                        <div>
                          <Label>Variant (Optional)</Label>
                          <select value={variantId} onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : "")} className={selectClass}>
                            <option value="">Select Variant</option>
                            {filteredVariants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.variantName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Fuel Type</Label>
                          <select
                            value={fuelType}
                            onChange={(e) => setFuelType((e.target.value as FuelType) || "")}
                            disabled={availableFuelTypes.length === 0}
                            className={selectClass}
                          >
                            <option value="">Select Fuel Type</option>
                            {availableFuelTypes.map((ft) => (
                              <option key={ft} value={ft}>
                                {FUEL_TYPE_LABELS[ft]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label required>Registration Year</Label>
                          <select
                            value={registrationYear}
                            onChange={(e) => setRegistrationYear(e.target.value ? Number(e.target.value) : "")}
                            className={selectClass}
                          >
                            <option value="">Select Year</option>
                            {REGISTRATION_YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label required>Registration State</Label>
                          <select value={stateId} onChange={(e) => setStateId(e.target.value ? Number(e.target.value) : "")} className={selectClass}>
                            <option value="">Select State</option>
                            {states.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <Label required>Registration City / RTO</Label>
                          <select
                            value={cityId}
                            onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}
                            disabled={!stateId}
                            className={selectClass}
                          >
                            <option value="">{stateId ? "Select City" : "Select a state first"}</option>
                            {filteredCities.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
                    </div>
                  ) : wizardStep === "insurance" ? (
                    <div className="flex flex-col gap-3.5">
                      <h4 className="text-[14px] font-bold text-ink">Insurance Required For</h4>
                      <div className="flex flex-col gap-2">
                        {INSURANCE_TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setInsuranceType(opt.value)}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                              insuranceType === opt.value ? "border-brand bg-brand-soft text-brand" : "border-border bg-white/50 text-ink hover:border-brand"
                            }`}
                          >
                            {opt.label}
                            {insuranceType === opt.value && <CheckIcon className="size-4" />}
                          </button>
                        ))}
                      </div>

                      {insuranceType === "renew" && (
                        <div className="flex flex-col gap-3 rounded-xl bg-page/50 p-3.5">
                          <div>
                            <Label>Current Insurance Company</Label>
                            <input
                              value={currentInsuranceCompany}
                              onChange={(e) => setCurrentInsuranceCompany(e.target.value)}
                              placeholder="e.g. HDFC ERGO"
                              maxLength={150}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <Label>Policy Expiry Date</Label>
                            <input type="date" value={policyExpiryDate} onChange={(e) => setPolicyExpiryDate(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <Label required>Any Claim in Last Policy?</Label>
                            <div className="flex gap-2">
                              {[
                                { value: true, label: "Yes" },
                                { value: false, label: "No" },
                              ].map((opt) => (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => setHadClaim(opt.value)}
                                  className={`flex-1 cursor-pointer rounded-xl border px-3.5 py-2 text-[13px] font-bold transition-colors ${
                                    hadClaim === opt.value ? "border-brand bg-brand-soft text-brand" : "border-border bg-white/50 text-ink hover:border-brand"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
                    </div>
                  ) : (
                    <form id="insurance-lead-form" onSubmit={handleContactSubmit} className="flex flex-col gap-3.5">
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

                      <div>
                        <Label>City</Label>
                        <input type="text" readOnly value={filteredCities.find((c) => c.id === cityId)?.name ?? "—"} className={`${inputClass} bg-page/60`} />
                      </div>

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
                    {wizardStep !== "vehicle" && (
                      <button
                        type="button"
                        onClick={() => goBack(wizardStep === "contact" ? "insurance" : "vehicle")}
                        className="flex cursor-pointer items-center gap-1 rounded-xl border border-border bg-white/50 px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
                      >
                        <ChevronIcon dir="left" className="size-3.5" /> Back
                      </button>
                    )}
                    {wizardStep === "contact" ? (
                      <button
                        type="submit"
                        form="insurance-lead-form"
                        disabled={submitting || sendingOtp}
                        className="flex-1 cursor-pointer rounded-xl bg-brand py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingOtp ? "Sending OTP..." : submitting ? "Submitting..." : "Get Insurance Quotes"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={wizardStep === "vehicle" ? goToInsurance : goToContact}
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
                      <h4 className="mb-3 text-[13px] font-bold text-ink">Why buy insurance from TimesAuto?</h4>
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
                form="insurance-lead-form"
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
