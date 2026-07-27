"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Banner } from "@/features/banners/banner.types";
import { recordBannerClick } from "@/features/banners/banner.api";
import type { BodyType } from "@/features/bodyTypes/bodyType.types";

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

const ORANGE = "#f2650f";
const ORANGE_HOVER = "#d9560a";
const DARK = "#111827";

export default function HeroSection({ banners, bodyTypes }: { banners: Banner[]; bodyTypes: BodyType[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const [budget, setBudget] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [carTab, setCarTab] = useState("new");

  const videoRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const slide = banners[current];

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
    const basePath = bodyType ? `/${bodyType}-cars` : "/new-cars";
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  if (banners.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden font-body" style={{ minHeight: 560, background: DARK }}>
      <div className="h-160 sm:h-[88vh]" />
      {/* BACKGROUNDS */}
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

      {/* CTA — pinned to the very top-right corner of the hero, above the
          background but independent of the left column's layout. */}
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

      {/* LEFT COLUMN */}
      <div className="absolute left-0 top-0 h-full w-full md:w-[58%] flex flex-col justify-center z-10 px-4 sm:px-4 md:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
        <div className={`transition-opacity duration-400 mb-8 ${fade ? "opacity-100" : "opacity-0"}`}>
          <p className="text-[10px] tracking-[0.4em] uppercase mb-3 font-semibold" style={{ color: ORANGE }}>
            {slide.tagLabel}
          </p>
          <h1 className="font-head text-3xl md:text-[2.4rem] lg:text-[2.8rem] font-bold text-white leading-tight mb-1 tracking-tight">
            {slide.heading.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
          <h2 className="font-head text-lg md:text-xl font-extrabold mb-3" style={{ color: ORANGE }}>
            {slide.highlightText}
          </h2>
          <p className="text-[13px] text-[#c7ccd6] leading-relaxed mb-6 max-w-lg">{slide.description}</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-2xl">
          <div className="flex gap-2">
            <button
              onClick={() => setCarTab("new")}
              className="px-8 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
              style={
                carTab === "new"
                  ? { background: ORANGE, color: "#fff" }
                  : { background: "rgba(255,255,255,0.06)", color: "#9aa1ad", border: "1px solid rgba(255,255,255,0.12)" }
              }
              onMouseEnter={(e) => {
                if (carTab !== "new") e.currentTarget.style.color = "#f4f5f9";
              }}
              onMouseLeave={(e) => {
                if (carTab !== "new") e.currentTarget.style.color = "#9aa1ad";
              }}
            >
              New Car
            </button>
            <button
              onClick={() => setCarTab("used")}
              className="px-8 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all"
              style={
                carTab === "used"
                  ? { background: ORANGE, color: "#fff" }
                  : { background: "rgba(255,255,255,0.06)", color: "#9aa1ad", border: "1px solid rgba(255,255,255,0.12)" }
              }
              onMouseEnter={(e) => {
                if (carTab !== "used") e.currentTarget.style.color = "#f4f5f9";
              }}
              onMouseLeave={(e) => {
                if (carTab !== "used") e.currentTarget.style.color = "#9aa1ad";
              }}
            >
              Used Car
            </button>
          </div>

          <div
            className="backdrop-blur-xl rounded-2xl p-2 flex flex-col sm:flex-row sm:items-center gap-2 w-full shadow-2xl"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="relative flex-1 w-full">
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full appearance-none text-sm sm:text-base font-medium rounded-xl pl-5 pr-9 py-3 sm:py-4 outline-none cursor-pointer transition-all"
                style={{
                  background: "rgba(17,24,39,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                  backgroundImage: "none",
                }}
              >
                {budgetOptions.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: DARK, color: "#fff" }}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "#9aa1ad" }}>
                ▼
              </span>
            </div>

            <div className="hidden sm:block w-px h-9 flex-shrink-0" style={{ background: "rgba(255,255,255,0.12)" }} />

            <div className="relative flex-1 w-full">
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full appearance-none text-sm sm:text-base font-medium rounded-xl pl-5 pr-9 py-3 sm:py-4 outline-none cursor-pointer transition-all"
                style={{
                  background: "rgba(17,24,39,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                  backgroundImage: "none",
                }}
              >
                <option value="" style={{ background: DARK, color: "#fff" }}>
                  Select Body Type
                </option>
                {bodyTypes.map((bt) => (
                  <option key={bt.id} value={bt.slug} style={{ background: DARK, color: "#fff" }}>
                    {bt.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "#9aa1ad" }}>
                ▼
              </span>
            </div>

            <button
              onClick={handleSearch}
              className="w-full sm:w-auto flex-shrink-0 text-white font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl transition-all tracking-wide shadow-lg"
              style={{ background: ORANGE }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ORANGE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ORANGE)}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* SLIDE DOTS */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((b, i) => (
          <button
            key={b.id}
            onClick={() => jumpTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "w-6 h-2" : "w-2 h-2 bg-white/30 hover:bg-white/60"
            }`}
            style={i === current ? { background: ORANGE } : {}}
          />
        ))}
      </div>
    </section>
  );
}
