"use client";
import { useState } from "react";
import Image from "next/image";
import { getCarVariantOptions, getVariantPowertrainOptions } from "@/features/compare/compare.api";
import type { CarOption, CompareVariantOption, CompareVariantPowertrainOption } from "@/features/compare/compare.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='12' fill='%23e5e7eb'/%3E%3C/svg%3E";

const selectClass =
  "w-full cursor-pointer rounded-lg border border-border bg-page px-1.5 py-1.5 text-[10px] font-semibold text-ink outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:px-2.5 sm:py-2 sm:text-[12.5px]";

// A car isn't fully "picked" until brand -> model -> variant -> powertrain
// are all chosen — comparing at the model level alone is too vague, since
// specs (power, mileage, features) actually differ by variant/powertrain,
// not by model name. Shared by ComparePicker (compare-cars hub) and
// CompareResults (the "+ Add car" slot on the result page itself).
export type SelectedCompareCar = CarOption & {
  variantId: number;
  variantName: string;
  powertrainId: number;
  powertrainLabel: string;
};

export default function AddCarSlot({
  brands,
  byBrand,
  excludeSlugs,
  onPick,
}: {
  brands: string[];
  byBrand: Map<string, CarOption[]>;
  excludeSlugs: Set<string>;
  onPick: (car: SelectedCompareCar) => void;
}) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState<CarOption | null>(null);
  const [variants, setVariants] = useState<CompareVariantOption[]>([]);
  const [variantId, setVariantId] = useState<number | "">("");
  const [powertrains, setPowertrains] = useState<CompareVariantPowertrainOption[]>([]);
  const [powertrainId, setPowertrainId] = useState<number | "">("");
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingPowertrains, setLoadingPowertrains] = useState(false);

  const models = (brand ? byBrand.get(brand) ?? [] : []).filter((m) => !excludeSlugs.has(m.slug));

  function resetFromBrand(nextBrand: string) {
    setBrand(nextBrand);
    setModel(null);
    setVariants([]);
    setVariantId("");
    setPowertrains([]);
    setPowertrainId("");
  }

  async function selectModel(slug: string) {
    const car = models.find((m) => m.slug === slug);
    if (!car) return;
    setModel(car);
    setVariantId("");
    setPowertrains([]);
    setPowertrainId("");
    setLoadingVariants(true);
    try {
      setVariants(await getCarVariantOptions(car.slug));
    } finally {
      setLoadingVariants(false);
    }
  }

  async function selectVariant(id: number) {
    setVariantId(id);
    setPowertrainId("");
    if (!model) return;
    setLoadingPowertrains(true);
    try {
      setPowertrains(await getVariantPowertrainOptions(model.slug, id));
    } finally {
      setLoadingPowertrains(false);
    }
  }

  // Auto-adds the moment a powertrain is chosen — no separate confirm
  // step, since brand/model/variant are already locked in by then.
  function selectPowertrain(id: number) {
    setPowertrainId(id);
    if (!model || variantId === "") return;
    const variant = variants.find((v) => v.id === variantId);
    const powertrain = powertrains.find((p) => p.id === id);
    if (!variant || !powertrain) return;
    onPick({ ...model, variantId: variant.id, variantName: variant.variantName, powertrainId: powertrain.id, powertrainLabel: powertrain.label });
  }

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border bg-surface p-1.5 text-center sm:gap-2 sm:p-3">
      <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-page">
        {model ? (
          <Image src={model.coverImageUrl ?? FALLBACK_IMG} alt={model.name} fill sizes="200px" className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 text-base font-bold leading-none text-brand sm:size-9 sm:text-xl">+</span>
            <span className="text-[9.5px] font-semibold text-muted sm:text-[12px]">Add car</span>
          </div>
        )}
      </div>

      <select value={brand} onChange={(e) => resetFromBrand(e.target.value)} className={selectClass}>
        <option value="">Select Brand</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select value={model?.slug ?? ""} disabled={!brand} onChange={(e) => selectModel(e.target.value)} className={selectClass}>
        <option value="">{brand ? "Select Model" : "Pick a brand first"}</option>
        {models.map((m) => (
          <option key={m.id} value={m.slug}>
            {m.name}
          </option>
        ))}
      </select>

      {model && (
        <select
          value={variantId}
          disabled={loadingVariants}
          onChange={(e) => selectVariant(Number(e.target.value))}
          className={selectClass}
        >
          <option value="">{loadingVariants ? "Loading variants…" : "Select Variant"}</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.variantName}
            </option>
          ))}
        </select>
      )}

      {variantId !== "" && (
        <select
          value={powertrainId}
          disabled={loadingPowertrains}
          onChange={(e) => selectPowertrain(Number(e.target.value))}
          className={selectClass}
        >
          <option value="">{loadingPowertrains ? "Loading powertrains…" : "Select Powertrain"}</option>
          {powertrains.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
