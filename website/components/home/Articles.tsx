"use client";
import SectionHeader from "@/components/common/SectionHeader";
import ScrollArrows from "@/components/common/ScrollArrows";
import { useScrollRail } from "@/components/common/useScrollRail";
import ArticleCard from "@/components/articles/ArticleCard";
import type { HomeArticle } from "@/features/articles/article.types";

const SURFACE = "#f4f5f9";

export default function Articles({
  articles,
  eyebrow = "Guides & Explainers",
  title = "Latest news",
  subtitle = "Buying guides, explainers, and ownership tips from the TimesAuto team",
  href = "news/car-reviews",
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
            <ArticleCard key={article.id} article={article} className="w-70 shrink-0 snap-start" />
          ))}
        </div>
      </div>
    </section>
  );
}
