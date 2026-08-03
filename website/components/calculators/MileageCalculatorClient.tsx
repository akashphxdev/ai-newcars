"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FuelIcon,
  FlameIcon,
  BoltIcon,
  GaugeIcon,
  RoadIcon,
  ThermometerIcon,
  GearIcon,
  ShieldIcon,
  StarIcon,
  CheckIcon,
} from "@/components/common/icons";
import { getModelsByBrand } from "@/features/calculators/emiCalculator.api";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import type { EmiCalculatorModel } from "@/features/calculators/emiCalculator.types";
import { FUEL_TYPES, FUEL_TYPE_LABELS, FUEL_PRICE_UNIT_LABELS, MILEAGE_UNIT_LABELS } from "@/features/calculators/mileageCalculator.types";
import type { FuelType, MileageCalculatorVariant } from "@/features/calculators/mileageCalculator.types";
import type { Brand } from "@/features/brands/brand.types";
import { getCarDetail, getCarsBrowse } from "@/features/cars/car.api";
import type { CarDetailResult, HomeCar } from "@/features/cars/car.types";
import ReviewsSection from "@/components/cars/reviews/ReviewsSection";
import SoftLeadCapture from "@/components/leads/SoftLeadCapture";
import { calculateRunningCost } from "@/lib/mileageMath";

function formatRupee(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
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

const FUEL_TYPE_ICONS: Record<FuelType, React.ComponentType<{ className?: string }>> = {
  petrol: FuelIcon,
  diesel: FuelIcon,
  cng: FlameIcon,
  ev: BoltIcon,
};

const AFFECTED_BY = [
  { Icon: GaugeIcon, title: "Driving Style", desc: "Aggressive acceleration and braking use more fuel per km." },
  { Icon: RoadIcon, title: "Traffic Conditions", desc: "Stop-and-go traffic lowers mileage compared to open roads." },
  { Icon: ThermometerIcon, title: "AC Usage", desc: "Running the AC constantly increases fuel/energy consumption." },
  { Icon: GearIcon, title: "Maintenance", desc: "Regular servicing and correct tyre pressure help sustain mileage." },
];

export default function MileageCalculatorClient({ brands }: { brands: Brand[] }) {
  const [fuelType, setFuelType] = useState<FuelType>("petrol");

  const [brandId, setBrandId] = useState<number | "">("");
  const [models, setModels] = useState<EmiCalculatorModel[]>([]);
  const [modelId, setModelId] = useState<number | "">("");
  const [variants, setVariants] = useState<MileageCalculatorVariant[]>([]);
  const [variantId, setVariantId] = useState<number | "">("");

  const [fuelPrice, setFuelPrice] = useState("");
  const [averageMileage, setAverageMileage] = useState("");
  const [monthlyDistance, setMonthlyDistance] = useState("");

  const [carDetail, setCarDetail] = useState<CarDetailResult | null>(null);
  const [comparisonCars, setComparisonCars] = useState<HomeCar[]>([]);

  // Comparison basis: other cars of the SAME body type and SAME fuel
  // type as the selected car — anything else (e.g. random "popular"
  // cars) wouldn't be a fair mileage comparison (a hatchback vs an SUV,
  // or petrol vs electric, don't compare meaningfully on mileage).
  useEffect(() => {
    if (!carDetail?.bodyType) {
      setComparisonCars([]);
      return;
    }
    let cancelled = false;
    getCarsBrowse({
      bodyType: [carDetail.bodyType.slug],
      fuelType: [fuelType === "ev" ? "electric" : fuelType],
      limit: 4,
    }).then((result) => {
      if (!cancelled) setComparisonCars(result.cars);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carDetail?.bodyType?.slug, fuelType]);

  // Nothing pre-selected on load.
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

  // Fuel type change invalidates whichever variant was picked under the
  // old filter.
  useEffect(() => {
    setVariantId("");
  }, [fuelType]);

  const selectedBrand = brands.find((b) => b.id === brandId) ?? null;
  const selectedModel = models.find((m) => m.id === modelId) ?? null;

  const filteredVariants = useMemo(
    () => variants.filter((v) => (fuelType === "ev" ? v.isElectric : !v.isElectric && v.fuelType?.toLowerCase() === fuelType)),
    [variants, fuelType],
  );
  const selectedVariant = filteredVariants.find((v) => v.id === variantId) ?? null;

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

  // Pre-fill Average Mileage from the variant's own real-world rating —
  // still editable, since a visitor's actual observed mileage can
  // differ from the rated figure.
  useEffect(() => {
    if (!carDetail?.selectedVariant) {
      setAverageMileage("");
      return;
    }
    const v = carDetail.selectedVariant;
    const rated = v.isElectric ? v.electric?.realWorldRange : v.ice?.realWorldMileage;
    setAverageMileage(rated ? String(rated) : "");
  }, [carDetail]);

  const mileageValue = Number(averageMileage) || 0;
  const fuelPriceValue = Number(fuelPrice) || 0;
  const monthlyDistanceValue = Number(monthlyDistance) || 0;

  const runningCost = useMemo(
    () => calculateRunningCost(fuelPriceValue, mileageValue, monthlyDistanceValue),
    [fuelPriceValue, mileageValue, monthlyDistanceValue],
  );
  const hasRunningCost = fuelPriceValue > 0 && mileageValue > 0 && monthlyDistanceValue > 0;

  const handleReset = () => {
    setFuelPrice("");
    setMonthlyDistance("");
    if (carDetail?.selectedVariant) {
      const v = carDetail.selectedVariant;
      const rated = v.isElectric ? v.electric?.realWorldRange : v.ice?.realWorldMileage;
      setAverageMileage(rated ? String(rated) : "");
    }
  };

  const otherCars = comparisonCars.filter((c) => c.id !== carDetail?.id).slice(0, 3);

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
                  { label: "Rated mileage", text: `${averageMileage || "—"} ${MILEAGE_UNIT_LABELS[fuelType]}, straight from the spec sheet.` },
                  { label: "Editable", text: "adjust it below if your actual observed mileage differs." },
                  { label: "Real running cost", text: "enter today's fuel price to see daily, monthly and yearly cost." },
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
              <Label>Select Fuel Type</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FUEL_TYPES.map((ft) => {
                  const Icon = FUEL_TYPE_ICONS[ft];
                  return (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => setFuelType(ft)}
                      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[12.5px] font-bold transition-colors ${
                        fuelType === ft ? "border-brand text-brand" : "border-border text-ink hover:border-brand"
                      }`}
                    >
                      <Icon className="size-4" />
                      {FUEL_TYPE_LABELS[ft]}
                    </button>
                  );
                })}
              </div>
            </div>

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
                    disabled={filteredVariants.length === 0}
                    className={selectClass}
                  >
                    <option value="">Select Variant</option>
                    {filteredVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.variantName}
                      </option>
                    ))}
                  </select>
                  {modelId !== "" && filteredVariants.length === 0 && (
                    <p className="mt-1 text-[11px] text-faint">No {FUEL_TYPE_LABELS[fuelType]} variant for this model.</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Fuel Price</Label>
                <span className="text-[11px] font-medium text-faint">{FUEL_PRICE_UNIT_LABELS[fuelType]}</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Enter today's fuel price"
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Average Mileage</Label>
                <span className="text-[11px] font-medium text-faint">{MILEAGE_UNIT_LABELS[fuelType]}</span>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={averageMileage}
                onChange={(e) => setAverageMileage(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Select a car to pre-fill, or enter your own"
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Monthly Driving Distance</Label>
                <span className="text-[11px] font-medium text-faint">km</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={monthlyDistance}
                onChange={(e) => setMonthlyDistance(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 1000"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => document.getElementById("mileage-result")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="flex-1 cursor-pointer rounded-xl bg-brand py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                Calculate Mileage
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
              <ShieldIcon className="size-3" /> All calculations are based on the figures you enter and may vary.
            </p>
          </div>
        </div>

        {/* Right — Your Result */}
        <div id="mileage-result" className="flex flex-col gap-4">
          {mileageValue <= 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-page text-brand">
                <GaugeIcon className="size-5" />
              </span>
              <p className="text-[14px] font-bold text-ink">Enter your mileage to get started</p>
              <p className="text-[12.5px] text-muted">
                Select a car on the left to auto-fill it, or type your own mileage directly.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-green-50 p-5">
                <p className="text-[12px] font-bold text-ink">Your Car Mileage</p>
                <p className="mt-1 text-[32px] font-extrabold leading-none text-green-700">
                  {averageMileage || "—"} <span className="text-[16px] font-bold">{MILEAGE_UNIT_LABELS[fuelType]}</span>
                </p>
                <p className="mt-1 text-[12px] font-medium text-muted">This is the mileage used for your cost calculation below.</p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="mb-3 text-[13.5px] font-bold text-ink">Running Cost Summary</h3>
                {!hasRunningCost ? (
                  <p className="text-[12.5px] text-muted">
                    Enter the fuel price and your monthly driving distance above to see your running cost.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Cost per km", formatRupee(runningCost.costPerKm)],
                      ["Daily Cost", formatRupee(runningCost.dailyCost)],
                      ["Monthly Cost", formatRupee(runningCost.monthlyCost)],
                      ["Yearly Cost", formatRupee(runningCost.yearlyCost)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-page p-3">
                        <p className="text-[10.5px] font-bold uppercase tracking-wide text-faint">{label}</p>
                        <p className="mt-1 text-[15px] font-extrabold text-ink">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {hasRunningCost && (
                <SoftLeadCapture
                  calculatorType="mileage"
                  brandId={selectedBrand?.id}
                  modelId={selectedModel?.id}
                  inputSummary={`Mileage ${averageMileage} ${MILEAGE_UNIT_LABELS[fuelType]} · Running cost ${formatRupee(runningCost.monthlyCost)}/mo`}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mileage Comparison — only meaningful once a real car (with a
          body type) is selected, since the comparison set is other cars
          of that SAME body type and fuel type. */}
      {carDetail?.bodyType && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h3 className="text-[15px] font-bold text-ink">Mileage Comparison</h3>
          <p className="mb-4 text-[12px] text-muted">
            Other {carDetail.bodyType.name} · {FUEL_TYPE_LABELS[fuelType]} cars, for a fair comparison.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="relative h-44 overflow-hidden rounded-xl border-[1.5px] border-brand bg-page">
              {carDetail.coverImageUrl && (
                <Image src={carDetail.coverImageUrl} alt={carDetail.name} fill sizes="180px" className="object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="truncate text-[12px] font-bold text-white">{carDetail.name}</p>
                <p className="text-[10px] text-white/75">{FUEL_TYPE_LABELS[fuelType]}</p>
                <p className="text-[14px] font-extrabold text-white">
                  {averageMileage || "—"} <span className="text-[10px] font-semibold text-white/75">{MILEAGE_UNIT_LABELS[fuelType]}</span>
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-orange-300">You</p>
              </div>
            </div>
            {otherCars.map((car) => (
              <Link
                key={car.id}
                href={`/${car.brand.slug}-cars/${car.slug}`}
                className="group relative block h-44 overflow-hidden rounded-xl border border-border bg-page"
              >
                {car.coverImageUrl && (
                  <Image src={car.coverImageUrl} alt={car.name} fill sizes="180px" className="object-cover transition-transform group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="truncate text-[12px] font-bold text-white">
                    {car.brand.name} {car.name}
                  </p>
                  <p className="text-[10px] text-white/75">{FUEL_TYPE_LABELS[fuelType]}</p>
                  <p className="text-[14px] font-extrabold text-white">
                    {car.isElectric ? car.specs?.range ?? "—" : car.specs?.mileage ?? "—"}{" "}
                    <span className="text-[10px] font-semibold text-white/75">{MILEAGE_UNIT_LABELS[fuelType]}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-white underline">View Details</p>
                </div>
              </Link>
            ))}
            {otherCars.length === 0 && (
              <p className="col-span-2 text-[12.5px] text-muted sm:col-span-3">
                No other {carDetail.bodyType.name} · {FUEL_TYPE_LABELS[fuelType]} cars to compare right now.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mileage Affected By */}
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-page p-6 sm:grid-cols-4">
        {AFFECTED_BY.map(({ Icon, title, desc }) => (
          <div key={title} className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface text-brand">
              <Icon className="size-4.5" />
            </span>
            <p className="text-[12.5px] font-bold text-ink">{title}</p>
            <p className="text-[11px] leading-relaxed text-faint">{desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-faint">
        *Mileage shown is the manufacturer-rated figure for the selected variant. Actual mileage may vary depending on driving
        conditions, traffic, vehicle condition and driving habits.
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
