import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
