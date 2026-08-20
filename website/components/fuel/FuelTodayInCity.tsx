"use client";

// components/fuel/FuelTodayInCity.tsx
//
// "Today in <city>" — the visitor's own city when they have one.
//
// The chosen city lives in localStorage, so the server cannot know it and
// this page stays statically cached for everyone. The server renders the
// default city, and this swaps in the visitor's after mount. That order
// matters: rendering nothing until the city is known would leave a hole
// at the top of the page for every first-time visitor, who has no city
// at all.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon, PinIcon } from "@/components/common/icons";
import FuelSummaryCard from "@/components/fuel/FuelSummaryCard";
import { getCurrentCity, CITY_EVENT } from "@/features/location/currentCity";
import { getFuelPricesForCity, resolveFuelCityState } from "@/features/fuel/fuel.api";
import type { FuelName, FuelPoint } from "@/features/fuel/fuel.types";
import { routes } from "@/lib/routes";

const FUELS: FuelName[] = ["petrol", "diesel", "cng"];

export interface FuelTodayCity {
  cityName: string;
  citySlug: string;
  stateSlug: string;
  prices: Partial<Record<FuelName, FuelPoint>>;
}

export default function FuelTodayInCity({ fallback }: { fallback: FuelTodayCity }) {
  const [city, setCity] = useState<FuelTodayCity>(fallback);
  const [loading, setLoading] = useState(false);

  const syncToChosenCity = useCallback(async () => {
    const chosen = getCurrentCity();
    if (!chosen) {
      setCity(fallback);
      return;
    }
    if (chosen.slug === fallback.citySlug) return;

    setLoading(true);
    try {
      // Cities stored before slugs became state-scoped carry no
      // stateSlug, and a bare slug no longer identifies a city.
      const stateSlug = chosen.stateSlug ?? (await resolveFuelCityState(chosen.slug));
      if (!stateSlug) return;

      const prices = await getFuelPricesForCity(stateSlug, chosen.slug);
      // A city we hold no prices for keeps the default rather than
      // showing the visitor an empty panel.
      if (prices) {
        setCity({
          cityName: prices.city.name,
          citySlug: prices.city.slug,
          stateSlug: prices.state.slug,
          prices: prices.prices,
        });
      }
    } catch {
      // Network trouble leaves the default in place, which is still true.
    } finally {
      setLoading(false);
    }
  }, [fallback]);

  useEffect(() => {
    void syncToChosenCity();
    const onCityChange = () => void syncToChosenCity();
    window.addEventListener(CITY_EVENT, onCityChange);
    return () => window.removeEventListener(CITY_EVENT, onCityChange);
  }, [syncToChosenCity]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-ink">
          <PinIcon className="size-4 text-brand" />
          Today in {city.cityName}
          {loading && <span className="font-body text-[11px] font-semibold normal-case text-muted">updating…</span>}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={routes.fuelPriceInCity(city.stateSlug, city.citySlug)}
            className="text-[12px] font-bold text-brand no-underline hover:text-brand-hover"
          >
            Full {city.cityName} breakdown
          </Link>
          <a href="#metro-comparison" className="text-[12px] font-bold text-brand no-underline hover:text-brand-hover">
            Compare with another city
          </a>
          <a
            href="mailto:support@timesauto.net?subject=Fuel%20price%20alert"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink no-underline hover:text-brand"
          >
            <BellIcon className="size-3.5" /> Set price alert
          </a>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {FUELS.map((fuel) => (
          <FuelSummaryCard
            key={fuel}
            fuel={fuel}
            point={city.prices[fuel]}
            citySlug={city.citySlug}
            stateSlug={city.stateSlug}
          />
        ))}
      </div>
    </div>
  );
}
