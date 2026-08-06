import type { NextConfig } from "next";

// Assets are served from a CDN origin in every deployed environment and
// from the API's own /uploads mount locally. Both have to be allowlisted
// for next/image, which refuses to optimise a host it was not told about
// — an unlisted host is a hard 400, not a silent passthrough, so a wrong
// value here breaks every image on the site.
const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
const assetPattern = assetBase ? new URL(assetBase) : null;

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the modules actually reached at
  // runtime, so a deploy ships that instead of the whole node_modules
  // tree. Matters here because the host is memory- and disk-constrained.
  output: "standalone",

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
      // photos tab. Three segments vs two above, so no overlap with that
      // rule — but SAME segment count as the variant rewrite below, so
      // order matters here: this literal "photos" match must come first,
      // otherwise the wildcard variant-slug rule below would swallow it.
      {
        source: "/:brandSlug([a-z0-9-]+)-cars/:modelSlug([a-z0-9-]+)/photos",
        destination: "/car-model/:brandSlug/:modelSlug/photos",
      },
      // "/tata-motors-cars/nexon/xz-plus-dark-edition" — a specific
      // variant's own page (see app/car-model/.../[variantSlug]). Must be
      // registered after the "photos" rule immediately above (same
      // 3-segment shape; Next.js rewrites match in array order, first
      // match wins).
      {
        source: "/:brandSlug([a-z0-9-]+)-cars/:modelSlug([a-z0-9-]+)/:variantSlug([a-z0-9-]+)",
        destination: "/car-model/:brandSlug/:modelSlug/:variantSlug",
      },
    ];
  },
  images: {
    // Next.js blocks image optimization for local/private IPs by default
    // as SSRF hardening. Only lifted for local development, where the
    // backend genuinely is on localhost — never in a deployed build.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      // The CDN origin (static.timesauto.net), derived from the same env
      // var the app resolves asset paths against so the two can never
      // disagree about which host serves uploads.
      ...(assetPattern
        ? [
            {
              protocol: assetPattern.protocol.replace(":", "") as "http" | "https",
              hostname: assetPattern.hostname,
              pathname: "/uploads/**",
            },
          ]
        : []),
      // admin-backend's own /uploads mount — the local-development
      // fallback, and the rollback path if assets ever move back off CDN.
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
