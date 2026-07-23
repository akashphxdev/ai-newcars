// lib/apiClient.ts

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
    throw new ApiError(body?.message ?? `Request to ${path} failed (${res.status})`, res.status);
  }

  return body.data;
}
