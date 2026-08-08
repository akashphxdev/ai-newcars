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

export type CalculatorSeed<V> = {
  brandId: number;
  modelId: number;
  variantId: number;
  models: EmiCalculatorModel[];
  variants: V[];
};

export async function leadCarSeed<V extends { id: number }>(
  fetchVariants: (modelId: number) => Promise<V[]>,
  type: "popular" | "electric" = "popular",
): Promise<CalculatorSeed<V> | null> {
  try {
    const [lead] = await getHomeCars(type, 1);
    if (!lead) return null;

    const [models, variants] = await Promise.all([
      getModelsByBrand(lead.brand.id),
      fetchVariants(lead.id),
    ]);
    if (!variants.length) return null;

    return {
      brandId: lead.brand.id,
      modelId: lead.id,
      variantId: variants[0].id,
      models,
      variants,
    };
  } catch {
    // A calculator that cannot seed still works from its dropdowns, so a
    // failure here degrades to the old empty state rather than a 500.
    return null;
  }
}
