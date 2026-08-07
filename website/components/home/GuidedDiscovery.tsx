// components/home/GuidedDiscovery.tsx
//
// Replaces the old "Search by category" body-type row. That row was a
// single axis — body type — presented as the only way to narrow the
// catalogue. This asks the four questions a buyer actually starts from
// and shows the match count moving as they answer.
//
// The count comes from the same /cars/browse endpoint the listing page
// uses, asked for one row: pagination.total is the answer, and one row
// is the cheapest way to carry it. Selections map straight onto that
// page's query params, so "View matches" is a navigation rather than a
// second, differently-behaved search.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckIcon, WalletIcon, SparkleIcon, FuelIcon, ShieldIcon, CloseIcon,
} from "@/components/common/icons";
import { getCarsBrowse } from "@/features/cars/car.api";
import type { CarBrowseFilterOptions } from "@/features/cars/car.types";
import type { Brand } from "@/features/brands/brand.types";
import { routes } from "@/lib/routes";

// The catalogue reaches 12.25 crore, but nearly every car sits under one,
// and a linear track over the full span would spend nine tenths of its
// travel on the ~90 cars above that. So the floor is the real cheapest
// car and the top handle means "and above".
const CEILING = 10_000_000;
const STEP = 50_000;

function lakh(v: number): string {
  if (v >= 10_000_000) return "₹1.00 Cr+";
  return `₹${(v / 100_000).toFixed(2)} L`;
}

function Card({
  icon,
  title,
  hint,
  active,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        active ? "border-brand bg-brand-soft/40" : "border-border bg-surface"
      }`}
    >
      <div className="mb-3.5 flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
            active ? "bg-brand-soft text-brand" : "bg-page text-muted"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink">{title}</p>
          <p className="text-[12px] text-muted">{hint}</p>
        </div>
        <span
          className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
            active ? "bg-brand text-white" : "border border-border text-transparent"
          }`}
        >
          <CheckIcon className="size-3" />
        </span>
      </div>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-md border px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
        active ? "border-brand bg-surface text-brand" : "border-border bg-surface text-ink hover:border-subtle"
      }`}
    >
      {label}
    </button>
  );
}

export default function GuidedDiscovery({
  initialFilters,
  brandLogos,
}: {
  initialFilters: CarBrowseFilterOptions;
  brandLogos: Brand[];
}) {
  const router = useRouter();
  // Floor comes from the cheapest car actually listed, not a round number.
  const floor = Math.floor(Number(initialFilters.priceRange.min) / STEP) * STEP;
  const [minPrice, setMinPrice] = useState(floor);
  const [maxPrice, setMaxPrice] = useState(CEILING);
  const budgetTouched = minPrice !== floor || maxPrice !== CEILING;
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);

  const [facets, setFacets] = useState(initialFilters);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    const id = ++runId.current;
    setLoading(true);
    getCarsBrowse({
      page: 1,
      limit: 1,
      minPrice: minPrice > floor ? minPrice : undefined,
      // At the ceiling the handle means "and above", so no cap is sent.
      maxPrice: maxPrice < CEILING ? maxPrice : undefined,
      bodyType: bodyType ? [bodyType] : undefined,
      fuelType: fuelType ? [fuelType] : undefined,
      brand: brand ? [brand] : undefined,
    })
      .then((res) => {
        // A late reply for a selection already changed would otherwise
        // overwrite the current count.
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
  }, [floor, minPrice, maxPrice, bodyType, fuelType, brand]);

  const chosen: { label: string; clear: () => void }[] = [
    budgetTouched && {
      label: `${lakh(minPrice)} – ${lakh(maxPrice)}`,
      clear: () => {
        setMinPrice(floor);
        setMaxPrice(CEILING);
      },
    },
    bodyType && {
      label: facets.bodyTypes.find((b) => b.slug === bodyType)?.name ?? bodyType,
      clear: () => setBodyType(null),
    },
    fuelType && {
      label: facets.fuelTypes.find((f) => f.value === fuelType)?.label ?? fuelType,
      clear: () => setFuelType(null),
    },
    brand && {
      label: facets.brands.find((b) => b.slug === brand)?.name ?? brand,
      clear: () => setBrand(null),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const viewMatches = () => {
    const p = new URLSearchParams();
    if (minPrice > floor) p.set("minPrice", String(minPrice));
    if (maxPrice < CEILING) p.set("maxPrice", String(maxPrice));
    if (bodyType) p.set("bodyType", bodyType);
    if (fuelType) p.set("fuelType", fuelType);
    if (brand) p.set("brand", brand);
    const qs = p.toString();
    router.push(qs ? `${routes.newCars()}?${qs}` : routes.newCars());
  };

  const toggle = <T,>(current: T | null, next: T) => (current === next ? null : next);

  const logoBySlug = new Map(brandLogos.map((b) => [b.slug, b.logoUrl]));
  const topBrands = facets.brands
    .slice(0, 8)
    .map((b) => ({ ...b, logoUrl: logoBySlug.get(b.slug) ?? null }));

  return (
    <section className="bg-surface py-12 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-12">
        <div className="lg:pt-6">
          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Find your perfect car <span className="h-px w-8 bg-brand" />
          </p>
          <h2 className="mt-4 font-head text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            Start with
            <br />
            what matters
          </h2>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted">
            Choose by budget, body style, fuel type, or brand. TimesAuto narrows the list for you.
          </p>
          <p className="mt-6 flex items-center gap-2.5 text-[12.5px] font-semibold text-muted">
            <span className="flex size-8 items-center justify-center rounded-full bg-ev-soft text-ev">
              <SparkleIcon className="size-4" />
            </span>
            Smart filters • Real results • Zero guesswork
          </p>

        </div>

        <div className="rounded-2xl border border-border p-4 sm:p-5">
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Card
              icon={<WalletIcon className="size-5" />}
              title="Budget first"
              hint="Set your range"
              active={budgetTouched}
            >
              <p className="mb-3 text-lg font-bold text-brand tabular-nums">
                {lakh(minPrice)} – {lakh(maxPrice)}
              </p>
              <RangeSlider
                floor={floor}
                min={minPrice}
                max={maxPrice}
                onMin={(v) => setMinPrice(Math.min(v, maxPrice - STEP))}
                onMax={(v) => setMaxPrice(Math.max(v, minPrice + STEP))}
              />
            </Card>

            <Card
              icon={<CarGlyph />}
              title="Body style"
              hint="Pick what fits you"
              active={bodyType != null}
            >
              <div className="flex flex-wrap gap-2">
                {facets.bodyTypes.slice(0, 6).map((b) => (
                  <Chip
                    key={b.slug}
                    label={b.name}
                    active={bodyType === b.slug}
                    onClick={() => setBodyType(toggle(bodyType, b.slug))}
                  />
                ))}
              </div>
            </Card>

            <Card
              icon={<FuelIcon className="size-5" />}
              title="Fuel type"
              hint="Choose your fuel"
              active={fuelType != null}
            >
              <div className="flex flex-wrap gap-2">
                {facets.fuelTypes.map((f) => (
                  <Chip
                    key={f.value}
                    label={f.label}
                    active={fuelType === f.value}
                    onClick={() => setFuelType(toggle(fuelType, f.value))}
                  />
                ))}
              </div>
            </Card>

            <Card
              icon={<ShieldIcon className="size-5" />}
              title="Trusted brands"
              hint="Select your preferred brands"
              active={brand != null}
            >
              <div className="grid grid-cols-4 gap-2">
                {topBrands.map((b) => (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => setBrand(toggle(brand, b.slug))}
                    aria-pressed={brand === b.slug}
                    title={b.name}
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border bg-surface px-1.5 py-2 transition-colors ${
                      brand === b.slug ? "border-brand" : "border-border hover:border-subtle"
                    }`}
                  >
                    <span className="relative h-6 w-full">
                      {b.logoUrl ? (
                        <Image src={b.logoUrl} alt="" fill sizes="48px" className="object-contain" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[11px] font-bold text-muted">
                          {b.name.slice(0, 2)}
                        </span>
                      )}
                    </span>
                    <span className="w-full truncate text-center text-[10px] font-semibold text-ink">{b.name}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <SparkleIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-muted">Your selection</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {chosen.length === 0 ? (
                    <span className="text-[12.5px] text-subtle">Nothing yet — every car qualifies</span>
                  ) : (
                    chosen.slice(0, 3).map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={c.clear}
                        className="flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11.5px] font-semibold text-ink transition-colors hover:border-subtle"
                      >
                        {c.label}
                        <CloseIcon className="size-3 text-subtle" />
                      </button>
                    ))
                  )}
                  {chosen.length > 3 && (
                    <span className="rounded-md border border-dashed border-border px-2 py-1 text-[11.5px] font-semibold text-muted">
                      +{chosen.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-[12px] font-semibold text-muted">Matching cars</p>
                <p className={`text-2xl font-bold tabular-nums ${loading ? "text-subtle" : "text-brand"}`}>
                  {total ?? "—"}
                  <span className="ml-1.5 text-[13px] font-semibold text-ink">
                    {total === 1 ? "match" : "matches"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={viewMatches}
                disabled={total === 0}
                className="cursor-pointer whitespace-nowrap rounded-md bg-brand px-5 py-3 text-[13px] font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                View matches →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Two range inputs stacked on one track. A single input cannot express a
// range, and a library for one control is not worth the bundle. Only the
// handles take pointer events, so the lower input does not swallow
// clicks meant for the upper one.
// Decorative only, and hidden from assistive tech: it carries no
// information the copy does not already give.
function RangeSlider({
  floor,
  min,
  max,
  onMin,
  onMax,
}: {
  floor: number;
  min: number;
  max: number;
  onMin: (v: number) => void;
  onMax: (v: number) => void;
}) {
  const pct = (v: number) => ((v - floor) / (CEILING - floor)) * 100;
  const thumb =
    "pointer-events-none absolute inset-0 h-1.5 w-full appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 " +
    "[&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-surface " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 " +
    "[&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full " +
    "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-surface";

  return (
    <div className="relative h-4">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
        style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
      />
      <input
        type="range"
        aria-label="Minimum budget"
        min={floor}
        max={CEILING}
        step={STEP}
        value={min}
        onChange={(e) => onMin(Number(e.target.value))}
        className={`${thumb} top-1/2 -translate-y-1/2`}
      />
      <input
        type="range"
        aria-label="Maximum budget"
        min={floor}
        max={CEILING}
        step={STEP}
        value={max}
        onChange={(e) => onMax(Number(e.target.value))}
        className={`${thumb} top-1/2 -translate-y-1/2`}
      />
    </div>
  );
}

function CarGlyph() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 15v2m16-2v2M3 14l1.6-4.6A2 2 0 0 1 6.5 8h11a2 2 0 0 1 1.9 1.4L21 14v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="14.5" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
