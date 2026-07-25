// features/siteSettings/siteSetting.api.ts
//
// Also called from middleware.ts (Edge runtime) on every request, so
// this stays a plain apiFetch() call with no Node-only APIs — same
// reason apiClient.ts itself only uses the Fetch API.

import { apiFetch } from "@/lib/apiClient";
import type { PublicSiteSetting } from "./siteSetting.types";

export async function getSiteSettings(): Promise<PublicSiteSetting> {
  return apiFetch<PublicSiteSetting>(`/site-settings`, { cache: "no-store" });
}
