"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { StarIcon, CloseIcon } from "@/components/common/icons";
import { submitTestimonial } from "@/features/testimonials/testimonial.api";
import type { Testimonial } from "@/features/testimonials/testimonial.types";

const FILTERS = ["All Reviews", "5 Star", "4 Star", "3 Star & below"] as const;

const ORANGE = "#f2650f";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const PAGE_BG = "#f4f5f9";
const PEACH = "#fde3d3";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Brand-orange stars (not the amber ones common/CardBits' StarRow uses
// elsewhere) — Reviews' rating chip is intentionally orange-themed, so
// this stays a local wrapper around the shared StarIcon.
const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <StarIcon key={i} filled={i < Math.round(rating)} className={`size-3.5 ${i < Math.round(rating) ? "text-brand" : "text-border"}`} />
    ))}
  </div>
);

const QuoteMark = () => (
  <svg width="26" height="26" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path
      d="M16.6 8.3c-5.6 2-9.4 7.2-9.4 13.4 0 5.1 3.3 8.6 7.5 8.6 3.7 0 6.5-2.9 6.5-6.4 0-3.4-2.4-6-5.7-6-.5 0-1 .1-1.4.2.6-4 3.6-6.9 6.9-8.1l-3.4-1.7Zm17 0c-5.6 2-9.4 7.2-9.4 13.4 0 5.1 3.3 8.6 7.5 8.6 3.7 0 6.5-2.9 6.5-6.4 0-3.4-2.4-6-5.7-6-.5 0-1 .1-1.4.2.6-4 3.6-6.9 6.9-8.1l-3.4-1.7Z"
      fill={ORANGE}
    />
  </svg>
);

const Avatar = ({ name, photoUrl }: { name: string; photoUrl: string | null }) => {
  if (photoUrl) {
    return (
      <span className="relative block size-11 shrink-0 overflow-hidden rounded-full">
        <Image src={photoUrl} alt={name} fill sizes="44px" className="object-cover" />
      </span>
    );
  }
  return (
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
};

const ReviewCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const [helpful, setHelpful] = useState(false);
  const rating = testimonial.rating ? Number(testimonial.rating) : 0;

  return (
    <div
      className="flex h-full w-[300px] shrink-0 snap-start flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 sm:w-[320px]"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <QuoteMark />

      <p className="text-[13.5px] leading-relaxed" style={{ color: DARK }}>
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      <div className="mt-auto flex items-center justify-between border-t pt-3.5" style={{ borderColor: "#f0f1f4" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={testimonial.customerName} photoUrl={testimonial.photoUrl} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold" style={{ color: DARK }}>
              {testimonial.customerName}
            </p>
            {testimonial.customerCity && (
              <p className="truncate text-[11px] font-medium" style={{ color: MUTED }}>
                {testimonial.customerCity}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StarRow rating={rating} />
          <span className="text-[9.5px] font-medium" style={{ color: "#9ca3af" }}>
            {DATE_FMT.format(new Date(testimonial.createdAt))}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end border-t pt-3" style={{ borderColor: "#f0f1f4" }}>
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

// Inline "write your own review" form — posts to the public
// features/testimonials/testimonial.api.ts, which lands as a "pending"
// row until an admin approves it (won't appear here immediately).
const WriteReviewForm = ({ onClose }: { onClose: () => void }) => {
  const [customerName, setCustomerName] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitTestimonial({
        customerName,
        customerCity: customerCity.trim() || undefined,
        rating,
        quote,
      });
      setDone(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6" style={{ border: `1px solid ${BORDER}` }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: DARK }}>
            {done ? "Thank you!" : "Write a Review"}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" style={{ color: MUTED }}>
            <CloseIcon />
          </button>
        </div>

        {done ? (
          <p className="text-sm" style={{ color: MUTED }}>
            Your review has been submitted and will appear here once approved.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${BORDER}` }}
            />
            <input
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
              placeholder="Your city (optional)"
              className="rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${BORDER}` }}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: DARK }}>
                Rating
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`}>
                    <StarIcon filled={n <= rating} className={`size-5 ${n <= rating ? "text-brand" : "text-border"}`} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              required
              minLength={5}
              maxLength={500}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              className="rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ border: `1px solid ${BORDER}` }}
            />
            {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: ORANGE }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const AUTO_SCROLL_INTERVAL = 3000; // ms per card
const RESUME_AFTER_MANUAL = 4000; // ms before auto-scroll resumes after a manual click

export default function Reviews({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All Reviews");
  const [showForm, setShowForm] = useState(false);
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();
  const isPausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { overallRating, totalReviews } = useMemo(() => {
    if (testimonials.length === 0) return { overallRating: 0, totalReviews: 0 };
    const rated = testimonials.filter((t) => t.rating);
    const avg = rated.length ? rated.reduce((sum, t) => sum + Number(t.rating), 0) / rated.length : 0;
    return { overallRating: Math.round(avg * 10) / 10, totalReviews: testimonials.length };
  }, [testimonials]);

  const visibleTestimonials = useMemo(() => {
    if (activeFilter === "All Reviews") return testimonials;
    return testimonials.filter((t) => {
      const rating = t.rating ? Math.round(Number(t.rating)) : 0;
      if (activeFilter === "5 Star") return rating === 5;
      if (activeFilter === "4 Star") return rating === 4;
      return rating <= 3;
    });
  }, [testimonials, activeFilter]);

  const pauseAutoScrollTemporarily = () => {
    isPausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, RESUME_AFTER_MANUAL);
  };

  const handleArrowClick = (dir: "left" | "right") => {
    pauseAutoScrollTemporarily();
    scrollBy(dir);
  };

  // Auto-scroll: advance one card at a time, loop back to start at the end.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || visibleTestimonials.length === 0) return;

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      const first = el.children[0] as HTMLElement | undefined;
      const second = el.children[1] as HTMLElement | undefined;
      const step = first && second ? second.offsetLeft - first.offsetLeft : el.clientWidth * 0.8;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;

      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTestimonials.length]);

  return (
    <div style={{ background: PAGE_BG }}>
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Real Owner Feedback"
            title="Customer Reviews"
            subtitle="Honest feedback from real owners who've driven these cars every day."
            divider
            after={
              <>
                {totalReviews > 0 && (
                  <div className="hidden items-center gap-2 rounded-xl px-3.5 py-2 sm:flex" style={{ background: PEACH }}>
                    <span className="text-lg font-black" style={{ color: ORANGE }}>
                      {overallRating}
                    </span>
                    <StarRow rating={overallRating} />
                    <span className="text-[11px] font-semibold" style={{ color: DARK }}>
                      {totalReviews.toLocaleString("en-IN")} reviews
                    </span>
                  </div>
                )}
                <ScrollArrows
                  canScrollLeft={canScrollLeft}
                  canScrollRight={canScrollRight}
                  onLeft={() => handleArrowClick("left")}
                  onRight={() => handleArrowClick("right")}
                />
              </>
            }
          />

          {/* Filter chips scroll horizontally on mobile on their own —
              "Write a Review" stays outside that scroll area so it's
              always visible without having to scroll the chips. */}
          <div className="mb-7 flex items-center gap-2.5">
            <div className="scrollbar-none flex min-w-0 flex-1 flex-nowrap items-center gap-2.5 overflow-x-auto sm:flex-wrap">
              {FILTERS.map((f) => {
                const active = f === activeFilter;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActiveFilter(f)}
                    className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
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
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-[13px] font-bold transition-colors hover:bg-orange-50"
              style={{ border: `1.5px solid ${ORANGE}`, color: ORANGE }}
            >
              Write a Review
            </button>
          </div>

          {visibleTestimonials.length > 0 ? (
            <div
              onMouseEnter={() => (isPausedRef.current = true)}
              onMouseLeave={() => {
                if (!resumeTimeoutRef.current) isPausedRef.current = false;
              }}
            >
              <div
                ref={trackRef}
                onScroll={updateArrows}
                className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
              >
                {visibleTestimonials.map((testimonial) => (
                  <ReviewCard key={testimonial.id} testimonial={testimonial} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: MUTED }}>
              No reviews yet — be the first to share your experience.
            </p>
          )}
        </div>
      </section>

      {showForm && <WriteReviewForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
