"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { stripPrefix } from "@/lib/format";
import Image from "next/image";
import { FuelIcon, FlameIcon, BoltIcon, TagIcon, ShieldIcon, CheckIcon } from "@/components/common/icons";
import { getModelsByBrand } from "@/features/calculators/emiCalculator.api";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import type { EmiCalculatorModel } from "@/features/calculators/emiCalculator.types";
import { FUEL_TYPES, FUEL_TYPE_LABELS, FUEL_PRICE_UNIT_LABELS, MILEAGE_UNIT_LABELS } from "@/features/calculators/mileageCalculator.types";
import type { FuelType, MileageCalculatorVariant } from "@/features/calculators/mileageCalculator.types";
import type { Brand } from "@/features/brands/brand.types";
import type { ModelSeed } from "@/features/calculators/calculatorSeed";
import { getCarDetail } from "@/features/cars/car.api";
import { calculateRunningCost, ratedFigure } from "@/lib/mileageMath";
import FuelBreakEvenVerdict from "./FuelBreakEvenVerdict";
import { formatRupee } from "@/lib/calculatorFormat";
import { Label, selectClass, inputClass } from "@/components/calculators/CalculatorFormControls";
import SoftLeadCapture from "@/components/leads/SoftLeadCapture";
import { CITY_EVENT, getCurrentCity } from "@/features/location/currentCity";
import { getFuelPricesForCity } from "@/features/fuel/fuel.api";
import type { LocationCity } from "@/features/location/location.types";
import type { FuelName } from "@/features/fuel/fuel.types";

const FUEL_TYPE_ICONS: Record<FuelType, React.ComponentType<{ className?: string }>> = {
  petrol: FuelIcon,
  diesel: FuelIcon,
  cng: FlameIcon,
  ev: BoltIcon,
};

const FUEL_TYPE_THEME: Record<FuelType, { header: string; value: string; bar: string }> = {
  petrol: { header: "border-brand/35 bg-orange-50 text-brand", value: "text-brand", bar: "bg-brand" },
  diesel: { header: "border-slate-300 bg-slate-50 text-slate-700", value: "text-slate-700", bar: "bg-slate-700" },
  cng: { header: "border-green-300 bg-green-50 text-green-700", value: "text-green-700", bar: "bg-green-600" },
  ev: { header: "border-cyan-300 bg-cyan-50 text-cyan-700", value: "text-cyan-700", bar: "bg-cyan-600" },
};

interface FuelOption {
  fuelType: FuelType;
  variant: MileageCalculatorVariant;
  imageUrl: string | null;
  mileage: string;
  fuelPrice: string;
}

export default function FuelComparisonCalculatorClient({
  brands,
  seed = null,
}: {
  brands: Brand[];
  seed?: ModelSeed | null;
}) {
  const [brandId, setBrandId] = useState<number | "">(seed?.brandId ?? "");
  const [models, setModels] = useState<EmiCalculatorModel[]>(seed?.models ?? []);
  const [modelId, setModelId] = useState<number | "">(seed?.modelId ?? "");

  const [city, setCity] = useState<LocationCity | null>(null);
  const [cityPrices, setCityPrices] = useState<Partial<Record<FuelName, string>>>({});
  const [pricesFrom, setPricesFrom] = useState<string | null>(null);
  const cityPricesRef = useRef<Partial<Record<FuelName, string>>>({});
  const [fuelOptions, setFuelOptions] = useState<FuelOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [monthlyDistance, setMonthlyDistance] = useState("1200");

  // Changing brand must clear the model beneath it, but that same reset
  // runs on mount and would discard the server-seeded car.
  const hydrating = useRef(seed != null);

  useEffect(() => {
    if (brandId === "") {
      setModels([]);
      setModelId("");
      return;
    }
    if (hydrating.current) {
      hydrating.current = false;
      return;
    }
    getModelsByBrand(brandId).then((list) => {
      setModels(list);
      setModelId("");
    });
  }, [brandId]);

  const selectedBrand = brands.find((b) => b.id === brandId) ?? null;
  const selectedModel = models.find((m) => m.id === modelId) ?? null;

  // For each fuel type that actually has a variant on this model, take
  // the cheapest one as the representative and fetch its real mileage —
  // only fuel types genuinely available for this model are shown, none
  // invented.
  useEffect(() => {
    if (!selectedBrand || !selectedModel) {
      setFuelOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingOptions(true);

    getVariantsByModel(selectedModel.id)
      .then(async (variants) => {
        if (cancelled) return;

        const representatives: { fuelType: FuelType; variant: MileageCalculatorVariant }[] = [];
        for (const ft of FUEL_TYPES) {
          const match = variants.find((v) => (ft === "ev" ? v.isElectric : !v.isElectric && v.fuelType?.toLowerCase() === ft));
          if (match) representatives.push({ fuelType: ft, variant: match });
        }

        const details = await Promise.all(
          representatives.map(({ variant }) => getCarDetail(selectedBrand.slug, selectedModel.slug, variant.id)),
        );

        if (cancelled) return;

        const options: FuelOption[] = representatives.map(({ fuelType, variant }, i) => {
          const detail = details[i];
          const sv = detail?.selectedVariant;
          const rated = sv ? ratedFigure(sv) : null;
          return {
            fuelType,
            variant,
            imageUrl: detail?.coverImageUrl ?? null,
            mileage: rated ? String(rated) : "",
            fuelPrice: cityPricesRef.current[fuelType as FuelName] ?? "",
          };
        });

        setFuelOptions(options);
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBrand?.slug, selectedModel?.id, selectedModel?.slug]);

  useEffect(() => {
    setCity(getCurrentCity());
    const sync = (e: Event) => setCity((e as CustomEvent<LocationCity>).detail);
    window.addEventListener(CITY_EVENT, sync);
    return () => window.removeEventListener(CITY_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!city?.stateSlug) return;
    let alive = true;
    getFuelPricesForCity(city.stateSlug, city.slug).then((res) => {
      if (!alive || !res) return;
      const next: Partial<Record<FuelName, string>> = {};
      (Object.keys(res.prices) as FuelName[]).forEach((f) => {
        const p = res.prices[f];
        if (p) next[f] = Number(p.price).toFixed(2);
      });
      cityPricesRef.current = next;
      setCityPrices(next);
      setPricesFrom(res.prices.petrol?.updatedOn ?? null);
    });
    return () => {
      alive = false;
    };
  }, [city]);

  // Fill only blanks, so a price the visitor typed is never overwritten
  // when they change city or pick another car.
  useEffect(() => {
    if (Object.keys(cityPrices).length === 0) return;
    setFuelOptions((prev) =>
      prev.map((o) =>
        o.fuelPrice === "" && cityPrices[o.fuelType as FuelName]
          ? { ...o, fuelPrice: cityPrices[o.fuelType as FuelName]! }
          : o,
      ),
    );
  }, [cityPrices, fuelOptions.length]);

  const monthlyDistanceValue = Number(monthlyDistance) || 0;

  const results = useMemo(
    () =>
      fuelOptions.map((opt) => {
        const mileageValue = Number(opt.mileage) || 0;
        const priceValue = Number(opt.fuelPrice) || 0;
        const cost = calculateRunningCost(priceValue, mileageValue, monthlyDistanceValue);
        const hasCost = mileageValue > 0 && priceValue > 0 && monthlyDistanceValue > 0;
        return { ...opt, cost, hasCost };
      }),
    [fuelOptions, monthlyDistanceValue],
  );

  const validResults = results.filter((r) => r.hasCost);

  const breakEvenOptions = validResults.map((r) => ({
    label: FUEL_TYPE_LABELS[r.fuelType],
    price: Number(r.variant.price) || 0,
    costPerKm: r.cost.costPerKm,
  }));

  const cheapestFuelType =
    validResults.length > 1 ? validResults.reduce((min, r) => (r.cost.monthlyCost < min.cost.monthlyCost ? r : min)).fuelType : null;
  const mostExpensive =
    validResults.length > 1 ? validResults.reduce((max, r) => (r.cost.monthlyCost > max.cost.monthlyCost ? r : max)) : null;
  const cheapest = validResults.length > 1 ? validResults.find((r) => r.fuelType === cheapestFuelType) ?? null : null;
  const monthlySavings = cheapest && mostExpensive ? mostExpensive.cost.monthlyCost - cheapest.cost.monthlyCost : 0;

  const updateOption = (fuelType: FuelType, patch: Partial<Pick<FuelOption, "mileage" | "fuelPrice">>) => {
    setFuelOptions((prev) => prev.map((opt) => (opt.fuelType === fuelType ? { ...opt, ...patch } : opt)));
  };

  return (
    <div className="tool-workspace tool-workspace-comparison">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 border-b border-border-soft pb-3 text-[15px] font-bold text-ink">Select a Car</h2>
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
                  {stripPrefix(m.name, selectedBrand?.name ?? "")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Monthly Driving Distance</Label>
            <input
              type="text"
              inputMode="numeric"
              value={monthlyDistance}
              onChange={(e) => setMonthlyDistance(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 1200 km"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {Object.keys(cityPrices).length > 0 && city && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
          <CheckIcon className="size-3.5 text-ev" />
          Fuel prices prefilled from {city.name}
          {pricesFrom && `, ${pricesFrom}`}. Edit any of them if your local rate differs.
        </p>
      )}
      {!city && (
        <p className="mt-3 text-[12px] text-muted">
          Pick your city in the header and we&apos;ll fill today&apos;s fuel prices for you.
        </p>
      )}

      {loadingOptions && <p className="mt-6 text-center text-[13px] text-muted">Loading fuel-type options for this car...</p>}

      {!loadingOptions && modelId !== "" && fuelOptions.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          No fuel-type variants found for this model.
        </p>
      )}

      {!loadingOptions && fuelOptions.length > 0 && (
        <>
          {fuelOptions.length === 1 && (
            <p className="mt-6 rounded-xl bg-page px-4 py-3 text-[12.5px] text-muted">
              This model is only available in {FUEL_TYPE_LABELS[fuelOptions[0].fuelType]} — nothing to compare it against yet.
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {results.map((opt) => {
              const Icon = FUEL_TYPE_ICONS[opt.fuelType];
              const theme = FUEL_TYPE_THEME[opt.fuelType];
              const isCheapest = cheapestFuelType === opt.fuelType;
              return (
                <div
                  key={opt.fuelType}
                  className={`overflow-hidden rounded-lg border bg-surface transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lg ${isCheapest ? "border-[1.5px] border-green-600" : "border-border"}`}
                >
                  <div className={`flex h-11 items-center justify-between border-b px-4 ${theme.header}`}>
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" />
                      <p className="text-[13px] font-extrabold uppercase tracking-[0.08em]">{FUEL_TYPE_LABELS[opt.fuelType]}</p>
                    </div>
                    {isCheapest && (
                      <span className="rounded-sm bg-green-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">Lowest cost</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 border-b border-border-soft bg-page/50 px-4 py-3">
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-surface">
                      {opt.imageUrl && <Image src={opt.imageUrl} alt={opt.variant.variantName} fill sizes="80px" className="object-contain" />}
                    </div>
                    <p className="line-clamp-2 text-[11.5px] font-medium leading-4 text-muted" title={opt.variant.variantName}>
                      {opt.variant.variantName}
                    </p>
                  </div>
                  <div className="p-4">

                    <div className="mt-3">
                      <Label>Mileage ({MILEAGE_UNIT_LABELS[opt.fuelType]})</Label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={opt.mileage}
                        onChange={(e) => updateOption(opt.fuelType, { mileage: e.target.value.replace(/[^0-9.]/g, "") })}
                        className={inputClass}
                      />
                    </div>
                    <div className="mt-2.5">
                      <Label>Fuel Price ({FUEL_PRICE_UNIT_LABELS[opt.fuelType]})</Label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={opt.fuelPrice}
                        onChange={(e) => updateOption(opt.fuelType, { fuelPrice: e.target.value.replace(/[^0-9.]/g, "") })}
                        placeholder="Enter price"
                        className={inputClass}
                      />
                    </div>

                    <div className="mt-3 border-t border-border-soft pt-3">
                      {opt.hasCost ? (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Monthly running cost</p>
                          <p className={`mt-1 text-[26px] font-extrabold leading-none ${theme.value}`}>{formatRupee(opt.cost.monthlyCost)}</p>
                          <p className="text-[11px] text-muted">{formatRupee(opt.cost.costPerKm)} / km</p>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-page">
                            <div
                              className={`h-full rounded-full ${theme.bar}`}
                              style={{ width: `${Math.max(14, mostExpensive ? (opt.cost.monthlyCost / mostExpensive.cost.monthlyCost) * 100 : 100)}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-[11.5px] text-faint">Enter mileage &amp; price to see cost</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {cheapest && mostExpensive && cheapest.fuelType !== mostExpensive.fuelType && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-green-50 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                <CheckIcon className="size-4" />
              </span>
              <p className="text-[13px] text-ink">
                Choosing <span className="font-bold">{FUEL_TYPE_LABELS[cheapest.fuelType]}</span> over{" "}
                <span className="font-bold">{FUEL_TYPE_LABELS[mostExpensive.fuelType]}</span> saves you{" "}
                <span className="font-bold text-green-700">{formatRupee(monthlySavings)}/month</span> (
                {formatRupee(monthlySavings * 12)}/year).
              </p>
            </div>
          )}

          {validResults.length > 0 && selectedBrand && selectedModel && (
            <SoftLeadCapture
              calculatorType="fuel_comparison"
              brandId={selectedBrand.id}
              modelId={selectedModel.id}
              inputSummary={
                cheapest
                  ? `Cheapest: ${FUEL_TYPE_LABELS[cheapest.fuelType]} ${formatRupee(cheapest.cost.monthlyCost)}/mo`
                  : `${FUEL_TYPE_LABELS[validResults[0].fuelType]} ${formatRupee(validResults[0].cost.monthlyCost)}/mo`
              }
            />
          )}
          {breakEvenOptions.length > 1 && (
            <div className="mt-6">
              <FuelBreakEvenVerdict
                options={breakEvenOptions}
                monthlyDistanceKm={monthlyDistanceValue}
              />
            </div>
          )}
        </>
      )}

      {fuelOptions.length === 0 && !loadingOptions && modelId === "" && (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-page text-brand">
            <TagIcon className="size-5" />
          </span>
          <p className="text-[14px] font-bold text-ink">Select a car to compare its fuel-type options</p>
          <p className="text-[12.5px] text-muted">Pick a brand and model above.</p>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 pt-6 text-center text-[11px] text-faint">
        <ShieldIcon className="size-3" /> All calculations are based on the figures you enter and may vary.
      </p>
    </div>
  );
}
