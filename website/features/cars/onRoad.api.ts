// features/cars/onRoad.api.ts

import { apiFetch } from "@/lib/apiClient";

export interface OnRoadPrice {
  state: { id: number; name: string; slug: string };
  variantId: number;
  fuelType: string;
  exShowroom: string;
  roadTax: {
    amount: string;
    ratePct: string;
    basis: string;
    effectiveFrom: string;
    sourceUrl: string | null;
    // Rates were compiled from published secondary sources rather than
    // state RTO notifications, so the page labels an unverified figure
    // instead of implying we stand behind it.
    verified: boolean;
  };
  registration: {
    amount: string;
    detail: { registration: string; hsrp: string; fastag: string };
  };
  // No published rate exists for insurance — it moves with insurer, IDV
  // and add-ons — so it is always an estimate and says so.
  insurance: { amount: string; ratePct: string; estimated: boolean };
  total: string;
  estimated: boolean;
}

export async function getOnRoadPrice(
  variantId: number,
  stateSlug: string,
): Promise<OnRoadPrice | null> {
  try {
    return await apiFetch<OnRoadPrice>(
      `/cars/on-road-price?variant=${variantId}&state=${encodeURIComponent(stateSlug)}`,
    );
  } catch {
    // States we hold no slab for return 404. That is a normal answer here,
    // not a failure — the card simply says we cannot price that state.
    return null;
  }
}

// The endpoint answers at most BATCH ids and drops the remainder silently,
// so a long table has to be asked for in pieces — a Nexon has 66 trims.
const BATCH = 60;

// One request per batch for a whole variant table. Variants the state has
// no slab for are simply absent from the response rather than failing it.
export async function getOnRoadPrices(
  variantIds: number[],
  stateSlug: string,
): Promise<OnRoadPrice[]> {
  if (!variantIds.length) return [];

  const batches: number[][] = [];
  for (let i = 0; i < variantIds.length; i += BATCH) {
    batches.push(variantIds.slice(i, i + BATCH));
  }

  const state = encodeURIComponent(stateSlug);
  const results = await Promise.all(
    batches.map(async (ids) => {
      try {
        const res = await apiFetch<{ prices: OnRoadPrice[] }>(
          `/cars/on-road-prices?variants=${ids.join(",")}&state=${state}`,
        );
        return res.prices ?? [];
      } catch {
        return [];
      }
    }),
  );
  return results.flat();
}
