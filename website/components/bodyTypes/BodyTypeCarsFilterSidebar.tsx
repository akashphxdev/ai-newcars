"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, CloseIcon } from "@/components/common/icons";
import type { BodyTypeCarsBrandFilter, BodyTypeCarsFuelTypeFilter } from "@/features/bodyTypes/bodyType.types";

const MAX_PRICE_LAKH = 50;

type Draft = { brand: string[]; fuelType: string[]; maxPriceLakh: number };

const FilterFields = ({
  brands,
  fuelTypes,
  draft,
  setDraft,
  onApply,
  onReset,
}: {
  brands: BodyTypeCarsBrandFilter[];
  fuelTypes: BodyTypeCarsFuelTypeFilter[];
  draft: Draft;
  setDraft: (d: Draft) => void;
  onApply: () => void;
  onReset: () => void;
}) => {
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="flex flex-col gap-5">
      {brands.length > 0 && (
        <div>
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-muted">Brand</p>
          <div className="flex flex-col gap-2">
            {brands.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center justify-between gap-2 text-[13px] font-medium text-ink">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.brand.includes(b.slug)}
                    onChange={() => setDraft({ ...draft, brand: toggle(draft.brand, b.slug) })}
                    className="cursor-pointer accent-brand"
                  />
                  {b.name}
                </span>
                <span className="text-[11px] font-semibold text-muted">{b.count}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {fuelTypes.length > 0 && (
        <div>
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-muted">Fuel Type</p>
          <div className="flex flex-col gap-2">
            {fuelTypes.map((f) => (
              <label key={f.value} className="flex cursor-pointer items-center justify-between gap-2 text-[13px] font-medium text-ink">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.fuelType.includes(f.value)}
                    onChange={() => setDraft({ ...draft, fuelType: toggle(draft.fuelType, f.value) })}
                    className="cursor-pointer accent-brand"
                  />
                  {f.label}
                </span>
                <span className="text-[11px] font-semibold text-muted">{f.count}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-muted">Max Price</p>
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
          className="cursor-pointer rounded-xl px-4 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:text-brand"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 cursor-pointer rounded-xl border-[1.5px] border-brand py-2.5 text-[13px] font-semibold text-brand transition-colors hover:bg-brand/5"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default function BodyTypeCarsFilterSidebar({
  bodyTypeSlug,
  brands,
  fuelTypes,
  initial,
}: {
  bodyTypeSlug: string;
  brands: BodyTypeCarsBrandFilter[];
  fuelTypes: BodyTypeCarsFuelTypeFilter[];
  initial: { brand?: string[]; fuelType?: string[]; maxPrice?: number };
}) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    brand: initial.brand ?? [],
    fuelType: initial.fuelType ?? [],
    maxPriceLakh: initial.maxPrice ? initial.maxPrice / 100000 : MAX_PRICE_LAKH,
  });

  useEffect(() => {
    setDraft({
      brand: initial.brand ?? [],
      fuelType: initial.fuelType ?? [],
      maxPriceLakh: initial.maxPrice ? initial.maxPrice / 100000 : MAX_PRICE_LAKH,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.brand?.join(","), initial.fuelType?.join(","), initial.maxPrice]);

  useEffect(() => {
    if (!sheetOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const hasActiveFilters = !!(initial.brand?.length || initial.fuelType?.length || initial.maxPrice);
  const basePath = `/${bodyTypeSlug}-cars`;

  const apply = () => {
    const params = new URLSearchParams();
    if (draft.brand.length) params.set("brand", draft.brand.join(","));
    if (draft.fuelType.length) params.set("fuelType", draft.fuelType.join(","));
    if (draft.maxPriceLakh < MAX_PRICE_LAKH) params.set("maxPrice", String(Math.round(draft.maxPriceLakh * 100000)));
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    setSheetOpen(false);
  };

  const reset = () => {
    setDraft({ brand: [], fuelType: [], maxPriceLakh: MAX_PRICE_LAKH });
    router.push(basePath);
    setSheetOpen(false);
  };

  return (
    <>
      <aside className="sticky top-20 hidden h-fit max-h-[calc(100vh-6rem)] flex-col gap-5 self-start overflow-y-auto rounded-2xl border border-border bg-surface p-5 lg:flex">
        <h3 className="text-[14.5px] font-semibold text-ink">Filter Cars</h3>
        <FilterFields brands={brands} fuelTypes={fuelTypes} draft={draft} setDraft={setDraft} onApply={apply} onReset={reset} />
      </aside>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-[13.5px] font-semibold text-ink lg:hidden"
      >
        <span className="flex items-center gap-2">
          Filter Cars
          {hasActiveFilters && <span className="size-1.5 rounded-full bg-brand" />}
        </span>
        <ChevronDownIcon className="size-4 -rotate-90 text-muted" />
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[65vh] overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">Filter Cars</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-page text-muted"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
            <FilterFields brands={brands} fuelTypes={fuelTypes} draft={draft} setDraft={setDraft} onApply={apply} onReset={reset} />
          </div>
        </div>
      )}
    </>
  );
}
