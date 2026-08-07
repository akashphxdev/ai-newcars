"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Banner } from "@/features/banners/banner.types";
import { recordBannerClick } from "@/features/banners/banner.api";
import type { BodyType } from "@/features/bodyTypes/bodyType.types";
import { routes } from "@/lib/routes";
import SearchResultsList from "@/components/common/SearchResultsList";
import { ChevronDownIcon, SearchIcon } from "@/components/common/icons";
import { searchCars } from "@/features/search/search.api";
import type { SearchCarResult } from "@/features/search/search.types";

const budgetOptions = [
  { value: "", label: "Select Budget" },
  { value: "u10", label: "Under Rs.10 Lakh" },
  { value: "10-25", label: "Rs.10L - Rs.25L" },
  { value: "25-50", label: "Rs.25L - Rs.50L" },
  { value: "50-100", label: "Rs.50L - Rs.1Cr" },
  { value: "a100", label: "Above Rs.1 Crore" },
];

// value -> { minPrice?, maxPrice? } in plain rupees, for the search redirect.
const BUDGET_RANGES: Record<string, { minPrice?: number; maxPrice?: number }> = {
  u10: { maxPrice: 1_000_000 },
  "10-25": { minPrice: 1_000_000, maxPrice: 2_500_000 },
  "25-50": { minPrice: 2_500_000, maxPrice: 5_000_000 },
  "50-100": { minPrice: 5_000_000, maxPrice: 10_000_000 },
  a100: { minPrice: 10_000_000 },
};

const ORANGE = "var(--color-brand)";
const ORANGE_HOVER = "var(--color-brand-hover)";
const DARK = "var(--color-ink)";

export default function HeroSection({ banners, bodyTypes }: { banners: Banner[]; bodyTypes: BodyType[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const [budget, setBudget] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [carTab, setCarTab] = useState("new");
  const [carQuery, setCarQuery] = useState("");
  const [carResults, setCarResults] = useState<SearchCarResult[]>([]);
  const [carSearching, setCarSearching] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const slide = banners[current];

  useEffect(() => {
    const q = carQuery.trim();
    if (q.length < 2) {
      setCarResults([]);
      setCarSearching(false);
      return;
    }
    setCarSearching(true);
    // Debounced so typing a model name is one request, not one per key.
    const t = setTimeout(() => {
      searchCars(q, { pageUrl: window.location.pathname, deviceType: "web" })
        .then((r) => setCarResults(r.results))
        .catch(() => setCarResults([]))
        .finally(() => setCarSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [carQuery]);

  const advance = () => {
    clearInterval(timer.current);
    setFade(false);
    setTimeout(() => {
      setCurrent((p) => (p + 1) % banners.length);
      setFade(true);
    }, 350);
  };

  const startTimer = (idx: number) => {
    clearInterval(timer.current);
    if (banners[idx]?.mediaType !== 2) {
      timer.current = setInterval(advance, 4500);
    }
  };

  useEffect(() => {
    if (banners.length === 0) return;
    startTimer(0);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length]);

  useEffect(() => {
    if (banners.length === 0) return;
    if (slide.mediaType === 2 && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (slide.mediaType !== 2) {
      startTimer(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const jumpTo = (i: number) => {
    clearInterval(timer.current);
    setFade(false);
    setTimeout(() => {
      setCurrent(i);
      setFade(true);
    }, 300);
  };

  // Used-car search isn't wired up yet — only "New Car" navigates for now.
  const handleSearch = () => {
    if (carTab !== "new") return;

    const range = BUDGET_RANGES[budget];
    const params = new URLSearchParams();
    if (range?.minPrice != null) params.set("minPrice", String(range.minPrice));
    if (range?.maxPrice != null) params.set("maxPrice", String(range.maxPrice));
    const qs = params.toString();

    // A body type takes you straight to that type's own filtered page;
    // without one, /new-cars (unscoped, brand+body-type+price filters)
    // is the only page that can show "all cars under this budget".
    const basePath = bodyType ? routes.bodyType(bodyType) : "/new-cars";
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  if (banners.length === 0) return null;

  return (
    <>
      {/* The banner is now purely the banner. The search moved out below
          it so the art is never covered — previously the tabs and the
          filter bar sat on top of the image and hid the car. */}
      <section className="relative w-full overflow-hidden font-body" style={{ background: DARK }}>
        <div className="h-[360px] sm:h-[420px] lg:h-[480px]" />

        <div className={`absolute inset-0 z-0 transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}>
          {banners.map((b, i) =>
            b.mediaType === 2 ? (
              <video
                key={b.id}
                ref={i === 0 ? videoRef : null}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ${
                  i === current ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                src={b.videoUrl ?? undefined}
                autoPlay
                muted
                playsInline
                onEnded={advance}
              />
            ) : (
              b.imageUrl && (
                <Image
                  key={b.id}
                  src={b.imageUrl}
                  alt={b.heading}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  className={`object-cover transition-opacity duration-400 ${
                    i === current ? "opacity-100" : "opacity-0"
                  }`}
                />
              )
            )
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${DARK}eb, ${DARK}73, transparent)` }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${DARK}cc, transparent, transparent)` }} />
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(242,101,15,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(242,101,15,0.5) 1px,transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        {slide.ctaText && slide.ctaLink && (
          <div className={`absolute right-4 top-4 z-20 sm:right-6 sm:top-6 transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}>
            <a
              href={slide.ctaLink}
              onClick={() => {
                // Fire-and-forget — never block navigation on this call.
                recordBannerClick(slide.id).catch(() => {});
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-transparent px-5 py-2.5 text-sm font-bold tracking-wide transition-colors hover:bg-orange-500/10"
              style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
            >
              {slide.ctaText}
            </a>
          </div>
        )}

        {/* Copy is bottom-weighted and padded clear of the search card,
            which overlaps the hero's lower edge. */}
        <div className="absolute inset-0 z-10 flex w-full flex-col justify-center pb-16 md:w-[62%] px-4 sm:px-4 md:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
          <div className={`transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}>
            <p className="text-[10px] tracking-[0.4em] uppercase mb-3 font-semibold" style={{ color: ORANGE }}>
              {slide.tagLabel}
            </p>
            <h1 className="font-head text-2xl md:text-[2.1rem] lg:text-[2.5rem] font-bold text-white leading-tight mb-1 tracking-tight">
              {slide.heading.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <h2 className="font-head text-base md:text-lg font-extrabold mb-2.5" style={{ color: ORANGE }}>
              {slide.highlightText}
            </h2>
            <p className="text-[13px] text-faint leading-relaxed max-w-lg">{slide.description}</p>
          </div>
        </div>

        {/* Sits above the overlapping card, not behind it. */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => jumpTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current ? "w-6 h-2" : "w-2 h-2 bg-white/30 hover:bg-white/60"
              }`}
              style={i === current ? { background: ORANGE } : {}}
            />
          ))}
        </div>
      </section>

      {/* Search card — one prominent car lookup plus compact filter
          chips, rather than two full-width selects. The chips carry
          their value in the label, so a chosen filter is visible without
          opening anything. */}
      <div className="relative z-30 mx-auto -mt-10 max-w-7xl px-4">
        <div className="rounded-2xl border border-border bg-surface p-3 shadow-lg sm:p-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="inline-flex shrink-0 self-start rounded-md bg-page p-0.5 lg:self-auto">
              {(["new", "used"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCarTab(tab)}
                  className={`cursor-pointer rounded-sm px-5 py-2 text-[13px] font-bold transition-colors ${
                    carTab === tab ? "bg-brand text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {tab === "new" ? "New" : "Used"}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle">
                <SearchIcon />
              </span>
              <input
                value={carQuery}
                onChange={(e) => setCarQuery(e.target.value)}
                placeholder="Search by car name, e.g. Nexon"
                aria-label="Search for a car"
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-4 text-sm font-medium text-ink outline-none transition-colors placeholder:text-subtle hover:border-subtle focus:border-brand"
              />
              {carQuery.trim().length >= 2 && (
                <SearchResultsList
                  results={carResults}
                  searching={carSearching}
                  onSelect={(car) => {
                    setCarQuery("");
                    setCarResults([]);
                    router.push(routes.model(car.brand.slug, car.slug));
                  }}
                />
              )}
            </div>

            <button
              onClick={handleSearch}
              className="shrink-0 cursor-pointer rounded-md bg-brand px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
            >
              Search
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-soft pt-3">
            <FilterChip
              label="Budget"
              value={budget}
              options={budgetOptions.filter((o) => o.value)}
              onChange={setBudget}
            />
            <FilterChip
              label="Body Type"
              value={bodyType}
              options={bodyTypes.map((bt) => ({ value: bt.slug, label: bt.name }))}
              onChange={setBodyType}
            />
            {(budget || bodyType) && (
              <button
                onClick={() => {
                  setBudget("");
                  setBodyType("");
                }}
                className="cursor-pointer px-2 py-1 text-[12px] font-semibold text-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// A filter reads as a chip carrying its own value rather than an empty
// full-width bar. Kept local: the hero is the only place with this
// pattern, and hoisting it now would be abstraction without a caller.
function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
          selected
            ? "border-brand bg-brand-soft text-brand"
            : "border-border text-ink hover:border-subtle"
        }`}
      >
        {selected ? selected.label : label}
        <ChevronDownIcon className="size-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-72 w-56 overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value === value ? "" : o.value);
                setOpen(false);
              }}
              className={`w-full cursor-pointer px-3.5 py-2 text-left text-[13px] font-semibold transition-colors hover:bg-page ${
                o.value === value ? "text-brand" : "text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
