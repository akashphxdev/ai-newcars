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

  // The ONLY rewrite in the app.
  //
  // Brand paths are keyword-rich ("tata cars" is a real search query) but
  // cannot be a folder — a Next.js dynamic segment must be a whole path
  // segment, so `[brandSlug]-cars` is not a legal name. This maps the
  // whole brand subtree onto app/brand/[brandSlug]/... in one rule, so
  // model, photos and variant pages are all real nested folders rather
  // than four separate rewrites that had to be ordered by hand.
  //
  // Returning a plain array means these are "afterFiles" rewrites, which
  // are checked AFTER filesystem routes. That is what keeps /new-cars,
  // /electric-cars, /upcoming-cars and /compare-cars resolving to their
  // own pages instead of being read as a brand named "new"/"electric".
  async rewrites() {
    return [
      {
        // The negative lookahead is load-bearing. afterFiles rewrites run
        // after static pages but BEFORE dynamic routes, so without it
        // "/new-cars/suv" matches this rule as brand "new" and never
        // reaches app/new-cars/[bodyType]. "/new-cars" itself is a static
        // page and was unaffected, which makes the bug easy to miss.
        //
        // It excludes the full "<word>-cars" literal, not just "<word>".
        // Writing it as (?!new$) does nothing here: the $ anchors to the
        // end of the whole path, and the path continues "-cars/suv", so
        // the lookahead passes and "new" is captured as the brand.
        source: "/:brandSlug((?!new-cars|electric-cars|upcoming-cars|compare-cars|used-cars)[a-z0-9-]+)-cars/:path*",
        destination: "/brand/:brandSlug/:path*",
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
