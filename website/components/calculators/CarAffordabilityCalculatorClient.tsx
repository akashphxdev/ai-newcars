"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TagIcon, ShieldIcon, ChevronIcon } from "@/components/common/icons";
import { getCarsBrowse } from "@/features/cars/car.api";
import type { HomeCar } from "@/features/cars/car.types";
import type { BodyType } from "@/features/bodyTypes/bodyType.types";
import { calculatePrincipalFromEmi } from "@/lib/emiMath";
import { formatRupee, formatLakh } from "@/lib/calculatorFormat";
import { Label, inputClass, selectClass } from "@/components/calculators/CalculatorFormControls";
import BrandCarCard from "@/components/brands/BrandCarCard";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import SoftLeadCapture from "@/components/leads/SoftLeadCapture";

const TENURE_OPTIONS = [1, 2, 3, 4, 5, 7];
const DEFAULT_INTEREST_RATE = 9;
const DEFAULT_TENURE_YEARS = 5;

// Rail card width — matches components/brands/BrandElectricCarsRail.tsx's
// choice, which sits ~4-up inside a max-w-7xl container.
const RAIL_CARD_WIDTH = "w-[270px] shrink-0 snap-start";

function BudgetCarsRail({
  title,
  countLabel,
  bodyTypes,
  bodyType,
  onBodyTypeChange,
  cars,
  totalMatches,
  loading,
  emptyLabel,
  viewAllHref,
}: {
  title: string;
  countLabel: string;
  bodyTypes: BodyType[];
  bodyType: string;
  onBodyTypeChange: (slug: string) => void;
  cars: HomeCar[];
  totalMatches: number;
  loading: boolean;
  emptyLabel: string;
  viewAllHref: string;
}) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-ink">{title}</h3>
          <p className="text-[12.5px] text-muted">{countLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={bodyType} onChange={(e) => onBodyTypeChange(e.target.value)} className={`${selectClass} w-auto`}>
            <option value="">All Body Types</option>
            {bodyTypes.map((bt) => (
              <option key={bt.id} value={bt.slug}>
                {bt.name}
              </option>
            ))}
          </select>
          {totalMatches > cars.length && (
            <Link href={viewAllHref} className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-bold text-brand hover:underline">
              View All <ChevronIcon />
            </Link>
          )}
          <ScrollArrows canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onLeft={() => scrollBy("left")} onRight={() => scrollBy("right")} />
        </div>
      </div>

      {!loading && cars.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">{emptyLabel}</p>
      )}

      {cars.length > 0 && (
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cars.map((car) => (
            <div key={car.id} className={RAIL_CARD_WIDTH}>
              <BrandCarCard car={car} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CarAffordabilityCalculatorClient({ bodyTypes }: { bodyTypes: BodyType[] }) {
  const [monthlyEmi, setMonthlyEmi] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  const [tenureYears, setTenureYears] = useState(DEFAULT_TENURE_YEARS);

  const [carsBodyType, setCarsBodyType] = useState("");
  const [cars, setCars] = useState<HomeCar[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loadingCars, setLoadingCars] = useState(false);

  const [electricBodyType, setElectricBodyType] = useState("");
  const [electricCars, setElectricCars] = useState<HomeCar[]>([]);
  const [electricTotalMatches, setElectricTotalMatches] = useState(0);
  const [loadingElectricCars, setLoadingElectricCars] = useState(false);

  const monthlyEmiValue = Number(monthlyEmi) || 0;
  const downPaymentValue = Number(downPayment) || 0;

  const result = useMemo(() => {
    if (monthlyEmiValue <= 0) return null;
    const maxLoan = calculatePrincipalFromEmi(monthlyEmiValue, interestRate, tenureYears);
    const maxCarPrice = maxLoan + downPaymentValue;
    return { maxLoan, maxCarPrice };
  }, [monthlyEmiValue, downPaymentValue, interestRate, tenureYears]);

  useEffect(() => {
    if (!result || result.maxCarPrice <= 0) {
      setCars([]);
      setTotalMatches(0);
      return;
    }
    let cancelled = false;
    setLoadingCars(true);
    getCarsBrowse({
      maxPrice: Math.round(result.maxCarPrice),
      bodyType: carsBodyType ? [carsBodyType] : undefined,
      sort: "price-desc",
      limit: 12,
    })
      .then((res) => {
        if (cancelled) return;
        setCars(res.cars);
        setTotalMatches(res.pagination.total);
      })
      .finally(() => {
        if (!cancelled) setLoadingCars(false);
      });
    return () => {
      cancelled = true;
    };
  }, [result?.maxCarPrice, carsBodyType]);

  useEffect(() => {
    if (!result || result.maxCarPrice <= 0) {
      setElectricCars([]);
      setElectricTotalMatches(0);
      return;
    }
    let cancelled = false;
    setLoadingElectricCars(true);
    getCarsBrowse({
      maxPrice: Math.round(result.maxCarPrice),
      fuelType: ["electric"],
      bodyType: electricBodyType ? [electricBodyType] : undefined,
      sort: "price-desc",
      limit: 12,
    })
      .then((res) => {
        if (cancelled) return;
        setElectricCars(res.cars);
        setElectricTotalMatches(res.pagination.total);
      })
      .finally(() => {
        if (!cancelled) setLoadingElectricCars(false);
      });
    return () => {
      cancelled = true;
    };
  }, [result?.maxCarPrice, electricBodyType]);

  const handleReset = () => {
    setMonthlyEmi("");
    setDownPayment("");
    setInterestRate(DEFAULT_INTEREST_RATE);
    setTenureYears(DEFAULT_TENURE_YEARS);
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left — Enter Details */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="mb-4 border-b border-border-soft pb-3 text-[15px] font-bold text-ink">Enter Your Budget</h2>

          <div className="flex flex-col gap-4">
            <div>
              <Label>Monthly EMI You Can Pay</Label>
              <input
                type="text"
                inputMode="numeric"
                value={monthlyEmi}
                onChange={(e) => setMonthlyEmi(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 15000"
                className={inputClass}
              />
            </div>

            <div>
              <Label>Down Payment You Can Pay</Label>
              <input
                type="text"
                inputMode="numeric"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 200000"
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
                onClick={() => document.getElementById("affordability-result")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="flex-1 cursor-pointer rounded-xl bg-brand py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                Find My Budget
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
        <div id="affordability-result" className="flex flex-col gap-4">
          {!result ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-page text-brand">
                <TagIcon className="size-5" />
              </span>
              <p className="text-[14px] font-bold text-ink">Enter your budget to get started</p>
              <p className="text-[12.5px] text-muted">Tell us your monthly EMI budget on the left.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-brand-soft p-5">
                <p className="text-[12px] font-bold text-ink">You Can Afford Up To</p>
                <p className="mt-1 text-[32px] font-extrabold leading-none text-brand">{formatLakh(result.maxCarPrice)}</p>
                <p className="mt-1 text-[12px] font-medium text-muted">Ex-Showroom Price</p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="mb-3 text-[13.5px] font-bold text-ink">Budget Summary</h3>
                <dl className="flex flex-col gap-2 text-[12.5px]">
                  {[
                    ["Max Car Price", formatRupee(result.maxCarPrice)],
                    ["Down Payment", formatRupee(downPaymentValue)],
                    ["Max Loan Amount", formatRupee(result.maxLoan)],
                    ["Monthly EMI", formatRupee(monthlyEmiValue)],
                    ["Interest Rate (p.a.)", `${interestRate.toFixed(2)}%`],
                    ["Loan Tenure", `${tenureYears} Years`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <dt className="text-muted">{label}</dt>
                      <dd className="font-semibold text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <SoftLeadCapture
                calculatorType="affordability"
                inputSummary={`Afford up to ${formatLakh(result.maxCarPrice)} · EMI ${formatRupee(monthlyEmiValue)}/mo · Down payment ${formatRupee(downPaymentValue)}`}
              />
            </>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6">
          <BudgetCarsRail
            title="Cars Within Your Budget"
            countLabel={loadingCars ? "Loading..." : `${totalMatches} car${totalMatches === 1 ? "" : "s"} match your budget`}
            bodyTypes={bodyTypes}
            bodyType={carsBodyType}
            onBodyTypeChange={setCarsBodyType}
            cars={cars}
            totalMatches={totalMatches}
            loading={loadingCars}
            emptyLabel="No cars found within this budget — try increasing your EMI or down payment, or clearing the body type filter."
            viewAllHref={`/new-cars?maxPrice=${Math.round(result.maxCarPrice)}&sort=price-desc${carsBodyType ? `&bodyType=${carsBodyType}` : ""}`}
          />
        </div>
      )}

      {result && (loadingElectricCars || electricCars.length > 0 || electricBodyType) && (
        <div className="mt-8">
          <BudgetCarsRail
            title="Electric Cars Within Your Budget"
            countLabel={loadingElectricCars ? "Loading..." : `${electricTotalMatches} electric car${electricTotalMatches === 1 ? "" : "s"} match your budget`}
            bodyTypes={bodyTypes}
            bodyType={electricBodyType}
            onBodyTypeChange={setElectricBodyType}
            cars={electricCars}
            totalMatches={electricTotalMatches}
            loading={loadingElectricCars}
            emptyLabel="No electric cars found within this budget — try increasing your EMI or down payment, or clearing the body type filter."
            viewAllHref={`/new-cars?maxPrice=${Math.round(result.maxCarPrice)}&fuelType=electric&sort=price-desc${electricBodyType ? `&bodyType=${electricBodyType}` : ""}`}
          />
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-faint">
        *This is an estimate based on the figures you enter. Actual loan eligibility and car prices may vary.
      </p>
    </div>
  );
}
