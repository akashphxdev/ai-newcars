// lib/apiClient.ts
//
// Thin fetch wrapper around admin-backend's public API
// (NEXT_PUBLIC_API_BASE_URL). Every feature's data-fetching function
// (e.g. features/banners/banner.api.ts) should call apiFetch() rather
// than using fetch() directly, so the base URL, response envelope, and
// error handling stay in one place.

import { clearCurrentUser } from "@/features/auth/currentUser";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/public/v1";

// admin-backend returns uploaded-file fields (logoUrl, coverImageUrl, ...)
// as host-relative paths (e.g. "/uploads/brands/x.avif"). Those paths are
// what the database stores, deliberately — the CDN hostname lives here in
// config instead, so pointing assets at a different origin is an env
// change rather than a rewrite of every row holding a path.
//
// NEXT_PUBLIC_ASSET_BASE_URL is the CDN origin (https://static.timesauto.net).
// Without it, paths resolve against the API origin, which is what keeps
// local development working against Express's own /uploads static mount.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/public\/v1\/?$/, "");
const ASSET_BASE_URL = (process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? API_ORIGIN).replace(/\/+$/, "");

export function getUploadUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${ASSET_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiPaginatedEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiFetchOptions = RequestInit & { next?: { revalidate?: number | false; tags?: string[] } };

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  let body: ApiEnvelope<T> | undefined;
  try {
    body = await res.json();
  } catch {
  }

  if (!res.ok || !body?.success) {
    // Only auth-gated routes ever 401 here — the stored token is dead
    // (expired/invalid), so drop it immediately rather than leaving the
    // header/wishlist etc. showing a "logged in" state every subsequent
    // call keeps failing against.
    if (res.status === 401) clearCurrentUser();
    throw new ApiError(body?.message ?? `Request to ${path} failed (${res.status})`, res.status);
  }

  return body.data;
}

// For endpoints that use sendPaginated() on the backend (data + pagination
// in one envelope) — plain apiFetch() would silently drop the pagination
// block since it only returns `.data`.
export async function apiFetchPaginated<T>(
  path: string,
  options?: ApiFetchOptions,
): Promise<{ data: T[]; pagination: Pagination }> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  let body: ApiPaginatedEnvelope<T> | undefined;
  try {
    body = await res.json();
  } catch {
  }

  if (!res.ok || !body?.success) {
    if (res.status === 401) clearCurrentUser();
    throw new ApiError(body?.message ?? `Request to ${path} failed (${res.status})`, res.status);
  }

  return { data: body.data, pagination: body.pagination };
}
