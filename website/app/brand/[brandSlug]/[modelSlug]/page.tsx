import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarDetail, getCarFaqs, getCarArticles, getHomeCars } from "@/features/cars/car.api";
import { getModelCrossPairs } from "@/features/compare/compare.api";
import { formatPriceRange, formatSinglePrice, slugify, featureLabel, carTitle } from "@/lib/format";
import ModelDetailTabs from "@/components/common/ModelDetailTabs";
import ModelHero from "@/components/cars/ModelHero";
import KeySpecsStrip from "@/components/cars/KeySpecsStrip";
import OnRoadPriceCard from "@/components/cars/OnRoadPriceCard";
import CarModelColours from "@/components/cars/CarModelColours";
import VariantsList from "@/components/cars/VariantsList";
import Articles from "@/components/home/Articles";
import BrandComparisonsSection from "@/components/brands/BrandComparisonsSection";
import ReviewsSection from "@/components/cars/reviews/ReviewsSection";
import { CheckIcon, ChevronDownIcon } from "@/components/common/icons";
import type { CarDetailResult, CarDetailFeatureGroup, CarFaq } from "@/features/cars/car.types";
import type { HomeArticle } from "@/features/articles/article.types";
import type { RandomComparisonPair } from "@/features/compare/compare.types";
import { routes } from "@/lib/routes";

function buildOverviewGroups(groups: CarDetailFeatureGroup[]) {
  return groups
    .filter((group) => group.categoryName.toLowerCase() !== "safety" && group.items.length > 0)
    .map((group) => ({ title: group.categoryName, items: group.items.map(featureLabel) }));
}

type Props = {
  params: Promise<{ brandSlug: string; modelSlug: string }>;
};

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
  const title = `${carTitle(car)} - Price, Specs, Images & Variants`;
  const description = `${carTitle(car)} price in India: ${priceText}. Check variants, specifications, colours, and images.`;

  return {
    title,
    description,
    openGraph: { title, description, images: car.coverImageUrl ? [car.coverImageUrl] : undefined },
  };
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
      <h2 className="mt-2 font-head text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{title}</h2>
      {copy && <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted sm:text-[14px]">{copy}</p>}
    </div>
  );
}

export default async function CarModelPage(props: Props) {
  const { car, faqs, articles, comparisonPairs } = await loadCar(props);
  const variant = car.selectedVariant;
  const defaultVariantSlug = variant ? slugify(variant.variantName) : "";
  const overviewGroups = buildOverviewGroups(variant?.features ?? []);
  const editorialImage = car.images[1]?.imageUrl ?? car.images[0]?.imageUrl ?? car.coverImageUrl;
  const totalHighlights = overviewGroups.reduce((count, group) => count + group.items.length, 0);

  return (
    <main className="model-detail-page bg-white">
      <div className="border-b border-border bg-white">
        <nav className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-3 text-[11.5px] font-medium text-faint scrollbar-none">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={routes.brand(car.brand.slug)} className="hover:text-brand">{car.brand.name}</Link>
          <span aria-hidden="true">/</span>
          <span className="whitespace-nowrap text-ink">{car.name}</span>
        </nav>
      </div>

      <ModelHero car={car} variant={variant} />
      <KeySpecsStrip variant={variant} />
      <ModelDetailTabs brandSlug={car.brand.slug} modelSlug={car.slug} variantSlug={defaultVariantSlug} onVariantPage={false} />

      {overviewGroups.length > 0 && (
        <section id="overview" className="scroll-mt-32 border-b border-border py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <SectionIntro
              eyebrow="TimesAuto expert view"
              title={`What makes the ${car.name} worth considering`}
              copy={`A focused look at the equipment, everyday usability and key decisions that define the ${carTitle(car)} range.`}
            />

            <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
              <div className="grid content-start gap-0 border-t border-border">
                {overviewGroups.slice(0, 4).map((group, index) => (
                  <div key={group.title} className="grid grid-cols-[34px_minmax(0,1fr)] gap-4 border-b border-border py-5">
                    <span className="font-head text-lg font-bold text-brand">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="text-[14px] font-extrabold text-ink">{group.title}</h3>
                      <ul className="mt-2 grid gap-1.5">
                        {group.items.slice(0, 4).map((item) => (
                          <li key={item} className="flex gap-2 text-[12.5px] leading-5 text-muted">
                            <CheckIcon className="mt-1 size-3 shrink-0 text-brand" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative min-h-[360px] overflow-hidden bg-page sm:min-h-[520px]">
                {editorialImage ? (
                  <Image src={editorialImage} alt={`${carTitle(car)} expert review`} fill sizes="(min-width: 1024px) 650px, 100vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">Image unavailable</div>
                )}
                <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 bg-black/78 text-white backdrop-blur-sm sm:grid-cols-3">
                  <div className="border-r border-white/20 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Body style</p>
                    <p className="mt-1 text-[13px] font-bold">{car.bodyType?.name ?? "Car"}</p>
                  </div>
                  <div className="border-r border-white/20 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Variants</p>
                    <p className="mt-1 text-[13px] font-bold">{car.variantCount}</p>
                  </div>
                  <div className="hidden px-4 py-4 sm:block">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/55">Key features</p>
                    <p className="mt-1 text-[13px] font-bold">{totalHighlights}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {car.variantOptions.length > 0 && (
        <section id="variants" className="scroll-mt-32 border-b border-border bg-[#f5f5f3] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <SectionIntro
                eyebrow="Range & pricing"
                title={`${car.name} variants`}
                copy="Compare every available trim by its ex-showroom price, then open a variant for full technical details."
              />
              <div className="grid grid-cols-2 border border-border bg-white text-center">
                <div className="border-r border-border px-5 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Range starts</p>
                  <p className="mt-1 text-[13px] font-extrabold text-ink">{formatSinglePrice(car.priceMin, "Price on request")}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Total trims</p>
                  <p className="mt-1 text-[13px] font-extrabold text-ink">{car.variantCount}</p>
                </div>
              </div>
            </div>

            {/* Ex-showroom is not what anyone pays, so the itemised
                on-road figure sits beside the trims rather than being
                left for the visitor to work out. */}
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
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
              <div className="lg:sticky lg:top-28">
                <OnRoadPriceCard variantId={variant?.id ?? null} />
              </div>
            </div>
          </div>
        </section>
      )}

      {car.colors.length > 0 && (
        <section id="colours" className="scroll-mt-32 bg-[#151515] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-9 max-w-2xl text-white">
              <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Colour studio</p>
              <h2 className="mt-2 font-head text-3xl font-extrabold sm:text-4xl">See the {car.name} in every shade.</h2>
            </div>
            <CarModelColours colors={car.colors} modelName={carTitle(car)} />
          </div>
        </section>
      )}

      {comparisonPairs.length > 0 && (
        <div id="comparison" className="scroll-mt-32 border-b border-border bg-white">
          <BrandComparisonsSection
            pairs={comparisonPairs}
            eyebrow="Head to head"
            title={`Compare the ${car.name}`}
            subtitle={`See how the ${carTitle(car)} lines up with the alternatives buyers consider most.`}
            titleSize="lg"
            cardWidthClass="w-[86vw] max-w-[390px] sm:w-[48%] lg:w-[31.5%]"
          />
        </div>
      )}

      <div id="reviews" className="scroll-mt-32 border-b border-border bg-[#f5f5f3]">
        <ReviewsSection modelId={car.id} brandSlug={car.brand.slug} modelSlug={car.slug} />
      </div>

      {articles.length > 0 && (
        <div id="news" className="scroll-mt-32 border-b border-border bg-white">
          <Articles
            articles={articles}
            eyebrow="Road tests & updates"
            title={`${car.name} stories`}
            subtitle={`Reviews, comparisons and product updates for the ${carTitle(car)}.`}
          />
        </div>
      )}

      {faqs.length > 0 && (
        <section id="faqs" className="scroll-mt-32 bg-[#f5f5f3] py-16 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
            <div>
              <SectionIntro eyebrow="Before you decide" title={`${car.name} FAQs`} copy="Clear answers to the questions buyers ask most often." />
              <div className="mt-8 border-t border-border">
                {faqs.map((faq) => (
                  <details key={faq.id} className="group border-b border-border py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-extrabold text-ink">
                      {faq.question}
                      <ChevronDownIcon className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 max-w-3xl text-[13px] leading-6 text-muted">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <aside className="h-fit border-t-4 border-brand bg-ink p-7 text-white lg:sticky lg:top-32">
              <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Buying assistance</p>
              <h3 className="mt-3 font-head text-2xl font-extrabold">Ready to shortlist?</h3>
              <p className="mt-3 text-[13px] leading-6 text-white/65">Review the complete specification, compare alternatives or explore finance before speaking with a dealer.</p>
              <div className="mt-6 grid gap-2">
                {defaultVariantSlug && (
                  <Link href={routes.variant(car.brand.slug, car.slug, defaultVariantSlug)} className="bg-brand px-4 py-3 text-center text-[12px] font-black uppercase tracking-[0.08em] text-white hover:bg-brand-hover">
                    View specifications
                  </Link>
                )}
                <Link href="/compare-cars" className="border border-white/30 px-4 py-3 text-center text-[12px] font-bold text-white hover:border-brand hover:text-brand">
                  Compare cars
                </Link>
              </div>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
