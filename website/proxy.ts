// proxy.ts
//
// Next.js 16 renamed `middleware.ts`/`export function middleware()` to
// `proxy.ts`/`export function proxy()` — the old file name is silently
// ignored on this version, so this file (not middleware.ts) is what
// actually runs on every request.
//
// Checks the admin-configurable maintenanceMode flag (Redis-cached
// 30s on the backend) and, when on, redirects every page to /maintenance —
// a real redirect (not a rewrite), so the browser's URL actually becomes
// /maintenance. That's what lets Header/Footer's existing
// isChromelessRoute(usePathname()) check (lib/routes.ts) correctly hide
// them there: usePathname() reflects the visible URL, not an internally
// rewritten one, so a silent rewrite would leave them showing. Fails open
// (site stays up) if the settings API is unreachable, rather than taking
// the whole site down over an API hiccup.
//
// Also serves admin-managed old-URL -> new-URL redirects (SEO > Redirects
// in admin panel) — checked after the maintenance gate, since there's no
// point honoring an SEO redirect while the whole site is down anyway.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSiteSettings } from "@/features/siteSettings/siteSetting.api";
import { getActiveRedirects } from "@/features/seo/seo.api";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Independent of each other except that redirects don't matter once
  // maintenanceMode is on — fetched in parallel rather than one-after-
  // another, since this runs on nearly every request site-wide and a
  // sequential second round-trip would add latency to every page load.
  const [settings, redirects] = await Promise.all([
    getSiteSettings().catch(() => null),
    getActiveRedirects(),
  ]);

  if (settings?.maintenanceMode) {
    if (pathname === "/maintenance") return NextResponse.next();
    // 307: temporary — preserves the request method and must never be
    // cached as permanent, since this only applies while the flag is on.
    return NextResponse.redirect(new URL("/maintenance", request.url), 307);
  }

  // Maintenance mode is off (or the settings API was unreachable — fail
  // open) — /maintenance isn't a real page for anyone to land on
  // directly, send them home instead of showing stale/irrelevant "under
  // maintenance" copy.
  if (pathname === "/maintenance") {
    return NextResponse.redirect(new URL("/", request.url), 307);
  }

  const match = redirects.find((r) => r.oldPath === pathname);
  if (match) {
    return NextResponse.redirect(new URL(match.newPath, request.url), match.redirectType);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
