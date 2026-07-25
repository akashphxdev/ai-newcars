"use client";
import { useEffect, useState } from "react";

// Temporary dev-only perf indicator — shows how long the page took to
// load, via the Navigation Timing API. The NODE_ENV check means this is
// dead-code-eliminated from production builds automatically, so it's
// safe even if this file is never removed.
export default function DevLoadTimeBadge() {
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const report = () => {
      const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (nav) setLoadMs(Math.round(nav.loadEventEnd - nav.startTime));
    };

    if (document.readyState === "complete") {
      report();
    } else {
      window.addEventListener("load", report);
      return () => window.removeEventListener("load", report);
    }
  }, []);

  if (process.env.NODE_ENV === "production" || loadMs === null || dismissed) return null;

  return (
    <div
      className="fixed bottom-3 right-3 z-[999] flex items-center gap-2 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm"
      role="status"
    >
      <span>⚡ Loaded in {loadMs < 1000 ? `${loadMs}ms` : `${(loadMs / 1000).toFixed(2)}s`}</span>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-white/60 hover:text-white">
        ×
      </button>
    </div>
  );
}
