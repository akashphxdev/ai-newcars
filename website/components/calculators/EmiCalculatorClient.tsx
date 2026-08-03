"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { EditIcon, TagIcon, ShieldIcon, ClockIcon, GaugeIcon, StarIcon, LockIcon, CheckIcon } from "@/components/common/icons";
import { getModelsByBrand, getVariantsByModel } from "@/features/calculators/emiCalculator.api";
import type { EmiCalculatorModel, EmiCalculatorVariant } from "@/features/calculators/emiCalculator.types";
import type { Brand } from "@/features/brands/brand.types";
import { getCarDetail } from "@/features/cars/car.api";
import type { CarDetailResult } from "@/features/cars/car.types";
import ReviewsSection from "@/components/cars/reviews/ReviewsSection";
import SoftLeadCapture from "@/components/leads/SoftLeadCapture";
import LoanLeadModal from "@/components/leads/LoanLeadModal";
import { ChevronIcon } from "@/components/common/icons";
import { submitLoanLead } from "@/features/leads/lead.api";
import { calculateEmi, buildAmortizationSchedule } from "@/lib/emiMath";

const TENURE_OPTIONS = [1, 2, 3, 4, 5, 7];
const DEFAULT_INTEREST_RATE = 9;
const DEFAULT_TENURE_YEARS = 5;

function formatRupee(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatLakh(n: number): string {
  return `₹${(n / 100000).toFixed(2)}L`;
}

const selectClass =
  "w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-50";
const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand";
const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1.5 block text-[12px] font-bold text-ink">{children}</span>
);

function DonutChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const principalLength = total > 0 ? (principal / total) * circumference : 0;

  return (
    <svg viewBox="0 0 160 160" className="size-40 shrink-0">
      <circle cx="80" cy="80" r={radius} fill="none" stroke="#f2650f" strokeWidth="20" />
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="#2563eb"
        strokeWidth="20"
        strokeDasharray={`${principalLength} ${circumference - principalLength}`}
        strokeLinecap={principalLength > 0 && principalLength < circumference ? "round" : "butt"}
        transform="rotate(-90 80 80)"
      />
      <text x="80" y="75" textAnchor="middle" className="fill-faint text-[10px] font-bold uppercase">
        Total Payable
      </text>
      <text x="80" y="95" textAnchor="middle" className="fill-ink text-[15px] font-extrabold">
        {formatRupee(total)}
      </text>
    </svg>
  );
}

export default function EmiCalculatorClient({ brands }: { brands: Brand[] }) {
  const [brandId, setBrandId] = useState<number | "">("");
  const [models, setModels] = useState<EmiCalculatorModel[]>([]);
  const [modelId, setModelId] = useState<number | "">("");
  const [variants, setVariants] = useState<EmiCalculatorVariant[]>([]);
  const [variantId, setVariantId] = useState<number | "">("");
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  const [exShowroomPrice, setExShowroomPrice] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  const [tenureYears, setTenureYears] = useState(DEFAULT_TENURE_YEARS);
  const [showSchedule, setShowSchedule] = useState(false);

  // Nothing pre-selected on load — brand/model/variant all start blank,
  // and each dropdown only populates once its parent is actually chosen.
  useEffect(() => {
    if (brandId === "") {
      setModels([]);
      setModelId("");
      return;
    }
    getModelsByBrand(brandId).then((list) => {
      setModels(list);
      setModelId("");
    });
  }, [brandId]);

  useEffect(() => {
    if (modelId === "") {
      setVariants([]);
      setVariantId("");
      return;
    }
    getVariantsByModel(modelId).then((list) => {
      setVariants(list);
      setVariantId("");
    });
  }, [modelId]);

  useEffect(() => {
    const variant = variants.find((v) => v.id === variantId);
    if (variant) {
      const price = Number(variant.price);
      setExShowroomPrice(price);
      setDownPayment(Math.round((price * 0.2) / 10000) * 10000);
    } else {
      setExShowroomPrice(0);
      setDownPayment(0);
    }
    // Only re-run when the selected variant itself changes, not every
    // time the variants list is re-fetched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  const selectedBrand = brands.find((b) => b.id === brandId) ?? null;
  const selectedModel = models.find((m) => m.id === modelId) ?? null;
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;

  const [carDetail, setCarDetail] = useState<CarDetailResult | null>(null);

  // Full detail (image + specs) only fetched once a variant is actually
  // chosen — the lightweight lookup endpoints backing the dropdowns
  // don't carry images/specs, so this reuses the same car-detail
  // endpoint the model page itself uses.
  useEffect(() => {
    if (!selectedBrand || !selectedModel || variantId === "") {
      setCarDetail(null);
      return;
    }
    let cancelled = false;
    getCarDetail(selectedBrand.slug, selectedModel.slug, variantId).then((detail) => {
      if (!cancelled) setCarDetail(detail);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrand?.slug, selectedModel?.slug, variantId]);

  const loanAmount = Math.max(exShowroomPrice - downPayment, 0);
  const downPaymentPct = exShowroomPrice > 0 ? (downPayment / exShowroomPrice) * 100 : 0;

  const { emi, totalPayable, totalInterest } = useMemo(
    () => calculateEmi(loanAmount, interestRate, tenureYears),
    [loanAmount, interestRate, tenureYears],
  );

  const schedule = useMemo(
    () => (showSchedule ? buildAmortizationSchedule(loanAmount, interestRate, tenureYears) : []),
    [showSchedule, loanAmount, interestRate, tenureYears],
  );

  const handleReset = () => {
    setDownPayment(Math.round((exShowroomPrice * 0.2) / 10000) * 10000);
    setInterestRate(DEFAULT_INTEREST_RATE);
    setTenureYears(DEFAULT_TENURE_YEARS);
    setShowSchedule(false);
  };

  return (
    <div>
      {carDetail && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-52 w-full shrink-0 bg-page sm:h-auto sm:w-72">
              {carDetail.coverImageUrl && (
                <Image
                  src={carDetail.coverImageUrl}
                  alt={carDetail.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 288px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[18px] font-bold text-ink">{carDetail.name}</h3>
                {carDetail.ratingAvg && (
                  <span className="flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    {carDetail.ratingAvg}
                    <StarIcon filled className="size-2.5" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-[14px] font-semibold text-brand">
                {carDetail.selectedVariant ? formatLakh(Number(carDetail.selectedVariant.price)) : "—"}{" "}
                <span className="font-normal text-faint">Ex-Showroom Price</span>
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {[
                  { label: "Plan your EMI", text: "adjust down payment, rate and tenure to fit your budget." },
                  { label: "Compare variants", text: "check specs, features and on-road pricing side-by-side." },
                  { label: "Read real reviews", text: "see how it performs from verified owners below." },
                ].map((item) => (
                  <p key={item.label} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted">
                    <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-brand" />
                    <span>
                      <span className="font-semibold text-ink">{item.label}</span> — {item.text}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left — Configure Your Loan */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 border-b border-border-soft pb-3 text-[15px] font-bold text-ink">Configure Your Loan</h2>

          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Car Details</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label>Select Brand</Label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : "")}
                    className={selectClass}
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Select Model</Label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value ? Number(e.target.value) : "")}
                    disabled={models.length === 0}
                    className={selectClass}
                  >
                    <option value="">Select Model</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Select Variant</Label>
                  <select
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : "")}
                    disabled={variants.length === 0}
                    className={selectClass}
                  >
                    <option value="">Select Variant</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.variantName} ({formatLakh(Number(v.price))})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <Label>Ex-Showroom Price</Label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={exShowroomPrice ? exShowroomPrice.toLocaleString("en-IN") : ""}
                  onChange={(e) => {
                    const digits = Number(e.target.value.replace(/\D/g, "")) || 0;
                    setExShowroomPrice(digits);
                  }}
                  className={`${inputClass} pr-9`}
                />
                <EditIcon className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Down Payment</Label>
                <span className="rounded-md bg-page px-2 py-0.5 text-[11px] font-bold text-muted">
                  {downPaymentPct.toFixed(1)}%
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={downPayment.toLocaleString("en-IN")}
                onChange={(e) => {
                  const digits = Number(e.target.value.replace(/\D/g, "")) || 0;
                  setDownPayment(Math.min(digits, exShowroomPrice));
                }}
                className={inputClass}
              />
              <input
                type="range"
                min={0}
                max={exShowroomPrice || 0}
                step={5000}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="mt-2.5 w-full accent-brand"
              />
              <div className="mt-1 flex justify-between text-[11px] text-faint">
                <span>₹0</span>
                <span>{formatLakh(exShowroomPrice)}</span>
              </div>
            </div>

            <div>
              <Label>Loan Amount</Label>
              <input type="text" readOnly value={formatRupee(loanAmount)} className={`${inputClass} bg-page`} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Interest Rate (p.a.)</Label>
                <span className="text-[11px] font-medium text-faint">Typical Range: 8% - 12%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInterestRate((r) => Math.max(1, +(r - 0.1).toFixed(2)))}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border text-ink transition-colors hover:border-brand hover:text-brand"
                  aria-label="Decrease interest rate"
                >
                  −
                </button>
                <div className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-center text-[13px] font-bold text-ink">
                  {interestRate.toFixed(2)}%
                </div>
                <button
                  type="button"
                  onClick={() => setInterestRate((r) => Math.min(20, +(r + 0.1).toFixed(2)))}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border text-ink transition-colors hover:border-brand hover:text-brand"
                  aria-label="Increase interest rate"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <Label>Loan Tenure</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {TENURE_OPTIONS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setTenureYears(y)}
                    className={`cursor-pointer rounded-xl border px-2 py-2 text-[12.5px] font-bold transition-colors ${
                      tenureYears === y ? "border-brand text-brand" : "border-border text-ink hover:border-brand"
                    }`}
                  >
                    {y} {y === 1 ? "Year" : "Years"}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="mt-2.5 w-full accent-brand"
              />
              <p className="mt-1 text-[11px] text-faint">{tenureYears} Years</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => document.getElementById("emi-summary")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="flex-1 cursor-pointer rounded-xl bg-brand py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                Calculate EMI
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="cursor-pointer rounded-xl border border-border px-4 py-3 text-[13px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                ↻ Reset
              </button>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-faint">
              <LockIcon className="size-3" /> Your information is secure and will not be shared
            </p>
          </div>
        </div>

        {/* Right — car preview + EMI results */}
        <div id="emi-summary" className="flex flex-col gap-4">

          {!selectedVariant ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-page text-brand">
                <TagIcon className="size-5" />
              </span>
              <p className="text-[14px] font-bold text-ink">Select a car to see your EMI</p>
              <p className="text-[12.5px] text-muted">
                Pick a brand, model and variant from the left to calculate your monthly EMI.
              </p>
            </div>
          ) : (
            <>
          <div className="rounded-2xl bg-brand-soft p-5">
            <p className="flex items-center gap-1 text-[12px] font-bold text-ink">Your Monthly EMI</p>
            <p className="mt-1 text-[32px] font-extrabold leading-none text-brand">{formatRupee(emi)}</p>
            <p className="mt-1 text-[12px] font-medium text-muted">
              For {tenureYears} years at {interestRate.toFixed(2)}% p.a.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-[13.5px] font-bold text-ink">Loan Summary</h3>
            <dl className="flex flex-col gap-2 text-[12.5px]">
              {[
                ["Ex-Showroom Price", formatRupee(exShowroomPrice)],
                ["Down Payment", formatRupee(downPayment)],
                ["Loan Amount", formatRupee(loanAmount)],
                ["Interest Rate (p.a.)", `${interestRate.toFixed(2)}%`],
                ["Loan Tenure", `${tenureYears} Years`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-semibold text-ink">{value}</dd>
                </div>
              ))}
              <div className="mt-1 border-t border-border-soft pt-2" />
              <div className="flex items-center justify-between">
                <dt className="font-semibold text-ink">Total Payable Amount</dt>
                <dd className="font-bold text-ink">{formatRupee(totalPayable)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Total Interest Payable</dt>
                <dd className="font-semibold text-brand">{formatRupee(totalInterest)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-[13.5px] font-bold text-ink">EMI Breakdown</h3>
            <div className="flex items-center gap-5">
              <DonutChart principal={loanAmount} interest={totalInterest} />
              <div className="flex flex-col gap-2.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: "#2563eb" }} />
                  <span className="text-muted">Principal Amount</span>
                </div>
                <p className="-mt-1.5 pl-4.5 font-bold text-ink">
                  {formatRupee(loanAmount)}{" "}
                  <span className="font-normal text-faint">
                    ({totalPayable > 0 ? ((loanAmount / totalPayable) * 100).toFixed(1) : "0"}%)
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: "#f2650f" }} />
                  <span className="text-muted">Total Interest</span>
                </div>
                <p className="-mt-1.5 pl-4.5 font-bold text-ink">
                  {formatRupee(totalInterest)}{" "}
                  <span className="font-normal text-faint">
                    ({totalPayable > 0 ? ((totalInterest / totalPayable) * 100).toFixed(1) : "0"}%)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[13.5px] font-bold text-ink">Amortization Schedule</h3>
                <p className="text-[11.5px] text-muted">See year-wise principal & interest breakup</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSchedule((s) => !s)}
                className="shrink-0 cursor-pointer rounded-xl border border-border px-3.5 py-2 text-[12px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {showSchedule ? "Hide Schedule" : "View Schedule →"}
              </button>
            </div>

            {showSchedule && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border-soft text-left text-faint">
                      <th className="py-1.5 pr-2 font-semibold">Year</th>
                      <th className="py-1.5 pr-2 font-semibold">Principal Paid</th>
                      <th className="py-1.5 pr-2 font-semibold">Interest Paid</th>
                      <th className="py-1.5 font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.year} className="border-b border-border-soft last:border-0">
                        <td className="py-1.5 pr-2 text-ink">{row.year}</td>
                        <td className="py-1.5 pr-2 text-muted">{formatRupee(row.principalPaid)}</td>
                        <td className="py-1.5 pr-2 text-muted">{formatRupee(row.interestPaid)}</td>
                        <td className="py-1.5 font-semibold text-ink">{formatRupee(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <SoftLeadCapture
            calculatorType="emi"
            brandId={selectedBrand?.id}
            modelId={selectedModel?.id}
            inputSummary={`EMI ${formatRupee(emi)}/mo · ${formatLakh(exShowroomPrice)} @ ${interestRate.toFixed(2)}% · ${tenureYears}yr`}
          />

          {selectedBrand && selectedModel && (
            <button
              type="button"
              onClick={() => setLoanModalOpen(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-1 py-1 text-[12.5px] font-bold text-brand hover:underline"
            >
              Want better loan offers? Apply Now <ChevronIcon className="size-3" />
            </button>
          )}

          {loanModalOpen && selectedBrand && selectedModel && (
            <LoanLeadModal
              brandName={selectedBrand.name}
              carName={selectedModel.name}
              modelId={selectedModel.id}
              imageUrl={carDetail?.coverImageUrl ?? null}
              initialLoanAmount={loanAmount}
              initialTenureYears={tenureYears}
              initialInterestRate={interestRate}
              onClose={() => setLoanModalOpen(false)}
              onSubmit={async (values) => {
                await submitLoanLead({ ...values, brandId: selectedBrand.id, modelId: selectedModel.id });
              }}
            />
          )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-4">
        {[
          { Icon: TagIcon, title: "Lowest Interest Rates", sub: "Compare offers from top lenders and save more" },
          { Icon: ShieldIcon, title: "100% Secure", sub: "Your data is safe with us. No spam calls." },
          { Icon: ClockIcon, title: "Instant Calculation", sub: "Real-time EMI calculation in just a click" },
          { Icon: GaugeIcon, title: "Flexible Tenure", sub: "Choose tenure up to 7 years as per your convenience" },
        ].map(({ Icon, title, sub }) => (
          <div key={title} className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-page text-brand">
              <Icon className="size-4.5" />
            </span>
            <p className="text-[12.5px] font-bold text-ink">{title}</p>
            <p className="text-[11px] leading-relaxed text-faint">{sub}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-faint">
        *The EMI calculated is an estimate and for information purposes only. Actual EMI may vary depending on the lender&apos;s policy.
      </p>

      {selectedModel && selectedVariant && (
        <div className="mt-10">
          <h2 className="mb-4 text-[19px] font-bold text-ink">
            {selectedBrand?.name} {selectedModel.name} Reviews
          </h2>
          {selectedBrand && <ReviewsSection modelId={selectedModel.id} brandSlug={selectedBrand.slug} modelSlug={selectedModel.slug} />}
        </div>
      )}
    </div>
  );
}
