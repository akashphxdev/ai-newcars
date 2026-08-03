// features/lenders/lender.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { LenderOption } from "./lender.types";

// Client-only (called from inside the Loan Lead modal) — every active
// lender in one shot for the form's Preferred Lender field.
export async function getLenderOptions(): Promise<LenderOption[]> {
  const lenders = await apiFetch<LenderOption[]>(`/lenders/options`);
  return lenders.map((l) => ({ ...l, logoUrl: getUploadUrl(l.logoUrl) }));
}
