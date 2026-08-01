"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FuelIcon, FlameIcon, BoltIcon, TagIcon, ShieldIcon, CheckIcon } from "@/components/common/icons";
import { getModelsByBrand } from "@/features/calculators/emiCalculator.api";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import type { EmiCalculatorModel } from "@/features/calculators/emiCalculator.types";
import { FUEL_TYPES, FUEL_TYPE_LABELS, FUEL_PRICE_UNIT_LABELS, MILEAGE_UNIT_LABELS } from "@/features/calculators/mileageCalculator.types";
import type { FuelType, MileageCalculatorVariant } from "@/features/calculators/mileageCalculator.types";
import type { Brand } from "@/features/brands/brand.types";
import { getCarDetail } from "@/features/cars/car.api";
import { calculateRunningCost } from "@/lib/mileageMath";
import { formatRupee } from "@/lib/calculatorFormat";
import { Label, selectClass, inputClass } from "@/components/calculators/CalculatorFormControls";

const FUEL_TYPE_ICONS: Record<FuelType, React.ComponentType<{ className?: string }>> = {
  petrol: FuelIcon,
  diesel: FuelIcon,
  cng: FlameIcon,
  ev: BoltIcon,
};

interface FuelOption {
  fuelType: FuelType;
  variant: MileageCalculatorVariant;
  imageUrl: string | null;
  mileage: string;
  fuelPrice: string;
}

export default function FuelComparisonCalculatorClient({ brands }: { brands: Brand[] }) {
  const [brandId, setBrandId] = useState<number | "">("");
  const [models, setModels] = useState<EmiCalculatorModel[]>([]);
  const [modelId, setModelId] = useState<number | "">("");

  const [fuelOptions, setFuelOptions] = useState<FuelOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [monthlyDistance, setMonthlyDistance] = useState("");

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
          const rated = sv ? (sv.isElectric ? sv.electric?.realWorldRange : sv.ice?.realWorldMileage) : null;
          return {
            fuelType,
            variant,
            imageUrl: detail?.coverImageUrl ?? null,
            mileage: rated ? String(rated) : "",
            fuelPrice: "",
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
    <div>
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
                  {m.name}
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

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {results.map((opt) => {
              const Icon = FUEL_TYPE_ICONS[opt.fuelType];
              const isCheapest = cheapestFuelType === opt.fuelType;
              return (
                <div
                  key={opt.fuelType}
                  className={`overflow-hidden rounded-2xl border bg-surface ${isCheapest ? "border-[1.5px] border-green-600" : "border-border"}`}
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-page">
                    {opt.imageUrl && <Image src={opt.imageUrl} alt={opt.variant.variantName} fill sizes="(max-width: 640px) 50vw, 260px" className="object-cover" />}
                    {isCheapest && (
                      <span className="absolute left-2 top-2 rounded-md bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">Cheapest</span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="mb-3 flex items-center gap-1.5">
                      <Icon className="size-4 text-brand" />
                      <p className="text-[13px] font-bold text-ink">{FUEL_TYPE_LABELS[opt.fuelType]}</p>
                    </div>
                    <p className="truncate text-[11.5px] text-faint" title={opt.variant.variantName}>
                      {opt.variant.variantName}
                    </p>

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
                          <p className="text-[10.5px] font-bold uppercase tracking-wide text-faint">Monthly Cost</p>
                          <p className="text-[20px] font-extrabold text-ink">{formatRupee(opt.cost.monthlyCost)}</p>
                          <p className="text-[11px] text-muted">{formatRupee(opt.cost.costPerKm)} / km</p>
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
