// lib/mileageMath.ts
//
// Deliberately just one formula — cost per km from the car's own rated
// mileage and the fuel price the visitor enters. No AC-usage/traffic
// adjustment factors and no maintenance/insurance estimates live here:
// none of those have a real data source anywhere in this app, and
// inventing multipliers for them would just be fabricated numbers
// presented as real ones.

import type { CarDetailResult } from "@/features/cars/car.types";

// The rated efficiency figure to show for a variant.
//
// real_world_mileage is empty for every one of the 1,743 ICE variants in
// the catalogue, so reading it alone meant the mileage pre-fill never
// fired for any car. claimed_fe is the manufacturer's rated figure and is
// present for most variants — which is what "rated mileage, straight from
// the spec sheet" already promises the reader.
export function ratedFigure(
  variant: NonNullable<CarDetailResult["selectedVariant"]>,
): number | null {
  if (variant.isElectric) return variant.electric?.realWorldRange ?? null;
  // claimedFe arrives as a decimal string from the API.
  const rated = variant.ice?.realWorldMileage ?? Number(variant.ice?.claimedFe);
  return Number.isFinite(rated) && rated ? Number(rated) : null;
}

export interface RunningCost {
  costPerKm: number;
  dailyCost: number;
  monthlyCost: number;
  yearlyCost: number;
}

export function calculateRunningCost(fuelPricePerUnit: number, mileage: number, monthlyDistanceKm: number): RunningCost {
  if (fuelPricePerUnit <= 0 || mileage <= 0 || monthlyDistanceKm <= 0) {
    return { costPerKm: 0, dailyCost: 0, monthlyCost: 0, yearlyCost: 0 };
  }

  const costPerKm = fuelPricePerUnit / mileage;
  const monthlyCost = costPerKm * monthlyDistanceKm;

  return {
    costPerKm,
    dailyCost: costPerKm * (monthlyDistanceKm / 30),
    monthlyCost,
    yearlyCost: monthlyCost * 12,
  };
}
