// features/analytics/pageView.api.ts
//
// Fire-and-forget page-view recording — same apiFetch wrapper as every
// other feature, but the caller (PageViewTracker) never awaits/surfaces
// failures; a dropped analytics log must never affect the page itself.
// No auth header — the counter this increments (PageViewDailyStat) isn't
// tied to a user account, guest or logged-in write the same way.

import { apiFetch } from "@/lib/apiClient";

export async function recordPageView(pageUrl: string): Promise<void> {
  await apiFetch<null>("/analytics/page-views", {
    method: "POST",
    body: JSON.stringify({ pageUrl }),
  });
}
