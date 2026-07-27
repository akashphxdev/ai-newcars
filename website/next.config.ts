import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "/tata-motors-cars" or "/suv-cars" -> internally served by
  // app/listing-cars/[slug]/page.tsx (slug = "tata-motors" / "suv"). A
  // plain [slug]-cars folder isn't valid Next.js routing syntax (dynamic
  // segments must be the whole path segment), so this rewrite is what
  // makes the vanity URL work — the browser still shows "/suv-cars",
  // only the internal render path changes. One destination handles both
  // brand and body-type slugs (see that page for how it decides which):
  // a rewrite's source pattern can't branch by what the slug resolves to
  // in the database, so the resolution has to happen at render time.
  async rewrites() {
    return [
      {
        source: "/:slug([a-z0-9-]+)-cars",
        destination: "/listing-cars/:slug",
      },
      // "/tata-motors-cars/nexon" -> app/car-model/[brandSlug]/[modelSlug]
      // (same vanity-URL trick as the listing rewrite above — a
      // "[brandSlug]-cars" folder isn't valid Next.js routing syntax, so
      // the rewrite is what makes the nested vanity URL work). Distinct
      // segment count from the rewrite above (2 segments vs 1), so no
      // overlap between the two.
      {
        source: "/:brandSlug([a-z0-9-]+)-cars/:modelSlug([a-z0-9-]+)",
        destination: "/car-model/:brandSlug/:modelSlug",
      },
      // "/tata-motors-cars/nexon/photos" — the model page's dedicated
      // photos tab. Three segments vs two above, so no overlap.
      {
        source: "/:brandSlug([a-z0-9-]+)-cars/:modelSlug([a-z0-9-]+)/photos",
        destination: "/car-model/:brandSlug/:modelSlug/photos",
      },
    ];
  },
  images: {
    // Next.js 16 blocks image optimization for local/private IPs by
    // default (security hardening against SSRF-style abuse). Safe to
    // allow here since admin-backend runs on localhost in dev — revisit
    // once the backend has a real domain in production.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      // admin-backend's /uploads (banners, brand logos, car covers,
      // city logos, testimonial photos). Update the hostname here when
      // the backend moves off localhost in production.
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/uploads/**" },
      // Still-static sections (Comparecars/Videos/Stories) — remove
      // once those are wired to real data too.
      { protocol: "https", hostname: "stimg.cardekho.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.iconify.design" },
    ],
  },
};

export default nextConfig;
