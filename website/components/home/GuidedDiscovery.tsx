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
  CheckIcon, WalletIcon, SparkleIcon, FuelIcon, ShieldIcon, CloseIcon, ChevronIcon,
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
      className={`relative rounded-[8px] border p-4 transition-[border-color,background-color,box-shadow,transform] duration-300 sm:p-[18px] ${
        active
          ? "border-brand bg-brand-soft/30 shadow-[0_16px_42px_-30px_rgba(242,101,15,0.75)]"
          : "border-border bg-surface/85 hover:-translate-y-0.5 hover:border-faint"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-[7px] transition-colors ${
            active ? "bg-brand-soft text-brand" : "bg-page text-muted"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-head text-[15px] font-bold leading-tight text-ink sm:text-[15.5px]">{title}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted sm:text-[12.5px]">{hint}</p>
        </div>
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-colors ${
            active ? "bg-brand text-white" : "border border-border text-transparent"
          }`}
        >
          <CheckIcon className="size-3.5" />
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
      className={`min-h-9 cursor-pointer rounded-[6px] border px-3 py-1.5 text-[12.5px] font-semibold transition-[color,border-color,background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98] ${
        active
          ? "border-brand bg-surface text-brand"
          : "border-border bg-surface text-ink hover:border-faint hover:bg-page/70"
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
  const [loading, setLoading] = useState(true);
  const runId = useRef(0);

  useEffect(() => {
    const id = ++runId.current;
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
        setLoading(true);
        setMinPrice(floor);
        setMaxPrice(CEILING);
      },
    },
    bodyType && {
      label: facets.bodyTypes.find((b) => b.slug === bodyType)?.name ?? bodyType,
      clear: () => {
        setLoading(true);
        setBodyType(null);
      },
    },
    fuelType && {
      label: facets.fuelTypes.find((f) => f.value === fuelType)?.label ?? fuelType,
      clear: () => {
        setLoading(true);
        setFuelType(null);
      },
    },
    brand && {
      label: facets.brands.find((b) => b.slug === brand)?.name ?? brand,
      clear: () => {
        setLoading(true);
        setBrand(null);
      },
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
    <section className="relative isolate overflow-hidden bg-surface py-12 sm:py-14 lg:py-16">
      {/* Road grid sits under the left column only, fading out before it
          reaches the panel so the cards keep a clean background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[52%] opacity-[0.42] lg:block"
        style={{
          backgroundImage: "url(/design/road-grid.png)",
          backgroundSize: "cover",
          backgroundPosition: "left bottom",
          maskImage: "linear-gradient(to right, black 42%, transparent 92%)",
          WebkitMaskImage: "linear-gradient(to right, black 42%, transparent 92%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_36%,rgba(242,101,15,0.045),transparent_32%)]"
      />

      <div className="relative mx-auto grid max-w-[1536px] gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(330px,430px)_minmax(0,1fr)] lg:gap-8 xl:px-10 2xl:px-0">
        <div className="relative lg:min-h-[588px] lg:pt-4">
          <p className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.24em] text-brand sm:text-[12px]">
            Find your perfect car <span className="h-px w-9 bg-brand sm:w-12" />
          </p>
          <h2 className="mt-5 max-w-[430px] text-balance font-head text-[36px] font-extrabold leading-[1.03] tracking-[-0.035em] text-ink sm:text-[44px] lg:text-[48px] xl:text-[52px]">
            Start with
            <br />
            what matters
          </h2>
          <p className="mt-4 max-w-[400px] text-pretty text-[14.5px] leading-6.5 text-muted sm:text-[15.5px]">
            Choose by budget, body style, fuel type, or brand. TimesAuto narrows the list for you.
          </p>
          <p className="mt-8 flex items-center gap-3 text-[13px] font-semibold text-ink sm:text-[14px]">
            <span className="flex size-10 items-center justify-center rounded-full bg-ev-soft text-ev">
              <SparkleIcon className="size-[18px]" />
            </span>
            Smart filters • Real results • Zero guesswork
          </p>

          <CarAndTrace />
        </div>

        <div className="self-start rounded-[8px] border border-border bg-surface/80 p-3 shadow-[0_36px_90px_-66px_rgba(92,67,45,0.55)] backdrop-blur-[2px] sm:p-5 lg:p-6">
          <div className="grid items-stretch gap-4 md:grid-cols-2">
            <Card
              icon={<WalletIcon className="size-6" />}
              title="Budget first"
              hint="Set your range"
              active={budgetTouched}
            >
              <p className="mb-5 text-[21px] font-bold text-brand tabular-nums sm:text-[23px]">
                {lakh(minPrice)} – {lakh(maxPrice)}
              </p>
              <RangeSlider
                floor={floor}
                min={minPrice}
                max={maxPrice}
                onMin={(v) => {
                  setLoading(true);
                  setMinPrice(Math.min(v, maxPrice - STEP));
                }}
                onMax={(v) => {
                  setLoading(true);
                  setMaxPrice(Math.max(v, minPrice + STEP));
                }}
              />
            </Card>

            <Card
              icon={<CarGlyph className="size-6" />}
              title="Body style"
              hint="Pick what fits you"
              active={bodyType != null}
            >
              <div className="flex flex-wrap gap-2.5">
                {facets.bodyTypes.slice(0, 6).map((b) => (
                  <Chip
                    key={b.slug}
                    label={b.name}
                    active={bodyType === b.slug}
                    onClick={() => {
                      setLoading(true);
                      setBodyType(toggle(bodyType, b.slug));
                    }}
                  />
                ))}
              </div>
            </Card>

            <Card
              icon={<FuelIcon className="size-6" />}
              title="Fuel type"
              hint="Choose your fuel"
              active={fuelType != null}
            >
              <div className="flex flex-wrap gap-2.5">
                {facets.fuelTypes.map((f) => (
                  <Chip
                    key={f.value}
                    label={f.label}
                    active={fuelType === f.value}
                    onClick={() => {
                      setLoading(true);
                      setFuelType(toggle(fuelType, f.value));
                    }}
                  />
                ))}
              </div>
            </Card>

            <Card
              icon={<ShieldIcon className="size-6" />}
              title="Trusted brands"
              hint="Select your preferred brands"
              active={brand != null}
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {topBrands.map((b) => (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setBrand(toggle(brand, b.slug));
                    }}
                    aria-pressed={brand === b.slug}
                    title={b.name}
                    className={`flex min-h-[58px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[6px] border bg-surface px-1.5 py-1.5 transition-[border-color,background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98] ${
                      brand === b.slug ? "border-brand bg-brand-soft/20" : "border-border hover:border-faint hover:bg-page/70"
                    }`}
                  >
                    <span className="relative h-5 w-full">
                      {b.logoUrl ? (
                        <Image src={b.logoUrl} alt="" fill sizes="48px" className="object-contain" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[11px] font-bold text-muted">
                          {b.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="w-full truncate text-center text-[10.5px] font-semibold text-ink">{b.name}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-5 border-t border-border pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <SparkleIcon className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">Your selection</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {chosen.length === 0 ? (
                    <span className="text-[13px] text-muted">Nothing yet — every car qualifies</span>
                  ) : (
                    chosen.slice(0, 3).map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={c.clear}
                        className="flex min-h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-border bg-page/60 px-2.5 py-1 text-[12px] font-semibold text-ink transition-colors hover:border-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {c.label}
                        <CloseIcon className="size-3 text-subtle" />
                      </button>
                    ))
                  )}
                  {chosen.length > 3 && (
                    <span className="rounded-[6px] border border-dashed border-faint px-2.5 py-1 text-[12px] font-semibold text-muted">
                      +{chosen.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-5 sm:justify-end">
              <div className="min-w-[118px] sm:text-right" aria-live="polite">
                <p className="text-[12px] font-semibold text-ink">Matching cars</p>
                <p className={`mt-0.5 text-[30px] font-bold leading-none tabular-nums sm:text-[34px] ${loading ? "text-subtle" : "text-brand"}`}>
                  {total ?? "—"}
                  <span className="ml-1.5 text-[13px] font-semibold text-ink sm:text-[14px]">
                    {total === 1 ? "match" : "matches"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={viewMatches}
                disabled={total === 0}
                className="flex min-h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-[7px] bg-brand px-5 py-3 text-[13px] font-bold text-white shadow-[0_12px_28px_-16px_rgba(242,101,15,0.85)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_16px_34px_-18px_rgba(242,101,15,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                View matches <ChevronIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// The car bleeds past the container's left edge and the traces run from
// it toward the cards, which is what ties the two halves of the section
// together. Decorative: it carries nothing the copy does not already say.
function CarAndTrace() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[320px] lg:block">
      <svg
        viewBox="0 0 500 320"
        fill="none"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {/* Four runs, alternating solid grey and dashed brand, each
            leaving the car at a different height and arriving at the
            panel edge. One line reads as a stray rule; several read as a
            harness, which is what the reference is doing. */}
        <path d="M40 84h150a22 22 0 0 1 22 22v34a22 22 0 0 0 22 22h146" stroke="var(--color-border)" strokeWidth="1.3" />
        <path
          d="M64 138h96a22 22 0 0 1 22 22v18a22 22 0 0 0 22 22h176"
          stroke="var(--color-brand)"
          strokeWidth="1.3"
          strokeDasharray="5 6"
          opacity=".55"
        />
        <path d="M58 236h118a22 22 0 0 0 22-22v-20a22 22 0 0 1 22-22h160" stroke="var(--color-border)" strokeWidth="1.3" />
        <path
          d="M84 286h84a22 22 0 0 0 22-22v-46a22 22 0 0 1 22-22h168"
          stroke="var(--color-brand)"
          strokeWidth="1.3"
          strokeDasharray="5 6"
          opacity=".55"
        />

        <circle cx="212" cy="106" r="3.6" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1.3" />
        <circle cx="182" cy="160" r="3.6" fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth="1.3" />
        <circle cx="198" cy="214" r="3.6" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1.3" />
        <circle cx="190" cy="264" r="3.6" fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth="1.3" />
      </svg>

      {/* The wide cutout is deliberately shifted off-canvas so only the
          front half enters the composition, matching the design reference. */}
      <Image
        src="/design/guided-suv.png"
        alt=""
        width={1536}
        height={1024}
        sizes="690px"
        className="absolute -left-[330px] -bottom-[70px] w-[640px] max-w-none drop-shadow-[0_18px_12px_rgba(17,24,39,0.12)] xl:-left-[350px] xl:w-[690px]"
        priority={false}
      />
    </div>
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
    <div className="relative h-5">
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

function CarGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
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
