// src/pages/Seo/SeoMeta/AllSeoMetas.tsx
//
// Single SEO Manager screen for both static AND dynamic pages. The
// page-picker strip lists every static page (see STATIC_PAGE_SLUG_OPTIONS
// in lib/lookups.ts) followed by chips for each dynamic, entity-based
// page type (Brand Listing, Model Detail, Variant Detail, Body Type
// Listing, News Category — see DYNAMIC_SEO_PAGE_TYPE_OPTIONS). Picking a
// static chip loads that one page's SEO row into SeoMetaModal (one entry
// per page, no duplicates possible). Picking a dynamic chip switches the
// panel below to DynamicSeoMetaPanel — a searchable list, since these are
// open-ended entities rather than a short fixed list.
import { useEffect, useMemo, useRef, useState } from "react";
import { useGetSeoMetasQuery, type SeoMetaRecord } from "./seoMeta.api";
import SeoMetaModal from "./SeoMetaModal";
import DynamicSeoMetaPanel from "./DynamicSeoMetaPanel";
import { SEO_PAGE_TYPE, DYNAMIC_SEO_PAGE_TYPE_OPTIONS, STATIC_PAGE_SLUG_OPTIONS } from "../../../lib/lookups";

const ACCENT = "#D4300F";

// Purely cosmetic grouping so the sidebar reads as two short lists
// instead of one flat 15-row wall of text. Doesn't affect data — every
// slug here still has to exist in STATIC_PAGE_SLUG_OPTIONS.
const CALCULATOR_SLUGS = new Set([
  "car-affordability-calculator",
  "car-loan-emi-calculator",
  "down-payment-calculator",
  "ev-charging-time-calculator",
  "fuel-comparison-calculator",
  "mileage-calculator",
]);

// Discriminated selection — either one fixed static page (by slug), or a
// whole dynamic category (by pageType), which DynamicSeoMetaPanel then
// lists/searches on its own.
type Selection = { kind: "static"; slug: string } | { kind: "dynamic"; pageType: number };

function DocIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function CalcIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8" />
      <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </svg>
  );
}

function CarIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
      <rect x="3" y="11" width="18" height="6" rx="1.5" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function NewsIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ScrollArrowButton({ direction, onClick, disabled }: { direction: "left" | "right"; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className="cursor-pointer shrink-0 h-7 w-7 rounded-full bg-white border border-[#e8e4dc] flex items-center justify-center text-[#4a4640] hover:bg-[#f7f5f1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

function PageChip({
  label,
  icon,
  isSelected,
  hasSeo,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  hasSeo?: boolean;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer shrink-0 flex items-center gap-1.5 whitespace-nowrap text-[12.5px] px-3.5 py-2.5 rounded-t-lg border-b-2 transition-colors ${
        isSelected ? "font-black text-[#1c1a17]" : "font-semibold text-[#8a8579] border-transparent hover:text-[#4a4640]"
      }`}
      style={{ borderColor: isSelected ? ACCENT : "transparent" }}
    >
      {icon}
      {label}
      {hasSeo !== undefined && (
        <span
          title={hasSeo ? (isActive ? "SEO added — active" : "SEO added — inactive") : "SEO not added yet"}
          className="shrink-0 h-1.5 w-1.5 rounded-full"
          style={{ background: hasSeo ? (isActive ? "#22c55e" : "#c0bab0") : "#e2ddd5" }}
        />
      )}
    </button>
  );
}

export default function AllSeoMetas() {
  // Only 15 static pages exist today (per STATIC_PAGE_SLUG_OPTIONS), so a
  // single unpaginated fetch of pageType=STATIC covers all of them for
  // the chip strip's "has SEO / active" dots — no search/pagination
  // needed for that part.
  const {
    data: seoMetasData,
    isLoading,
    isFetching,
    error: queryError,
  } = useGetSeoMetasQuery({ pageType: SEO_PAGE_TYPE.STATIC, limit: 100 });

  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as { message?: string }).message ?? "Something went wrong." : "";

  const recordsBySlug = useMemo(() => {
    const map = new Map<string, SeoMetaRecord>();
    for (const record of seoMetasData?.data ?? []) {
      if (record.staticPageSlug) map.set(record.staticPageSlug, record);
    }
    return map;
  }, [seoMetasData]);

  const orderedOptions = useMemo(
    () => STATIC_PAGE_SLUG_OPTIONS.map((option) => ({ ...option, isCalculator: CALCULATOR_SLUGS.has(option.value) })),
    [],
  );

  const staticFilledCount = useMemo(
    () => STATIC_PAGE_SLUG_OPTIONS.filter((o) => recordsBySlug.has(o.value)).length,
    [recordsBySlug],
  );

  const [selection, setSelection] = useState<Selection>({ kind: "static", slug: STATIC_PAGE_SLUG_OPTIONS[0].value });

  const selectedStaticOption =
    selection.kind === "static" ? STATIC_PAGE_SLUG_OPTIONS.find((o) => o.value === selection.slug) ?? STATIC_PAGE_SLUG_OPTIONS[0] : null;
  const selectedStaticRecord = selectedStaticOption ? recordsBySlug.get(selectedStaticOption.value) ?? null : null;

  // Prev/next arrows for the chip strip — mirrors a standard carousel:
  // scroll the row by a fixed amount and disable whichever arrow points
  // past the current edge.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [orderedOptions.length]);

  const scrollByAmount = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: direction === "left" ? -240 : 240, behavior: "smooth" });
  };

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-center gap-2.5 mb-1">
        <span
          className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #fbeae6, #fdf3ee)" }}
        >
          <SearchIcon />
        </span>
        <h1 className="text-[18px] font-black text-[#1c1a17]">SEO Manager</h1>
        {!loading && (
          <span
            className="text-[10.5px] font-bold px-2.5 py-1 rounded-full"
            style={{ color: ACCENT, background: "#fbeae6" }}
          >
            {staticFilledCount}/{STATIC_PAGE_SLUG_OPTIONS.length} static pages covered
          </span>
        )}
      </div>
      <p className="text-[12px] text-[#a39e96] mb-5">
        Pick a page (or a dynamic page type) to view or edit its meta tags, OG tags, robots directive and JSON-LD
        structured data.
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-5">
          <p className="text-red-500 text-xs font-medium">{error}</p>
        </div>
      )}

      <div className="mb-5 flex items-center gap-2 border-b border-[#ece7dd]">
        <ScrollArrowButton direction="left" onClick={() => scrollByAmount("left")} disabled={!canScrollLeft} />
        <div ref={scrollRef} className="no-scrollbar flex items-center gap-0.5 overflow-x-auto scroll-smooth -mb-px">
          {orderedOptions.map((option) => {
            const record = recordsBySlug.get(option.value);
            const isSelected = selection.kind === "static" && selection.slug === option.value;
            const Icon = option.isCalculator ? CalcIcon : DocIcon;
            return (
              <PageChip
                key={option.value}
                label={option.label}
                icon={<Icon color={isSelected ? ACCENT : "#a39e96"} />}
                isSelected={isSelected}
                hasSeo={!!record}
                isActive={!!record?.status}
                onClick={() => setSelection({ kind: "static", slug: option.value })}
              />
            );
          })}

          {/* Divider between static pages and dynamic categories */}
          <span className="shrink-0 h-5 w-px bg-[#e2ddd5] mx-1" />

          {DYNAMIC_SEO_PAGE_TYPE_OPTIONS.map((opt) => {
            const isSelected = selection.kind === "dynamic" && selection.pageType === opt.value;
            const Icon = opt.value === SEO_PAGE_TYPE.NEWS_CATEGORY ? NewsIcon : CarIcon;
            return (
              <PageChip
                key={opt.value}
                label={opt.label}
                icon={<Icon color={isSelected ? ACCENT : "#a39e96"} />}
                isSelected={isSelected}
                onClick={() => setSelection({ kind: "dynamic", pageType: opt.value })}
              />
            );
          })}
        </div>
        <ScrollArrowButton direction="right" onClick={() => scrollByAmount("right")} disabled={!canScrollRight} />
      </div>

      <div>
        {selection.kind === "dynamic" ? (
          <DynamicSeoMetaPanel pageType={selection.pageType} />
        ) : loading ? (
          <div className="bg-white border border-[#e8e4dc] rounded-xl px-6 py-10 text-center text-[13px] text-[#a39e96]">
            Loading SEO entries...
          </div>
        ) : (
          selectedStaticOption && (
            <SeoMetaModal slug={selectedStaticOption.value} slugLabel={selectedStaticOption.label} seoMeta={selectedStaticRecord} />
          )
        )}
      </div>
    </div>
  );
}
