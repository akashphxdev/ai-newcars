// components/home/GuidedDiscovery.tsx
//
// Pick budget, body style, fuel and brand and see the match count move
// before committing to a listing page. The homepage otherwise offers
// only two ways in — a name you already know, or a rail someone else
// ranked — and neither helps a visitor who knows their budget but not
// their shortlist.
//
// The count comes from the same /cars/browse endpoint the listing page
// uses, asked for one row: pagination.total is the answer, and the row
// itself is the cheapest way to get it. Selections map straight onto
// that page's query params, so "View matches" is a navigation rather
// than a second, differently-behaved search.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SectionHeader from "@/components/common/SectionHeader";
import { getCarsBrowse } from "@/features/cars/car.api";
import type { CarBrowseFilterOptions } from "@/features/cars/car.types";
import { routes } from "@/lib/routes";

const BUDGETS = [
  { label: "Under ₹10L", maxPrice: 1_000_000 },
  { label: "₹10L – ₹25L", minPrice: 1_000_000, maxPrice: 2_500_000 },
  { label: "₹25L – ₹50L", minPrice: 2_500_000, maxPrice: 5_000_000 },
  { label: "Above ₹50L", minPrice: 5_000_000 },
] as const;

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-md border px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
        active ? "border-brand bg-brand-soft text-brand" : "border-border text-ink hover:border-subtle"
      }`}
    >
      {label}
      {count != null && <span className="ml-1.5 text-[11px] text-muted tabular-nums">{count}</span>}
    </button>
  );
}

export default function GuidedDiscovery({ initialFilters }: { initialFilters: CarBrowseFilterOptions }) {
  const router = useRouter();
  const [budget, setBudget] = useState<number | null>(null);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);

  const [facets, setFacets] = useState(initialFilters);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    const b = budget != null ? BUDGETS[budget] : undefined;
    const id = ++runId.current;
    setLoading(true);
    getCarsBrowse({
      page: 1,
      limit: 1,
      minPrice: b && "minPrice" in b ? b.minPrice : undefined,
      maxPrice: b && "maxPrice" in b ? b.maxPrice : undefined,
      bodyType: bodyType ? [bodyType] : undefined,
      fuelType: fuelType ? [fuelType] : undefined,
      brand: brand ? [brand] : undefined,
    })
      .then((res) => {
        // Late responses from a superseded selection would otherwise
        // overwrite the current one's count.
        if (id !== runId.current) return;
        setTotal(res.pagination.total);
        setFacets(res.filters);
      })
      .catch(() => {
        if (id === runId.current) setTotal(null);
      })
      .finally(() => {
        if (id === runId.current) setLoading(false);
      });
  }, [budget, bodyType, fuelType, brand]);

  const selections = [
    budget != null && BUDGETS[budget].label,
    bodyType && facets.bodyTypes.find((b) => b.slug === bodyType)?.name,
    fuelType && facets.fuelTypes.find((f) => f.value === fuelType)?.label,
    brand && facets.brands.find((b) => b.slug === brand)?.name,
  ].filter(Boolean) as string[];

  const viewMatches = () => {
    const p = new URLSearchParams();
    const b = budget != null ? BUDGETS[budget] : undefined;
    if (b && "maxPrice" in b && b.maxPrice) p.set("maxPrice", String(b.maxPrice));
    if (bodyType) p.set("bodyType", bodyType);
    if (fuelType) p.set("fuelType", fuelType);
    if (brand) p.set("brand", brand);
    const qs = p.toString();
    router.push(qs ? `${routes.newCars()}?${qs}` : routes.newCars());
  };

  const toggle = <T,>(current: T | null, next: T) => (current === next ? null : next);

  return (
    <section className="bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Find your perfect car"
          title="Start with what matters"
          subtitle="Choose by budget, body style, fuel type, or brand — we narrow the list as you go."
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">Budget</p>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b, i) => (
                <Chip key={b.label} label={b.label} active={budget === i} onClick={() => setBudget(toggle(budget, i))} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">Body style</p>
            <div className="flex flex-wrap gap-2">
              {facets.bodyTypes.slice(0, 6).map((b) => (
                <Chip
                  key={b.slug}
                  label={b.name}
                  count={b.count}
                  active={bodyType === b.slug}
                  onClick={() => setBodyType(toggle(bodyType, b.slug))}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">Fuel type</p>
            <div className="flex flex-wrap gap-2">
              {facets.fuelTypes.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  count={f.count}
                  active={fuelType === f.value}
                  onClick={() => setFuelType(toggle(fuelType, f.value))}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">Brand</p>
            <div className="flex flex-wrap gap-2">
              {facets.brands.slice(0, 8).map((b) => (
                <Chip
                  key={b.slug}
                  label={b.name}
                  count={b.count}
                  active={brand === b.slug}
                  onClick={() => setBrand(toggle(brand, b.slug))}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-page p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">Your selection</p>
            <p className="mt-1 truncate text-[13px] font-semibold text-ink">
              {selections.length > 0 ? selections.join(" · ") : "Everything, so far"}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className={`text-2xl font-bold tabular-nums ${loading ? "text-muted" : "text-brand"}`}>
                {total ?? "—"}
              </p>
              <p className="text-[11px] text-muted">{total === 1 ? "match" : "matches"}</p>
            </div>
            <button
              type="button"
              onClick={viewMatches}
              disabled={total === 0}
              className="cursor-pointer rounded-md bg-brand px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              View matches →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
