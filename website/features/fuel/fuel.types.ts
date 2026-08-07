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
  state: { id: number; name: string };
  prices: Partial<Record<FuelName, FuelPoint>>;
}

export interface MetroFuelPrices {
  cityId: number;
  cityName: string;
  citySlug: string;
  prices: Partial<Record<FuelName, FuelPoint>>;
}

export interface FuelState {
  id: number;
  name: string;
  cityCount: number;
}

export interface FuelCityRow {
  cityId: number;
  cityName: string;
  citySlug: string;
  price: string;
  change: string;
  updatedOn: string;
}

export interface FuelHistory {
  city: { id: number; name: string; slug: string };
  fuelType: number;
  series: { day: string; price: string; change: string }[];
}
