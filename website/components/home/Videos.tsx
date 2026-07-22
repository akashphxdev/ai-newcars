"use client";
import { useState } from "react";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";

type Video = {
  title: string;
  channel: string;
  duration: string;
  views: string;
  date: string;
  thumb: string;
  badge?: string;
};

const ORANGE = "#f2650f";
const SURFACE = "#f4f5f9";
const BORDER = "#e5e7eb";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EThumbnail unavailable%3C/text%3E%3C/svg%3E";

const VIDEOS: Video[] = [
  {
    title: "Tata Sierra vs Mahindra Scorpio-N — Real World Comparison",
    channel: "TimesAuto Reviews",
    duration: "12:47",
    views: "184K views",
    date: "3 days ago",
    thumb: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop",
    badge: "New",
  },
  {
    title: "Hyundai Creta EV: First Drive Review — Is It Worth the Wait?",
    channel: "TimesAuto Reviews",
    duration: "9:32",
    views: "97K views",
    date: "1 week ago",
    thumb: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Tata Nexon Walkaround — Every Feature Explained",
    channel: "TimesAuto Walkarounds",
    duration: "15:10",
    views: "212K views",
    date: "2 weeks ago",
    thumb: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1200&auto=format&fit=crop",
    badge: "Trending",
  },
  {
    title: "Mahindra XEV 9e — 500 km Range Test, City vs Highway",
    channel: "TimesAuto Reviews",
    duration: "18:04",
    views: "156K views",
    date: "3 weeks ago",
    thumb: "https://images.unsplash.com/photo-1617470702761-2bb9c41523c5?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Top 5 Sub-₹10 Lakh Cars With the Best Mileage in 2026",
    channel: "TimesAuto Explains",
    duration: "7:55",
    views: "301K views",
    date: "1 month ago",
    thumb: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop",
  },
];

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-6 translate-x-0.5">
    <path d="M8 5v14l11-7Z" />
  </svg>
);

const Thumb = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  return <img src={imgSrc} alt={alt} loading="lazy" onError={() => setImgSrc(FALLBACK_IMG)} className={className} />;
};

const Card = ({ video }: { video: Video }) => (
  <a
    href="#"
    className="group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:hover:translate-y-0"
    style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(17,24,39,0.04)", outlineColor: ORANGE }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 14px 30px rgba(17,24,39,0.12)")}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,24,39,0.04)")}
  >
    <div className="relative aspect-video overflow-hidden" style={{ background: SURFACE }}>
      <Thumb
        src={video.thumb}
        alt={video.title}
        className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div className="absolute inset-0 bg-ink/10 transition-colors group-hover:bg-ink/25" />
      <div
        className="pointer-events-none absolute inset-0 rounded-t-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 2px ${ORANGE}` }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="flex size-11 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform duration-300 group-hover:scale-110"
          style={{ color: ORANGE }}
        >
          <PlayIcon />
        </span>
      </div>

      <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {video.duration}
      </span>

      {video.badge && (
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white"
          style={{ background: ORANGE }}
        >
          {video.badge}
        </span>
      )}
    </div>

    <div className="flex flex-1 flex-col gap-1.5 p-3.5">
      <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">{video.title}</h3>
      <p className="text-[11px] font-semibold" style={{ color: ORANGE }}>
        {video.channel}
      </p>
      <p className="mt-auto text-[10.5px] text-faint">
        {video.views} · {video.date}
      </p>
    </div>
  </a>
);

export default function Videos() {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <section id="videos" className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Watch & Learn"
          title="Latest videos"
          subtitle="Walkarounds, comparisons, and first drives from the TimesAuto team"
          href="#"
          linkLabel="View all videos"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollBy("left")}
              onRight={() => scrollBy("right")}
            />
          }
        />

        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        >
          {VIDEOS.map((video) => (
            <Card key={video.title} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
}