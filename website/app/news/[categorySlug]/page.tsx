import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleCategories, getArticlesByCategoryPaginated } from "@/features/articles/article.api";
import CategoryArticlesGrid from "@/components/articles/CategoryArticlesGrid";

const PAGE_SIZE = 8;

type Props = {
  params: Promise<{ categorySlug: string }>;
};

// Small, fixed set of categories — pre-render all of them so this route
// is served statically (ISR-revalidated) instead of rendered per request.
export async function generateStaticParams() {
  const categories = await getArticleCategories();
  return categories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const categories = await getArticleCategories();
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) return {};

  return {
    title: `${category.name} — News | TimesAuto`,
    description: `Hands-on ${category.name.toLowerCase()} coverage from the TimesAuto editorial team — reviews, comparisons, and buying advice, updated regularly.`,
  };
}

export default async function NewsCategoryPage({ params }: Props) {
  const { categorySlug } = await params;

  const categories = await getArticleCategories();
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  // Only the first page loads server-side — CategoryArticlesGrid's "Load
  // more" button fetches the rest client-side, so a category with
  // hundreds of articles never has to load in one shot.
  const { articles, pagination } = await getArticlesByCategoryPaginated(categorySlug, 1, PAGE_SIZE);

  return (
    <div className="bg-page">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold" aria-label="Breadcrumb">
          <Link href="/" className="text-ink">
            Home
          </Link>
          <span className="text-muted">{">"}</span>
          <span className="text-brand">{category.name}</span>
        </nav>

        <h1 className="mb-2 text-2xl font-bold capitalize tracking-tight text-ink sm:text-[32px]">{category.name}</h1>
        <p className="mb-8 max-w-2xl text-[14px] leading-relaxed text-ink/70 sm:text-[15px]">
          Hands-on <span className="capitalize">{category.name.toLowerCase()}</span> coverage from the TimesAuto
          editorial team — reviews, comparisons, and buying advice, updated regularly.
        </p>

        <CategoryArticlesGrid categorySlug={categorySlug} initialArticles={articles} initialPagination={pagination} />
      </div>
    </div>
  );
}
