// components/cars/VariantsTable.tsx
//
// The variant table from the v2 design: what separates the trims, what
// each costs ex-showroom, and what it costs on the road in the reader's
// own city.
//
// The on-road column is the point of the section. Ex-showroom is the
// number every rival prints and nobody pays, and the difference between
// them is large enough to change which trim someone buys.
//
// All the on-road figures come from one request. A call per row would be
// 66 round trips on a model like the Nexon.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PinIcon } from "@/components/common/icons";
import { getOnRoadPrices, type OnRoadPrice } from "@/features/cars/onRoad.api";
import { getModelVariants, type ModelVariant } from "@/features/cars/variants.api";
import { CITY_EVENT, getCurrentCity } from "@/features/location/currentCity";
import type { LocationCity } from "@/features/location/location.types";
import { formatRupee } from "@/lib/calculatorFormat";
import { routes } from "@/lib/routes";
import { slugify, stripPrefix } from "@/lib/format";

export default function VariantsTable({
  brandSlug,
  modelSlug,
  modelName,
}: {
  brandSlug: string;
  modelSlug: string;
  modelName: string;
}) {
  const [variants, setVariants] = useState<ModelVariant[]>([]);
  const [city, setCity] = useState<LocationCity | null>(null);
  const [onRoad, setOnRoad] = useState<Record<number, OnRoadPrice>>({});

  useEffect(() => {
    setCity(getCurrentCity());
    const sync = (e: Event) => setCity((e as CustomEvent<LocationCity>).detail);
    window.addEventListener(CITY_EVENT, sync);
    return () => window.removeEventListener(CITY_EVENT, sync);
  }, []);

  useEffect(() => {
    let alive = true;
    getModelVariants(brandSlug, modelSlug).then((v) => alive && setVariants(v));
    return () => {
      alive = false;
    };
  }, [brandSlug, modelSlug]);

  useEffect(() => {
    if (!variants.length || !city?.stateSlug) {
      setOnRoad({});
      return;
    }
    let alive = true;
    getOnRoadPrices(
      variants.map((v) => v.id),
      city.stateSlug,
    ).then((list) => {
      if (!alive) return;
      setOnRoad(Object.fromEntries(list.map((p) => [p.variantId, p])));
    });
    return () => {
      alive = false;
    };
  }, [variants, city?.stateSlug]);

  const isElectric = useMemo(() => variants.some((v) => v.isElectric), [variants]);
  if (!variants.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-page text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">{isElectric ? "Battery" : "Engine"}</th>
              <th className="px-4 py-3">{isElectric ? "Claimed range" : "Mileage"}</th>
              <th className="px-4 py-3 text-right">Ex-showroom</th>
              <th className="px-4 py-3 text-right">
                {city ? `On-road in ${city.name}` : "On-road"}
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const price = onRoad[v.id];
              return (
                <tr key={v.id} className="border-b border-border-soft last:border-0">
                  <td className="px-4 py-3.5">
                    <Link
                      href={routes.variant(brandSlug, modelSlug, slugify(v.variantName))}
                      className="text-[13px] font-bold text-ink no-underline transition-colors hover:text-brand"
                    >
                      {stripPrefix(v.variantName, modelName)}
                    </Link>
                    {v.isTopSeller && (
                      <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em] text-brand">
                        Top seller
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] text-muted">
                    {v.isElectric
                      ? v.batteryCapacity
                        ? `${v.batteryCapacity} kWh`
                        : "—"
                      : v.cubicCapacity
                        ? `${v.cubicCapacity} cc`
                        : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] text-muted">
                    {v.isElectric
                      ? v.claimedRange
                        ? `${v.claimedRange} km`
                        : "—"
                      : v.claimedFe
                        ? `${v.claimedFe} kmpl`
                        : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[13px] font-semibold text-ink tabular-nums">
                    {formatRupee(Number(v.price))}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[13px] font-bold text-ink tabular-nums">
                    {price ? (
                      formatRupee(Number(price.total))
                    ) : (
                      <span className="text-[11.5px] font-medium text-subtle">
                        {city ? "not available" : "pick a city"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="flex items-start gap-2 border-t border-border-soft bg-page px-4 py-3 text-[11px] leading-relaxed text-muted">
        <span className="mt-0.5 shrink-0 text-brand">
          <PinIcon />
        </span>
        {city
          ? "On-road price includes road tax, registration and an insurance estimate. Insurance varies by insurer and cover, so treat the total as indicative."
          : "Pick your city in the header and every row shows what it costs on the road there, not just ex-showroom."}
      </p>
    </div>
  );
}
