// lib/fuel.ts
//
// Shared fuel formatting. Prices arrive as canonical decimal strings
// ("95.2", "86"), which is right for an API but wrong on screen — money
// is always shown to two places.

import type { FuelCityRow, FuelName, FuelPoint, StateCityFuelRow } from "@/features/fuel/fuel.types";

export const FUEL_LABELS: Record<FuelName, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  cng: "CNG",
};

export function formatFuelPrice(value: string | null | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : "—";
}

// A day's move, where zero is the common case and deserves to read as
// calm rather than as a red or green signal.
export function formatFuelChange(value: string | null | undefined): {
  label: string;
  className: string;
} {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return { label: "No change today", className: "text-muted" };
  const arrow = n > 0 ? "▲" : "▼";
  return {
    label: `${arrow} ₹${Math.abs(n).toFixed(2)} today`,
    className: n > 0 ? "text-danger" : "text-ev",
  };
}

// Three per-fuel city lists folded into one row per city, alphabetical.
export function mergeCityRows(rowsByFuel: Partial<Record<FuelName, FuelCityRow[]>>): StateCityFuelRow[] {
  const cities = new Map<number, StateCityFuelRow>();

  (Object.keys(rowsByFuel) as FuelName[]).forEach((fuel) => {
    (rowsByFuel[fuel] ?? []).forEach((row) => {
      const city = cities.get(row.cityId) ?? {
        cityId: row.cityId,
        cityName: row.cityName,
        citySlug: row.citySlug,
        isTopCity: row.isTopCity,
        prices: {} as Partial<Record<FuelName, FuelPoint>>,
      };
      city.prices[fuel] = { price: row.price, change: row.change, updatedOn: row.updatedOn };
      cities.set(row.cityId, city);
    });
  });

  return [...cities.values()].sort((a, b) => a.cityName.localeCompare(b.cityName));
}

// "2026-08-08" → "8 August 2026". Fixed locale and time zone: the value
// is a plain date, and letting it drift by the renderer's zone would
// stamp the wrong day on a page whose whole point is being current.
export function formatFuelDate(day: string | undefined): string | null {
  if (!day) return null;
  const parsed = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}
