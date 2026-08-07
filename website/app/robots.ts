import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/routes";

// There was no robots.txt at all before this — the site returned 404 for
// it, so nothing told a crawler where the sitemap lived.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal and transactional paths: nothing here is useful in an
      // index and /profile is per-user.
      disallow: ["/profile", "/maintenance", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
