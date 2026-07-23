// lib/apiClient.ts
//
// Thin fetch wrapper around admin-backend's public API
// (NEXT_PUBLIC_API_BASE_URL). Every feature's data-fetching function
// (e.g. a future lib/api/banners.ts) should call apiFetch() rather than
// using fetch() directly, so the base URL, response envelope, and error
// handling stay in one place.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/public/v1";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// `next` lets callers opt into Next.js's fetch cache (e.g. { revalidate: 60 })
// on top of the backend's own Redis cache — unused for now, wired up per
// call once real endpoints exist.
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
    // no/invalid JSON body — body stays undefined, handled below
  }

  if (!res.ok || !body?.success) {
    throw new ApiError(body?.message ?? `Request to ${path} failed (${res.status})`, res.status);
  }

  return body.data;
}
