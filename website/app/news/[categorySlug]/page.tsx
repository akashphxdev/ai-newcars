import type { Metadata } from "next";
import { getEntityPageMetadata } from "@/features/seo/seo.api";
import { SEO_PAGE_TYPE } from "@/features/seo/seo.types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleCategories, getArticlesByCategoryPaginated } from "@/features/articles/article.api";
import PageSidebar from "@/components/common/PageSidebar";
import { routes } from "@/lib/routes";
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

  return getEntityPageMetadata(
    SEO_PAGE_TYPE.NEWS_CATEGORY,
    category.id,
    { category_name: category.name, category_slug: category.slug },
    {
      title: `${category.name} — News | TimesAuto`,
      description: `Hands-on ${category.name.toLowerCase()} coverage from the TimesAuto editorial team — reviews, comparisons, and buying advice, updated regularly.`,
    },
    `/news/${category.slug}`,
  );
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

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <CategoryArticlesGrid
              categorySlug={categorySlug}
              initialArticles={articles}
              initialPagination={pagination}
            />
          </div>
          <div className="w-full lg:w-[300px] lg:shrink-0">
            <PageSidebar
              adSlotId="news-category"
              blocks={[
                {
                  title: "More from news",
                  links: categories
                    .filter((c) => c.slug !== categorySlug)
                    .slice(0, 6)
                    .map((c) => ({ href: routes.newsCategory(c.slug), label: c.name })),
                },
                {
                  title: "Work out the cost",
                  links: [
                    { href: routes.emiCalculator(), label: "Car loan EMI", note: "What it costs a month" },
                    { href: routes.mileageCalculator(), label: "Running cost", note: "What every km costs" },
                    { href: routes.compare(), label: "Compare cars", note: "Two models side by side" },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
