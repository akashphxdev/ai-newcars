"use client";
import { useState } from "react";
import Image from "next/image";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import type { HomeArticle } from "@/features/articles/article.types";

const ORANGE = "#f2650f";
const SURFACE = "#f4f5f9";
const BORDER = "#e5e7eb";
const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const ArticleImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes="280px"
      onError={() => setImgSrc(FALLBACK_IMG)}
      className={className}
    />
  );
};

const Card = ({ article }: { article: HomeArticle }) => (
  <a
    href={`/news/${article.category.slug}/${article.slug}`}
    className="group flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:hover:translate-y-0"
    style={{ border: "1px solid " + BORDER, boxShadow: "0 1px 2px rgba(17,24,39,0.04)", outlineColor: ORANGE }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 14px 30px rgba(17,24,39,0.12)")}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,24,39,0.04)")}
  >
    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: SURFACE }}>
      <ArticleImage
        src={article.coverImageUrl ?? FALLBACK_IMG}
        alt={article.title}
        className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
        <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide backdrop-blur-sm" style={{ color: ORANGE }}>
          {article.category.name}
        </span>
      </div>
    </div>

    <div className="flex flex-1 flex-col gap-2 p-3.5">
      <h3 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-ink">{article.title}</h3>
      {article.excerpt && <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted">{article.excerpt}</p>}
      <div className="mt-auto flex items-center justify-between border-t pt-2.5 text-[10.5px] font-semibold text-faint" style={{ borderColor: BORDER }}>
        <span>{article.author.name}</span>
        <span>
          {article.publishedAt ? DATE_FMT.format(new Date(article.publishedAt)) : ""}
          {article.readTimeMinutes ? ` · ${article.readTimeMinutes} min read` : ""}
        </span>
      </div>
    </div>
  </a>
);

export default function Articles({
  articles,
  eyebrow = "Guides & Explainers",
  title = "Latest news",
  subtitle = "Buying guides, explainers, and ownership tips from the TimesAuto team",
  href = "#",
  linkLabel = "View all news",
}: {
  articles: HomeArticle[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  const { trackRef, canScrollLeft, canScrollRight, updateArrows, scrollBy } = useScrollRail<HTMLDivElement>();

  if (articles.length === 0) return null;

  return (
    <section className="py-12 sm:py-16" style={{ background: SURFACE }}>
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          href={href}
          linkLabel={linkLabel}
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
          {articles.map((article) => (
            <Card key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
