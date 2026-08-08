// features/fuel/fuel.types.ts

export type FuelName = "petrol" | "diesel" | "cng";

export const FUEL_TYPE_IDS: Record<FuelName, number> = { petrol: 1, diesel: 2, cng: 3 };

export interface FuelPoint {
  price: string;
  change: string;
  updatedOn: string;
}

export interface CityFuelPrices {
  city: { id: number; name: string; slug: string };
  state: { id: number; name: string; slug: string };
  prices: Partial<Record<FuelName, FuelPoint>>;
}

export interface MetroFuelPrices {
  cityId: number;
  cityName: string;
  citySlug: string;
  stateSlug: string;
  prices: Partial<Record<FuelName, FuelPoint>>;
}

export interface FuelState {
  id: number;
  name: string;
  slug: string;
  cityCount: number;
}

export interface FuelStateDetail {
  state: FuelState;
  fuelType: number;
  cities: FuelCityRow[];
}

export interface FuelCityRow {
  cityId: number;
  cityName: string;
  citySlug: string;
  isTopCity?: boolean;
  price: string;
  change: string;
  updatedOn: string;
}

export interface FuelHistory {
  city: { id: number; name: string; slug: string };
  fuelType: number;
  series: { day: string; price: string; change: string }[];
}

export interface StateCityFuelRow {
  cityId: number;
  cityName: string;
  citySlug: string;
  isTopCity?: boolean;
  prices: Partial<Record<FuelName, FuelPoint>>;
}

export interface FuelCityIndexEntry {
  cityName: string;
  citySlug: string;
  stateName: string;
  stateSlug: string;
}

// What a city's price should be read against. Every value is a decimal
// string, matching the price fields.
export interface FuelBenchmark {
  stateAvg: string;
  nationalAvg: string;
  low30: string;
  high30: string;
}

export type FuelCityContext = Partial<Record<FuelName, FuelBenchmark>>;

// A state's average rate per fuel, for the at-a-glance state table.
export interface FuelStatePrices {
  id: number;
  name: string;
  slug: string;
  cityCount: number;
  prices: Partial<Record<FuelName, string>>;
}

export interface PopularCityFuelPrices {
  cityId: number;
  cityName: string;
  citySlug: string;
  stateName: string;
  stateSlug: string;
  prices: Partial<Record<FuelName, FuelPoint>>;
}
