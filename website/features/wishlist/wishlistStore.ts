// features/wishlist/wishlistStore.ts
//
// In-memory "which models are wishlisted" cache for the logged-in user —
// backs every WishlistButton on the site so mounting many cards at once
// (a homepage rail, a brand grid) only ever fetches the list once, and
// toggling one heart updates every other heart for the same car
// immediately. Same same-tab custom-event pub/sub shape as
// features/compare/compareTray.ts, just server-backed (via wishlist.api)
// instead of localStorage-backed, since a wishlist is tied to an account.

import { getCurrentUserToken } from "@/features/auth/currentUser";
import { getMyWishlist, addToWishlist as apiAdd, removeFromWishlist as apiRemove } from "./wishlist.api";

const EVENT = "wishlist-change";

let ids: Set<number> | null = null;
let loadingPromise: Promise<void> | null = null;

function notify() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function isWishlisted(modelId: number): boolean {
  return ids?.has(modelId) ?? false;
}

// Call from every WishlistButton's mount effect — concurrent calls
// across many rendered cards share the same in-flight request instead
// of firing one per card. No-ops for guests (nothing to load).
export async function ensureWishlistLoaded(): Promise<void> {
  if (ids || !getCurrentUserToken()) return;
  if (!loadingPromise) {
    loadingPromise = getMyWishlist()
      .then((items) => {
        ids = new Set(items.map((i) => i.modelId));
        notify();
      })
      .catch(() => {
        ids = new Set();
      })
      .finally(() => {
        loadingPromise = null;
      });
  }
  await loadingPromise;
}

export function subscribeWishlist(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

// Thrown when a guest tries to toggle — WishlistButton catches this
// specific error to open the login prompt instead of a generic failure
// state.
export class WishlistAuthRequiredError extends Error {
  constructor() {
    super("Login required");
    this.name = "WishlistAuthRequiredError";
  }
}

export async function toggleWishlist(modelId: number): Promise<void> {
  if (!getCurrentUserToken()) {
    throw new WishlistAuthRequiredError();
  }

  const wasWishlisted = isWishlisted(modelId);
  const next = new Set(ids ?? []);
  if (wasWishlisted) next.delete(modelId);
  else next.add(modelId);
  ids = next;
  notify();

  try {
    if (wasWishlisted) await apiRemove(modelId);
    else await apiAdd(modelId);
  } catch (err) {
    // Roll back the optimistic update on failure.
    const rollback = new Set(ids ?? []);
    if (wasWishlisted) rollback.add(modelId);
    else rollback.delete(modelId);
    ids = rollback;
    notify();
    throw err;
  }
}
