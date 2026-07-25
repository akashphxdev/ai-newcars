// proxy.ts
//
// Next.js 16 renamed `middleware.ts`/`export function middleware()` to
// `proxy.ts`/`export function proxy()` — the old file name is silently
// ignored on this version, so this file (not middleware.ts) is what
// actually runs on every request.
//
// Checks the admin-configurable maintenanceMode flag (Redis-cached
// 30s on the backend) and, when on, rewrites every page to /maintenance
// without changing the URL the visitor sees. Fails open (site stays up)
// if the settings API is unreachable, rather than taking the whole
// site down over an API hiccup.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSiteSettings } from "@/features/siteSettings/siteSetting.api";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  try {
    const { maintenanceMode } = await getSiteSettings();
    if (maintenanceMode) {
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }
  } catch {
    // Settings API unreachable — fail open.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
