"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BoltIcon, ClockIcon, StarIcon, CheckIcon, ShieldIcon } from "@/components/common/icons";
import { getModelsByBrand } from "@/features/calculators/emiCalculator.api";
import { getVariantsByModel } from "@/features/calculators/mileageCalculator.api";
import type { EmiCalculatorModel } from "@/features/calculators/emiCalculator.types";
import type { MileageCalculatorVariant } from "@/features/calculators/mileageCalculator.types";
import type { Brand } from "@/features/brands/brand.types";
import { getCarDetail } from "@/features/cars/car.api";
import type { CarDetailResult } from "@/features/cars/car.types";
import { formatLakh } from "@/lib/calculatorFormat";
import { Label, selectClass, inputClass } from "@/components/calculators/CalculatorFormControls";
import SoftLeadCapture from "@/components/leads/SoftLeadCapture";

function formatDuration(hours: number): string {
  if (!isFinite(hours) || hours <= 0) return "—";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function EvChargingCalculatorClient({ brands }: { brands: Brand[] }) {
  const [brandId, setBrandId] = useState<number | "">("");
  const [models, setModels] = useState<EmiCalculatorModel[]>([]);
  const [modelId, setModelId] = useState<number | "">("");
  const [variants, setVariants] = useState<MileageCalculatorVariant[]>([]);
  const [variantId, setVariantId] = useState<number | "">("");

  const [fromPct, setFromPct] = useState("20");
  const [toPct, setToPct] = useState("100");

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
  const evVariants = useMemo(() => variants.filter((v) => v.isElectric), [variants]);
  const selectedVariant = evVariants.find((v) => v.id === variantId) ?? null;

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

  const electricSpecs = carDetail?.selectedVariant?.electric ?? null;
  const batteryCapacity = electricSpecs?.batteryCapacity ? Number(electricSpecs.batteryCapacity) : 0;
  const acOutput = electricSpecs?.acChargingOutput ? Number(electricSpecs.acChargingOutput) : 0;
  const dcOutput = electricSpecs?.dcChargingOutput ? Number(electricSpecs.dcChargingOutput) : 0;

  const fromValue = Math.max(0, Math.min(100, Number(fromPct) || 0));
  const toValue = Math.max(0, Math.min(100, Number(toPct) || 0));
  const chargeRangePct = Math.max(toValue - fromValue, 0);
  const hasValidRange = batteryCapacity > 0 && chargeRangePct > 0;

  const acTime = hasValidRange && acOutput > 0 ? (batteryCapacity * chargeRangePct) / 100 / acOutput : 0;
  const dcTime = hasValidRange && dcOutput > 0 ? (batteryCapacity * chargeRangePct) / 100 / dcOutput : 0;

  const handleReset = () => {
    setFromPct("20");
    setToPct("100");
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
                  { label: "Battery capacity", text: `${batteryCapacity || "—"} kWh, from this variant's own spec sheet.` },
                  { label: "Charging output", text: "AC and DC fast-charging power, also from the spec sheet." },
                  { label: "Pick a range", text: "choose the charge % you're starting and ending at, below." },
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
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Select Your EV</p>
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
                    disabled={evVariants.length === 0}
                    className={selectClass}
                  >
                    <option value="">Select Variant</option>
                    {evVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.variantName}
                      </option>
                    ))}
                  </select>
                  {modelId !== "" && evVariants.length === 0 && (
                    <p className="mt-1 text-[11px] text-faint">No electric variant for this model.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Charge From (%)</Label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={fromPct}
                  onChange={(e) => setFromPct(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="20"
                  className={inputClass}
                />
              </div>
              <div>
                <Label>Charge To (%)</Label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={toPct}
                  onChange={(e) => setToPct(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="100"
                  className={inputClass}
                />
              </div>
            </div>
            {toValue <= fromValue && fromPct && toPct && (
              <p className="-mt-2 text-[11px] font-medium text-red-600">&quot;Charge To&quot; should be greater than &quot;Charge From&quot;.</p>
            )}

            {carDetail && (
              <div className="rounded-xl bg-page p-3.5 text-[12px] text-muted">
                <p>
                  Battery: <span className="font-semibold text-ink">{batteryCapacity || "—"} kWh</span> · AC Output:{" "}
                  <span className="font-semibold text-ink">{acOutput || "—"} kW</span> · DC Output:{" "}
                  <span className="font-semibold text-ink">{dcOutput || "—"} kW</span>
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="self-start cursor-pointer rounded-xl border border-border px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              ↻ Reset
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-faint">
              <ShieldIcon className="size-3" /> Actual charging time can vary with temperature, charger health and battery condition.
            </p>
          </div>
        </div>

        {/* Right — Your Result */}
        <div className="flex flex-col gap-4">
          {!hasValidRange ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-page text-brand">
                <BoltIcon className="size-5" />
              </span>
              <p className="text-[14px] font-bold text-ink">Select an EV to see charging time</p>
              <p className="text-[12.5px] text-muted">Pick a brand, model and variant, then set your charge range.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-[12px] font-bold text-ink">Charging {fromValue}% → {toValue}%</p>
                <p className="mt-1 text-[12px] text-muted">
                  Adding {((batteryCapacity * chargeRangePct) / 100).toFixed(1)} kWh to the battery.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-page text-brand">
                      <BoltIcon className="size-4" />
                    </span>
                    <p className="text-[12.5px] font-bold text-ink">AC Charging</p>
                  </div>
                  <p className="mt-3 text-[26px] font-extrabold text-ink">{formatDuration(acTime)}</p>
                  <p className="mt-1 text-[11.5px] text-muted">at {acOutput || "—"} kW</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-page text-brand">
                      <ClockIcon className="size-4" />
                    </span>
                    <p className="text-[12.5px] font-bold text-ink">DC Fast Charging</p>
                  </div>
                  <p className="mt-3 text-[26px] font-extrabold text-ink">{formatDuration(dcTime)}</p>
                  <p className="mt-1 text-[11.5px] text-muted">at {dcOutput || "—"} kW</p>
                </div>
              </div>

              <SoftLeadCapture
                calculatorType="ev_charging"
                brandId={selectedBrand?.id}
                modelId={selectedModel?.id}
                inputSummary={`Charging ${fromValue}%→${toValue}% · AC ${formatDuration(acTime)} · DC ${formatDuration(dcTime)}`}
              />
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-faint">
        *Charging time is estimated assuming a constant charging rate across the whole range. Real EV charging speed typically
        tapers off above ~80%, so actual time to 100% may be longer than this estimate.
      </p>
    </div>
  );
}
