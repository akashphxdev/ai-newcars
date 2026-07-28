// features/search/search.api.ts
//
// Client-only — called straight from the header's search box, never from
// a Server Component (no caching: every keystroke's result should reflect
// what's in the catalog right now, and search_logs needs one row per
// actual search).

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import { getCurrentUserToken } from "@/features/auth/currentUser";
import type { SearchCarsResult } from "./search.types";

const SESSION_KEY = "search_session_id";

// Groups a browser tab's searches together for analytics — not tied to
// the logged-in user (SearchLog.userId already covers that), just to a
// single browsing session. Generated once per tab, not per search.
export function getSearchSessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export interface SearchCarsParams {
  pageUrl?: string;
  deviceType?: string;
}

export async function searchCars(q: string, params: SearchCarsParams = {}): Promise<SearchCarsResult> {
  const query = new URLSearchParams({ q });
  if (params.pageUrl) query.set("pageUrl", params.pageUrl);
  if (params.deviceType) query.set("deviceType", params.deviceType);
  const sessionId = getSearchSessionId();
  if (sessionId) query.set("sessionId", sessionId);

  const token = getCurrentUserToken();
  const result = await apiFetch<SearchCarsResult>(`/search/cars?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return { ...result, results: result.results.map((r) => ({ ...r, coverImageUrl: getUploadUrl(r.coverImageUrl) })) };
}
