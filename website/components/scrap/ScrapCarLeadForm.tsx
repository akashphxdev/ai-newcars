"use client";

// components/scrap/ScrapCarLeadForm.tsx
//
// Lead capture for scrapping an end-of-life vehicle.
//
// The car is the awkward part. Anything old enough to scrap is often not
// in the catalogue, so the brand and model fields fall back to free text
// the moment the owner cannot find their car — losing the lead there
// would defeat the point of the page. Everything except name, mobile and
// city is optional for the same reason: the yard can establish the rest
// on the phone, and every required field costs submissions.

import { useEffect, useMemo, useState } from "react";
import TurnstileWidget from "@/components/common/TurnstileWidget";
import { submitScrapLead } from "@/features/leads/lead.api";
import { getCityOptions } from "@/features/cities/city.api";
import type { CityOption } from "@/features/cities/city.types";
import type { ScrapVehicleCondition } from "@/features/leads/lead.types";

interface BrandOption {
  id: number;
  name: string;
}

const CONDITIONS: { value: ScrapVehicleCondition; label: string; hint: string }[] = [
  { value: "running", label: "Running", hint: "Drives to the yard on its own" },
  { value: "not_running", label: "Not running", hint: "Needs to be towed" },
  { value: "accidental", label: "Accidental", hint: "Damaged in a collision" },
];

const CURRENT_YEAR = new Date().getFullYear();
// 15 years is when a private vehicle becomes eligible, so the list is
// weighted to the cars people actually scrap without hard-blocking newer
// ones — a written-off three-year-old car is still a real lead.
const YEARS = Array.from({ length: 45 }, (_, i) => CURRENT_YEAR - i);

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

export default function ScrapCarLeadForm({ brands }: { brands: BrandOption[] }) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [cityId, setCityId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [modelName, setModelName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationYear, setRegistrationYear] = useState("");
  const [condition, setCondition] = useState<ScrapVehicleCondition | "">("");
  const [hasOriginalRc, setHasOriginalRc] = useState(false);
  const [isHypothecated, setIsHypothecated] = useState(false);
  const [wantsCod, setWantsCod] = useState(true);

  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ duplicate: boolean } | null>(null);

  useEffect(() => {
    getCityOptions(true)
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  // "Not listed" is a real choice here rather than a fallback nobody
  // finds, because for a 20-year-old car it is the common case.
  const usingFreeTextBrand = brandId === "other";
  const canSubmit = useMemo(
    () => MOBILE_PATTERN.test(mobile) && cityId !== "" && token !== "" && !submitting,
    [mobile, cityId, token, submitting],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!MOBILE_PATTERN.test(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!token) {
      setError("Please complete the security check.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitScrapLead({
        name: name.trim() || undefined,
        mobile,
        email: email.trim() || undefined,
        cityId: Number(cityId),
        brandId: !usingFreeTextBrand && brandId ? Number(brandId) : undefined,
        brandName: usingFreeTextBrand ? brandName.trim() || undefined : undefined,
        modelName: modelName.trim() || undefined,
        registrationNumber: registrationNumber.trim().toUpperCase() || undefined,
        registrationYear: registrationYear ? Number(registrationYear) : undefined,
        vehicleCondition: condition || undefined,
        hasOriginalRc,
        isHypothecated,
        wantsCertificateOfDeposit: wantsCod,
        turnstileToken: token,
      });
      setDone({ duplicate: result.duplicate });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      // The token is spent whether or not the submission succeeded, so a
      // retry needs a fresh challenge.
      setToken("");
      setResetKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <h2 className="text-lg font-bold text-green-900">
          {done.duplicate ? "We already have this vehicle" : "Request received"}
        </h2>
        <p className="mt-2 text-sm text-green-800">
          {done.duplicate
            ? "Our team is already working on this registration number and will call you shortly."
            : "Our scrapping partner will call you with a quote and arrange free pick-up."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={INPUT}
            autoComplete="name"
          />
        </Field>

        <Field label="Mobile number" required>
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile"
            inputMode="numeric"
            className={INPUT}
            autoComplete="tel"
            required
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={INPUT}
            autoComplete="email"
          />
        </Field>

        <Field label="City" required>
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={INPUT} required>
            <option value="">Select your city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {cities.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">Loading the cities we currently cover…</p>
          )}
        </Field>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Your vehicle</legend>

        <Field label="Brand">
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className={INPUT}
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            <option value="other">Not listed / older brand</option>
          </select>
        </Field>

        {usingFreeTextBrand ? (
          <Field label="Brand name">
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Premier"
              className={INPUT}
            />
          </Field>
        ) : (
          <Field label="Model">
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. Alto 800"
              className={INPUT}
            />
          </Field>
        )}

        <Field label="Registration number">
          <input
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
            placeholder="RJ14AB1234"
            className={INPUT}
          />
        </Field>

        <Field label="Registration year">
          <select value={registrationYear} onChange={(e) => setRegistrationYear(e.target.value)} className={INPUT}>
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <div>
        <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">Condition</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCondition(c.value)}
              aria-pressed={condition === c.value}
              className={`cursor-pointer rounded-md border px-3 py-2 text-left text-sm transition ${
                condition === c.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span className="block font-semibold">{c.label}</span>
              <span className={`block text-xs ${condition === c.value ? "text-gray-300" : "text-gray-500"}`}>
                {c.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Checkbox checked={hasOriginalRc} onChange={setHasOriginalRc} label="I have the original RC" />
        <Checkbox
          checked={isHypothecated}
          onChange={setIsHypothecated}
          label="There is still a loan / hypothecation on this vehicle"
        />
        <Checkbox
          checked={wantsCod}
          onChange={setWantsCod}
          label="I want a Certificate of Deposit (road-tax rebate on my next car)"
        />
      </div>

      <TurnstileWidget onToken={setToken} resetKey={resetKey} />

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full cursor-pointer rounded-md bg-gray-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Get my scrap quote"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Free pick-up and paperwork handled by our registered scrapping partner.
      </p>
    </form>
  );
}

const INPUT = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 cursor-pointer"
      />
      <span>{label}</span>
    </label>
  );
}
