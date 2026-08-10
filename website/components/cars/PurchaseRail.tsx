// components/cars/PurchaseRail.tsx
//
// The sticky buying column beside the model hero: which variant, which
// city, and what that combination actually costs on the road.
//
// It leads with the on-road figure rather than ex-showroom because
// ex-showroom is not a price anyone pays, and every rival makes the reader
// hunt for the real one. Where we hold no road tax slab for a state the
// card says so instead of quietly falling back to ex-showroom, which would
// read as a much cheaper car.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VariantSwitcher from "./VariantSwitcher";
import { WishlistButton } from "@/components/common/CardBits";
import { PinIcon, ChevronIcon } from "@/components/common/icons";
import ShareButton from "@/components/common/ShareButton";
import { getOnRoadPrice, type OnRoadPrice } from "@/features/cars/onRoad.api";
import { CITY_EVENT, getCurrentCity } from "@/features/location/currentCity";
import type { LocationCity } from "@/features/location/location.types";
import type { CarDetailResult, CarDetailSelectedVariant } from "@/features/cars/car.types";
import { formatRupee } from "@/lib/calculatorFormat";
import { formatSinglePrice } from "@/lib/format";
import { routes } from "@/lib/routes";

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 py-2.5 text-[12.5px] font-semibold text-ink no-underline transition-colors hover:text-brand"
    >
      {label}
      <ChevronIcon dir="right" className="size-3.5 text-muted" />
    </Link>
  );
}

export default function PurchaseRail({
  car,
  variant,
}: {
  car: CarDetailResult;
  variant: CarDetailSelectedVariant | null;
}) {
  const [city, setCity] = useState<LocationCity | null>(null);
  const [price, setPrice] = useState<OnRoadPrice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCity(getCurrentCity());
    const sync = (e: Event) => setCity((e as CustomEvent<LocationCity>).detail);
    window.addEventListener(CITY_EVENT, sync);
    return () => window.removeEventListener(CITY_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!variant?.id || !city?.stateSlug) {
      setPrice(null);
      return;
    }
    let alive = true;
    setLoading(true);
    getOnRoadPrice(variant.id, city.stateSlug)
      .then((r) => alive && setPrice(r))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [variant?.id, city?.stateSlug]);

  return (
    <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {variant && (
          <div className="border-b border-border-soft p-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              Select variant
            </p>
            <VariantSwitcher
              brandSlug={car.brand.slug}
              modelSlug={car.slug}
              currentVariantName={variant.variantName}
              variantOptions={car.variantOptions}
              variantCount={car.variantCount}
            />
          </div>
        )}

        <div className="border-b border-border-soft p-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Your city
          </p>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <span className="text-brand">
              <PinIcon />
            </span>
            {city ? city.name : "Pick your city in the header"}
          </p>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            {price ? "Est. on-road price" : "Ex-showroom price"}
          </p>

          {loading ? (
            <p className="mt-1.5 text-[13px] text-muted">Working it out…</p>
          ) : price ? (
            <>
              <p className="mt-1 font-head text-[24px] font-extrabold leading-none text-ink tabular-nums">
                {formatRupee(Number(price.total))}
              </p>
              <p className="mt-1.5 text-[11px] text-muted">On-road price in {city?.name}</p>
              <dl className="mt-3 space-y-1.5 border-t border-border-soft pt-3 text-[12px]">
                {[
                  ["Ex-showroom", price.exShowroom],
                  [`RTO (${price.roadTax.ratePct}%)`, price.roadTax.amount],
                  ["Insurance (est.)", price.insurance.amount],
                  ["Other charges", price.registration.amount],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-2">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-semibold text-ink tabular-nums">
                      {formatRupee(Number(value))}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <>
              <p className="mt-1 font-head text-[24px] font-extrabold leading-none text-ink tabular-nums">
                {formatSinglePrice(variant?.price ?? car.priceMin, "Price on request")}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                {city
                  ? `We don't hold road tax rates for ${city.name} yet, so we can't give an on-road figure without guessing.`
                  : "Pick your city in the header for the on-road price."}
              </p>
            </>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={routes.compare()}
              className="rounded-lg bg-brand px-4 py-2.5 text-center text-[13px] font-bold text-white no-underline transition-colors hover:bg-brand-hover"
            >
              Get best offer
            </Link>
            <Link
              href="/car-loan-emi-calculator"
              className="rounded-lg border border-brand px-4 py-2.5 text-center text-[13px] font-bold text-brand no-underline transition-colors hover:bg-brand-soft"
            >
              Calculate EMI
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-[12px] font-semibold text-ink">
              <WishlistButton modelId={car.id} size="sm" />
              Shortlist
            </div>
            <ShareButton
              title={car.name}
              label="Share"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border py-2 text-[12px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          Explore & calculate
        </p>
        <div className="divide-y divide-border-soft">
          <ToolLink href={`${routes.model(car.brand.slug, car.slug)}#variants`} label="View all variants" />
          <ToolLink href={`${routes.model(car.brand.slug, car.slug)}#specifications`} label="Specifications" />
          <ToolLink href={`${routes.model(car.brand.slug, car.slug)}#colours`} label="Colours" />
          <ToolLink href={routes.modelPhotos(car.brand.slug, car.slug)} label="Photos" />
          <ToolLink href={routes.compare()} label={`Compare ${car.name}`} />
          <ToolLink href="/mileage-calculator" label="Calculate running cost" />
          <ToolLink href="/car-loan-emi-calculator" label="EMI calculator" />
          {variant?.isElectric && (
            <ToolLink href="/ev-charging-time-calculator" label="Charging time calculator" />
          )}
        </div>
      </div>
    </aside>
  );
}
