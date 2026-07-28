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

// Initials from the account's single combined `name` field (DB has no
// separate first/last name columns) — first letter of the first word +
// first letter of the last word, e.g. "Akash Meena" -> "AM".
export function getUserInitials(user: AuthUser): string {
  const parts = user.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}
