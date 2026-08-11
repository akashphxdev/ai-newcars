// proxy.ts
//
// Next.js 16 renamed `middleware.ts`/`export function middleware()` to
// `proxy.ts`/`export function proxy()` — the old file name is silently
// ignored on this version, so this file (not middleware.ts) is what
// actually runs on every request.
//
// Checks the admin-configurable maintenanceMode flag (Redis-cached
// 30s on the backend) and, when on, redirects every page to /maintenance —
// a real redirect rather than a rewrite, because Header/Footer decide
// whether to render from usePathname(), which reports the visible URL. A
// silent rewrite would leave the site chrome wrapped around the
// maintenance page. Fails open (site stays up) if the settings API is
// unreachable, rather than taking the whole site down over an API hiccup.
//
// Also serves the admin's old-URL to new-URL redirects, checked after the
// maintenance gate — there is no point honouring an SEO redirect while
// the whole site is behind a maintenance page.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSiteSettings } from "@/features/siteSettings/siteSetting.api";
import { getActiveRedirects } from "@/features/seo/seo.api";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Independent of each other, and this runs on nearly every request —
  // fetching them one after the other would add a second round trip to
  // every page load.
  const [settings, redirects] = await Promise.all([
    getSiteSettings().catch(() => null),
    getActiveRedirects(),
  ]);

  if (settings?.maintenanceMode) {
    if (pathname === "/maintenance") return NextResponse.next();
    // Temporary, and never cached as permanent: it applies only while
    // the flag is on.
    return NextResponse.redirect(new URL("/maintenance", request.url), 307);
  }

  // Maintenance is off, so /maintenance is not a page anyone should land
  // on — send them home rather than showing stale "we're down" copy.
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
