// features/auth/currentUser.ts
//
// Client-only localStorage-backed "who's logged in" state. AuthModal
// already stored the raw JWT under "user_token" on login/signup success —
// this adds the user's basic info alongside it so the header can render
// an avatar immediately (page reload after auth already re-mounts it)
// without an extra /auth/me round-trip on every page load.

import type { AuthUser } from "./auth.types";

const TOKEN_KEY = "user_token";
const USER_KEY = "user_info";
const AUTH_EVENT = "auth-change";

export function saveCurrentUser(user: AuthUser, token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — not critical, skip silently.
  }
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getCurrentUserToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Logout, and also called by lib/apiClient.ts whenever the backend
// rejects a stored token as invalid/expired — either way the stale
// session needs to disappear immediately, not just on next page load.
export function clearCurrentUser(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // localStorage unavailable — nothing to clear.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
}

// Lets any mounted component (Header's avatar, WishlistButton, etc.)
// react the moment the session is cleared, without needing a full page
// reload — same same-tab custom-event shape as compareTray/wishlistStore.
export function subscribeAuthChange(onChange: () => void): () => void {
  window.addEventListener(AUTH_EVENT, onChange);
  return () => window.removeEventListener(AUTH_EVENT, onChange);
}

// Initials from the account's single combined `name` field (DB has no
// separate first/last name columns) — first letter of the first word +
// first letter of the last word, e.g. "Akash Meena" -> "AM".
export function getUserInitials(user: AuthUser): string {
  const parts = user.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}
