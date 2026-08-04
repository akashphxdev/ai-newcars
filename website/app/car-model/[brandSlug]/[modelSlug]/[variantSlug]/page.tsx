import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCarDetail, getCarVariants, getHomeCars } from "@/features/cars/car.api";
import { formatSinglePrice, slugify, featureLabel } from "@/lib/format";
import ModelDetailTabs from "@/components/common/ModelDetailTabs";
import CarModelHero from "@/components/cars/CarModelHero";
import CarModelSidebar from "@/components/cars/CarModelSidebar";
import ReviewsSection from "@/components/cars/reviews/ReviewsSection";
import { PowerIcon, TorqueIcon, CheckIcon } from "@/components/common/icons";
import type { CarDetailResult, CarDetailFeatureGroup } from "@/features/cars/car.types";

// "/tata-motors-cars/nexon/xz-plus-dark-edition" -> app/car-model/[brandSlug]/
// [modelSlug]/[variantSlug] via the rewrite in next.config.ts. Variant-level
// content only (Specifications/Features/Safety) — Overview and other
// model-level content (Variants list, Colours, FAQs, Comparison, News)
// lives on the model page. Reviews is shared, shown on both.
//
// CarVariant has no slug column (schema stays untouched) — the URL segment
// is variantName slugified on the fly, matched back against the model's
// variant list here (small per-model list, so an in-memory match is cheap).

type Props = {
  params: Promise<{ brandSlug: string; modelSlug: string; variantSlug: string }>;
};

// Pre-render only the popular cars' top-seller (or first) variant — the
// models × variants combination space is much bigger than the model page's
// own list, so this stays a small, deliberately narrow slice. Every other
// variant (and every other model) still renders fine on first visit via
// dynamicParams' on-demand render-then-cache fallback.
export async function generateStaticParams() {
  const cars = await getHomeCars("popular", 24);
  const paramsByCar = await Promise.all(
    cars.map(async (car) => {
      const variants = await getCarVariants(car.brand.slug, car.slug);
      const topSeller = variants.find((v) => v.isTopSeller) ?? variants[0];
      return topSeller ? [{ brandSlug: car.brand.slug, modelSlug: car.slug, variantSlug: slugify(topSeller.variantName) }] : [];
    }),
  );
  return paramsByCar.flat();
}

async function resolveVariantId(brandSlug: string, modelSlug: string, variantSlug: string): Promise<number> {
  const variants = await getCarVariants(brandSlug, modelSlug);
  const match = variants.find((v) => slugify(v.variantName) === variantSlug);
  if (!match) notFound();
  return match.id;
}

async function loadCar(props: Props): Promise<{ car: CarDetailResult; variantSlug: string }> {
  const { brandSlug, modelSlug, variantSlug } = await props.params;
  const variantId = await resolveVariantId(brandSlug, modelSlug, variantSlug);

  const car = await getCarDetail(brandSlug, modelSlug, variantId);
  if (!car || !car.selectedVariant) notFound();
  return { car, variantSlug };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { brandSlug, modelSlug, variantSlug } = await props.params;
  const variantId = await resolveVariantId(brandSlug, modelSlug, variantSlug).catch(() => undefined);
  if (!variantId) return {};

  const car = await getCarDetail(brandSlug, modelSlug, variantId);
  if (!car || !car.selectedVariant) return {};

  const priceText = formatSinglePrice(car.selectedVariant.price);
  const title = `${car.brand.name} ${car.name} ${car.selectedVariant.variantName} - Price & Specs`;
  const description = `${car.brand.name} ${car.name} ${car.selectedVariant.variantName} price: ${priceText}. Full specifications, features, and safety details.`;

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

function buildSafetyItems(groups: CarDetailFeatureGroup[]): string[] {
  const safety = groups.find((g) => g.categoryName.toLowerCase() === "safety");
  return safety ? safety.items.map(featureLabel) : [];
}

function buildKeyFeatureItems(groups: CarDetailFeatureGroup[]): string[] {
  return groups
    .filter((g) => g.categoryName.toLowerCase() !== "safety")
    .flatMap((g) => g.items)
    .map(featureLabel);
}

export default async function CarVariantPage(props: Props) {
  const { car, variantSlug } = await loadCar(props);
  const v = car.selectedVariant!;

  const safetyItems = buildSafetyItems(v.features);
  const keyFeatureItems = buildKeyFeatureItems(v.features);

  return (
    <div className="bg-page">
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-1.5 text-[12px] font-medium text-faint">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/${car.brand.slug}-cars`} className="hover:text-brand">{car.brand.name}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/${car.brand.slug}-cars/${car.slug}`} className="hover:text-brand">{car.name}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{v.variantName}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <CarModelHero car={car} variant={v} />
      </div>

      <div className="mx-auto max-w-7xl gap-8 px-4 py-8 sm:py-10 lg:grid lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="min-w-0">
          <ModelDetailTabs brandSlug={car.brand.slug} modelSlug={car.slug} variantSlug={variantSlug} onVariantPage={true} />

          {/* Specifications */}
          {(v.ice || v.electric) && (
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
                    <SpecRow label="Motor Power" value={v.electric.motorPowerKw ? `${v.electric.motorPowerKw} kW` : "-"} />
                    <SpecRow label="Charging Port" value={v.electric.chargingPort ?? "-"} />
                    <SpecRow
                      label="Regenerative Braking"
                      value={v.electric.regenerativeBraking ? (v.electric.regenerativeBrakingLevels ? `Yes, ${v.electric.regenerativeBrakingLevels} levels` : "Yes") : "No"}
                    />
                    <SpecRow label="Emission Norm" value={v.electric.emissionNormCompliance ?? "-"} />
                  </>
                ) : v.ice ? (
                  <>
                    <SpecRow label="Fuel Type" value={v.ice.fuelType ?? "-"} />
                    <SpecRow label="Engine Displacement" value={v.ice.engineDisplacement ? `${Math.round(Number(v.ice.engineDisplacement))} cc` : "-"} />
                    <SpecRow label="Power" value={v.ice.powerPs ? `${v.ice.powerPs} PS` : "-"} icon={<PowerIcon className="size-3.5" />} />
                    <SpecRow label="Torque" value={v.ice.torqueNm ? `${v.ice.torqueNm} Nm` : "-"} icon={<TorqueIcon className="size-3.5" />} />
                    <SpecRow label="Mileage (ARAI)" value={v.ice.claimedFe ? `${v.ice.claimedFe} km/l` : "-"} />
                    <SpecRow label="Top Speed" value={v.ice.topSpeedKmph ? `${v.ice.topSpeedKmph} km/h` : "-"} />
                    <SpecRow label="Drivetrain" value={v.ice.drivetrain ?? (v.ice.isFourByFour ? "4x4" : "-")} />
                    <SpecRow label="Fuel Tank Capacity" value={v.ice.fuelTankCapacity ? `${v.ice.fuelTankCapacity} L` : "-"} />
                    <SpecRow label="Turbo Charger" value={v.ice.turboCharger ? "Yes" : "No"} />
                    <SpecRow label="Emission Norm" value={v.ice.emissionNormCompliance ?? "-"} />
                  </>
                ) : null}
              </div>

              <h3 className="mt-6 text-[13.5px] font-extrabold text-ink">Dimensions & Chassis</h3>
              <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-2 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
                <SpecRow label="Length" value={v.dimensions.length ? `${v.dimensions.length} mm` : "-"} />
                <SpecRow label="Width" value={v.dimensions.width ? `${v.dimensions.width} mm` : "-"} />
                <SpecRow label="Height" value={v.dimensions.height ? `${v.dimensions.height} mm` : "-"} />
                <SpecRow label="Wheelbase" value={v.dimensions.wheelBase ? `${v.dimensions.wheelBase} mm` : "-"} />
                <SpecRow label="Ground Clearance" value={v.dimensions.groundClearance ? `${v.dimensions.groundClearance} mm` : "-"} />
                <SpecRow label="Boot Space" value={v.dimensions.bootSpace ? `${v.dimensions.bootSpace} L` : "-"} />
                <SpecRow label="Front Suspension" value={v.dimensions.frontSuspension ?? "-"} />
                <SpecRow label="Rear Suspension" value={v.dimensions.rearSuspension ?? "-"} />
                <SpecRow label="Steering Type" value={v.dimensions.steeringType ?? "-"} />
                <SpecRow label="Front Brake Type" value={v.dimensions.frontBrakeType ?? "-"} />
                <SpecRow label="Rear Brake Type" value={v.dimensions.rearBrakeType ?? "-"} />
              </div>
            </section>
          )}

          {/* Features */}
          {keyFeatureItems.length > 0 && (
            <section id="features" className="mt-12 scroll-mt-32">
              <h2 className="font-head text-lg font-extrabold text-ink">Key Features</h2>
              <div className="mt-4 grid grid-cols-1 gap-x-8 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2">
                {keyFeatureItems.map((label) => (
                  <FeatureRow key={label} label={label} />
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
        </div>

        {/* Right column */}
        <div className="mt-6 lg:mt-0">
          <CarModelSidebar variant={v} />
        </div>
      </div>

      {/* Reviews — also present on the model page (same section, same
          component) since it's tied to the model, not a specific variant. */}
      <div id="reviews" className="scroll-mt-32">
        <ReviewsSection modelId={car.id} brandSlug={car.brand.slug} modelSlug={car.slug} />
      </div>
    </div>
  );
}
