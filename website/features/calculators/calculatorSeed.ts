// features/calculators/calculatorSeed.ts
//
// Every calculator opened onto empty dropdowns, so the whole results half
// of the page was dead until the visitor had made three separate choices —
// the tool demonstrated nothing about itself. Seeding a real car on the
// server means the page arrives with a worked example, and it removes the
// three chained client fetches that selection would otherwise cost.
//
// The variant fetcher is injected because the calculators disagree on what
// a variant is: the finance tools want price, the running-cost tools want
// mileage and tank size.

import { getHomeCars } from "@/features/cars/car.api";
import { getModelsByBrand } from "@/features/calculators/emiCalculator.api";
import type { EmiCalculatorModel } from "@/features/calculators/emiCalculator.types";

export type ModelSeed = {
  brandId: number;
  modelId: number;
  models: EmiCalculatorModel[];
};

export type CalculatorSeed<V> = ModelSeed & {
  variantId: number;
  variants: V[];
};

// Some calculators only need the car, not a variant — the fuel comparison
// fetches and groups variants itself, so pulling them here would be a
// round trip whose result is thrown away.
export async function leadModelSeed(
  type: "popular" | "electric" = "popular",
): Promise<ModelSeed | null> {
  try {
    const [lead] = await getHomeCars(type, 1);
    if (!lead) return null;
    return { brandId: lead.brand.id, modelId: lead.id, models: await getModelsByBrand(lead.brand.id) };
  } catch {
    return null;
  }
}

export async function leadCarSeed<V extends { id: number }>(
  fetchVariants: (modelId: number) => Promise<V[]>,
  type: "popular" | "electric" = "popular",
): Promise<CalculatorSeed<V> | null> {
  const base = await leadModelSeed(type);
  if (!base) return null;
  try {
    const variants = await fetchVariants(base.modelId);
    if (!variants.length) return null;
    return { ...base, variantId: variants[0].id, variants };
  } catch {
    // A calculator that cannot seed still works from its dropdowns, so a
    // failure here degrades to the old empty state rather than a 500.
    return null;
  }
}
