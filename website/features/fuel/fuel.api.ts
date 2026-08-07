// features/fuel/fuel.api.ts
//
// Prices move at most once a day, so these are cached for an hour rather
// than fetched per request.

import { apiFetch } from "@/lib/apiClient";
import type {
  CityFuelPrices, FuelCityRow, FuelHistory, FuelState, MetroFuelPrices,
} from "./fuel.types";

const DAILY = { next: { revalidate: 3600 } } as const;

export async function getMetroFuelPrices(): Promise<MetroFuelPrices[]> {
  return apiFetch<MetroFuelPrices[]>("/fuel/metros", DAILY);
}

export async function getFuelStates(): Promise<FuelState[]> {
  return apiFetch<FuelState[]>("/fuel/states", DAILY);
}

export async function getFuelPricesForCity(citySlug: string): Promise<CityFuelPrices | null> {
  try {
    return await apiFetch<CityFuelPrices>(`/fuel/city/${encodeURIComponent(citySlug)}`, DAILY);
  } catch {
    // A city we hold no prices for 404s; the caller renders notFound().
    return null;
  }
}

export async function getFuelHistory(citySlug: string, fuelType: number, days = 30): Promise<FuelHistory | null> {
  try {
    return await apiFetch<FuelHistory>(
      `/fuel/city/${encodeURIComponent(citySlug)}/history?fuelType=${fuelType}&days=${days}`, DAILY);
  } catch {
    return null;
  }
}

export async function getFuelPricesInState(stateId: number, fuelType: number): Promise<FuelCityRow[]> {
  try {
    return await apiFetch<FuelCityRow[]>(`/fuel/states/${stateId}/cities?fuelType=${fuelType}`, DAILY);
  } catch {
    return [];
  }
}
