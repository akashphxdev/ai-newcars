"use client";
import { useState, useEffect, useRef } from "react";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import { CloseIcon } from "@/components/common/icons";

type Story = {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  img: string;
};

const ORANGE = "#f2650f";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const STORIES: Story[] = [
  {
    title: "Why India's small-SUV war is about to get a lot more interesting",
    excerpt: "Four new launches in three months are rewriting the sub-4m SUV segment, and the price gaps are closing fast.",
    category: "Analysis",
    readTime: "6 min read",
    date: "18 Jun 2026",
    img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Fuel prices hold steady for a third straight week",
    excerpt: "Petrol and diesel rates stay flat across major cities as crude prices stabilise.",
    category: "News",
    readTime: "2 min read",
    date: "20 Jun 2026",
    img: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "We drove the XEV 9e for a week. Here's what surprised us",
    excerpt: "Real-world range, charging stops, and the one feature we didn't expect to love.",
    category: "Road Test",
    readTime: "8 min read",
    date: "17 Jun 2026",
    img: "https://images.unsplash.com/photo-1617470702761-2bb9c41523c5?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "New safety norms could delay three upcoming launches",
    excerpt: "Stricter crash-test rules from next year are pushing automakers to rework timelines.",
    category: "News",
    readTime: "4 min read",
    date: "16 Jun 2026",
    img: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Used car prices are finally cooling off. Here's why",
    excerpt: "Resale values for popular hatchbacks have dropped for the first time in two years.",
    category: "Market",
    readTime: "5 min read",
    date: "14 Jun 2026",
    img: "https://images.unsplash.com/photo-1568844293986-8d0400bd55b9?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Six things every first-time car buyer gets wrong",
    excerpt: "From ignoring resale value to skipping the test drive at night — the mistakes we see most often.",
    category: "Guide",
    readTime: "5 min read",
    date: "12 Jun 2026",
    img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Diesel is quietly making a comeback in the SUV segment",
    excerpt: "Buyers are returning to diesel for highway-heavy use cases, reversing a three-year decline.",
    category: "Market",
    readTime: "4 min read",
    date: "10 Jun 2026",
    img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Inside the plant building India's best-selling hatchback",
    excerpt: "A look at the production line that ships one car every 40 seconds during peak shifts.",
    category: "Feature",
    readTime: "7 min read",
    date: "8 Jun 2026",
    img: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "How insurance premiums are calculated, explained simply",
    excerpt: "IDV, NCB, and add-ons — the terms on your policy paper, decoded in plain language.",
    category: "Guide",
    readTime: "6 min read",
    date: "6 Jun 2026",
    img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "The road trip that convinced us EVs are ready for highways",
    excerpt: "800 km, four charging stops, zero range anxiety — our notes from a Delhi-to-Manali run.",
    category: "Road Test",
    readTime: "9 min read",
    date: "4 Jun 2026",
    img: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=1200&auto=format&fit=crop",
  },
];

const SLIDE_MS = 6000;

const StoryImage = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  return <img src={imgSrc} alt={alt} loading="lazy" onError={() => setImgSrc(FALLBACK_IMG)} className={className} />;
};

// Full-screen viewer. Background is a blurred collage of the previous,
// current, and next story photos — with a single sharp image card floating
// on top holding just a title and one line of description. No badges, no
// author row, no extra chrome.
const StoryViewer = ({ startIndex, onClose }: { startIndex: number; onClose: () => void }) => {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const story = STORIES[index];
  const prevStory = STORIES[(index - 1 + STORIES.length) % STORIES.length];
  const nextStory = STORIES[(index + 1) % STORIES.length];

  const goTo = (next: number) => {
    if (next < 0) return;
    if (next >= STORIES.length) {
      onClose();
      return;
    }
    setIndex(next);
    setProgress(0);
    startRef.current = Date.now();
  };

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (paused) return;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / SLIDE_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goTo(index + 1);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-0 sm:p-4">
      <div
        className="relative h-full w-full max-w-md overflow-hidden bg-ink sm:h-[88vh] sm:rounded-2xl"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* ambient background: a collage of neighbouring story photos, blurred + darkened */}
        <div className="absolute inset-0 grid grid-cols-3">
          <StoryImage src={prevStory.img} alt="" className="size-full object-cover" />
          <StoryImage src={story.img} alt="" className="size-full object-cover" />
          <StoryImage src={nextStory.img} alt="" className="size-full object-cover" />
        </div>
        <div className="absolute inset-0 backdrop-blur-2xl bg-black/45" />

        {/* prev / next tap zones, sit under the header so the close button stays clickable */}
        <button
          aria-label="Previous story"
          className="absolute inset-y-0 left-0 z-10 w-1/3"
          onClick={() => goTo(index - 1)}
        />
        <button
          aria-label="Next story"
          className="absolute inset-y-0 right-0 z-10 w-1/3"
          onClick={() => goTo(index + 1)}
        />

        {/* header: progress + close, always on top and clickable */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex gap-1.5">
          {STORIES.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                  transition: i === index ? "none" : "width 150ms linear",
                  background: ORANGE,
                }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="pointer-events-auto absolute right-3 top-7 z-20 rounded-full bg-black/30 p-1.5 text-white/90 backdrop-blur-sm transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: ORANGE }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* foreground: sharp image card + title + description, nothing else */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center gap-5 px-6 pt-10">
          <div
            className="w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15"
            style={{ maxHeight: "48vh" }}
          >
            <StoryImage src={story.img} alt={story.title} className="aspect-[4/3] w-full object-cover" />
          </div>

          <div className="flex w-full flex-col gap-2 text-center">
            <h2 className="text-xl font-black leading-tight text-white">{story.title}</h2>
            <p className="mx-auto max-w-[32ch] text-sm leading-relaxed text-white/75">{story.excerpt}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Editorial card: photo on top, content in a plain white panel below — the
// same structure as a print front page or a proper news site rail, not a
// text-on-image tile. No hover motion, no color-shifting borders; it reads
// as calm, static, and professional at rest.
const Card = ({ story, onOpen }: { story: Story; onOpen: () => void }) => (
  <article
    onClick={onOpen}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onOpen()}
    className="group relative aspect-[3/4] w-[196px] shrink-0 cursor-pointer overflow-hidden rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    style={{ outlineColor: ORANGE }}
  >
    <StoryImage src={story.img} alt={story.title} className="absolute inset-0 size-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />

    <span
      className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="ml-0.5 size-4" fill={ORANGE}>
        <path d="M8 5.14v13.72c0 .53.6.85 1.05.56l10.6-6.86a.67.67 0 0 0 0-1.12L9.05 4.58A.67.67 0 0 0 8 5.14z" />
      </svg>
    </span>

    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
      <div className="flex items-center gap-1.5">
        <span className="size-1 rounded-full" style={{ background: ORANGE }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ORANGE }}>
          {story.category}
        </span>
      </div>
      <h3 className="line-clamp-2 text-[14px] font-black leading-snug text-white">{story.title}</h3>
      <p className="text-[10.5px] font-semibold text-white/60">
        {story.date} · {story.readTime}
      </p>
    </div>
  </article>
);

export default function Stories() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <section className="bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="From The Newsroom"
          title="Stories"
          subtitle="Tap through news, road tests, and analysis in a minute"
          href="#"
          linkLabel="View all stories"
          after={
            <ScrollArrows
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onLeft={() => scrollBy("left")}
              onRight={() => scrollBy("right")}
            />
          }
        />

        <div ref={trackRef} onScroll={updateArrows} className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
          {STORIES.map((story, i) => (
            <Card key={story.title} story={story} onOpen={() => setOpenIndex(i)} />
          ))}
        </div>
      </div>    

      {openIndex !== null && <StoryViewer startIndex={openIndex} onClose={() => setOpenIndex(null)} />}
    </section>
  );
}