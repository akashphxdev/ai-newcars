// features/wishlist/wishlist.api.ts
//
// Client-only — every call needs the logged-in user's token, same
// pattern as features/leads/lead.api.ts.

import { apiFetch } from "@/lib/apiClient";
import { getCurrentUserToken } from "@/features/auth/currentUser";
import type { WishlistItem, AddWishlistResult } from "./wishlist.types";

function authHeaders(): HeadersInit | undefined {
  const token = getCurrentUserToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getMyWishlist(): Promise<WishlistItem[]> {
  return apiFetch<WishlistItem[]>("/wishlist", { headers: authHeaders() });
}

export async function addToWishlist(modelId: number): Promise<AddWishlistResult> {
  return apiFetch<AddWishlistResult>("/wishlist", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ modelId }),
  });
}

export async function removeFromWishlist(modelId: number): Promise<void> {
  await apiFetch<null>(`/wishlist/${modelId}`, { method: "DELETE", headers: authHeaders() });
}
