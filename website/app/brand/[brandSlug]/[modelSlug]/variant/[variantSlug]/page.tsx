import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarDetail, getCarVariants, getHomeCars } from "@/features/cars/car.api";
import { formatSinglePrice, slugify, featureLabel, isFeaturePresent, carTitle } from "@/lib/format";
import ModelDetailTabs from "@/components/common/ModelDetailTabs";
import CarModelHero from "@/components/cars/CarModelHero";
import CarModelSidebar from "@/components/cars/CarModelSidebar";
import KeySpecsStrip from "@/components/cars/KeySpecsStrip";
import TrimLadder from "@/components/cars/TrimLadder";
import OnRoadPriceCard from "@/components/cars/OnRoadPriceCard";
import RunningCostStrip from "@/components/cars/RunningCostStrip";
import ReviewsSection from "@/components/cars/reviews/ReviewsSection";
import { getMetroFuelPrices } from "@/features/fuel/fuel.api";
import {
  CheckIcon,
  EngineIcon,
  PowerIcon,
  TorqueIcon,
  GaugeIcon,
  GearIcon,
  CarIcon,
  RoadIcon,
  BatteryIcon,
  PlugIcon,
  FuelIcon,
  RulerIcon,
  BootIcon,
  SeatIcon,
} from "@/components/common/icons";
import type { CarDetailResult, CarDetailFeatureGroup, CarDetailVariantOption } from "@/features/cars/car.types";
import type { MetroFuelPrices } from "@/features/fuel/fuel.types";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ brandSlug: string; modelSlug: string; variantSlug: string }>;
};

type Metric = { label: string; value: string };

export async function generateStaticParams() {
  const cars = await getHomeCars("popular", 24);
  const paramsByCar = await Promise.all(
    cars.map(async (car) => {
      const variants = await getCarVariants(car.brand.slug, car.slug);
      const topSeller = variants.find((variant) => variant.isTopSeller) ?? variants[0];
      return topSeller ? [{ brandSlug: car.brand.slug, modelSlug: car.slug, variantSlug: slugify(topSeller.variantName) }] : [];
    }),
  );
  return paramsByCar.flat();
}

async function resolveVariantId(brandSlug: string, modelSlug: string, variantSlug: string): Promise<number> {
  const variants = await getCarVariants(brandSlug, modelSlug);
  const match = variants.find((variant) => slugify(variant.variantName) === variantSlug);
  if (!match) notFound();
  return match.id;
}

async function loadCar(props: Props): Promise<{
  car: CarDetailResult;
  variantSlug: string;
  siblings: CarDetailVariantOption[];
  metros: MetroFuelPrices[];
}> {
  const { brandSlug, modelSlug, variantSlug } = await props.params;
  const siblings = await getCarVariants(brandSlug, modelSlug);
  const match = siblings.find((variant) => slugify(variant.variantName) === variantSlug);
  if (!match) notFound();
  const [car, metros] = await Promise.all([
    getCarDetail(brandSlug, modelSlug, match.id),
    getMetroFuelPrices().catch(() => []),
  ]);
  if (!car?.selectedVariant) notFound();
  return { car, variantSlug, siblings, metros };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { brandSlug, modelSlug, variantSlug } = await props.params;
  const variantId = await resolveVariantId(brandSlug, modelSlug, variantSlug).catch(() => undefined);
  if (!variantId) return {};

  const car = await getCarDetail(brandSlug, modelSlug, variantId);
  if (!car?.selectedVariant) return {};

  const priceText = formatSinglePrice(car.selectedVariant.price);
  const variantLabel = car.selectedVariant.variantName.toLowerCase().startsWith(car.name.toLowerCase())
    ? car.selectedVariant.variantName
    : `${car.name} ${car.selectedVariant.variantName}`;
  const title = `${variantLabel} - Price & Specs`;
  const description = `${variantLabel} price: ${priceText}. Full specifications, features, and safety details.`;

  return {
    title,
    description,
    openGraph: { title, description, images: car.coverImageUrl ? [car.coverImageUrl] : undefined },
  };
}

function metric(label: string, value: string | number | null | undefined, suffix = ""): Metric | null {
  if (value === null || value === undefined || value === "") return null;
  return { label, value: `${value}${suffix}` };
}

// One icon per metric, chosen by what the number means. A label with no
// entry simply renders without one.
const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Engine: EngineIcon,
  Battery: BatteryIcon,
  Power: PowerIcon,
  Torque: TorqueIcon,
  "ARAI mileage": GaugeIcon,
  "Claimed range": RoadIcon,
  "Top speed": GaugeIcon,
  Transmission: GearIcon,
  Drivetrain: CarIcon,
  "AC charge time": PlugIcon,
  "Charging port": PlugIcon,
  "Fuel tank": FuelIcon,
  Length: RulerIcon,
  Width: RulerIcon,
  Height: RulerIcon,
  Wheelbase: RulerIcon,
  "Ground clearance": RulerIcon,
  "Boot space": BootIcon,
  Seating: SeatIcon,
};

// gap-px over a line-colour backdrop draws every separator, including
// between wrapped rows — per-cell borders left gaps there and painted
// stray rules on row edges.
function MetricGrid({ metrics, dark = false }: { metrics: Metric[]; dark?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-px border-y sm:grid-cols-3 lg:grid-cols-4 ${dark ? "border-white/20 bg-white/20" : "border-border bg-border"}`}>
      {metrics.map((item) => {
        const Icon = METRIC_ICONS[item.label];
        return (
          <div key={`${item.label}-${item.value}`} className={`min-w-0 px-4 py-5 sm:px-5 ${dark ? "bg-[#101112]" : "bg-white"}`}>
            {Icon && <Icon className="mb-2 size-4 text-brand" />}
            <p className={`break-words font-head text-xl font-extrabold sm:text-2xl ${dark ? "text-white" : "text-ink"}`}>{item.value}</p>
            <p className={`mt-1 text-[9.5px] font-bold uppercase tracking-[0.1em] ${dark ? "text-white/50" : "text-muted"}`}>{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function buildSafetyItems(groups: CarDetailFeatureGroup[]): string[] {
  const safety = groups.find((group) => group.categoryName.toLowerCase() === "safety");
  return safety ? safety.items.filter(isFeaturePresent).map(featureLabel) : [];
}

export default async function CarVariantPage(props: Props) {
  const { car, variantSlug, siblings, metros } = await loadCar(props);
  const variant = car.selectedVariant!;
  const safetyItems = buildSafetyItems(variant.features);
  const variantLabel = variant.variantName.toLowerCase().startsWith(car.name.toLowerCase())
    ? variant.variantName
    : `${car.name} ${variant.variantName}`;
  const featureGroups = variant.features.filter((group) => group.categoryName.toLowerCase() !== "safety" && group.items.length > 0);
  const gallery = car.images.map((image) => image.imageUrl);
  const primaryImage = gallery[0] ?? car.coverImageUrl;
  const performanceImage = gallery[1] ?? primaryImage;
  const cabinImage = gallery[2] ?? primaryImage;
  const safetyImage = gallery[3] ?? primaryImage;
  const rawEngineDisplacement = variant.ice?.engineDisplacement ? Number(variant.ice.engineDisplacement) : null;
  const engineCapacityCc = variant.ice?.cubicCapacity
    ?? (rawEngineDisplacement && Number.isFinite(rawEngineDisplacement)
      ? Math.round(rawEngineDisplacement < 20 ? rawEngineDisplacement * 1000 : rawEngineDisplacement)
      : null);

  const performanceMetrics = (
    variant.isElectric && variant.electric
      ? [
          metric("Battery", variant.electric.batteryCapacity, " kWh"),
          metric("Power", variant.electric.powerPs, " PS"),
          metric("Torque", variant.electric.torqueNm, " Nm"),
          metric("Claimed range", variant.electric.claimedRange, " km"),
          metric("Top speed", variant.electric.topSpeedKmph, " km/h"),
          metric("Drivetrain", variant.electric.drivetrain),
          metric("AC charge time", variant.electric.acChargingTime),
          metric("Charging port", variant.electric.chargingPort),
        ]
      : variant.ice
        ? [
            metric("Engine", engineCapacityCc, " cc"),
            metric("Power", variant.ice.powerPs, " PS"),
            metric("Torque", variant.ice.torqueNm, " Nm"),
            metric("ARAI mileage", variant.ice.claimedFe, " km/l"),
            metric("Transmission", variant.transmission),
            metric("Drivetrain", variant.ice.drivetrain ?? (variant.ice.isFourByFour ? "4x4" : null)),
            metric("Top speed", variant.ice.topSpeedKmph, " km/h"),
            metric("Fuel tank", variant.ice.fuelTankCapacity, " L"),
          ]
        : []
  ).filter((item): item is Metric => item !== null);

  const dimensionMetrics = [
    metric("Length", variant.dimensions.length, " mm"),
    metric("Width", variant.dimensions.width, " mm"),
    metric("Height", variant.dimensions.height, " mm"),
    metric("Wheelbase", variant.dimensions.wheelBase, " mm"),
    metric("Ground clearance", variant.dimensions.groundClearance, " mm"),
    metric("Boot space", variant.dimensions.bootSpace, " L"),
    metric("Seating", variant.seatingCapacity, " seats"),
  ].filter((item): item is Metric => item !== null);

  const chassisDetails = [
    metric("Front suspension", variant.dimensions.frontSuspension),
    metric("Rear suspension", variant.dimensions.rearSuspension),
    metric("Steering", variant.dimensions.steeringType),
    metric("Front brakes", variant.dimensions.frontBrakeType),
    metric("Rear brakes", variant.dimensions.rearBrakeType),
  ].filter((item): item is Metric => item !== null);

  return (
    <main className="variant-detail-page bg-white">
      <div className="border-b border-border bg-white">
        <nav className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-3 text-[11.5px] font-medium text-faint scrollbar-none">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={routes.brand(car.brand.slug)} className="hover:text-brand">{car.brand.name}</Link>
          <span aria-hidden="true">/</span>
          <Link href={routes.model(car.brand.slug, car.slug)} className="hover:text-brand">{car.name}</Link>
          <span aria-hidden="true">/</span>
          <span className="whitespace-nowrap text-ink">{variant.variantName}</span>
        </nav>
      </div>

      <CarModelHero car={car} variant={variant} mode="variant" />
      <KeySpecsStrip variant={variant} />
      <ModelDetailTabs brandSlug={car.brand.slug} modelSlug={car.slug} variantSlug={variantSlug} onVariantPage />

      {siblings.length > 1 && (
        <section className="border-b border-border bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4">
            <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Where this trim sits</p>
            <h2 className="mt-2 font-head text-3xl font-extrabold leading-tight text-ink">
              One step down, one step up.
            </h2>
            <div className="mt-7">
              <TrimLadder
                variants={siblings}
                currentId={variant.id}
                carName={car.name}
                brandSlug={car.brand.slug}
                modelSlug={car.slug}
              />
            </div>
          </div>
        </section>
      )}

      {performanceMetrics.length > 0 && (
        <section id="performance" className="scroll-mt-32 bg-[#101112] py-16 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
              <div className="pb-2">
                <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Powertrain</p>
                <h2 className="mt-3 font-head text-4xl font-extrabold leading-[1.05] sm:text-5xl">Performance, measured.</h2>
                <p className="mt-5 max-w-md text-[13px] leading-6 text-white/58">
                  The full output, efficiency and drivetrain specification for the {variantLabel}.
                </p>
              </div>

              <div className="relative min-h-[330px] overflow-hidden bg-[#242526] sm:min-h-[500px]">
                {performanceImage ? (
                  <Image src={performanceImage} alt={`${carTitle(car)} ${variant.variantName}`} fill sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/45">Image unavailable</div>
                )}
              </div>
            </div>
            <div className="mt-10">
              <MetricGrid metrics={performanceMetrics} dark />
            </div>
          </div>
        </section>
      )}

      {!variant.isElectric && (
        <section className="border-b border-border bg-white py-4 sm:py-8">
          <div className="mx-auto max-w-7xl px-4">
            <RunningCostStrip variant={variant} carName={car.name} metros={metros} />
          </div>
        </section>
      )}

      {dimensionMetrics.length > 0 && (
        <section id="dimensions" className="scroll-mt-32 border-b border-border py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)] lg:items-center">
              <div>
                <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Dimensions & practicality</p>
                <h2 className="mt-2 font-head text-3xl font-extrabold leading-tight text-ink sm:text-4xl">Sized for real life.</h2>
                <div className="relative mt-8 min-h-[280px] bg-[#f0f1f2] sm:min-h-[430px]">
                  {primaryImage && <Image src={primaryImage} alt={`${carTitle(car)} dimensions`} fill sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" />}
                </div>
              </div>
              <div>
                <MetricGrid metrics={dimensionMetrics} />
                {chassisDetails.length > 0 && (
                  <div className="mt-8 border-t border-border">
                    {chassisDetails.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-6 border-b border-border py-3.5 text-[12.5px]">
                        <span className="text-muted">{item.label}</span>
                        <span className="max-w-[58%] text-right font-bold text-ink">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {featureGroups.length > 0 && (
        <section id="features" className="scroll-mt-32 bg-[#ecebe8] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
              <div className="relative min-h-[400px] overflow-hidden bg-[#d9d9d6] sm:min-h-[620px]">
                {cabinImage ? (
                  <Image src={cabinImage} alt={`${carTitle(car)} cabin and features`} fill sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">Image unavailable</div>
                )}
                <div className="absolute left-5 top-5 bg-brand px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white">Cabin & equipment</div>
              </div>

              <div>
                <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Inside the variant</p>
                <h2 className="mt-2 font-head text-3xl font-extrabold leading-tight text-ink sm:text-4xl">Features you will use every day.</h2>
                <div className="mt-8 border-t border-ink">
                  {featureGroups.map((group, index) => (
                    <div key={group.categoryName} className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 border-b border-border py-5">
                      <span className="font-head text-base font-extrabold text-brand">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <h3 className="text-[13.5px] font-extrabold text-ink">{group.categoryName}</h3>
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                          {group.items.map((item) => (
                            <li key={item.id} className="flex gap-2 text-[12px] leading-5 text-muted">
                              <CheckIcon className="mt-1 size-3 shrink-0 text-brand" />
                              {featureLabel(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {safetyItems.length > 0 && (
        <section id="safety" className="scroll-mt-32 border-b border-border bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(330px,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
              <div>
                <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-ev">Safety specification</p>
                <h2 className="mt-2 font-head text-3xl font-extrabold leading-tight text-ink sm:text-4xl">Protection, item by item.</h2>
                <div className="mt-8 grid border-t border-border sm:grid-cols-2 lg:grid-cols-1">
                  {safetyItems.map((item) => (
                    <div key={item} className="flex gap-3 border-b border-border py-3.5 text-[12.5px] font-semibold text-ink">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-ev" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[340px] overflow-hidden bg-[#edf1ef] sm:min-h-[540px]">
                {safetyImage ? (
                  <Image src={safetyImage} alt={`${carTitle(car)} safety`} fill sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">Image unavailable</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="ownership" className="scroll-mt-32 bg-[#f5f5f3] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:gap-16">
            <div>
              <p className="text-[10.5px] font-black uppercase tracking-[0.16em] text-brand">Price & ownership</p>
              <h2 className="mt-2 font-head text-3xl font-extrabold leading-tight text-ink sm:text-4xl">Know the numbers before you buy.</h2>
              <p className="mt-4 max-w-md text-[13px] leading-6 text-muted">Review the variant price, key ownership specifications and the tools available to plan finance and dealer offers.</p>
              <div className="mt-7 border-y border-border py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">Ex-showroom price</p>
                <p className="mt-1 font-head text-3xl font-extrabold text-ink">{formatSinglePrice(variant.price)}</p>
              </div>
              <div className="mt-5">
                <OnRoadPriceCard variantId={variant.id} />
              </div>
            </div>
            <CarModelSidebar variant={variant} />
          </div>
        </div>
      </section>

      <div id="reviews" className="scroll-mt-32 border-t border-border bg-white">
        <ReviewsSection modelId={car.id} brandSlug={car.brand.slug} modelSlug={car.slug} />
      </div>
    </main>
  );
}
