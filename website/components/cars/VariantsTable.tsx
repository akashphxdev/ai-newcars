// components/cars/VariantsTable.tsx
//
// Section 3 of the v2 model page: pick a trim by what it costs where the
// reader lives, not by ex-showroom.
//
// The on-road column is the point. Ex-showroom is the number every rival
// prints and nobody pays, and on this car the two differ by well over a
// lakh at the top of the range — enough to change which trim someone buys.
// Each row opens to show where that difference goes.
//
// Every on-road figure arrives in one request. A call per row would be 66
// round trips on a model like the Nexon.

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BoltIcon,
  ChevronDownIcon,
  FuelIcon,
  GaugeIcon,
  PinIcon,
  StarIcon,
} from "@/components/common/icons";
import { getOnRoadPrices, type OnRoadPrice } from "@/features/cars/onRoad.api";
import { getModelVariants, type ModelVariant } from "@/features/cars/variants.api";
import { CITY_EVENT, getCurrentCity } from "@/features/location/currentCity";
import type { LocationCity } from "@/features/location/location.types";
import { formatRupee, formatLakh } from "@/lib/calculatorFormat";
import { calculateEmi } from "@/lib/emiMath";
import { routes } from "@/lib/routes";
import { slugify, stripPrefix } from "@/lib/format";

// Indicative terms for the "EMI from" line, stated on screen so the figure
// is never mistaken for a quote.
const EMI_RATE = 9;
const EMI_YEARS = 5;
const EMI_DOWN_PAYMENT = 0.2;

function Th({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-bold">
      <span className="flex items-center gap-1.5">
        <span className="text-brand">{icon}</span>
        {children}
      </span>
    </th>
  );
}

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
  const [group, setGroup] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);

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
    getOnRoadPrices(variants.map((v) => v.id), city.stateSlug).then((list) => {
      if (alive) setOnRoad(Object.fromEntries(list.map((p) => [p.variantId, p])));
    });
    return () => {
      alive = false;
    };
  }, [variants, city?.stateSlug]);

  const isElectric = useMemo(() => variants.some((v) => v.isElectric), [variants]);

  // Trims of one car split along whichever axis actually separates them:
  // battery for an EV, fuel for anything else. Derived from the data so it
  // works for every model rather than being a list per car.
  const groups = useMemo(() => {
    const keys = new Set<string>();
    for (const v of variants) {
      const k = v.isElectric
        ? v.batteryCapacity
          ? `${v.batteryCapacity} kWh`
          : ""
        : (v.fuelType ?? "");
      if (k) keys.add(k);
    }
    return [...keys];
  }, [variants]);

  const groupOf = (v: ModelVariant) =>
    v.isElectric ? (v.batteryCapacity ? `${v.batteryCapacity} kWh` : "") : (v.fuelType ?? "");

  const shown = group === "all" ? variants : variants.filter((v) => groupOf(v) === group);
  const chosen = variants.filter((v) => selected.includes(v.id));

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]));

  if (!variants.length) return null;

  return (
    <div className="relative">
      {(groups.length > 1 || city) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {groups.length > 1 && (
            <div className="flex rounded-xl border border-border bg-surface p-1">
              {["all", ...groups].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-[12.5px] font-bold transition-colors ${
                    group === g ? "bg-brand text-white" : "text-ink hover:text-brand"
                  }`}
                >
                  {g === "all" ? "All variants" : g}
                </button>
              ))}
            </div>
          )}
          {city && (
            <p className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 text-[12.5px] font-semibold text-ink">
              <span className="text-brand">
                <PinIcon />
              </span>
              {city.name}
            </p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-page text-[10.5px] uppercase tracking-[0.08em] text-muted">
                <Th icon={<StarIcon className="size-3.5" />}>Variant</Th>
                <Th icon={isElectric ? <BoltIcon className="size-3.5" /> : <GaugeIcon className="size-3.5" />}>
                  {isElectric ? "Battery" : "Engine"}
                </Th>
                <Th icon={isElectric ? <GaugeIcon className="size-3.5" /> : <FuelIcon className="size-3.5" />}>
                  {isElectric ? "Claimed range" : "Mileage"}
                </Th>
                <Th icon={<StarIcon className="size-3.5" />}>Key addition</Th>
                <th className="px-4 py-3 text-right font-bold">Ex-showroom</th>
                <th className="px-4 py-3 text-right font-bold">
                  {city ? `On-road in ${city.name}` : "On-road"}
                </th>
                <th className="px-4 py-3 text-center font-bold">Compare</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => {
                const price = onRoad[v.id];
                const isOpen = expanded === v.id;
                const emi = price
                  ? calculateEmi(Number(price.total) * (1 - EMI_DOWN_PAYMENT), EMI_RATE, EMI_YEARS).emi
                  : 0;
                return (
                  // The key belongs on the fragment: each row can render a
                  // second <tr> for its breakup, and keying the inner rows
                  // instead leaves React reconciling siblings by position.
                  <Fragment key={v.id}>
                    <tr
                      className={`border-b border-border-soft last:border-0 ${
                        selected.includes(v.id) ? "bg-brand-soft/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={routes.variant(brandSlug, modelSlug, slugify(v.variantName))}
                          className="text-[13px] font-bold text-ink no-underline transition-colors hover:text-brand"
                        >
                          {stripPrefix(v.variantName, modelName)}
                        </Link>
                        {v.isTopSeller && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-brand px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em] text-white">
                            <StarIcon filled className="size-2.5" />
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
                      <td className="px-4 py-3.5 text-[12.5px] font-semibold text-ev">
                        {v.isElectric
                          ? v.claimedRange
                            ? `${v.claimedRange} km`
                            : "—"
                          : v.claimedFe
                            ? `${v.claimedFe} kmpl`
                            : "—"}
                      </td>
                      <td className="max-w-[220px] px-4 py-3.5 text-[12px] leading-relaxed text-muted">
                        {v.keyAdditions?.length ? (
                          <ul className="space-y-0.5">
                            {v.keyAdditions.map((a) => (
                              <li key={a}>{a}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[13px] font-semibold text-ink tabular-nums">
                        {formatLakh(Number(v.price))}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {price ? (
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : v.id)}
                            className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-bold text-ink transition-colors hover:text-brand"
                            aria-expanded={isOpen}
                          >
                            {formatLakh(Number(price.total))}
                            <ChevronDownIcon
                              className={`size-3.5 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        ) : (
                          <span className="text-[11.5px] text-subtle">
                            {city ? "not available" : "pick a city"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(v.id)}
                          onChange={() => toggle(v.id)}
                          aria-label={`Compare ${v.variantName}`}
                          className="size-4 cursor-pointer accent-brand"
                        />
                      </td>
                    </tr>

                    {isOpen && price && (
                      <tr className="border-b border-border-soft bg-page">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="flex flex-wrap items-start gap-x-10 gap-y-3">
                            {[
                              ["Ex-showroom", price.exShowroom],
                              [`RTO (${price.roadTax.ratePct}%)`, price.roadTax.amount],
                              ["Insurance (est.)", price.insurance.amount],
                              ["Other charges", price.registration.amount],
                            ].map(([label, value]) => (
                              <div key={label}>
                                <p className="text-[10.5px] uppercase tracking-[0.06em] text-muted">
                                  {label}
                                </p>
                                <p className="mt-0.5 text-[13px] font-bold text-ink tabular-nums">
                                  {formatRupee(Number(value))}
                                </p>
                              </div>
                            ))}
                            <div className="ml-auto">
                              <p className="text-[10.5px] uppercase tracking-[0.06em] text-muted">
                                EMI from
                              </p>
                              <p className="mt-0.5 text-[13px] font-bold text-brand tabular-nums">
                                {formatRupee(emi)}/mo
                              </p>
                              <p className="text-[10px] text-subtle">
                                {EMI_YEARS}yr · {EMI_RATE}% · {EMI_DOWN_PAYMENT * 100}% down
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

      {chosen.length > 0 && (
        <div className="sticky bottom-4 mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.5)]">
          <div>
            <p className="text-[12.5px] font-bold text-ink">
              {chosen.length} {chosen.length === 1 ? "variant" : "variants"} selected
            </p>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="cursor-pointer text-[11.5px] font-semibold text-brand"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {chosen.map((v) => (
              <span
                key={v.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[12px] text-ink"
              >
                {stripPrefix(v.variantName, modelName)}
                <button
                  type="button"
                  onClick={() => toggle(v.id)}
                  aria-label={`Remove ${v.variantName}`}
                  className="cursor-pointer text-muted transition-colors hover:text-brand"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <Link
            href={routes.compare()}
            className="ml-auto rounded-lg border border-brand px-4 py-2.5 text-[12.5px] font-bold text-brand no-underline transition-colors hover:bg-brand-soft"
          >
            Compare selected →
          </Link>
        </div>
      )}
    </div>
  );
}
