"use client"
import { useState, useEffect, useRef } from "react";

type Story = {
  title: string;
  excerpt: string;
  body: string[];
  category: string;
  readTime: string;
  date: string;
  author: string;
  img: string;
  badge?: string;
};

const STORIES: Story[] = [
  {
    title: "Why India's small-SUV war is about to get a lot more interesting",
    excerpt: "Four new launches in three months are rewriting the sub-4m SUV segment, and the price gaps are closing fast.",
    body: [
      "Four new launches in three months are rewriting the sub-4m SUV segment, and the price gaps between rivals are closing fast.",
      "What started as a two-horse race between the Nexon and the Venue has turned into a crowded field, with at least three automakers readying refreshed models before the festive season.",
      "The biggest shift is in pricing. Base-to-top spreads have narrowed by nearly 15% over the last year as brands chase volume in India's most competitive segment.",
    ],
    category: "Analysis",
    readTime: "6 min read",
    date: "18 Jun 2026",
    author: "Aditi Rao",
    img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1200&auto=format&fit=crop",
    badge: "Featured",
  },
  {
    title: "Fuel prices hold steady for a third straight week",
    excerpt: "Petrol and diesel rates stay flat across major cities as crude prices stabilise.",
    body: [
      "Petrol and diesel rates stayed flat across major Indian cities this week, marking the third consecutive week without a revision.",
      "Oil marketing companies have held prices steady even as global crude benchmarks fluctuated within a narrow band.",
      "Analysts expect prices to remain range-bound through the month unless crude moves decisively higher.",
    ],
    category: "News",
    readTime: "2 min read",
    date: "20 Jun 2026",
    author: "Karan Mehta",
    img: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop",
    badge: "Breaking",
  },
  {
    title: "We drove the XEV 9e for a week. Here's what surprised us",
    excerpt: "Real-world range, charging stops, and the one feature we didn't expect to love.",
    body: [
      "We spent a week with Mahindra's XEV 9e in daily mixed driving — city commutes, one highway run, and a lot of stop-start traffic.",
      "Claimed range is 542 km, and we saw a real-world figure closer to 470 km, a smaller drop-off than most EVs in this class.",
      "The feature that won us over wasn't the screen — it was the regenerative braking, tuned naturally enough that we stopped thinking about it within a day.",
    ],
    category: "Road Test",
    readTime: "8 min read",
    date: "17 Jun 2026",
    author: "Aditi Rao",
    img: "https://images.unsplash.com/photo-1617470702761-2bb9c41523c5?q=80&w=1200&auto=format&fit=crop",
    badge: "Must Read",
  },
  {
    title: "New safety norms could delay three upcoming launches",
    excerpt: "Stricter crash-test rules from next year are pushing automakers to rework timelines.",
    body: [
      "Stricter crash-test requirements set to take effect next year are pushing at least three automakers to rework their launch timelines.",
      "The revised norms raise the bar for side-impact protection, requiring structural changes beyond a simple trim update.",
      "Two affected models were originally slated for a festive-season launch; both are now expected to slip into the new year.",
    ],
    category: "News",
    readTime: "4 min read",
    date: "16 Jun 2026",
    author: "Karan Mehta",
    img: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop",
    badge: "In-Depth",
  },
  {
    title: "Used car prices are finally cooling off. Here's why",
    excerpt: "Resale values for popular hatchbacks have dropped for the first time in two years.",
    body: [
      "Resale values for popular hatchbacks have dropped for the first time in two years, according to data from used-car platforms.",
      "The correction follows a steady rise in new-car supply, which had been constrained and pushed buyers toward the used market.",
      "Sellers holding out for last year's prices may need to adjust expectations, particularly for high-mileage variants.",
    ],
    category: "Market",
    readTime: "5 min read",
    date: "14 Jun 2026",
    author: "Priya Nair",
    img: "https://images.unsplash.com/photo-1568844293986-8d0400bd55b9?q=80&w=1200&auto=format&fit=crop",
    badge: "Analysis",
  },
];

const SLIDE_MS = 6000;

const StoryViewer = ({ startIndex, onClose }: { startIndex: number; onClose: () => void }) => {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0); // ✅ 0 se initialize karo

  const story = STORIES[index];

  const goTo = (next: number) => {
    if (next < 0) return;
    if (next >= STORIES.length) {
      onClose();
      return;
    }
    setIndex(next);
    setProgress(0);
    startRef.current = Date.now(); // ✅ yeh valid hai — render mein nahi hai
  };

  // ✅ Mount hone pe timer start karo
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 sm:p-4">
      <div
        className="relative h-full w-full max-w-md overflow-hidden bg-gray-900 sm:h-[88vh] sm:rounded-2xl"
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
          {STORIES.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                  transition: i === index ? "none" : "width 150ms linear",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute inset-x-3 top-7 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              {story.category}
            </span>
            {story.badge && (
              <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                {story.badge}
              </span>
            )}
            <span className="text-[11px] font-semibold text-white/70">{story.author}</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/80 hover:text-white" aria-label="Close">
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <img src={story.img} alt={story.title} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-black/0" />

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 pb-7">
          <h2 className="text-xl font-black leading-tight text-white">{story.title}</h2>
          <div className="flex flex-col gap-2.5">
            {story.body.map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-white/85">
                {para}
              </p>
            ))}
          </div>
          <p className="pt-1 text-xs font-semibold text-white/50">
            {story.date} · {story.readTime}
          </p>
        </div>

        {/* Tap zones */}
        <button
          aria-label="Previous story"
          className="absolute inset-y-0 left-0 w-1/3"
          onClick={() => goTo(index - 1)}
        />
        <button
          aria-label="Next story"
          className="absolute inset-y-0 right-0 w-1/3"
          onClick={() => goTo(index + 1)}
        />
      </div>
    </div>
  );
};

// ✅ Fix: outer element div hai, button nahi — nested button error gone
const Card = ({ story, onOpen }: { story: Story; onOpen: () => void }) => (
  <div
    onClick={onOpen}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onOpen()}
    className="group flex w-[180px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl bg-white text-left ring-1 ring-gray-200 transition-shadow duration-300 hover:shadow-lg sm:w-[15.5vw] sm:min-w-[200px] sm:max-w-[260px]"
  >
    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
      <img
        src={story.img}
        alt={story.title}
        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />

      <div className="absolute left-2 top-2">
        <span className="inline-block rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-gray-900">
          {story.category}
        </span>
        {story.badge && (
          <span className="ml-1 inline-block rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
            {story.badge}
          </span>
        )}
      </div>

      {/* ✅ Ab yeh button valid hai — div ke andar button allowed hai */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2 top-2 rounded-full bg-white p-1 transition-colors hover:bg-gray-100"
        aria-label="Save story"
      >
        <svg className="size-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        </svg>
      </button>
    </div>

    <div className="flex flex-1 flex-col gap-1 p-3">
      <h3 className="line-clamp-2 text-xs font-black leading-snug text-gray-900">{story.title}</h3>
      <p className="line-clamp-2 text-[10px] leading-relaxed text-gray-600">{story.excerpt}</p>
      <div className="mt-auto flex flex-col gap-0.5 pt-2 text-[9px] font-semibold text-gray-500">
        <span>{story.author}</span>
        <span>{story.date} · {story.readTime}</span>
      </div>
    </div>
  </div>
);

export default function Stories() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-600">From The Newsroom</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Stories</h2>
            <p className="mt-1 text-xs text-gray-500">
              News, road tests, and analysis from the team that watches the Indian auto market every day
            </p>
          </div>
          <a href="#" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 hover:text-red-600">
            View all stories
            <svg className="size-3" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M8 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 sm:px-[max(1rem,calc((100vw-80rem)/2+1rem))] [scrollbar-width:thin]">
        {STORIES.map((story, i) => (
          <Card key={story.title} story={story} onOpen={() => setOpenIndex(i)} />
        ))}
      </div>

      {openIndex !== null && (
        <StoryViewer startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </section>
  );
}