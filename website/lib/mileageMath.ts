// lib/mileageMath.ts
//
// Deliberately just one formula — cost per km from the car's own rated
// mileage and the fuel price the visitor enters. No AC-usage/traffic
// adjustment factors and no maintenance/insurance estimates live here:
// none of those have a real data source anywhere in this app, and
// inventing multipliers for them would just be fabricated numbers
// presented as real ones.

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
