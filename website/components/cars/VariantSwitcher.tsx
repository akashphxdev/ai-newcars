"use client";

import { useState } from "react";
import Link from "next/link";
import { slugify } from "@/lib/format";
import { getCarVariants } from "@/features/cars/car.api";
import { ChevronDownIcon } from "@/components/common/icons";
import type { CarDetailVariantOption } from "@/features/cars/car.types";

// Rectangle below the hero's Ex-Showroom Price, showing the currently
// viewed variant — click opens a dropdown of the model's other variants,
// each navigating straight to that variant's own page.
//
// `variantOptions` is only the preview subset getCarDetail ships
// (VARIANT_OPTIONS_PREVIEW_LIMIT on the backend) — same reason
// VariantsList's own "View All" fetches the full list lazily instead of
// assuming the preview is everything.
export default function VariantSwitcher({
  brandSlug,
  modelSlug,
  currentVariantName,
  variantOptions,
  variantCount,
}: {
  brandSlug: string;
  modelSlug: string;
  currentVariantName: string;
  variantOptions: CarDetailVariantOption[];
  variantCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [allVariants, setAllVariants] = useState<CarDetailVariantOption[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (variantCount <= 1) return null;

  const visible = allVariants ?? variantOptions;
  const hasMore = !allVariants && variantCount > variantOptions.length;

  async function handleToggle() {
    const opening = !open;
    setOpen(opening);
    if (opening && hasMore) {
      setLoading(true);
      try {
        setAllVariants(await getCarVariants(brandSlug, modelSlug));
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-white px-3.5 py-2.5 text-[13px] font-bold text-ink transition-colors hover:border-brand"
      >
        {currentVariantName}
        <ChevronDownIcon className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* ModelDetailTabs' sticky bar sits at z-40 — this needs to stay
              above it regardless of scroll position, otherwise the tabs
              bar visually cuts through the dropdown list. */}
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" />
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
            {loading ? (
              <p className="px-3.5 py-2.5 text-[12.5px] text-muted">Loading variants…</p>
            ) : (
              visible.map((opt) => (
                <Link
                  key={opt.id}
                  href={`/${brandSlug}-cars/${modelSlug}/${slugify(opt.variantName)}`}
                  onClick={() => setOpen(false)}
                  className={`block px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-page ${
                    opt.variantName === currentVariantName ? "text-brand" : "text-ink"
                  }`}
                >
                  {opt.variantName}
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
