"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordPageView } from "@/features/analytics/pageView.api";

// Mounted once in the root layout (like CompareTray/DevLoadTimeBadge) —
// fires a best-effort page-view record on first load and every
// client-side route change. Query string deliberately excluded (keeps
// this simple, no useSearchParams()/Suspense boundary needed) — renders
// nothing.
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordPageView(pathname).catch(() => {
      // best-effort — a dropped analytics call must never surface to the visitor
    });
  }, [pathname]);

  return null;
}
