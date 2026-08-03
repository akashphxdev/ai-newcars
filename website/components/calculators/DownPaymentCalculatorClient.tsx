"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { StarIcon, CheckIcon, ShieldIcon } from "@/components/common/icons";
import { getModelsByBrand, getVariantsByModel } from "@/features/calculators/emiCalculator.api";
import type { EmiCalculatorModel, EmiCalculatorVariant } from "@/features/calculators/emiCalculator.types";
import type { Brand } from "@/features/brands/brand.types";
import { getCarDetail } from "@/features/cars/car.api";
import type { CarDetailResult } from "@/features/cars/car.types";
import { calculateEmi, calculatePrincipalFromEmi } from "@/lib/emiMath";
import { formatRupee, formatLakh } from "@/lib/calculatorFormat";
import { Label, selectClass, inputClass } from "@/components/calculators/CalculatorFormControls";
import SoftLeadCapture from "@/components/leads/SoftLeadCapture";

const TENURE_OPTIONS = [1, 2, 3, 4, 5, 7];
const DEFAULT_INTEREST_RATE = 9;
const DEFAULT_TENURE_YEARS = 5;

export default function DownPaymentCalculatorClient({ brands }: { brands: Brand[] }) {
  const [brandId, setBrandId] = useState<number | "">("");
  const [models, setModels] = useState<EmiCalculatorModel[]>([]);
  const [modelId, setModelId] = useState<number | "">("");
  const [variants, setVariants] = useState<EmiCalculatorVariant[]>([]);
  const [variantId, setVariantId] = useState<number | "">("");

  const [desiredEmi, setDesiredEmi] = useState("");
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  const [tenureYears, setTenureYears] = useState(DEFAULT_TENURE_YEARS);

  const [carDetail, setCarDetail] = useState<CarDetailResult | null>(null);

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

  const selectedBrand = brands.find((b) => b.id === brandId) ?? null;
  const selectedModel = models.find((m) => m.id === modelId) ?? null;
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;

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

  const exShowroomPrice = selectedVariant ? Number(selectedVariant.price) : 0;
  const desiredEmiValue = Number(desiredEmi) || 0;

  const result = useMemo(() => {
    if (exShowroomPrice <= 0 || desiredEmiValue <= 0) return null;

    const requiredLoan = calculatePrincipalFromEmi(desiredEmiValue, interestRate, tenureYears);
    const loanAmount = Math.min(requiredLoan, exShowroomPrice);
    const downPayment = Math.max(exShowroomPrice - requiredLoan, 0);
    const actual = calculateEmi(loanAmount, interestRate, tenureYears);

    return {
      downPayment,
      downPaymentPct: exShowroomPrice > 0 ? (downPayment / exShowroomPrice) * 100 : 0,
      loanAmount,
      actualEmi: actual.emi,
      totalInterest: actual.totalInterest,
      totalPayable: actual.totalPayable,
      fullyCovered: requiredLoan >= exShowroomPrice,
    };
  }, [exShowroomPrice, desiredEmiValue, interestRate, tenureYears]);

  const handleReset = () => {
    setDesiredEmi("");
    setInterestRate(DEFAULT_INTEREST_RATE);
    setTenureYears(DEFAULT_TENURE_YEARS);
  };

  return (
    <div>
      {carDetail && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex flex-row">
            <div className="relative h-28 w-28 shrink-0 bg-page sm:h-auto sm:w-72">
              {carDetail.coverImageUrl && (
                <Image
                  src={carDetail.coverImageUrl}
                  alt={carDetail.name}
                  fill
                  sizes="(max-width: 640px) 112px, 288px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1 p-3.5 sm:p-6">
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
                  { label: "Set your target EMI", text: "tell us what you can comfortably pay every month." },
                  { label: "We work backwards", text: "figure out the loan amount your EMI supports." },
                  { label: "Down payment", text: "the rest of the price, shown as the amount and the %." },
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
        {/* Left — Enter Details */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 border-b border-border-soft pb-3 text-[15px] font-bold text-ink">Enter Details</h2>

          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Select Your Car</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label>Select Brand</Label>
                  <select value={brandId} onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : "")} className={selectClass}>
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
              <input type="text" readOnly value={exShowroomPrice ? formatRupee(exShowroomPrice) : "Select a car"} className={`${inputClass} bg-page`} />
            </div>

            <div>
              <Label>Your Target Monthly EMI</Label>
              <input
                type="text"
                inputMode="numeric"
                value={desiredEmi}
                onChange={(e) => setDesiredEmi(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 15000"
                className={inputClass}
              />
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
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => document.getElementById("down-payment-result")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="flex-1 cursor-pointer rounded-xl bg-brand py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                Calculate Down Payment
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
              <ShieldIcon className="size-3" /> All calculations are estimated and may vary.
            </p>
          </div>
        </div>

        {/* Right — Your Result */}
        <div id="down-payment-result" className="flex flex-col gap-4">
          {!result ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-page text-brand">
                <ShieldIcon className="size-5" />
              </span>
              <p className="text-[14px] font-bold text-ink">Enter details to see your down payment</p>
              <p className="text-[12.5px] text-muted">Select a car and your target monthly EMI on the left.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-brand-soft p-5">
                <p className="text-[12px] font-bold text-ink">Down Payment Needed</p>
                <p className="mt-1 text-[32px] font-extrabold leading-none text-brand">{formatRupee(result.downPayment)}</p>
                <p className="mt-1 text-[12px] font-medium text-muted">
                  {result.fullyCovered
                    ? "Your target EMI alone covers the full price — no down payment needed."
                    : `That's ${result.downPaymentPct.toFixed(1)}% of the car's ex-showroom price.`}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="mb-3 text-[13.5px] font-bold text-ink">Loan Summary</h3>
                <dl className="flex flex-col gap-2 text-[12.5px]">
                  {[
                    ["Ex-Showroom Price", formatRupee(exShowroomPrice)],
                    ["Loan Amount", formatRupee(result.loanAmount)],
                    ["Your Target EMI", formatRupee(desiredEmiValue)],
                    ["Actual EMI (this loan amount)", formatRupee(result.actualEmi)],
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
                    <dd className="font-bold text-ink">{formatRupee(result.totalPayable)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Total Interest Payable</dt>
                    <dd className="font-semibold text-brand">{formatRupee(result.totalInterest)}</dd>
                  </div>
                </dl>
              </div>

              <SoftLeadCapture
                calculatorType="down_payment"
                brandId={selectedBrand?.id}
                modelId={selectedModel?.id}
                inputSummary={`Down payment ${formatRupee(result.downPayment)} · Target EMI ${formatRupee(desiredEmiValue)}/mo · ${tenureYears}yr`}
              />
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-faint">
        *This is an estimate based on the figures you enter. Actual down payment requirements may vary by lender.
      </p>
    </div>
  );
}
