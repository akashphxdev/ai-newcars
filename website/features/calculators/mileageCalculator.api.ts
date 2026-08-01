// features/calculators/mileageCalculator.api.ts
//
// Same /cars/lookup/models + /cars/lookup/variants endpoints EMI
// calculator uses (see emiCalculator.api.ts) — models don't need
// re-fetching here since EmiCalculatorModel already has everything the
// Model dropdown needs; variants are re-typed here to pick up
// isElectric/fuelType for the fuel-type filter.

import { apiFetch } from "@/lib/apiClient";
import type { MileageCalculatorVariant } from "./mileageCalculator.types";

export async function getVariantsByModel(modelId: number): Promise<MileageCalculatorVariant[]> {
  return apiFetch<MileageCalculatorVariant[]>(`/cars/lookup/variants?modelId=${modelId}`);
}
