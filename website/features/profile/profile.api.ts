import { getCurrentUserToken } from "@/features/auth/currentUser";
import { apiFetch } from "@/lib/apiClient";
import type { ProfileOverview } from "./profile.types";

function authHeaders(): HeadersInit | undefined {
  const token = getCurrentUserToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function getMyProfile(): Promise<ProfileOverview> {
  return apiFetch<ProfileOverview>("/profile", { headers: authHeaders() });
}
