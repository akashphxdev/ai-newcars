import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarDetail, getCarFaqs, getCarArticles, getHomeCars } from "@/features/cars/car.api";
import { getModelCrossPairs } from "@/features/compare/compare.api";
import { formatPriceRange, slugify, featureLabel } from "@/lib/format";
import ModelDetailTabs from "@/components/common/ModelDetailTabs";
import CarModelHero from "@/components/cars/CarModelHero";
import CarModelColours from "@/components/cars/CarModelColours";
import VariantsList from "@/components/cars/VariantsList";
import Articles from "@/components/home/Articles";
import BrandComparisonsSection from "@/components/brands/BrandComparisonsSection";
import ReviewsSection from "@/components/cars/reviews/ReviewsSection";
import { CheckIcon, BoltIcon, GearIcon, GaugeIcon, ChevronDownIcon } from "@/components/common/icons";
import type { CarDetailResult, CarDetailFeatureGroup, CarFaq } from "@/features/cars/car.types";
import type { HomeArticle } from "@/features/articles/article.types";
import type { RandomComparisonPair } from "@/features/compare/compare.types";

// "/tata-motors-cars/nexon" -> app/car-model/[brandSlug]/[modelSlug] via the
// rewrite in next.config.ts. Model-level content (Overview, Variants,
// Colours, FAQs, Comparison, News, Reviews) — full variant-specific specs/
// features/safety live on the variant page (see [variantSlug]/page.tsx).
// Always shows the default/top-seller variant's Overview highlights, no
// searchParams read here, so this route is fully static/ISR-eligible.

// Features are fully admin-defined (Feature + FeatureCategory), so every
// non-Safety category becomes an Overview card here, named exactly as the
// admin set it up rather than a fixed Exterior/Comfort/Tech set (Safety
// gets its own dedicated section on the variant page instead).
function categoryIcon(categoryName: string): React.ReactNode {
  const n = categoryName.toLowerCase();
  if (n.includes("exterior")) return <BoltIcon className="size-4" />;
  if (n.includes("comfort")) return <GearIcon className="size-4" />;
  if (n.includes("tech") || n.includes("infotainment")) return <GaugeIcon className="size-4" />;
  return <CheckIcon className="size-4" />;
}

function buildOverviewCards(groups: CarDetailFeatureGroup[]): { icon: React.ReactNode; title: string; items: string[] }[] {
  return groups
    .filter((g) => g.categoryName.toLowerCase() !== "safety")
    .map((g) => ({ icon: categoryIcon(g.categoryName), title: g.categoryName, items: g.items.map(featureLabel) }))
    .filter((c) => c.items.length > 0);
}

type Props = {
  params: Promise<{ brandSlug: string; modelSlug: string }>;
};

// Pre-render the popular cars at build time — anything not in this list
// still works via dynamicParams' on-demand render-then-cache fallback,
// so a long-tail model is never a 404, just not pre-built.
export async function generateStaticParams() {
  const cars = await getHomeCars("popular", 24);
  return cars.map((car) => ({ brandSlug: car.brand.slug, modelSlug: car.slug }));
}

async function loadCar(props: Props): Promise<{
  car: CarDetailResult;
  faqs: CarFaq[];
  articles: HomeArticle[];
  comparisonPairs: RandomComparisonPair[];
}> {
  const { brandSlug, modelSlug } = await props.params;

  // FAQs, articles, and comparison pairs don't depend on the selected
  // variant, so fetch in parallel with the detail payload instead of
  // waterfalling.
  const [car, faqs, articles, comparisonPairs] = await Promise.all([
    getCarDetail(brandSlug, modelSlug),
    getCarFaqs(brandSlug, modelSlug),
    getCarArticles(brandSlug, modelSlug),
    getModelCrossPairs(brandSlug, modelSlug, 5),
  ]);
  if (!car) notFound();
  return { car, faqs, articles, comparisonPairs };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { brandSlug, modelSlug } = await props.params;
  const car = await getCarDetail(brandSlug, modelSlug);
  if (!car) return {};

  const priceText = formatPriceRange(car.priceMin, car.priceMax);
  const title = `${car.brand.name} ${car.name} - Price, Specs, Images & Variants`;
  const description = `${car.brand.name} ${car.name} price in India: ${priceText}. Check variants, specifications, colours, and images.`;

  return {
    title,
    description,
    openGraph: { title, description, images: car.coverImageUrl ? [car.coverImageUrl] : undefined },
  };
}

export default async function CarModelPage(props: Props) {
  const { car, faqs, articles, comparisonPairs } = await loadCar(props);
  const v = car.selectedVariant;
  const defaultVariantSlug = v ? slugify(v.variantName) : "";
  const overviewCards = buildOverviewCards(v?.features ?? []);

  return (
    <div className="bg-page">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-1.5 text-[12px] font-medium text-faint">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/${car.brand.slug}-cars`} className="hover:text-brand">{car.brand.name}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{car.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <CarModelHero car={car} variant={v} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <ModelDetailTabs brandSlug={car.brand.slug} modelSlug={car.slug} variantSlug={defaultVariantSlug} onVariantPage={false} />

        {/* Overview */}
        {overviewCards.length > 0 && (
          <section id="overview" className="mt-12 scroll-mt-32">
            <h2 className="font-head text-lg font-extrabold text-ink">Overview</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {overviewCards.map((c) => (
                <div key={c.title} className="rounded-2xl border border-border bg-white p-5">
                  <div className="flex items-center gap-2 text-brand">
                    {c.icon}
                    <h3 className="text-[13.5px] font-bold text-ink">{c.title}</h3>
                  </div>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {c.items.slice(0, 5).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[12.5px] text-muted">
                        <CheckIcon className="size-3 shrink-0 text-brand" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Variant selector */}
        {car.variantOptions.length > 0 && (
          <section id="variants" className="mt-12 scroll-mt-32">
            <h2 className="font-head text-lg font-extrabold text-ink">Variants &amp; Price</h2>
            <p className="mt-1 text-[12.5px] text-muted">Select a variant to see its full specifications and features.</p>

            <VariantsList
              brandSlug={car.brand.slug}
              modelSlug={car.slug}
              carName={car.name}
              brandName={car.brand.name}
              imageUrl={car.coverImageUrl}
              variantOptions={car.variantOptions}
              variantCount={car.variantCount}
              selectedVariantId={undefined}
            />
          </section>
        )}

        {/* Colours */}
        {car.colors.length > 0 && (
          <section className="mt-12">
            <h2 className="font-head text-lg font-extrabold text-ink">Colours</h2>
            <div className="mt-4">
              <CarModelColours colors={car.colors} />
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section id="faqs" className="mt-12">
            <h2 className="font-head text-lg font-extrabold text-ink">Frequently Asked Questions</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {faqs.map((faq) => (
                <details key={faq.id} className="group rounded-2xl border border-border bg-white px-5 py-4 open:pb-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13.5px] font-bold text-ink">
                    {faq.question}
                    <ChevronDownIcon className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Comparison — full-width, above News. Reuses BrandComparisonsSection
          (already built for the brand-cars page) since the card/layout
          need is identical, just the pairing logic differs (this model vs
          random others, instead of one brand vs another). */}
      {comparisonPairs.length > 0 && (
        <div id="comparison" className="scroll-mt-32">
          <BrandComparisonsSection
            pairs={comparisonPairs}
            eyebrow="How It Compares"
            title={`Compare ${car.name} with other cars`}
            subtitle={`See how the ${car.brand.name} ${car.name} stacks up against other popular models`}
            cardWidthClass="w-full sm:w-1/2 lg:w-1/4"
          />
        </div>
      )}

      {/* News — full-width, outside the sidebar grid like the rest of the
          page's boxed sections (Articles carries its own background/padding). */}
      {articles.length > 0 && (
        <div id="news" className="scroll-mt-32">
          <Articles
            articles={articles}
            eyebrow="In The News"
            title={`${car.name} in the news`}
            subtitle={`Reviews, comparisons, and updates about the ${car.brand.name} ${car.name}`}
          />
        </div>
      )}

      {/* Reviews — also present on the variant page (same section, same
          component) since it's tied to the model, not a specific variant. */}
      <div id="reviews" className="scroll-mt-32">
        <ReviewsSection modelId={car.id} brandSlug={car.brand.slug} modelSlug={car.slug} />
      </div>
    </div>
  );
}
