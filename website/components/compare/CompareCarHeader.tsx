"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StarIcon, EditIcon } from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import VariantPicker from "./VariantPicker";
import PowertrainPicker from "./PowertrainPicker";
import type { CompareCarResult } from "@/features/compare/compare.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

// The spec table below compares a specific variant's specific powertrain,
// not the model as a whole. Variant/powertrain show as a plain text line
// with a pencil icon by default (matches the reference layout); clicking
// it swaps that line for the actual pickers. Switching either re-fetches
// client-side (onVariantChange/onPowertrainChange) rather than
// navigating — the URL stays the clean "/compare/model-a-vs-model-b"
// regardless of which variant is shown.
export default function CompareCarHeader({
  car,
  onVariantChange,
  onPowertrainChange,
  loading,
}: {
  car: CompareCarResult;
  onVariantChange: (variantId: number) => void;
  onPowertrainChange: (powertrainId: number) => void;
  loading: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const canEdit = car.variantOptions.length > 1 || car.powertrainOptions.length > 1;
  const summary = [car.selectedVariant?.variantName, car.selectedPowertrain?.label].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface p-2 text-center sm:gap-2 sm:p-3.5">
      <Link href={`/${car.brand.slug}-cars/${car.slug}`} className="relative aspect-16/10 w-full overflow-hidden rounded-xl bg-page">
        <Image src={car.coverImageUrl ?? FALLBACK_IMG} alt={`${car.brand.name} ${car.name}`} fill sizes="260px" className="object-cover" />
      </Link>

      <div className="w-full">
        <p className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-muted sm:text-[10px]">{car.brand.name}</p>
        <h2 className="text-[12px] font-bold leading-tight text-ink sm:text-[15.5px]">{car.name}</h2>

        {editing ? (
          <div className="mt-1.5 flex flex-col items-center gap-1.5">
            <VariantPicker
              options={car.variantOptions}
              selectedId={car.selectedVariant?.id ?? null}
              onChange={(id) => {
                onVariantChange(id);
                setEditing(false);
              }}
              disabled={loading}
            />
            <PowertrainPicker
              options={car.powertrainOptions}
              selectedId={car.selectedPowertrain?.id ?? null}
              onChange={(id) => {
                onPowertrainChange(id);
                setEditing(false);
              }}
              disabled={loading}
            />
          </div>
        ) : (
          summary && (
            <button
              type="button"
              onClick={() => canEdit && setEditing(true)}
              disabled={!canEdit}
              className="mt-0.5 flex w-full cursor-pointer items-center justify-center gap-1 text-[9.5px] font-semibold text-brand disabled:cursor-default sm:text-[11.5px]"
            >
              <span className="min-w-0 truncate">{summary}</span>
              {canEdit && <EditIcon className="size-2.5 shrink-0" />}
            </button>
          )
        )}
      </div>

      {car.ratingAvg && (
        <div className="flex items-center gap-1">
          <StarIcon filled className="size-2.5 text-amber-400 sm:size-3" />
          <span className="text-[10px] font-bold text-ink sm:text-[11.5px]">{car.ratingAvg}</span>
        </div>
      )}

      <p className="text-[13px] font-bold text-ink sm:text-[17px]">{formatSinglePrice(car.selectedVariant?.price ?? car.priceMin)}</p>

      <button
        type="button"
        className="w-full cursor-pointer rounded-xl border-[1.5px] border-brand px-2 py-1.5 text-[9.5px] font-bold text-brand transition-colors hover:bg-orange-50 sm:px-3 sm:text-[11.5px]"
      >
        View Offers
      </button>
    </div>
  );
}
