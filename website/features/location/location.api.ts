// features/location/location.api.ts

import { apiFetch } from "@/lib/apiClient";
import type { DetectedLocation, LocationCity } from "./location.types";

export async function getLocationCities(): Promise<LocationCity[]> {
  return apiFetch<LocationCity[]>("/location/cities");
}

// Cloudflare's edge geo hint. Cheap and needs no permission prompt, so it
// runs first — but it only pre-fills the answer, the visitor confirms it.
export async function detectCityFromIp(): Promise<DetectedLocation | null> {
  try {
    return await apiFetch<DetectedLocation>("/location/detect", { cache: "no-store" });
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<DetectedLocation | null> {
  try {
    return await apiFetch<DetectedLocation>(`/location/reverse?lat=${lat}&lon=${lon}`, {
      cache: "no-store",
    });
  } catch {
    return null;
  }
}
