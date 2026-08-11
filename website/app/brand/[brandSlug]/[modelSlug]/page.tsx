import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarDetail, getCarFaqs, getCarArticles, getHomeCars, getVariantPick } from "@/features/cars/car.api";
import { getModelCrossPairs } from "@/features/compare/compare.api";
import { getMetroFuelPrices } from "@/features/fuel/fuel.api";
import { formatPriceRange, formatSinglePrice, slugify, featureLabel, isFeaturePresent, byFeatureInterest, carTitle } from "@/lib/format";
import ModelDetailTabs from "@/components/common/ModelDetailTabs";
import ModelHero from "@/components/cars/ModelHero";
import PurchaseRail from "@/components/cars/PurchaseRail";
import CarModelColours from "@/components/cars/CarModelColours";
import VariantsTable from "@/components/cars/VariantsTable";
import VariantPickCard from "@/components/cars/VariantPickCard";
import RunningCostStrip from "@/components/cars/RunningCostStrip";
import EvRangeCharging from "@/components/cars/EvRangeCharging";
import SpecificationsSection from "@/components/cars/SpecificationsSection";
import Articles from "@/components/home/Articles";
import BrandComparisonsSection from "@/components/brands/BrandComparisonsSection";
import ReviewsSection from "@/components/cars/reviews/ReviewsSection";
import { CheckIcon, ChevronDownIcon } from "@/components/common/icons";
import type { CarDetailResult, CarDetailFeatureGroup, CarFaq, VariantPick } from "@/features/cars/car.types";
import type { HomeArticle } from "@/features/articles/article.types";
import type { RandomComparisonPair } from "@/features/compare/compare.types";
import type { MetroFuelPrices } from "@/features/fuel/fuel.types";
import { routes } from "@/lib/routes";
import { fillPlaceholders, getEntityPageMetadata, getEntitySchemas, getSeoMeta } from "@/features/seo/seo.api";
import { SEO_PAGE_TYPE } from "@/features/seo/seo.types";
import SeoJsonLd from "@/components/common/SeoJsonLd";
import { buildFaqPageSchema } from "@/lib/schema";

// The overview lists what the car has. Items recorded as "Not Available"
// were being rendered with a tick beside them, which read as the opposite
// of what the data said — so they are dropped, and a group left with
// nothing goes with them.
function buildOverviewGroups(groups: CarDetailFeatureGroup[]) {
  return groups
    .filter((group) => group.categoryName.toLowerCase() !== "safety")
    .map((group) => ({
      title: group.categoryName,
      items: group.items.filter(isFeaturePresent).map(featureLabel).sort(byFeatureInterest),
    }))
    .filter((group) => group.items.length > 0);
}

type Props = {
  params: Promise<{ brandSlug: string; modelSlug: string }>;
};

function modelSeoVars(car: CarDetailResult): Record<string, string> {
  return { brand_name: car.brand.name, brand_slug: car.brand.slug, model_name: car.name, model_slug: car.slug };
}

export async function generateStaticParams() {
  const cars = await getHomeCars("popular", 24);
  return cars.map((car) => ({ brandSlug: car.brand.slug, modelSlug: car.slug }));
}

async function loadCar(props: Props): Promise<{
  car: CarDetailResult;
  faqs: CarFaq[];
  articles: HomeArticle[];
  comparisonPairs: RandomComparisonPair[];
  variantPick: VariantPick;
  metros: MetroFuelPrices[];
}> {
  const { brandSlug, modelSlug } = await props.params;
  const [car, faqs, articles, comparisonPairs, variantPick, metros] = await Promise.all([
    getCarDetail(brandSlug, modelSlug),
    getCarFaqs(brandSlug, modelSlug),
    getCarArticles(brandSlug, modelSlug),
    getModelCrossPairs(brandSlug, modelSlug, 5),
    getVariantPick(brandSlug, modelSlug),
    getMetroFuelPrices().catch(() => []),
  ]);
  if (!car) notFound();
  return { car, faqs, articles, comparisonPairs, variantPick, metros };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { brandSlug, modelSlug } = await props.params;
  const car = await getCarDetail(brandSlug, modelSlug);
  if (!car) return {};

  const priceText = formatPriceRange(car.priceMin, car.priceMax);
  const meta = await getEntityPageMetadata(
    SEO_PAGE_TYPE.MODEL,
    car.id,
    modelSeoVars(car),
    {
      title: `${carTitle(car)} - Price, Specs, Images & Variants`,
      description: `${carTitle(car)} price in India: ${priceText}. Check variants, specifications, colours, and images.`,
    },
    routes.model(car.brand.slug, car.slug),
  );

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      images: meta.openGraph?.images ?? (car.coverImageUrl ? [car.coverImageUrl] : undefined),
    },
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
  const { car, faqs, articles, comparisonPairs, variantPick, metros } = await loadCar(props);
  const seoVars = modelSeoVars(car);
  const [adminSchemas, seo] = await Promise.all([
    getEntitySchemas(SEO_PAGE_TYPE.MODEL, car.id, seoVars),
    getSeoMeta({ pageType: SEO_PAGE_TYPE.MODEL, entityId: car.id }),
  ]);
  const faqSchema = buildFaqPageSchema(faqs.map((f) => ({ question: f.question, answer: f.answer })));
  const variant = car.selectedVariant;
  const defaultVariantSlug = variant ? slugify(variant.variantName) : "";
  const overviewGroups = buildOverviewGroups(variant?.features ?? []);
  const safetyItems =
    (variant?.features ?? [])
      .find((group) => group.categoryName.toLowerCase() === "safety")
      ?.items.filter(isFeaturePresent)
      .map(featureLabel) ?? [];
  const editorialImage = car.images[1]?.imageUrl ?? car.images[0]?.imageUrl ?? car.coverImageUrl;
  const totalHighlights = overviewGroups.reduce((count, group) => count + group.items.length, 0);

  return (
    <main className="model-detail-page bg-page">
      <SeoJsonLd schemas={[...adminSchemas, faqSchema]} />
      <div className="border-b border-border bg-white">
        <nav className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-3 text-[11.5px] font-medium text-faint scrollbar-none">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={routes.brand(car.brand.slug)} className="hover:text-brand">{car.brand.name}</Link>
          <span aria-hidden="true">/</span>
          <span className="whitespace-nowrap text-ink">{car.name}</span>
        </nav>
      </div>

      {/* The purchase rail spans both grid rows, so model navigation and
          content begin directly below the hero instead of waiting for the
          taller buying panel to finish. */}
      <div className="mx-auto grid max-w-7xl gap-x-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_336px] lg:grid-rows-[auto_1fr] lg:px-8 xl:gap-x-8">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <ModelHero car={car} variant={variant} h1Override={fillPlaceholders(seo?.h1Tag, seoVars)} />
        </div>

        <div className="mt-6 min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0">
          <PurchaseRail car={car} variant={variant} />
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <ModelDetailTabs
            brandSlug={car.brand.slug}
            modelSlug={car.slug}
            variantSlug={defaultVariantSlug}
            onVariantPage={false}
            embedded
            sections={[
              overviewGroups.length > 0 && "overview",
              car.variantOptions.length > 0 && "variants",
              Boolean(variant?.isElectric && variant.electric) && "range-charging",
              Boolean(variant) && "specifications",
              car.colors.length > 0 && "colours",
              comparisonPairs.length > 0 && "comparison",
              "reviews",
              articles.length > 0 && "news",
              faqs.length > 0 && "faqs",
            ].filter((section): section is string => typeof section === "string")}
          />
          <div className="mt-6 space-y-6">

      {overviewGroups.length > 0 && (
        <section id="overview" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="p-5 sm:p-7">
            <SectionIntro
              eyebrow="Equipment"
              title={`What the ${car.name} comes with`}
              copy={`The kit fitted to the ${variant?.variantName ?? carTitle(car)}, with what buyers ask about first at the top of each list.`}
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

                {/* Airbags and ADAS are top-shortlist facts, and this page
                    held them in the payload while showing none of it. */}
                {safetyItems.length > 0 && (
                  <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-4 border-b border-border py-5">
                    <span className="font-head text-lg font-bold text-ev">
                      {String(Math.min(overviewGroups.length, 4) + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[14px] font-extrabold text-ink">Safety</h3>
                      <ul className="mt-2 grid gap-1.5">
                        {safetyItems.slice(0, 5).map((item) => (
                          <li key={item} className="flex gap-2 text-[12.5px] leading-5 text-muted">
                            <CheckIcon className="mt-1 size-3 shrink-0 text-ev" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {defaultVariantSlug && (
                        <Link
                          href={`${routes.variant(car.brand.slug, car.slug, defaultVariantSlug)}#safety`}
                          className="mt-2.5 inline-block text-[12px] font-bold text-ev no-underline hover:underline"
                        >
                          All safety kit, item by item →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
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
        <section id="variants" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <SectionIntro
                eyebrow="Variants & pricing"
                title={`Choose the right ${car.name} variant`}
                copy="Compare trims by what they cost on the road in your city, not just ex-showroom. Open any row to see where the difference goes."
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

            <div className="mt-5">
              <VariantPickCard pick={variantPick} car={car} />
            </div>

            {/* The rail prices the one variant the reader has selected;
                this prices all of them side by side, which is the
                comparison the section exists for. */}
            <VariantsTable
              brandSlug={car.brand.slug}
              modelSlug={car.slug}
              modelName={car.name}
              brandName={car.brand.name}
              imageUrl={car.coverImageUrl}
            />
          </div>
        </section>
      )}

      {variant?.isElectric && variant.electric && (
        <section id="range-charging" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="p-5 sm:p-7">
            <div className="mb-8 max-w-2xl">
              <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">
                Range, charging & running cost
              </p>
              <h2 className="mt-2 font-head text-3xl font-extrabold text-ink sm:text-4xl">
                What the {car.name} costs to run
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-muted">
                Claimed range is a test figure. These are the numbers you would actually plan
                around, against today&apos;s electricity and pump prices.
              </p>
            </div>
            <EvRangeCharging variant={variant} modelName={car.name} />
          </div>
        </section>
      )}

      {variant && (
        <section id="specifications" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="p-5 sm:p-7">
            <div className="mb-8 max-w-2xl">
              <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">
                Specifications & dimensions
              </p>
              <h2 className="mt-2 font-head text-3xl font-extrabold text-ink sm:text-4xl">
                {car.name} specifications
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-muted">
                Figures for the {variant.variantName.replace(`${car.name} `, "")} variant. Other
                trims differ — switch variant above to see theirs.
              </p>
            </div>
            <SpecificationsSection variant={variant} carName={car.name} />

            <RunningCostStrip variant={variant} carName={car.name} metros={metros} />
          </div>
        </section>
      )}

            {car.colors.length > 0 && (
              <section id="colours" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
                <div className="p-5 sm:p-7">
                  <SectionIntro
                    eyebrow="Colour studio"
                    title={`Choose your ${car.name} finish`}
                    copy={`Preview all ${car.colors.length} factory colours and check whether your preferred finish carries an additional cost.`}
                  />
                  <div className="mt-8">
                    <CarModelColours colors={car.colors} modelName={carTitle(car)} />
                  </div>
                </div>
              </section>
            )}

      {comparisonPairs.length > 0 && (
        <div id="comparison" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
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

      <div id="reviews" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
        <ReviewsSection modelId={car.id} brandSlug={car.brand.slug} modelSlug={car.slug} />
      </div>

      {articles.length > 0 && (
        <div id="news" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
          <Articles
            articles={articles}
            eyebrow="Road tests & updates"
            title={`${car.name} stories`}
            subtitle={`Reviews, comparisons and product updates for the ${carTitle(car)}.`}
          />
        </div>
      )}

      {faqs.length > 0 && (
        <section id="faqs" className="scroll-mt-32 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="p-5 sm:p-7">
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
        </section>
      )}
          </div>
        </div>
      </div>
    </main>
  );
}
