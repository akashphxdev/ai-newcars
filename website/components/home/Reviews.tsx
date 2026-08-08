"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BoltIcon,
  ClockIcon,
  CloseIcon,
  CompareIcon,
  EditIcon,
  FuelIcon,
  GaugeIcon,
  SeatIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
} from "@/components/common/icons";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { submitTestimonial } from "@/features/testimonials/testimonial.api";
import type { Testimonial } from "@/features/testimonials/testimonial.types";

const FILTERS = ["All reviews", "5 Star", "4 Star", "3 Star & below"] as const;
const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function ratingOf(testimonial: Testimonial): number {
  const value = Number(testimonial.rating ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function StarRow({ rating, size = "size-3.5" }: { rating: number; size?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} filled={index < Math.round(rating)} className={`${size} ${index < Math.round(rating) ? "text-brand" : "text-border"}`} />
      ))}
    </span>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  if (photoUrl && !failed) {
    return (
      <span className="relative block size-12 shrink-0 overflow-hidden rounded-full bg-page">
        <Image src={photoUrl} alt={name} fill sizes="48px" onError={() => setFailed(true)} className="object-cover" />
      </span>
    );
  }
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-extrabold text-brand">
      {name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
    </span>
  );
}

function ReviewCard({ testimonial }: { testimonial: Testimonial }) {
  const [helpful, setHelpful] = useState(false);
  const rating = ratingOf(testimonial);
  return (
    <article className="flex min-h-[390px] w-[310px] shrink-0 snap-start flex-col rounded-[8px] border border-border bg-white p-6 shadow-[0_18px_50px_-44px_rgba(17,24,39,0.6)] sm:w-[330px] xl:w-[calc((100%-32px)/3)]">
      <div className="flex items-start justify-between">
        <span aria-hidden className="font-serif text-[54px] font-black leading-none text-brand">“</span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
          <ShieldIcon className="size-4" /> Verified
        </span>
      </div>
      <p className="mt-3 line-clamp-6 text-[14px] leading-7 text-ink">{testimonial.quote}</p>

      <div className="mt-auto border-t border-border-soft pt-5">
        <div className="flex items-center gap-3">
          <Avatar name={testimonial.customerName} photoUrl={testimonial.photoUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="truncate text-[13px] font-extrabold text-ink">{testimonial.customerName}</p>
              <StarRow rating={rating} size="size-3" />
            </div>
            <p className="mt-1 truncate text-[11px] text-muted">{testimonial.customerCity ?? "Verified owner"}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] text-subtle">
          <span>{DATE_FMT.format(new Date(testimonial.createdAt))}</span>
          <button type="button" onClick={() => setHelpful((value) => !value)} className={`cursor-pointer font-bold transition-colors ${helpful ? "text-brand" : "text-muted hover:text-ink"}`}>
            {helpful ? "Marked helpful" : "Helpful?"}
          </button>
        </div>
      </div>
    </article>
  );
}

function RatingSummary({ overallRating, totalReviews, distribution }: { overallRating: number; totalReviews: number; distribution: number[] }) {
  return (
    <div className="mt-8 rounded-[8px] border border-border bg-surface p-6 sm:p-7">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-head text-[48px] font-extrabold leading-none text-ink sm:text-[54px]">{overallRating ? overallRating.toFixed(1) : "-"}</span>
        <div><StarRow rating={overallRating} size="size-5" /><p className="mt-2 text-[11px] text-muted">average owner rating</p></div>
      </div>
      <div className="mt-7 space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const percent = totalReviews ? Math.round((distribution[star] / totalReviews) * 100) : 0;
          return (
            <div key={star} className="grid grid-cols-[42px_minmax(0,1fr)_36px] items-center gap-3">
              <span className="text-[11px] text-muted">{star} Star</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-page"><span className="block h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${percent}%` }} /></span>
              <span className="text-right text-[11px] font-bold text-muted">{percent}%</span>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-[10.5px] text-muted">Based on {totalReviews.toLocaleString("en-IN")} approved owner review{totalReviews === 1 ? "" : "s"}</p>
    </div>
  );
}

function Insight({ icon, title, value, text }: { icon: React.ReactNode; title: string; value?: string; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
      <span className="flex size-9 shrink-0 items-center justify-center text-muted">{icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2"><p className="truncate text-[11.5px] font-bold text-ink">{title}</p>{value && <span className="text-[11px] font-extrabold text-emerald-700">{value}</span>}</div>
        <p className="mt-1 truncate text-[10px] text-muted">{text}</p>
      </div>
    </div>
  );
}

function TrustPoint({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-5 sm:px-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[7px] bg-brand-soft text-brand">{icon}</span>
      <div><p className="text-[11.5px] font-bold text-ink">{title}</p><p className="mt-1 text-[10px] text-muted">{text}</p></div>
    </div>
  );
}

function WriteReviewForm({ onClose }: { onClose: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitTestimonial({ customerName, customerCity: customerCity.trim() || undefined, rating, quote });
      setDone(true);
    } catch {
      setError("We could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="review-form-title">
      <div className="w-full max-w-[480px] rounded-[8px] border border-border bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Owner feedback</p><h3 id="review-form-title" className="mt-2 font-head text-[24px] font-extrabold text-ink">{done ? "Review submitted" : "Write a review"}</h3></div>
          <button type="button" onClick={onClose} aria-label="Close review form" className="flex size-9 cursor-pointer items-center justify-center rounded-[7px] border border-border text-muted hover:text-ink"><CloseIcon className="size-4" /></button>
        </div>
        {done ? (
          <div className="mt-7 rounded-[7px] bg-ev-soft p-5"><p className="text-sm leading-6 text-ink">Your review will appear after the editorial team verifies it.</p><button type="button" onClick={onClose} className="mt-5 min-h-11 rounded-[7px] bg-brand px-5 text-[12px] font-bold text-white">Close</button></div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" className="min-h-12 rounded-[7px] border border-border px-3.5 text-sm text-ink outline-none focus:border-brand" />
              <input value={customerCity} onChange={(event) => setCustomerCity(event.target.value)} placeholder="Your city (optional)" className="min-h-12 rounded-[7px] border border-border px-3.5 text-sm text-ink outline-none focus:border-brand" />
            </div>
            <div className="flex items-center justify-between rounded-[7px] border border-border px-3.5 py-3">
              <span className="text-[12px] font-bold text-ink">Your rating</span>
              <div className="flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} star rating`} className="cursor-pointer"><StarIcon filled={value <= rating} className={`size-5 ${value <= rating ? "text-brand" : "text-border"}`} /></button>)}</div>
            </div>
            <textarea required minLength={5} maxLength={500} value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="Share your ownership experience" rows={5} className="w-full resize-none rounded-[7px] border border-border px-3.5 py-3 text-sm leading-6 text-ink outline-none focus:border-brand" />
            <div className="flex items-center justify-between text-[10px] text-muted"><span>Reviews are checked before publishing.</span><span>{quote.length}/500</span></div>
            {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className="min-h-12 w-full cursor-pointer rounded-[7px] bg-brand px-5 text-[13px] font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Submitting..." : "Submit review"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Reviews({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All reviews");
  const [showForm, setShowForm] = useState(false);
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  const summary = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0, 0];
    let ratingTotal = 0;
    let ratedCount = 0;
    testimonials.forEach((testimonial) => {
      const rating = ratingOf(testimonial);
      if (!rating) return;
      const rounded = Math.max(1, Math.min(5, Math.round(rating)));
      distribution[rounded] += 1;
      ratingTotal += rating;
      ratedCount += 1;
    });
    return { overallRating: ratedCount ? ratingTotal / ratedCount : 0, totalReviews: testimonials.length, distribution };
  }, [testimonials]);

  const visibleTestimonials = useMemo(() => testimonials.filter((testimonial) => {
    if (activeFilter === "All reviews") return true;
    const rating = Math.round(ratingOf(testimonial));
    if (activeFilter === "5 Star") return rating === 5;
    if (activeFilter === "4 Star") return rating === 4;
    return rating <= 3;
  }), [activeFilter, testimonials]);

  useEffect(() => {
    updateArrows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTestimonials.length]);

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1536px] px-5 sm:px-8 xl:px-10 2xl:px-0">
        <div className="grid gap-10 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[440px_minmax(0,1fr)] xl:gap-16">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand sm:text-[12px]"><span className="flex size-7 items-center justify-center rounded-[7px] bg-brand-soft"><ShieldIcon className="size-4" /></span>Owner reviews & trust</p>
            <h2 className="mt-6 max-w-[440px] text-balance font-head text-[40px] font-extrabold leading-[1.03] text-ink sm:text-[49px] xl:text-[54px]">Real owners.<br />Clearer decisions.</h2>
            <p className="mt-5 max-w-[420px] text-[15px] leading-7 text-muted">Verified feedback and transparent ratings help you choose with more confidence.</p>
            <RatingSummary overallRating={summary.overallRating} totalReviews={summary.totalReviews} distribution={summary.distribution} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="scrollbar-none flex min-w-0 gap-2 overflow-x-auto pb-1">
                {FILTERS.map((filter) => {
                  const active = filter === activeFilter;
                  return <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`min-h-11 shrink-0 cursor-pointer rounded-[7px] border px-5 text-[12px] font-bold transition-colors ${active ? "border-brand bg-brand-soft text-brand" : "border-border bg-white text-ink hover:border-faint"}`}>{filter}</button>;
                })}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ScrollArrows canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onLeft={() => scrollBy("left")} onRight={() => scrollBy("right")} />
                <button type="button" onClick={() => setShowForm(true)} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[7px] bg-brand px-5 text-[12px] font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-brand-hover active:translate-y-0"><EditIcon className="size-4" />Write a review</button>
              </div>
            </div>

            {visibleTestimonials.length ? (
              <div ref={trackRef} onScroll={updateArrows} className="scrollbar-none mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                {visibleTestimonials.map((testimonial) => <ReviewCard key={testimonial.id} testimonial={testimonial} />)}
              </div>
            ) : (
              <div className="mt-8 flex min-h-[390px] flex-col items-center justify-center rounded-[8px] border border-dashed border-faint bg-page px-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand"><EditIcon className="size-5" /></span>
                <h3 className="mt-5 font-head text-xl font-extrabold text-ink">No reviews in this rating yet</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted">Choose another rating or share the first approved owner review.</p>
                <button type="button" onClick={() => setShowForm(true)} className="mt-5 min-h-11 rounded-[7px] bg-brand px-5 text-[12px] font-bold text-white">Write a review</button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 grid rounded-[8px] border border-border bg-page sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:divide-x lg:divide-border-soft">
          <Insight icon={<GaugeIcon className="size-5 text-brand" />} title="Owner insights at a glance" value={summary.overallRating ? `${summary.overallRating.toFixed(1)}/5` : undefined} text="Summary from approved reviews" />
          <Insight icon={<SeatIcon className="size-5" />} title="Everyday comfort" text="Owner-reported experience" />
          <Insight icon={<FuelIcon className="size-5" />} title="Running costs" text="Real ownership context" />
          <Insight icon={<ClockIcon className="size-5" />} title="Service experience" text="Long-term feedback" />
        </div>

        <div className="mt-7 grid border-y border-border-soft sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border-soft">
          <TrustPoint icon={<ShieldIcon className="size-5" />} title="Verified submissions" text="Reviews checked before publishing" />
          <TrustPoint icon={<BoltIcon className="size-5" />} title="Clear summaries" text="Ratings made easier to scan" />
          <TrustPoint icon={<TagIcon className="size-5" />} title="Price guidance" text="Ownership context beyond specs" />
          <TrustPoint icon={<CompareIcon className="size-5" />} title="Compare easily" text="Use owner ratings side by side" />
        </div>
      </div>
      {showForm && <WriteReviewForm onClose={() => setShowForm(false)} />}
    </section>
  );
}
