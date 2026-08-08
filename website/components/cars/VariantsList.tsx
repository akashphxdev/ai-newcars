"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSinglePrice, slugify } from "@/lib/format";
import { getCarVariants } from "@/features/cars/car.api";
import { CompareIcon, CheckIcon } from "@/components/common/icons";
import { addToTray, removeFromTray, getTrayItems, subscribeTray, MAX_TRAY_ITEMS } from "@/features/compare/compareTray";
import type { CarDetailVariantOption } from "@/features/cars/car.types";
import { routes } from "@/lib/routes";

// getCarDetail's own payload only ships a preview subset of variants
// (VARIANT_OPTIONS_PREVIEW_LIMIT on the backend) — "View All" fetches the
// full list from the dedicated variants endpoint on demand instead of
// shipping every variant on first load.
//
// Each variant is its own page (/brand-cars/model/variant-slug) rather
// than a query param — see app/car-model/[brandSlug]/[modelSlug]/[variantSlug].
export default function VariantsList({
  brandSlug,
  modelSlug,
  carName,
  brandName,
  imageUrl,
  variantOptions,
  variantCount,
  selectedVariantId,
}: {
  brandSlug: string;
  modelSlug: string;
  carName: string;
  brandName: string;
  imageUrl: string | null;
  variantOptions: CarDetailVariantOption[];
  variantCount: number;
  selectedVariantId: number | undefined;
}) {
  const [allVariants, setAllVariants] = useState<CarDetailVariantOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  // Which of THIS model's variants are currently queued — more than one
  // can be (e.g. comparing two trims of the same car against a rival), so
  // this tracks a set of variantIds, not just a single "selected" one.
  // Starts empty to match the server-rendered markup (localStorage isn't
  // available during SSR) — filled in after mount, same pattern as
  // RecentlyViewedComparisons.
  const [queuedVariantIds, setQueuedVariantIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const sync = () =>
      setQueuedVariantIds(new Set(getTrayItems().filter((i) => i.modelSlug === modelSlug).map((i) => i.variantId)));
    sync();
    return subscribeTray(sync);
  }, [modelSlug]);

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

  function handleCompareClick(opt: CarDetailVariantOption) {
    if (queuedVariantIds.has(opt.id)) {
      removeFromTray(opt.id);
    } else {
      addToTray({ modelSlug, variantId: opt.id, variantName: opt.variantName, carName, brandName, imageUrl });
    }
  }

  return (
    <div className="mt-7 border-y border-border bg-white">
      <div className="hidden grid-cols-[minmax(0,1fr)_160px_128px] border-b border-border bg-page px-5 py-3 text-[10.5px] font-black uppercase tracking-[0.12em] text-muted sm:grid">
        <span>Variant</span>
        <span className="text-right">Ex-showroom</span>
        <span className="text-right">Compare</span>
      </div>
      {visible.map((opt) => {
        const isSelected = opt.id === selectedVariantId;
        const isQueued = queuedVariantIds.has(opt.id);
        return (
          <div
            key={opt.id}
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-4 transition-colors last:border-b-0 sm:grid-cols-[minmax(0,1fr)_160px_128px] sm:px-5 ${
              isSelected ? "bg-orange-50" : "bg-white hover:bg-page"
            }`}
          >
            <Link href={routes.variant(brandSlug, modelSlug, slugify(opt.variantName))} className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13.5px] font-bold text-ink">{opt.variantName}</span>
                {opt.isTopSeller && (
                  <span className="bg-brand px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-white">
                    Best value
                  </span>
                )}
              </div>
              <span className="mt-1 block text-[11px] font-medium text-muted sm:hidden">{formatSinglePrice(opt.price)}</span>
            </Link>

            <Link href={routes.variant(brandSlug, modelSlug, slugify(opt.variantName))} className="hidden text-right text-[13.5px] font-extrabold text-ink sm:block">
              {formatSinglePrice(opt.price)}
            </Link>

            <button
              type="button"
              onClick={() => handleCompareClick(opt)}
              title={isQueued ? "Remove from comparison" : "Add to Compare"}
              className={`flex shrink-0 items-center justify-center gap-1 border px-2 py-2 text-[11px] font-bold transition-colors ${
                isQueued ? "border-brand bg-orange-50 text-brand" : "border-border text-muted hover:border-brand hover:text-brand"
              }`}
            >
              {isQueued ? <CheckIcon className="size-3.5" /> : <CompareIcon className="size-3.5" />}
              <span className="hidden sm:inline">{isQueued ? "Added" : "Compare"}</span>
            </button>
          </div>
        );
      })}

      {hasMore && (
        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="cursor-pointer text-[12px] font-black uppercase tracking-[0.08em] text-brand hover:underline disabled:opacity-60"
          >
            {loading ? "Loading..." : `View all ${variantCount} variants`}
          </button>
        </div>
      )}

      <p className="border-t border-border px-5 py-3 text-[10.5px] text-muted">
        Up to {MAX_TRAY_ITEMS} cars can be compared at once — pick a variant above from any car&apos;s page to build your comparison.
      </p>
    </div>
  );
}
