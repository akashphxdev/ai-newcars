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
import { routes } from "@/lib/routes";

const MODEL_TABS = [
  { label: "Overview", id: "overview" },
  { label: "Variants", id: "variants" },
  { label: "Range & charging", id: "range-charging" },
  { label: "Specs", id: "specifications" },
  { label: "Colours", id: "colours" },
  { label: "Compare", id: "comparison" },
  { label: "Reviews", id: "reviews" },
  { label: "News", id: "news" },
  { label: "FAQs", id: "faqs" },
] as const;

const VARIANT_TABS = [
  { label: "Performance", id: "performance" },
  { label: "Dimensions", id: "dimensions" },
  { label: "Cabin & features", id: "features" },
  { label: "Safety", id: "safety" },
  { label: "Ownership", id: "ownership" },
  { label: "Reviews", id: "reviews" },
] as const;

export default function ModelDetailTabs({
  brandSlug,
  modelSlug,
  variantSlug,
  onVariantPage,
  embedded = false,
  sections,
}: {
  brandSlug: string;
  modelSlug: string;
  // The variant page's slug this tab strip should link to for
  // variant-only sections — the default variant when rendered from the
  // model page, the current variant when rendered from the variant page.
  variantSlug: string;
  onVariantPage: boolean;
  embedded?: boolean;
  // Section ids actually rendered on the page. A tab whose section a car
  // does not have scrolled nowhere; the EV section had no tab at all.
  sections?: string[];
}) {
  const modelHref = routes.model(brandSlug, modelSlug);
  const variantHref = routes.variant(brandSlug, modelSlug, variantSlug);

  const anchorTabs = (onVariantPage ? VARIANT_TABS : MODEL_TABS)
    .filter((tab) => !sections || sections.includes(tab.id))
    .map((tab) => ({ ...tab, isLocal: true }));

  const [activeId, setActiveId] = useState<string>(anchorTabs[0]?.id ?? "");
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
    ...(onVariantPage
      ? [{ label: "Model overview", href: modelHref, isLocal: false, id: "model" as const }]
      : variantSlug
        ? [{ label: "Variant details", href: variantHref, isLocal: false, id: "variant-details" as const }]
        : []),
    { label: "Photos", href: `${modelHref}/photos`, isLocal: false, id: "photos" as const },
  ];

  return (
    <div
      ref={tabsRef}
      className={`sticky top-16 z-40 w-full border-border bg-white/95 backdrop-blur-md ${
        embedded ? "mt-4 rounded-lg border" : "border-y"
      }`}
    >
      <div
        className={`flex items-center overflow-x-auto px-4 text-[12px] font-bold text-ink scrollbar-none sm:text-[13px] ${
          embedded ? "" : "mx-auto max-w-7xl"
        }`}
      >
        {tabs.map((tab) => {
          const href = tab.isLocal ? `#${tab.id}` : (tab as { href: string }).href;
          const isActive = tab.isLocal && tab.id === activeId;
          return (
            <Link
              key={tab.label}
              href={href}
              className={`relative whitespace-nowrap px-2.5 py-4 transition-colors hover:text-brand first:pl-0 ${
                isActive ? "text-brand after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:bg-brand after:content-[''] first:after:left-0" : ""
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
