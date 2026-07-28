// features/reviews/review.api.ts
//
// Client-only — the reviews section fetches on mount (not SSR) so it can
// carry the logged-in user's token straight away for accurate
// "hasMarkedHelpful" state, rather than a server fetch + a second
// client re-fetch just to get that one flag right.

import { apiFetch } from "@/lib/apiClient";
import { getCurrentUserToken } from "@/features/auth/currentUser";
import type { ListReviewsResult, SubmitReviewInput } from "./review.types";

function authHeaders(): HeadersInit | undefined {
  const token = getCurrentUserToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getReviews(modelId: number, page = 1, limit = 10): Promise<ListReviewsResult> {
  return apiFetch<ListReviewsResult>(`/reviews?modelId=${modelId}&page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
}

export async function submitReview(input: SubmitReviewInput): Promise<{ id: number; message: string }> {
  return apiFetch(`/reviews`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
}

export async function toggleHelpful(reviewId: number): Promise<{ marked: boolean; helpfulCount: number }> {
  return apiFetch(`/reviews/${reviewId}/helpful`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function postReviewReply(reviewId: number, body: string) {
  return apiFetch(`/reviews/${reviewId}/replies`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ body }),
  });
}
