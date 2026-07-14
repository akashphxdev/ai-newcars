// // src/lib/apiClient.ts

// import axios from "axios";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
// const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");
// export function getUploadUrl(path?: string | null): string | null {
//   if (!path) return null;
//   if (/^https?:\/\//i.test(path)) return path;
//   return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
// }

// export const apiClient = axios.create({
//   baseURL: BASE_URL,
//   headers: { "Content-Type": "application/json" },
// });
// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem("admin_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (axios.isAxiosError(error) && error.response?.status === 401) {
//       localStorage.removeItem("admin_token");
//       if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export interface ApiErrorShape {
//   success: false;
//   message: string;
//   errors?: { path: string; message: string }[];
// }

// export function extractApiError(err: unknown): string {
//   if (axios.isAxiosError(err)) {
//     const data = err.response?.data as ApiErrorShape | undefined;
//     if (data?.errors?.length) return data.errors.map((e) => e.message).join(", ");
//     if (data?.message) return data.message;
//     if (err.message) return err.message;
//   }
//   // RTK Query mutations (via axiosBaseQuery in store/baseApi.ts) reject with
//   // an already-unwrapped { status, message } object, NOT a raw AxiosError —
//   // axios.isAxiosError(err) is false for that shape, so without this check
//   // the real backend message (e.g. "Cannot delete this car model — 1
//   // variant(s) are linked to it...") gets silently swallowed and replaced
//   // with the generic fallback below.
//   if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
//     return (err as { message: string }).message;
//   }
//   return "Something went wrong. Please try again.";
// }


// src/lib/apiClient.ts

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");
export function getUploadUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getRelativeUploadPath(url: string): string {
  if (url.startsWith(API_ORIGIN)) return url.slice(API_ORIGIN.length);
  return url;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiErrorShape {
  success: false;
  message: string;
  errors?: { path: string; message: string }[];
}

export function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join(", ");
    if (data?.message) return data.message;
    if (err.message) return err.message;
  }
  if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Something went wrong. Please try again.";
}