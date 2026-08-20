// features/ads/ad.api.ts
//
// The website's half of the in-house ad server. Campaigns, placements and
// advertisers have been in the admin panel all along with nothing able to
// ask for an ad — impressions and clicks both sat at zero.
//
// Nothing here is allowed to break a page: an ad that fails to load is a
// slot that stays empty, never an error a reader sees.

import { apiFetch } from "@/lib/apiClient";

export interface ServedAd {
  campaignId: number;
  placementId: number;
  placement: string;
  // "image" is a creative we host and click-track ourselves. "script" is
  // a network tag that renders and tracks itself, so the image and target
  // are absent and the script fields are present instead.
  creativeType: "image" | "script";
  imageUrl?: string;
  targetUrl?: string;
  scriptSrc?: string;
  // Whatever the network put on its tag — data-cfasync, type, id.
  scriptAttrs?: Record<string, string>;
  name: string;
  // "300x250" — the placement's booked size, used to reserve the box at
  // the right shape before the creative loads.
  dimensions: string;
}

export async function getAd(placement: string): Promise<ServedAd | null> {
  try {
    return await apiFetch<ServedAd | null>(`/ads/serve?placement=${encodeURIComponent(placement)}`, {
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

interface AdEvent {
  campaignId: number;
  placementId: number;
  impressionId?: number;
  pageUrl?: string;
  referrerUrl?: string;
  deviceType?: string;
  sessionId?: string;
}

function context(): Pick<AdEvent, "pageUrl" | "referrerUrl" | "deviceType"> {
  return {
    pageUrl: window.location.pathname.slice(0, 255),
    referrerUrl: document.referrer.slice(0, 255) || undefined,
    deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
  };
}

export async function recordImpression(ad: ServedAd): Promise<number | null> {
  try {
    const res = await apiFetch<{ impressionId: number }>("/ads/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: ad.campaignId, placementId: ad.placementId, ...context() }),
      cache: "no-store",
    });
    return res.impressionId;
  } catch {
    return null;
  }
}

// Fired while the browser is already leaving for the advertiser, so it
// goes out as a beacon: fetch would be cancelled by the navigation and
// the click — the thing the advertiser pays for — would go uncounted.
export function recordClick(ad: ServedAd, impressionId: number | null): void {
  const payload = JSON.stringify({
    campaignId: ad.campaignId,
    placementId: ad.placementId,
    impressionId: impressionId ?? undefined,
    ...context(),
  });
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/ads/click`;

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
