"use client";
import { useEffect, useRef, useState } from "react";

type Review = {
  name: string;
  verified: boolean;
  car: string;
  rating: number;
  date: string;
  quote: string;
  ownership: string;
};

const REVIEWS: Review[] = [
  {
    name: "Rohit Sharma",
    verified: true,
    car: "Hyundai Creta 2023",
    rating: 5,
    date: "2 weeks ago",
    quote:
      "Driven it for 8 months now, mostly city plus a few highway trips. Mileage matches what the dealer promised and the cabin stays quiet even at 100+ km/h.",
    ownership: "8 months of ownership",
  },
  {
    name: "Ananya Desai",
    verified: true,
    car: "Tata Nexon EV 2024",
    rating: 4,
    date: "1 month ago",
    quote:
      "Range is genuinely close to claimed figures if you drive sensibly. My only complaint is finding fast chargers outside the city.",
    ownership: "1 year of ownership",
  },
  {
    name: "Vikram Singh",
    verified: false,
    car: "Maruti Suzuki Swift 2022",
    rating: 5,
    date: "3 weeks ago",
    quote:
      "Bought it as a second car for my wife's commute. Zero issues in two years, and service costs are the lowest among all the cars I've owned.",
    ownership: "2 years of ownership",
  },
  {
    name: "Priya Nair",
    verified: true,
    car: "Mahindra Scorpio-N 2023",
    rating: 4,
    date: "5 days ago",
    quote:
      "Love the ride height and how it handles bad roads. Just be ready for the fuel bills if you're doing a lot of city driving.",
    ownership: "6 months of ownership",
  },
  {
    name: "Sameer Khan",
    verified: true,
    car: "Kia Seltos 2023",
    rating: 4,
    date: "1 week ago",
    quote:
      "The panoramic sunroof and ventilated seats make a real difference on 6+ hour drives. Infotainment lags occasionally after an update.",
    ownership: "10 months of ownership",
  },
  {
    name: "Neha Gupta",
    verified: false,
    car: "Toyota Innova Crysta 2022",
    rating: 5,
    date: "4 days ago",
    quote:
      "Three years and two long road trips in, nothing has gone wrong beyond routine service. Resale value has also held up well.",
    ownership: "3 years of ownership",
  },
];

const FILTERS = ["All Reviews", "5 Star", "4 Star", "3 Star & below", "Verified Owners"];

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const PAGE_BG = "#f4f5f9";
const PEACH = "#fde3d3";

const ChevronIcon = ({ dir = "right" }: { dir?: "left" | "right" | "down" }) => (
  <svg
    className="size-3.5"
    viewBox="0 0 12 12"
    fill="none"
    style={{ transform: dir === "left" ? "rotate(180deg)" : dir === "down" ? "rotate(90deg)" : "none" }}
  >
    <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill={filled ? ORANGE : "none"}>
    <path
      d="m12 2.5 2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.7Z"
      stroke={filled ? ORANGE : "#d1d5db"}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <StarIcon key={i} filled={i < Math.round(rating)} />
    ))}
  </div>
);

const VerifiedBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
    <svg className="size-3" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2 14.5 4.2 17.8 3.8 18.6 7 21.5 8.6 20.4 11.8 21.5 15 18.6 16.6 17.8 19.8 14.5 19.4 12 21.6 9.5 19.4 6.2 19.8 5.4 16.6 2.5 15 3.6 11.8 2.5 8.6 5.4 7 6.2 3.8 9.5 4.2Z"
        fill="currentColor"
      />
      <path d="M8.5 12.2 11 14.7 15.5 9.8" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    Verified
  </span>
);

const QuoteMark = () => (
  <svg width="26" height="26" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path
      d="M16.6 8.3c-5.6 2-9.4 7.2-9.4 13.4 0 5.1 3.3 8.6 7.5 8.6 3.7 0 6.5-2.9 6.5-6.4 0-3.4-2.4-6-5.7-6-.5 0-1 .1-1.4.2.6-4 3.6-6.9 6.9-8.1l-3.4-1.7Zm17 0c-5.6 2-9.4 7.2-9.4 13.4 0 5.1 3.3 8.6 7.5 8.6 3.7 0 6.5-2.9 6.5-6.4 0-3.4-2.4-6-5.7-6-.5 0-1 .1-1.4.2.6-4 3.6-6.9 6.9-8.1l-3.4-1.7Z"
      fill={ORANGE}
    />
  </svg>
);

const Avatar = ({ name }: { name: string }) => (
  <span
    className="flex size-11 shrink-0 items-center justify-center rounded-full text-[12px] font-black"
    style={{ background: PEACH, color: ORANGE }}
  >
    {name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")}
  </span>
);

const ReviewCard = ({ review }: { review: Review }) => {
  const [helpful, setHelpful] = useState(false);

  return (
    <div
      className="flex h-full w-[300px] shrink-0 snap-start flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 sm:w-[320px]"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <QuoteMark />

      <p className="text-[13.5px] leading-relaxed" style={{ color: DARK }}>
        "{review.quote}"
      </p>

      <div className="mt-auto flex items-center justify-between border-t pt-3.5" style={{ borderColor: "#f0f1f4" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={review.name} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[12.5px] font-bold" style={{ color: DARK }}>
                {review.name}
              </p>
              {review.verified && <VerifiedBadge />}
            </div>
            <p className="truncate text-[11px] font-medium" style={{ color: MUTED }}>
              {review.car}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StarRow rating={review.rating} />
          <span className="text-[9.5px] font-medium" style={{ color: "#9ca3af" }}>
            {review.date}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "#f0f1f4" }}>
        <p className="text-[10px] font-semibold" style={{ color: MUTED }}>
          {review.ownership}
        </p>
        <button
          type="button"
          onClick={() => setHelpful((h) => !h)}
          className="text-[10.5px] font-bold"
          style={{ color: helpful ? ORANGE : MUTED }}
        >
          {helpful ? "Helpful ✓" : "Helpful?"}
        </button>
      </div>
    </div>
  );
};

const OVERALL_RATING = 4.3;
const TOTAL_REVIEWS = 1842;
const AUTO_SCROLL_INTERVAL = 3000; // ms per card
const RESUME_AFTER_MANUAL = 4000; // ms before auto-scroll resumes after a manual click

export default function Reviews() {
  const [activeFilter, setActiveFilter] = useState("All Reviews");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCardStep = () => {
    const el = scrollerRef.current;
    if (!el || !el.firstElementChild) return 320;
    const card = el.firstElementChild as HTMLElement;
    const gap = 20; // matches gap-5
    return card.offsetWidth + gap;
  };

  const scrollByCards = (dir: "left" | "right", count = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = getCardStep();
    el.scrollBy({ left: dir === "left" ? -step * count : step * count, behavior: "smooth" });
  };

  const pauseAutoScrollTemporarily = () => {
    isPausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, RESUME_AFTER_MANUAL);
  };

  const handleArrowClick = (dir: "left" | "right") => {
    pauseAutoScrollTemporarily();
    scrollByCards(dir, 2);
  };

  // Auto-scroll: advance one card at a time, loop back to start at the end.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      const step = getCardStep();
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;

      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: PAGE_BG }}>
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div
            className="mb-7 flex flex-col gap-4 border-b pb-7 sm:flex-row sm:items-start sm:justify-between"
            style={{ borderColor: BORDER }}
          >
            <div>
              <h2 className="text-[32px] font-bold tracking-tight" style={{ color: DARK }}>
                Customer Reviews
              </h2>
              <span className="mt-2 mb-3 block h-[3px] w-10 rounded-full" style={{ background: ORANGE }} />
              <p className="max-w-md text-[14px] font-medium leading-relaxed" style={{ color: MUTED }}>
                Honest feedback from real owners who've driven these cars every day.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-2" style={{ background: PEACH }}>
                <span className="text-lg font-black" style={{ color: ORANGE }}>
                  {OVERALL_RATING}
                </span>
                <StarRow rating={OVERALL_RATING} />
                <span className="text-[11px] font-semibold" style={{ color: DARK }}>
                  {TOTAL_REVIEWS.toLocaleString("en-IN")} reviews
                </span>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-5 py-3 text-[13.5px] font-bold"
                style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}
              >
                View All Reviews
                <ChevronIcon />
              </button>
            </div>
          </div>

          <div className="mb-7 flex flex-wrap items-center gap-2.5">
            {FILTERS.map((f) => {
              const active = f === activeFilter;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className="rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
                  style={{
                    background: "#fff",
                    color: active ? ORANGE : DARK,
                    border: `1.5px solid ${active ? ORANGE : BORDER}`,
                  }}
                >
                  {f}
                </button>
              );
            })}
            <button
              type="button"
              className="ml-auto whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold transition-colors hover:bg-orange-50"
              style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
            >
              Write a Review
            </button>
          </div>

          <div
            className="relative"
            onMouseEnter={() => (isPausedRef.current = true)}
            onMouseLeave={() => {
              if (!resumeTimeoutRef.current) isPausedRef.current = false;
            }}
          >
            <div
              ref={scrollerRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {REVIEWS.map((review) => (
                <ReviewCard key={review.name} review={review} />
              ))}
            </div>

            <button
              type="button"
              aria-label="Previous reviews"
              onClick={() => handleArrowClick("left")}
              className="absolute left-[-18px] top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white lg:flex"
              style={{ boxShadow: "0 4px 12px rgba(17,24,39,0.12)", color: DARK }}
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              aria-label="Next reviews"
              onClick={() => handleArrowClick("right")}
              className="absolute right-[-18px] top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white lg:flex"
              style={{ boxShadow: "0 4px 12px rgba(17,24,39,0.12)", color: DARK }}
            >
              <ChevronIcon />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}