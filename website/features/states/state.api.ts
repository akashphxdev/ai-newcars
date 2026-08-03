// features/states/state.api.ts

import { apiFetch } from "@/lib/apiClient";
import type { StateOption } from "./state.types";

// Client-only (called from inside the insurance lead wizard) — every
// state in one shot for the form's Registration State field.
export async function getStateOptions(): Promise<StateOption[]> {
  return apiFetch<StateOption[]>(`/states/options`);
}
