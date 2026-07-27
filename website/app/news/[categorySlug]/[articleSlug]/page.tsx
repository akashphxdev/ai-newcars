import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getArticleDetail, getRelatedArticles } from "@/features/articles/article.api";
import type { HomeArticle } from "@/features/articles/article.types";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" });

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

// Source articles (AI-imported) sometimes repeat the headline as an <h1>
// at the very start of the body — we already render the real title above,
// so drop a leading duplicate rather than showing it twice.
function stripLeadingDuplicateHeading(html: string): string {
  return html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, "");
}

const RelatedCard = ({ item }: { item: HomeArticle }) => (
  <a
    href={`/news/${item.category.slug}/${item.slug}`}
    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-page transition-colors hover:border-brand"
  >
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
      <Image
        src={item.coverImageUrl ?? FALLBACK_IMG}
        alt={item.title}
        fill
        sizes="320px"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    </div>
    <div className="flex flex-col gap-1.5 p-3.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-brand">{item.category.name}</span>
      <h3 className="line-clamp-2 text-[13.5px] font-bold leading-snug text-ink group-hover:text-brand">{item.title}</h3>
      <p className="text-[10.5px] font-medium text-faint">
        {item.author.name}
        {item.readTimeMinutes ? ` · ${item.readTimeMinutes} min read` : ""}
      </p>
    </div>
  </a>
);

type Props = { params: Promise<{ categorySlug: string; articleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, articleSlug } = await params;
  const article = await getArticleDetail(categorySlug, articleSlug);
  if (!article) return {};

  const description = article.metaDescription ?? article.excerpt ?? undefined;
  const image = article.ogImageUrl ?? article.coverImageUrl ?? undefined;

  return {
    title: article.metaTitle ?? article.title,
    description,
    keywords: article.metaKeywords ?? undefined,
    openGraph: {
      title: article.metaTitle ?? article.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { categorySlug, articleSlug } = await params;
  const article = await getArticleDetail(categorySlug, articleSlug);

  if (!article) notFound();

  const related = await getRelatedArticles(categorySlug, articleSlug, 4);
  const body = article.body ? stripLeadingDuplicateHeading(article.body) : null;

  return (
    <div className="bg-page">
      {/* Wider shell (matches the rest of the site's max-w-7xl) with a
          two-column layout on desktop — article on the left, related
          articles as a proper sidebar on the right, instead of a narrow
          centered column with a bare strip of cards stacked underneath. */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
          <article className="min-w-0">
            <a href={`/news/${article.category.slug}`} className="text-[11px] font-bold uppercase tracking-wide text-brand">
              {article.category.name}
            </a>

            <h1 className="mt-3 font-head text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{article.title}</h1>

            {article.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted">{article.excerpt}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-border py-4 text-sm text-faint">
              <span className="font-semibold text-ink">{article.author.name}</span>
              {article.publishedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{DATE_FMT.format(new Date(article.publishedAt))}</span>
                </>
              )}
              {article.readTimeMinutes && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{article.readTimeMinutes} min read</span>
                </>
              )}
            </div>

            {article.coverImageUrl && (
              <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-surface">
                <Image src={article.coverImageUrl} alt={article.title} fill sizes="(min-width: 1024px) 700px, 100vw" priority className="object-cover" />
              </div>
            )}

            {body && (
              <div
                className="prose prose-neutral mt-8 max-w-none text-ink prose-headings:text-ink prose-a:text-brand prose-strong:text-ink prose-img:rounded-xl [&_table]:block [&_table]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
          </article>

          {related.length > 0 && (
            <aside className="lg:pt-1">
              <h2 className="mb-4 font-head text-lg font-extrabold text-ink">More in {article.category.name}</h2>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                {related.map((item) => (
                  <RelatedCard key={item.id} item={item} />
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
