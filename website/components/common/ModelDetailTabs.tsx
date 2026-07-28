// components/common/ModelDetailTabs.tsx
//
// Sub-navigation strip for a car model detail page (app/car-model/[brandSlug]/[modelSlug]).
// Sits below the hero/gallery block (not pinned to the very top) — it only
// starts sticking once scrolled up to the main Header's bottom edge.
// "Photos" is a full navigation (its own page); everything else is an
// in-page anchor, and the active tab tracks whichever section is
// actually in view (IntersectionObserver) rather than always showing
// the first tab as active.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const ANCHOR_TABS = [
  { label: "Overview", id: "overview" },
  { label: "Variants", id: "variants" },
  { label: "Specifications", id: "specs" },
  { label: "Features", id: "features" },
  { label: "Safety", id: "safety" },
  { label: "Comparison", id: "comparison" },
  { label: "News", id: "news" },
  { label: "Reviews", id: "reviews" },
] as const;

export default function ModelDetailTabs({ brandSlug, modelSlug }: { brandSlug: string; modelSlug: string }) {
  const [activeId, setActiveId] = useState<string>(ANCHOR_TABS[0].id);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sections = ANCHOR_TABS.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // Anything crossing a line just below the sticky tabs bar counts as
    // "current" — top-margin offset accounts for the main Header (64px)
    // plus this bar's own height.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const tabs = [...ANCHOR_TABS, { label: "Photos", href: `/${brandSlug}-cars/${modelSlug}/photos` }];

  return (
    <div ref={tabsRef} className="sticky top-16 z-40 w-full rounded-xl border border-border bg-orange-50">
      <div className="flex items-center gap-1 overflow-x-auto px-3 text-[13.5px] font-semibold text-muted scrollbar-none">
        {tabs.map((tab) => {
          const isAnchor = "id" in tab;
          const isActive = isAnchor && tab.id === activeId;
          return (
            <Link
              key={tab.label}
              href={isAnchor ? `#${tab.id}` : tab.href}
              className={`whitespace-nowrap border-b-2 px-3 py-3 transition-colors hover:text-brand ${
                isActive ? "border-brand text-brand" : "border-transparent hover:border-brand"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
