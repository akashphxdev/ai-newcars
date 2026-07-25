// features/banners/banner.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { Banner } from "./banner.types";

export async function getBanners(): Promise<Banner[]> {
  const banners = await apiFetch<Banner[]>("/home/banners", { next: { revalidate: 60 } });
  return banners.map((b) => ({ ...b, imageUrl: getUploadUrl(b.imageUrl), videoUrl: getUploadUrl(b.videoUrl) }));
}

// Fire-and-forget from the client when a visitor clicks a banner's CTA —
// never cached, always hits the DB to actually increment.
export function recordBannerClick(id: number): Promise<{ id: number; clickCount: number }> {
  return apiFetch<{ id: number; clickCount: number }>(`/home/banners/${id}/click`, { method: "PATCH" });
}
