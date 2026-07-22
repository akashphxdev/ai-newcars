"use client";
import { useState } from "react";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";

type Article = {
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readTime: string;
  date: string;
  img: string;
  badge?: string;
};

const ORANGE = "#f2650f";
const SURFACE = "#f4f5f9";
const BORDER = "#e5e7eb";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const ARTICLES: Article[] = [
  {
    title: "10 Things to Check Before Buying a Used Car in 2026",
    excerpt: "A practical checklist covering paperwork, engine health, and the questions most first-time buyers forget to ask.",
    category: "Buying Guide",
    author: "Priya Nair",
    readTime: "7 min read",
    date: "16 Jul 2026",
    img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop",
    badge: "Editor's Pick",
  },
  {
    title: "Petrol vs Diesel vs Electric: What Actually Makes Sense in 2026",
    excerpt: "Running costs, resale value, and real ownership data compared across all three, city by city.",
    category: "Explainer",
    author: "Karan Mehta",
    readTime: "9 min read",
    date: "14 Jul 2026",
    img: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "How India's Crash Test Ratings Actually Work",
    excerpt: "A plain-English guide to Bharat NCAP star ratings and why two 5-star cars can still perform very differently.",
    category: "Explainer",
    author: "Aditi Rao",
    readTime: "6 min read",
    date: "10 Jul 2026",
    img: "https://images.unsplash.com/photo-1568844293986-8d0400bd55b9?q=80&w=1200&auto=format&fit=crop",
    badge: "Trending",
  },
  {
    title: "Car Insurance Renewal: 5 Add-ons Worth Paying For",
    excerpt: "Zero depreciation and engine protection make the list — a couple of popular ones surprisingly don't.",
    category: "Ownership",
    author: "Priya Nair",
    readTime: "5 min read",
    date: "07 Jul 2026",
    img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Festive Season 2026: The Best Time to Buy Is Closer Than You Think",
    excerpt: "Discounts historically peak in a specific two-week window — here's how to time your purchase.",
    category: "Market",
    author: "Karan Mehta",
    readTime: "4 min read",
    date: "02 Jul 2026",
    img: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1200&auto=format&fit=crop",
  },
];

const ArticleImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  return <img src={imgSrc} alt={alt} loading="lazy" onError={() => setImgSrc(FALLBACK_IMG)} className={className} />;
};

const Card = ({ article }: { article: Article }) => (
  <a
    href="#"
    className="group flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:hover:translate-y-0"
    style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(17,24,39,0.04)", outlineColor: ORANGE }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 14px 30px rgba(17,24,39,0.12)")}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,24,39,0.04)")}
  >
    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: SURFACE }}>
      <ArticleImage
        src={article.img}
        alt={article.title}
        className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
        <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide backdrop-blur-sm" style={{ color: ORANGE }}>
          {article.category}
        </span>
        {article.badge && (
          <span
            className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white"
            style={{ background: ORANGE }}
          >
            {article.badge}
          </span>
        )}
      </div>
    </div>

    <div className="flex flex-1 flex-col gap-2 p-3.5">
      <h3 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-ink">{article.title}</h3>
      <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted">{article.excerpt}</p>
      <div className="mt-auto flex items-center justify-between border-t pt-2.5 text-[10.5px] font-semibold text-faint" style={{ borderColor: BORDER }}>
        <span>{article.author}</span>
        <span>
          {article.date} · {article.readTime}
        </span>
      </div>
    </div>
  </a>
);

export default function Articles() {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Guides & Explainers"
          title="Latest articles"
          subtitle="Buying guides, explainers, and ownership tips from the TimesAuto team"
          href="#"
          linkLabel="View all articles"
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
          {ARTICLES.map((article) => (
            <Card key={article.title} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}