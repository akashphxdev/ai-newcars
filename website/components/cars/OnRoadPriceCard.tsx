// components/cars/OnRoadPriceCard.tsx
//
// Ex-showroom is not what anyone pays, and it is the number every rival
// makes you hunt for. This itemises the difference for the visitor's own
// state: road tax from the slab that applies, registration and plate
// charges, and an insurance estimate.
//
// Every figure that is not a published rate says so. An on-road price
// that looks authoritative and is quietly wrong costs a reader real
// money, so the card would rather show its working than a clean total.

"use client";

import { useEffect, useState } from "react";
import { PinIcon } from "@/components/common/icons";
import { getOnRoadPrice, type OnRoadPrice } from "@/features/cars/onRoad.api";
import { CITY_EVENT, getCurrentCity } from "@/features/location/currentCity";
import type { LocationCity } from "@/features/location/location.types";
import { formatRupee } from "@/lib/calculatorFormat";

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-[12.5px] text-muted">
        {label}
        {note && <span className="ml-1.5 text-[10.5px] text-subtle">{note}</span>}
      </span>
      <span className="shrink-0 text-[13px] font-semibold text-ink tabular-nums">{value}</span>
    </div>
  );
}

export default function OnRoadPriceCard({ variantId }: { variantId: number | null }) {
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
    if (!variantId || !city?.stateSlug) {
      setPrice(null);
      return;
    }
    let alive = true;
    setLoading(true);
    getOnRoadPrice(variantId, city.stateSlug)
      .then((res) => alive && setPrice(res))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [variantId, city?.stateSlug]);

  if (!variantId) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-bold text-ink">On-road price</h3>
        {city && (
          <span className="flex items-center gap-1 text-[11.5px] font-semibold text-brand">
            <PinIcon />
            {city.name}
          </span>
        )}
      </div>

      {!city && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          Pick your city in the header and we&apos;ll work out the road tax, registration and
          insurance for where you actually buy.
        </p>
      )}

      {city && loading && <p className="mt-3 text-[12.5px] text-muted">Working it out…</p>}

      {city && !loading && !price && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          We don&apos;t hold road tax rates for {city.name} yet, so we can&apos;t give an on-road
          figure without guessing at it.
        </p>
      )}

      {city && !loading && price && (
        <>
          <div className="mt-3 divide-y divide-border-soft">
            <Row label="Ex-showroom" value={formatRupee(Number(price.exShowroom))} />
            <Row
              label={`Road tax (${price.state.name})`}
              note={`${price.roadTax.ratePct}%`}
              value={formatRupee(Number(price.roadTax.amount))}
            />
            <Row
              label="Registration & plates"
              value={formatRupee(Number(price.registration.amount))}
            />
            <Row
              label="Insurance"
              note="estimated"
              value={formatRupee(Number(price.insurance.amount))}
            />
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <span className="text-[13px] font-bold text-ink">On-road, approx.</span>
            <span className="font-head text-[20px] font-extrabold text-ink tabular-nums">
              {formatRupee(Number(price.total))}
            </span>
          </div>

          <p className="mt-3 text-[10.5px] leading-relaxed text-subtle">
            Insurance is an estimate at {price.insurance.ratePct}% of ex-showroom; the real premium
            depends on your insurer and cover.
            {!price.roadTax.verified &&
              " Road tax rates are compiled from published sources and not yet checked against the state RTO."}
          </p>
        </>
      )}
    </div>
  );
}
