// lib/fuel.ts
//
// Shared fuel formatting. Prices arrive as canonical decimal strings
// ("95.2", "86"), which is right for an API but wrong on screen — money
// is always shown to two places.

import type { FuelName } from "@/features/fuel/fuel.types";

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
