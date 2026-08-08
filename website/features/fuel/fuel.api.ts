// features/fuel/fuel.api.ts
//
// Prices move at most once a day, so these are cached for an hour rather
// than fetched per request.

import type {
  CityFuelPrices, FuelCityContext, FuelCityIndexEntry, FuelCityRow, FuelHistory,
  FuelState, FuelStateDetail, FuelStatePrices, MetroFuelPrices, PopularCityFuelPrices,
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

// Slugs come from the URL, so they are scrubbed to the shape the database
// stores rather than trusted into a request path.
const cleanSlug = (value: string) => encodeURIComponent(value.toLowerCase().slice(0, 100));

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

// City slugs repeat across states, so a city is only addressable as a
// (state, city) pair — matching the /fuel-price/<state>/<city> URLs.
export async function getFuelPricesForCity(
  stateSlug: string, citySlug: string,
): Promise<CityFuelPrices | null> {
  try {
    return await fuelFetch<CityFuelPrices>(`/fuel/${cleanSlug(stateSlug)}/${cleanSlug(citySlug)}`);
  } catch {
    // A city we hold no prices for 404s; the caller renders notFound().
    return null;
  }
}

export async function getFuelHistory(
  stateSlug: string, citySlug: string, fuelType: number, days = 30,
): Promise<FuelHistory | null> {
  try {
    return await fuelFetch<FuelHistory>(
      `/fuel/${cleanSlug(stateSlug)}/${cleanSlug(citySlug)}/history?fuelType=${fuelType}&days=${days}`);
  } catch {
    return null;
  }
}

export async function getFuelState(
  stateSlug: string, fuelType = 1,
): Promise<FuelStateDetail | null> {
  try {
    return await fuelFetch<FuelStateDetail>(
      `/fuel/${cleanSlug(stateSlug)}?fuelType=${fuelType}`);
  } catch {
    return null;
  }
}

// Legacy /fuel-price/<city> links predate the state segment; this maps one
// back to its state so the page can 301 instead of 404.
export async function resolveFuelCityState(citySlug: string): Promise<string | null> {
  try {
    const res = await fuelFetch<{ stateSlug: string; citySlug: string }>(
      `/fuel/resolve/${cleanSlug(citySlug)}`);
    return res.stateSlug;
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

export async function getFuelCityIndex(): Promise<FuelCityIndexEntry[]> {
  try {
    return await fuelFetch<FuelCityIndexEntry[]>("/fuel/cities");
  } catch {
    return [];
  }
}

export async function getFuelCityContext(
  stateSlug: string, citySlug: string,
): Promise<FuelCityContext> {
  try {
    return await fuelFetch<FuelCityContext>(
      `/fuel/${cleanSlug(stateSlug)}/${cleanSlug(citySlug)}/context`);
  } catch {
    // Context is enrichment, not the page — a failure here must not take
    // the prices down with it.
    return {};
  }
}

export async function getFuelStatePrices(): Promise<FuelStatePrices[]> {
  try {
    return await fuelFetch<FuelStatePrices[]>("/fuel/state-prices");
  } catch {
    return [];
  }
}

export async function getPopularCityFuelPrices(): Promise<PopularCityFuelPrices[]> {
  try {
    return await fuelFetch<PopularCityFuelPrices[]>("/fuel/popular");
  } catch {
    return [];
  }
}
