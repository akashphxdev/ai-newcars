import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarDetail, getCarFaqs, getCarArticles } from "@/features/cars/car.api";
import { getModelCrossPairs } from "@/features/compare/compare.api";
import { formatPriceRange, formatSinglePrice } from "@/lib/format";
import ModelDetailTabs from "@/components/common/ModelDetailTabs";
import CarModelHero from "@/components/cars/CarModelHero";
import CarModelSidebar from "@/components/cars/CarModelSidebar";
import CarModelColours from "@/components/cars/CarModelColours";
import Articles from "@/components/home/Articles";
import BrandComparisonsSection from "@/components/brands/BrandComparisonsSection";
import { PowerIcon, TorqueIcon, CheckIcon, GaugeIcon, BoltIcon, GearIcon, ChevronDownIcon } from "@/components/common/icons";
import type { CarDetailResult, CarDetailFeatures, CarFaq } from "@/features/cars/car.types";
import type { HomeArticle } from "@/features/articles/article.types";
import type { RandomComparisonPair } from "@/features/compare/compare.types";

// "/tata-motors-cars/nexon" -> app/car-model/[brandSlug]/[modelSlug] via the
// rewrite in next.config.ts. One page, no brand/body-type branching (unlike
// listing-cars/[slug]) since a model always belongs to exactly one brand.

type Props = {
  params: Promise<{ brandSlug: string; modelSlug: string }>;
  searchParams: Promise<{ variant?: string }>;
};

async function loadCar(props: Props): Promise<{
  car: CarDetailResult;
  brandSlug: string;
  modelSlug: string;
  variantId?: number;
  faqs: CarFaq[];
  articles: HomeArticle[];
  comparisonPairs: RandomComparisonPair[];
}> {
  const { brandSlug, modelSlug } = await props.params;
  const { variant } = await props.searchParams;
  const variantId = variant ? Number(variant) : undefined;
  const parsedVariantId = variantId && !Number.isNaN(variantId) ? variantId : undefined;

  // FAQs, articles, and comparison pairs don't depend on the selected
  // variant, so fetch in parallel with the detail payload instead of
  // waterfalling.
  const [car, faqs, articles, comparisonPairs] = await Promise.all([
    getCarDetail(brandSlug, modelSlug, parsedVariantId),
    getCarFaqs(brandSlug, modelSlug),
    getCarArticles(brandSlug, modelSlug),
    getModelCrossPairs(brandSlug, modelSlug, 5),
  ]);
  if (!car) notFound();
  return { car, brandSlug, modelSlug, variantId, faqs, articles, comparisonPairs };
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

function FeatureRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border-soft py-2 text-[12.5px] font-medium text-ink last:border-0">
      <CheckIcon className="size-3.5 shrink-0 text-brand" />
      {label}
    </div>
  );
}

function SpecRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft py-2 last:border-0">
      <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
        {icon}
        {label}
      </span>
      <span className="text-[12.5px] font-bold text-ink">{value}</span>
    </div>
  );
}

// Overview cards use only real feature flags off the selected variant —
// grouped under generic category headers rather than per-car marketing
// copy (which the backend has no field for).
function buildOverviewCards(feat: CarDetailFeatures | null): { icon: React.ReactNode; title: string; items: string[] }[] {
  if (!feat) return [];
  const cards = [
    {
      icon: <BoltIcon className="size-4" />,
      title: "Exterior & Design",
      items: [
        feat.ledHeadlamps && "LED headlamps",
        feat.ledDrls && "LED DRLs",
        feat.alloyWheels && "Alloy wheels",
        feat.sunroof && "Sunroof",
        feat.roofRails && "Roof rails",
        feat.fogLamps && "Fog lamps",
      ].filter((x): x is string => Boolean(x)),
    },
    {
      icon: <GearIcon className="size-4" />,
      title: "Comfort & Convenience",
      items: [
        feat.climateControl && "Climate control",
        feat.ventilatedSeats && "Ventilated seats",
        feat.rearAcVents && "Rear AC vents",
        feat.cruiseControl && "Cruise control",
        feat.keylessEntry && "Keyless entry",
        feat.pushButtonStart && "Push button start",
        feat.adjustableSeats && "Adjustable seats",
      ].filter((x): x is string => Boolean(x)),
    },
    {
      icon: <GaugeIcon className="size-4" />,
      title: "Technology",
      items: [
        feat.touchscreenSizeInch && `${feat.touchscreenSizeInch}" touchscreen`,
        feat.androidAuto && "Android Auto",
        feat.appleCarplay && "Apple CarPlay",
        feat.connectedCarTech && "Connected car tech",
        feat.wirelessCharging && "Wireless charging",
        feat.numberOfSpeakers && `${feat.numberOfSpeakers}-speaker audio`,
      ].filter((x): x is string => Boolean(x)),
    },
  ];
  return cards.filter((c) => c.items.length > 0);
}

function buildSafetyItems(feat: CarDetailFeatures | null): string[] {
  if (!feat) return [];
  return [
    feat.airbagsCount ? `${feat.airbagsCount} Airbags` : "",
    feat.absWithEbd && "ABS with EBD",
    feat.esc && "Electronic Stability Control",
    feat.hillAssist && "Hill Hold Assist",
    feat.rearParkingCamera && "Rear Parking Camera",
    feat.frontParkingSensors && "Front Parking Sensors",
    feat.tpms && "Tyre Pressure Monitoring (TPMS)",
    feat.isofixMounts && "ISOFIX Child Seat Mounts",
    feat.ncapRating && `${feat.ncapRating} NCAP Rating`,
  ].filter((x): x is string => Boolean(x));
}

export default async function CarModelPage(props: Props) {
  const { car, variantId, faqs, articles, comparisonPairs } = await loadCar(props);
  const v = car.selectedVariant;

  const overviewCards = buildOverviewCards(v?.features ?? null);
  const safetyItems = buildSafetyItems(v?.features ?? null);

  const featureList: { label: string; on: boolean }[] = v?.features
    ? [
        { label: "Sunroof", on: v.features.sunroof },
        { label: "Keyless Entry", on: v.features.keylessEntry },
        { label: "Push Button Start", on: v.features.pushButtonStart },
        { label: "Cruise Control", on: v.features.cruiseControl },
        { label: "Climate Control", on: v.features.climateControl },
        { label: "Rear AC Vents", on: v.features.rearAcVents },
        { label: "Power Windows", on: v.features.powerWindows },
        { label: "Ventilated Seats", on: v.features.ventilatedSeats },
        { label: "LED Headlamps", on: v.features.ledHeadlamps },
        { label: "Alloy Wheels", on: v.features.alloyWheels },
        { label: "Rear Parking Camera", on: v.features.rearParkingCamera },
        { label: "Android Auto", on: v.features.androidAuto },
        { label: "Apple CarPlay", on: v.features.appleCarplay },
        { label: "Wireless Charging", on: v.features.wirelessCharging },
      ].filter((f) => f.on)
    : [];

  return (
    <div className="bg-page">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-1.5 text-[12px] font-medium text-faint">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/new-cars" className="hover:text-brand">New Cars</Link>
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

      <div className="mx-auto max-w-7xl gap-8 px-4 py-8 sm:py-10 lg:grid lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="min-w-0">
          <ModelDetailTabs brandSlug={car.brand.slug} modelSlug={car.slug} />

          {/* Overview */}
            {overviewCards.length > 0 && (
              <section id="overview" className="scroll-mt-32">
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

                <div className="mt-4 flex flex-col gap-2.5">
                  {car.variantOptions.map((opt) => {
                    const isSelected = v ? v.id === opt.id : opt.id === (variantId ?? car.variantOptions[0]?.id);
                    return (
                      <Link
                        key={opt.id}
                        href={`?variant=${opt.id}#variants`}
                        scroll={false}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3.5 transition-colors ${
                          isSelected ? "border-brand bg-orange-50" : "border-border bg-white hover:border-brand"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-bold text-ink">{opt.variantName}</span>
                          {opt.isTopSeller && (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                              Top Seller
                            </span>
                          )}
                        </div>
                        <span className="text-[13.5px] font-bold text-ink">{formatSinglePrice(opt.price)}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Specifications */}
            {v && (v.ice || v.electric) && (
              <section id="specs" className="mt-12 scroll-mt-32">
                <h2 className="font-head text-lg font-extrabold text-ink">Specifications</h2>
                <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
                  <SpecRow label="Body Type" value={car.bodyType?.name ?? "-"} />
                  <SpecRow label="Seating Capacity" value={v.seatingCapacity ? `${v.seatingCapacity} Seater` : "-"} />
                  <SpecRow label="Transmission" value={v.transmission ?? "-"} />
                  {v.isElectric && v.electric ? (
                    <>
                      <SpecRow label="Battery Capacity" value={v.electric.batteryCapacity ? `${v.electric.batteryCapacity} kWh` : "-"} />
                      <SpecRow label="Claimed Range" value={v.electric.claimedRange ? `${v.electric.claimedRange} km` : "-"} />
                      <SpecRow label="Power" value={v.electric.powerPs ? `${v.electric.powerPs} PS` : "-"} icon={<PowerIcon className="size-3.5" />} />
                      <SpecRow label="Torque" value={v.electric.torqueNm ? `${v.electric.torqueNm} Nm` : "-"} icon={<TorqueIcon className="size-3.5" />} />
                      <SpecRow label="Top Speed" value={v.electric.topSpeedKmph ? `${v.electric.topSpeedKmph} km/h` : "-"} />
                      <SpecRow label="AC Charging Time" value={v.electric.acChargingTime ? `${v.electric.acChargingTime} hrs` : "-"} />
                      <SpecRow label="Drivetrain" value={v.electric.drivetrain ?? "-"} />
                      <SpecRow label="Boot Space" value={v.electric.powertrainBootspace ? `${v.electric.powertrainBootspace} L` : "-"} />
                    </>
                  ) : v.ice ? (
                    <>
                      <SpecRow label="Fuel Type" value={v.ice.fuelType ?? "-"} />
                      <SpecRow label="Engine Displacement" value={v.ice.engineDisplacement ? `${Math.round(Number(v.ice.engineDisplacement))} cc` : "-"} />
                      <SpecRow label="Power" value={v.ice.powerPs ? `${v.ice.powerPs} PS` : "-"} icon={<PowerIcon className="size-3.5" />} />
                      <SpecRow label="Torque" value={v.ice.torqueNm ? `${v.ice.torqueNm} Nm` : "-"} icon={<TorqueIcon className="size-3.5" />} />
                      <SpecRow label="Mileage (City)" value={v.ice.cityMileage ? `${v.ice.cityMileage} km/l` : "-"} />
                      <SpecRow label="Top Speed" value={v.ice.topSpeedKmph ? `${v.ice.topSpeedKmph} km/h` : "-"} />
                      <SpecRow label="Drivetrain" value={v.ice.drivetrain ?? (v.ice.isFourByFour ? "4x4" : "-")} />
                      <SpecRow label="Fuel Tank Capacity" value={v.ice.fuelTankCapacity ? `${v.ice.fuelTankCapacity} L` : "-"} />
                    </>
                  ) : null}
                </div>
              </section>
            )}

            {/* Features */}
            {featureList.length > 0 && (
              <section id="features" className="mt-12 scroll-mt-32">
                <h2 className="font-head text-lg font-extrabold text-ink">Key Features</h2>
                <div className="mt-4 grid grid-cols-1 gap-x-8 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
                  {featureList.map((f) => (
                    <FeatureRow key={f.label} label={f.label} />
                  ))}
                </div>
              </section>
            )}

            {/* Safety */}
            {safetyItems.length > 0 && (
              <section id="safety" className="mt-12 scroll-mt-32">
                <h2 className="font-head text-lg font-extrabold text-ink">Safety</h2>
                <div className="mt-4 grid grid-cols-1 gap-x-8 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
                  {safetyItems.map((label) => (
                    <FeatureRow key={label} label={label} />
                  ))}
                </div>
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

        {/* Right column */}
        <div className="mt-6 lg:mt-0">
          <CarModelSidebar variant={v} />
        </div>
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
    </div>
  );
}
