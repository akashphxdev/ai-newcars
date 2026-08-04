// components/common/ModelDetailTabs.tsx
//
// Sub-navigation strip shared by the model page (app/car-model/[brandSlug]/[modelSlug])
// and the variant page (app/car-model/[brandSlug]/[modelSlug]/[variantSlug]).
// Sits below the hero/gallery block (not pinned to the very top) — it only
// starts sticking once scrolled up to the main Header's bottom edge.
//
// Overview/Variants/Comparison/News only exist on the model page;
// Specifications/Features/Safety only exist on the variant page; Reviews
// exists on both. Whichever page isn't the current one gets its tabs
// turned into a cross-page link (to that page's own anchor) instead of an
// in-page anchor. "Photos" is always its own separate navigation.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const TABS = [
  { label: "Overview", id: "overview", page: "model" },
  { label: "Specifications", id: "specs", page: "variant" },
  { label: "Features", id: "features", page: "variant" },
  { label: "Safety", id: "safety", page: "variant" },
  { label: "Variants", id: "variants", page: "model" },
  { label: "Comparison", id: "comparison", page: "model" },
  { label: "News", id: "news", page: "model" },
  { label: "Reviews", id: "reviews", page: "shared" },
] as const;

export default function ModelDetailTabs({
  brandSlug,
  modelSlug,
  variantSlug,
  onVariantPage,
}: {
  brandSlug: string;
  modelSlug: string;
  // The variant page's slug this tab strip should link to for
  // variant-only sections — the default variant when rendered from the
  // model page, the current variant when rendered from the variant page.
  variantSlug: string;
  onVariantPage: boolean;
}) {
  const modelHref = `/${brandSlug}-cars/${modelSlug}`;
  const variantHref = `/${brandSlug}-cars/${modelSlug}/${variantSlug}`;

  const anchorTabs = TABS.map((t) => {
    const isLocal = t.page === "shared" ? true : t.page === "variant" ? onVariantPage : !onVariantPage;
    const basePath = t.page === "variant" ? variantHref : t.page === "model" ? modelHref : onVariantPage ? variantHref : modelHref;
    return { ...t, isLocal, basePath };
  });

  const [activeId, setActiveId] = useState<string>(anchorTabs[0].id);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cross-page tabs have no matching element in this page's DOM —
    // getElementById returns null for those and they're filtered out,
    // so only this page's own sections are ever observed/highlighted.
    const sections = anchorTabs
      .filter((t) => t.isLocal)
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => el !== null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onVariantPage]);

  const tabs = [
    ...anchorTabs,
    { label: "Photos", href: `${modelHref}/photos`, isLocal: false, id: "photos" as const, basePath: modelHref },
  ];

  return (
    <div ref={tabsRef} className="sticky top-16 z-40 w-full rounded-xl border border-border bg-white">
      <div className="flex items-center gap-1 overflow-x-auto px-3 text-[13.5px] font-medium text-ink scrollbar-none">
        {tabs.map((tab) => {
          const isPhotos = tab.label === "Photos";
          const href = isPhotos ? (tab as { href: string }).href : tab.isLocal ? `#${tab.id}` : `${tab.basePath}#${tab.id}`;
          const isActive = tab.isLocal && !isPhotos && tab.id === activeId;
          return (
            <Link
              key={tab.label}
              href={href}
              className={`whitespace-nowrap px-3 py-3 transition-colors hover:text-brand ${isActive ? "text-brand" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
