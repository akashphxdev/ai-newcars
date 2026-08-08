// features/fuel/fuel.api.ts
//
// Prices move at most once a day, so these are cached for an hour rather
// than fetched per request.

import type {
  CityFuelPrices, FuelCityRow, FuelHistory, FuelState, MetroFuelPrices,
} from "./fuel.types";

const DAILY = { next: { revalidate: 3600 } } as const;
const FUEL_API_BASE_URL = (
  process.env.NEXT_PUBLIC_FUEL_API_BASE_URL
  ?? (process.env.NODE_ENV === "development"
    ? "http://localhost:5001/api/public/v1"
    : process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.timesauto.net/api/public/v1")
).replace(/\/+$/, "");

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

async function fuelFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${FUEL_API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...DAILY,
  });

  let body: ApiEnvelope<T> | undefined;
  try {
    body = await response.json();
  } catch {
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.message ?? `Fuel request failed (${response.status})`);
  }

  return body.data;
}

export async function getMetroFuelPrices(): Promise<MetroFuelPrices[]> {
  return fuelFetch<MetroFuelPrices[]>("/fuel/metros");
}

export async function getFuelStates(): Promise<FuelState[]> {
  return fuelFetch<FuelState[]>("/fuel/states");
}

export async function getFuelPricesForCity(citySlug: string): Promise<CityFuelPrices | null> {
  try {
    return await fuelFetch<CityFuelPrices>(`/fuel/city/${encodeURIComponent(citySlug)}`);
  } catch {
    // A city we hold no prices for 404s; the caller renders notFound().
    return null;
  }
}

export async function getFuelHistory(citySlug: string, fuelType: number, days = 30): Promise<FuelHistory | null> {
  try {
    return await fuelFetch<FuelHistory>(
      `/fuel/city/${encodeURIComponent(citySlug)}/history?fuelType=${fuelType}&days=${days}`);
  } catch {
    return null;
  }
}

export async function getFuelPricesInState(stateId: number, fuelType: number): Promise<FuelCityRow[]> {
  try {
    return await fuelFetch<FuelCityRow[]>(`/fuel/states/${stateId}/cities?fuelType=${fuelType}`);
  } catch {
    return [];
  }
}
