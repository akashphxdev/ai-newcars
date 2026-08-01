// features/calculators/emiCalculator.api.ts
//
// Client-only — the calculator fetches models/variants as the visitor
// picks a brand/model, so these are called from client state, not SSR.

import { apiFetch } from "@/lib/apiClient";
import type { EmiCalculatorModel, EmiCalculatorVariant } from "./emiCalculator.types";

export async function getModelsByBrand(brandId: number): Promise<EmiCalculatorModel[]> {
  return apiFetch<EmiCalculatorModel[]>(`/cars/lookup/models?brandId=${brandId}`);
}

export async function getVariantsByModel(modelId: number): Promise<EmiCalculatorVariant[]> {
  return apiFetch<EmiCalculatorVariant[]>(`/cars/lookup/variants?modelId=${modelId}`);
}
