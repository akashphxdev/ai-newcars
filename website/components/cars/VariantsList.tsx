"use client";

import { useState } from "react";
import Link from "next/link";
import { formatSinglePrice } from "@/lib/format";
import { getCarVariants } from "@/features/cars/car.api";
import type { CarDetailVariantOption } from "@/features/cars/car.types";

// getCarDetail's own payload only ships a preview subset of variants
// (VARIANT_OPTIONS_PREVIEW_LIMIT on the backend) — "View All" fetches the
// full list from the dedicated variants endpoint on demand instead of
// shipping every variant on first load.
export default function VariantsList({
  brandSlug,
  modelSlug,
  variantOptions,
  variantCount,
  selectedVariantId,
}: {
  brandSlug: string;
  modelSlug: string;
  variantOptions: CarDetailVariantOption[];
  variantCount: number;
  selectedVariantId: number | undefined;
}) {
  const [allVariants, setAllVariants] = useState<CarDetailVariantOption[] | null>(null);
  const [loading, setLoading] = useState(false);

  const visible = allVariants ?? variantOptions;
  const hasMore = !allVariants && variantCount > variantOptions.length;

  async function loadAll() {
    setLoading(true);
    try {
      const all = await getCarVariants(brandSlug, modelSlug);
      setAllVariants(all);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {visible.map((opt) => {
        const isSelected = opt.id === selectedVariantId;
        return (
          <Link
            key={opt.id}
            href={`?variant=${opt.id}#variants`}
            scroll={false}
            className={`flex items-center justify-between rounded-xl border px-4 py-3.5 transition-colors ${
              isSelected ? "border-brand bg-orange-50" : "border-border bg-white hover:border-brand"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-bold text-ink">{opt.variantName}</span>
              {opt.isTopSeller && (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                  Top Seller
                </span>
              )}
            </div>
            <span className="text-[13.5px] font-bold text-ink">{formatSinglePrice(opt.price)}</span>
          </Link>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="cursor-pointer self-start text-[12.5px] font-bold text-brand hover:underline disabled:opacity-60"
        >
          {loading ? "Loading..." : `View All ${variantCount} Variants`}
        </button>
      )}
    </div>
  );
}
