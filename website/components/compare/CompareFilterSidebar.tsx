"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, CloseIcon } from "@/components/common/icons";
import type { BodyType } from "@/features/bodyTypes/bodyType.types";
import type { FuelFilter } from "@/features/compare/compare.types";

const FUEL_OPTIONS: { value: FuelFilter; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "electric", label: "Electric" },
];

const MAX_PRICE_LAKH = 50;

type Draft = { bodyTypeSlug: string; fuelType: FuelFilter | ""; maxPriceLakh: number };

// Shared between the always-visible desktop sidebar and the mobile bottom
// sheet — same fields, same Reset/Apply pair, just mounted in different
// containers.
const FilterFields = ({
  bodyTypes,
  draft,
  setDraft,
  onApply,
  onReset,
}: {
  bodyTypes: BodyType[];
  draft: Draft;
  setDraft: (d: Draft) => void;
  onApply: () => void;
  onReset: () => void;
}) => (
  <div className="flex flex-col gap-5">
    <div>
      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-muted">Body Type</p>
      <div className="flex flex-col gap-2">
        {bodyTypes.map((bt) => (
          <label key={bt.id} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink">
            <input
              type="radio"
              name="bodyType"
              checked={draft.bodyTypeSlug === bt.slug}
              onChange={() => setDraft({ ...draft, bodyTypeSlug: bt.slug })}
              className="cursor-pointer accent-brand"
            />
            {bt.name}
          </label>
        ))}
      </div>
    </div>

    <div>
      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-muted">Fuel Type</p>
      <div className="flex flex-col gap-2">
        {FUEL_OPTIONS.map((f) => (
          <label key={f.value} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink">
            <input
              type="radio"
              name="fuelType"
              checked={draft.fuelType === f.value}
              onChange={() => setDraft({ ...draft, fuelType: f.value })}
              className="cursor-pointer accent-brand"
            />
            {f.label}
          </label>
        ))}
      </div>
    </div>

    <div>
      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-muted">Max Price</p>
      <input
        type="range"
        min={1}
        max={MAX_PRICE_LAKH}
        value={draft.maxPriceLakh}
        onChange={(e) => setDraft({ ...draft, maxPriceLakh: Number(e.target.value) })}
        className="w-full accent-brand"
      />
      <div className="mt-1 flex justify-between text-[11px] font-semibold text-muted">
        <span>₹0</span>
        <span>{draft.maxPriceLakh >= MAX_PRICE_LAKH ? `₹${MAX_PRICE_LAKH}L+` : `₹${draft.maxPriceLakh}L`}</span>
      </div>
    </div>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={onReset}
        className="cursor-pointer rounded-xl px-4 py-2.5 text-[13px] font-bold text-muted transition-colors hover:text-brand"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onApply}
        className="flex-1 cursor-pointer rounded-xl border-[1.5px] border-brand py-2.5 text-[13px] font-bold text-brand transition-colors hover:bg-brand/5"
      >
        Apply Filters
      </button>
    </div>
  </div>
);

export default function CompareFilterSidebar({
  bodyTypes,
  initial,
}: {
  bodyTypes: BodyType[];
  initial: { bodyTypeSlug?: string; fuelType?: FuelFilter; maxPrice?: number };
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    bodyTypeSlug: initial.bodyTypeSlug ?? "",
    fuelType: initial.fuelType ?? "",
    maxPriceLakh: initial.maxPrice ? initial.maxPrice / 100000 : MAX_PRICE_LAKH,
  });

  // Re-sync the draft whenever the URL's actual filters change — e.g. the
  // browser back/forward buttons navigate client-side without remounting
  // this component, so without this the panel could keep showing a
  // filter that's no longer applied.
  useEffect(() => {
    setDraft({
      bodyTypeSlug: initial.bodyTypeSlug ?? "",
      fuelType: initial.fuelType ?? "",
      maxPriceLakh: initial.maxPrice ? initial.maxPrice / 100000 : MAX_PRICE_LAKH,
    });
  }, [initial.bodyTypeSlug, initial.fuelType, initial.maxPrice]);

  // Mobile filters open as a bottom sheet over the page (not an inline
  // block) — locking scroll while it's open keeps the page from
  // scrolling underneath it, same as the header's mobile menu.
  useEffect(() => {
    if (!sheetOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const hasActiveFilters = !!(initial.bodyTypeSlug || initial.fuelType || initial.maxPrice);

  const apply = () => {
    const params = new URLSearchParams();
    if (draft.bodyTypeSlug) params.set("bodyTypeSlug", draft.bodyTypeSlug);
    if (draft.fuelType) params.set("fuelType", draft.fuelType);
    if (draft.maxPriceLakh < MAX_PRICE_LAKH) params.set("maxPrice", String(Math.round(draft.maxPriceLakh * 100000)));
    router.push(`/compare-cars?${params.toString()}`);
    setSheetOpen(false);
  };

  const reset = () => {
    setDraft({ bodyTypeSlug: "", fuelType: "", maxPriceLakh: MAX_PRICE_LAKH });
    router.push("/compare-cars");
    setSheetOpen(false);
  };

  return (
    <>
      {/* Desktop — always-visible sidebar */}
      <aside className="hidden h-fit flex-col gap-5 rounded-2xl border border-border bg-surface p-5 lg:flex">
        <h3 className="text-[14.5px] font-bold text-ink">Filter Comparisons</h3>
        <FilterFields bodyTypes={bodyTypes} draft={draft} setDraft={setDraft} onApply={apply} onReset={reset} />
      </aside>

      {/* Mobile — compact trigger that opens a bottom sheet */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-[13.5px] font-bold text-ink lg:hidden"
      >
        <span className="flex items-center gap-2">
          Filter Comparisons
          {hasActiveFilters && <span className="size-1.5 rounded-full bg-brand" />}
        </span>
        <ChevronDownIcon className="size-4 -rotate-90 text-muted" />
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[65vh] overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-ink">Filter Comparisons</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-page text-muted"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
            <FilterFields bodyTypes={bodyTypes} draft={draft} setDraft={setDraft} onApply={apply} onReset={reset} />
          </div>
        </div>
      )}
    </>
  );
}
