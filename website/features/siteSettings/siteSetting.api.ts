// features/siteSettings/siteSetting.api.ts
//
// Also called from proxy.ts (Edge runtime) on every request, so this
// stays a plain apiFetch() call with no Node-only APIs — same reason
// apiClient.ts itself only uses the Fetch API.

import { apiFetch } from "@/lib/apiClient";
import type { PublicSiteSetting } from "./siteSetting.types";

// Uncached — proxy.ts's maintenance-mode gate needs this as fresh as the
// backend's own 30s Redis cache allows. Do not add revalidate here; use
// getSiteSettingsCached() below for anything that isn't gating requests.
export async function getSiteSettings(): Promise<PublicSiteSetting> {
  return apiFetch<PublicSiteSetting>(`/site-settings`, { cache: "no-store" });
}

// Cached variant for display-only usage (e.g. RootLayout's Footer props).
// RootLayout wraps every route, so an uncached fetch there forces every
// page in the app to render dynamically — this matches the backend's own
// 30s TTL, which is as fresh as the data gets anyway.
export async function getSiteSettingsCached(): Promise<PublicSiteSetting> {
  return apiFetch<PublicSiteSetting>(`/site-settings`, { next: { revalidate: 30 } });
}
